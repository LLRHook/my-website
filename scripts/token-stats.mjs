// Writes data/token-stats.json, the public "token burner" snapshot on /projects, from
// local coding-agent logs (`npm run token-stats`). Ports the parsing in the owner's
// usage-widget (widget.py scan_claude / scan_codex). The snapshot holds totals by day,
// tool and model only: no paths, project names, session ids, prompts or tool names.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// API list prices in USD per million tokens, from
// https://platform.claude.com/docs/en/about-claude/pricing and
// https://developers.openai.com/api/docs/pricing (standard tier, global routing).
export const PRICES_AS_OF = "2026-10-14";
const CLAUDE_PRICES = {
  "claude-fable-5-1": { input: 10, write5m: 12.5, write1h: 20, read: 0.25, output: 50 },
  "claude-fable-5": { input: 10, write5m: 12.5, write1h: 20, read: 1, output: 50 },
  "claude-opus-5-5": { input: 4, write5m: 5, write1h: 8, read: 0.2, output: 20 },
  "claude-opus-5": { input: 5, write5m: 6.25, write1h: 10, read: 0.5, output: 25 },
  "claude-opus-4-8": { input: 5, write5m: 6.25, write1h: 10, read: 0.5, output: 25 },
  "claude-sonnet-5-5": { input: 2, write5m: 2.5, write1h: 4, read: 0.1, output: 10 },
  "claude-sonnet-5": { input: 2, write5m: 2.5, write1h: 4, read: 0.2, output: 10 },
  "claude-haiku-5-5": { input: 0.1, write5m: 0.125, write1h: 0.2, read: 0.01, output: 0.5,
    // Prompts over 100,000 tokens (input plus cache reads and writes) pay these instead.
    long: { over: 100_000, input: 0.5, write5m: 0.625, write1h: 1, read: 0.05, output: 2.5 } },
  "claude-haiku-4-5": { input: 1, write5m: 1.25, write1h: 2, read: 0.1, output: 5 },
};
// Requests over 272K input tokens pay the long-context row.
const OPENAI_PRICES = {
  "gpt-6.1-sol": { input: 2, read: 0.1, write: 2.5, output: 10, long: { over: 272_000, input: 4, read: 0.2, write: 5, output: 15 } },
  "gpt-6-astra": { input: 10, read: 1, write: 12.5, output: 50, long: { over: 272_000, input: 20, read: 2, write: 25, output: 75 } },
  "gpt-6-sol": { input: 2, read: 0.2, write: 2.5, output: 10, long: { over: 272_000, input: 4, read: 0.4, write: 5, output: 15 } },
  "gpt-6-luna": { input: 0.1, read: 0.01, write: 0.125, output: 0.5, long: { over: 272_000, input: 0.2, read: 0.02, write: 0.25, output: 0.75 } },
};

export const DAILY_DAYS = 90;
const LAST_DAYS = 30;
const TOP_MODELS = 6;
const MILLION = 1_000_000;

const count = (value) => (Number.isSafeInteger(value) && value > 0 ? value : 0);
const pad = (value) => String(value).padStart(2, "0");

/** Local calendar day, YYYY-MM-DD. */
export function localDay(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function shiftDay(day, days) {
  const [year, month, date] = day.split("-").map(Number);
  return localDay(new Date(year, month - 1, date + days));
}

/** Strips the context suffix ("[1m]") and snapshot date ("-20251001") from a model id. */
export function normalizeModel(model) {
  return String(model ?? "").toLowerCase().replace(/\[[^\]]*\]$/, "").replace(/-\d{8}$/, "");
}

/** "claude-opus-5-5" -> "Claude Opus 5.5", "gpt-6.1-sol" -> "GPT-6.1 Sol"; anything else -> null. */
export function modelLabel(model) {
  const title = (word) => word[0].toUpperCase() + word.slice(1);
  const claude = /^claude-([a-z]+)-(\d+)(?:-(\d))?$/.exec(model);
  if (claude) return `Claude ${title(claude[1])} ${claude[2]}${claude[3] ? `.${claude[3]}` : ""}`;
  const gpt = /^gpt-(\d+(?:\.\d+)?)((?:-[a-z]+)*)$/.exec(model);
  if (gpt) return `GPT-${gpt[1]}${gpt[2].split("-").filter(Boolean).map((word) => ` ${title(word)}`).join("")}`;
  return null;
}

/** One Claude Code assistant message: token split and API-equivalent cost (null if unpriced). */
export function claudeUsage(model, usage) {
  const input = count(usage.input_tokens);
  const output = count(usage.output_tokens);
  const cacheWrite = count(usage.cache_creation_input_tokens);
  const cacheRead = count(usage.cache_read_input_tokens);
  // Claude Code splits cache writes by TTL; older logs have only the total (5-minute).
  const write1h = Math.min(count(usage.cache_creation?.ephemeral_1h_input_tokens), cacheWrite);
  const tokens = { input, output, cacheWrite, cacheRead, total: input + output + cacheWrite + cacheRead };
  const base = CLAUDE_PRICES[model];
  if (!base) return { tokens, costUsd: null };
  const price = base.long && input + cacheWrite + cacheRead > base.long.over ? base.long : base;
  const costUsd = (input * price.input + (cacheWrite - write1h) * price.write5m + write1h * price.write1h
    + cacheRead * price.read + output * price.output) / MILLION;
  return { tokens, costUsd };
}

/** One Codex token_count delta. Cached and cache-write tokens are part of input_tokens. */
export function codexUsage(model, usage) {
  const allInput = count(usage.input_tokens);
  const cacheRead = Math.min(count(usage.cached_input_tokens), allInput);
  const cacheWrite = Math.min(count(usage.cache_write_input_tokens), allInput - cacheRead);
  const input = allInput - cacheRead - cacheWrite;
  const output = count(usage.output_tokens);
  const tokens = { input, output, cacheWrite, cacheRead, total: allInput + output };
  const base = OPENAI_PRICES[model];
  if (!base) return { tokens, costUsd: null };
  const price = allInput > base.long.over ? base.long : base;
  return { tokens, costUsd: (input * price.input + cacheRead * price.read + cacheWrite * price.write + output * price.output) / MILLION };
}

function jsonlFiles(dir, match) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true }).map(String).filter((file) => match.test(file.replace(/\\/g, "/"))).sort().map((file) => join(dir, file));
}

// Yields only the lines that contain one of the markers. Searching the raw buffer
// skips the large tool-result and transcript lines without decoding them.
function* markedRecords(file, markers) {
  const buffer = readFileSync(file);
  const needles = markers.map((marker) => Buffer.from(marker));
  let start = 0;
  while (start < buffer.length) {
    let hit = -1;
    for (const needle of needles) {
      const at = buffer.indexOf(needle, start);
      if (at !== -1 && (hit === -1 || at < hit)) hit = at;
    }
    if (hit === -1) return;
    const lineStart = buffer.lastIndexOf(10, hit) + 1;
    let lineEnd = buffer.indexOf(10, hit);
    if (lineEnd === -1) lineEnd = buffer.length;
    start = lineEnd + 1;
    try {
      yield JSON.parse(buffer.toString("utf8", lineStart, lineEnd));
    } catch {
      // A malformed or truncated line is skipped, as in usage-widget.
    }
  }
}

function timestampDay(value) {
  const date = typeof value === "string" ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? localDay(date) : null;
}

/**
 * Totals keyed by local day, tool and model. `add` receives
 * (day, tool, model, { tokens, costUsd }).
 */
export function scanClaude(dir, add) {
  const seen = new Set();
  for (const file of jsonlFiles(dir, /\.jsonl$/)) {
    for (const record of markedRecords(file, ['"usage"'])) {
      const message = record?.message;
      const usage = message?.usage;
      if (!usage || typeof usage !== "object") continue;
      if (message.id) {
        if (seen.has(message.id)) continue;
        seen.add(message.id);
      }
      const day = timestampDay(record.timestamp);
      if (!day) continue;
      const model = normalizeModel(message.model);
      const result = claudeUsage(model, usage);
      if (result.tokens.total) add(day, "claudeCode", model, result);
    }
  }
}

export function scanCodex(dir, add) {
  for (const file of jsonlFiles(dir, /(^|\/)rollout-[^/]*\.jsonl$/)) {
    let previous = null;
    let model = "";
    for (const record of markedRecords(file, ['"turn_context"', '"token_count"'])) {
      const payload = record?.payload ?? {};
      if (record?.type === "turn_context") model = normalizeModel(payload.model) || model;
      if (record?.type !== "event_msg" || payload.type !== "token_count") continue;
      const total = payload.info?.total_token_usage;
      if (!total || typeof total !== "object") continue;
      const current = Object.fromEntries(["input_tokens", "cached_input_tokens", "cache_write_input_tokens", "output_tokens", "total_tokens"]
        .map((key) => [key, count(total[key])]));
      // token_count totals are cumulative per rollout; count the delta. A counter
      // that went down was reset, so count its new value (usage-widget does the same).
      const delta = previous ? Object.fromEntries(Object.entries(current)
        .map(([key, value]) => [key, value >= previous[key] ? value - previous[key] : value])) : current;
      previous = current;
      const day = timestampDay(record.timestamp);
      if (!day) continue;
      const result = codexUsage(model, delta);
      if (result.tokens.total) add(day, "codex", model, result);
    }
  }
}

const emptyCounts = () => ({ input: 0, output: 0, cacheWrite: 0, cacheRead: 0, total: 0 });
const emptyUsage = () => ({ tokens: emptyCounts(), costUsd: 0 });
function addUsage(target, { tokens, costUsd }) {
  for (const key of Object.keys(target.tokens)) target.tokens[key] += tokens[key];
  target.costUsd += costUsd ?? 0;
}
const cents = (usage) => ({ tokens: usage.tokens, costUsd: Math.round(usage.costUsd * 100) / 100 });

/** Collects both logs into the snapshot for `today` (a local YYYY-MM-DD). */
export function collect({ claudeDir, codexDir, today }) {
  const rows = [];
  const unpriced = new Set();
  const add = (day, tool, model, usage) => {
    if (usage.costUsd === null) unpriced.add(model || "(none)");
    rows.push({ day, tool, model, usage });
  };
  scanClaude(claudeDir, add);
  scanCodex(codexDir, add);
  return { snapshot: buildSnapshot(rows, today), unpriced: [...unpriced].sort() };
}

export function buildSnapshot(rows, today) {
  const firstDaily = shiftDay(today, 1 - DAILY_DAYS);
  const firstLast = shiftDay(today, 1 - LAST_DAYS);
  const lifetime = emptyUsage();
  const last30 = emptyUsage();
  const byTool = { claudeCode: emptyUsage(), codex: emptyUsage() };
  const byModel = new Map();
  const daily = new Map();
  for (let day = firstDaily; day <= today; day = shiftDay(day, 1)) daily.set(day, emptyUsage());
  let since = today;
  for (const { day, tool, model, usage } of rows) {
    if (day > today) continue;
    if (day < since) since = day;
    addUsage(lifetime, usage);
    addUsage(byTool[tool], usage);
    if (day >= firstLast) addUsage(last30, usage);
    if (daily.has(day)) addUsage(daily.get(day), usage);
    const label = modelLabel(model) ?? "Other";
    byModel.set(label, (byModel.get(label) ?? 0) + usage.tokens.total);
  }
  const ranked = [...byModel].filter(([label]) => label !== "Other").sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const other = ranked.slice(TOP_MODELS).reduce((sum, [, tokens]) => sum + tokens, byModel.get("Other") ?? 0);
  const models = [...ranked.slice(0, TOP_MODELS), ...(other ? [["Other", other]] : [])];
  const share = (tokens) => (lifetime.tokens.total ? Math.round((tokens / lifetime.tokens.total) * 10_000) / 10_000 : 0);
  return {
    asOf: today,
    since,
    pricesAsOf: PRICES_AS_OF,
    lifetime: cents(lifetime),
    last30: cents(last30),
    byTool: { claudeCode: cents(byTool.claudeCode), codex: cents(byTool.codex) },
    byModel: models.map(([model, tokens]) => ({ model, tokens, share: share(tokens) })),
    daily: [...daily].map(([date, usage]) => ({ date, tokens: usage.tokens.total, costUsd: cents(usage).costUsd })),
  };
}

function main() {
  const started = Date.now();
  const out = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "token-stats.json");
  const home = homedir();
  const { snapshot, unpriced } = collect({
    claudeDir: join(home, ".claude", "projects"),
    codexDir: join(home, ".codex", "sessions"),
    today: localDay(new Date()),
  });
  if (unpriced.length) console.warn(`No list price for ${unpriced.join(", ")}: tokens counted, cost excluded.`);
  const text = `${JSON.stringify(snapshot, null, 2)}\n`;
  // Compare without line endings: a Windows checkout may hold the committed file as CRLF.
  const unchanged = existsSync(out) && readFileSync(out, "utf8").replace(/\r\n/g, "\n") === text;
  if (!unchanged) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, text);
  }
  console.log(`${unchanged ? "Unchanged" : "Wrote"} data/token-stats.json: ${snapshot.lifetime.tokens.total.toLocaleString("en-US")} tokens, `
    + `$${snapshot.lifetime.costUsd.toLocaleString("en-US")} API-equivalent, in ${((Date.now() - started) / 1000).toFixed(1)} s.`);
}

if (import.meta.main) main();
