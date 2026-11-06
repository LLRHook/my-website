// Writes data/token-stats.json, the public "token burner" snapshot on /projects, from
// local coding-agent logs (`npm run token-stats`, Rust by default). The JS functions
// remain a compatibility/parity oracle. Ports the parsing in the owner's
// usage-widget (widget.py scan_claude / scan_codex). The snapshot holds totals by day,
// tool and model only: no paths, project names, session ids, prompts or tool names.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { zstdDecompressSync } from "node:zlib";

// One dated price table is shared with the Rust exporter and the JS test oracle.
// Sources for the frozen 2026-10-14 values:
// https://platform.claude.com/docs/en/about-claude/pricing
// https://developers.openai.com/api/docs/pricing
import prices from "./token-prices.json" with { type: "json" };
export const PRICES_AS_OF = prices.pricesAsOf;
const CLAUDE_PRICES = prices.claude;
const OPENAI_PRICES = prices.openai;

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

// Own keys only, so an id such as "constructor" is not read off the prototype.
const priceOf = (prices, model) => (Object.hasOwn(prices, model) ? prices[model] : null);

/**
 * "claude-opus-5-5" -> "Claude Opus 5.5", "gpt-6.1-sol" -> "GPT-6.1 Sol". Only priced
 * models are named; any other id (a custom or proxy model) -> null, shown as Other.
 */
export function modelLabel(model) {
  if (!priceOf(CLAUDE_PRICES, model) && !priceOf(OPENAI_PRICES, model)) return null;
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
  const base = priceOf(CLAUDE_PRICES, model);
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
  const base = priceOf(OPENAI_PRICES, model);
  if (!base) return { tokens, costUsd: null };
  const price = allInput > base.long.over ? base.long : base;
  return { tokens, costUsd: (input * price.input + cacheRead * price.read + cacheWrite * price.write + output * price.output) / MILLION };
}

function jsonlFiles(dir, match) {
  if (!dir || !existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true }).map(String).filter((file) => match.test(file.replace(/\\/g, "/"))).sort()
    // Prefer a live plain log when its compressed copy is also present.
    .filter((file) => !file.endsWith(".zst") || !existsSync(join(dir, file.slice(0, -4))))
    .map((file) => join(dir, file));
}

// Yields only the lines that contain one of the markers. Searching the raw buffer
// skips the large tool-result and transcript lines without decoding them.
function* markedRecords(file, markers) {
  const raw = readFileSync(file);
  const buffer = file.endsWith(".zst") ? zstdDecompressSync(raw) : raw;
  const needles = markers.map((marker) => Buffer.from(marker));
  // Next match of each needle, searched again only once passed, so a rare marker
  // does not rescan the rest of the file on every line.
  const next = needles.map(() => -2);
  let start = 0;
  while (start < buffer.length) {
    let hit = -1;
    needles.forEach((needle, index) => {
      if (next[index] !== -1 && next[index] < start) next[index] = buffer.indexOf(needle, start);
      if (next[index] !== -1 && (hit === -1 || next[index] < hit)) hit = next[index];
    });
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
  // Claude Code writes one line per content block of a message, each with the usage so
  // far, so a message id counts once, at its largest total.
  const byId = new Map();
  for (const file of jsonlFiles(dir, /\.jsonl(?:\.zst)?$/)) {
    for (const record of markedRecords(file, ['"usage"'])) {
      const message = record?.message;
      const usage = message?.usage;
      if (!usage || typeof usage !== "object") continue;
      const day = timestampDay(record.timestamp);
      if (!day) continue;
      const model = normalizeModel(message.model);
      const result = claudeUsage(model, usage);
      if (!result.tokens.total) continue;
      const id = typeof message.id === "string" && message.id ? message.id : null;
      if (!id) add(day, "claudeCode", model, result);
      else if ((byId.get(id)?.result.tokens.total ?? -1) < result.tokens.total) byId.set(id, { day, model, result });
    }
  }
  for (const { day, model, result } of byId.values()) add(day, "claudeCode", model, result);
}

export function scanCodex(dir, add) {
  const seen = new Set();
  const dirs = Array.isArray(dir) ? dir : [dir];
  for (const file of dirs.flatMap((root) => jsonlFiles(root, /(^|\/)rollout-[^/]*\.jsonl(?:\.zst)?$/))) {
    // Moving a rollout to the archive must not count it again if a copy remains.
    const name = basename(file).replace(/\.zst$/, "");
    if (seen.has(name)) continue;
    seen.add(name);
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
export function collect({ claudeDir, codexDir, codexArchiveDir = "", today }) {
  const rows = [];
  const unpriced = new Set();
  const add = (day, tool, model, usage) => {
    if (usage.costUsd === null) unpriced.add(model || "(none)");
    rows.push({ day, tool, model, usage });
  };
  scanClaude(claudeDir, add);
  scanCodex([codexDir, codexArchiveDir], add);
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
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const home = homedir();
  const args = [
    "--claude-dir", join(home, ".claude", "projects"),
    "--codex-dir", join(home, ".codex", "sessions"),
    "--codex-archive-dir", join(home, ".codex", "archived_sessions"),
    "--today", localDay(new Date()), ...process.argv.slice(2),
  ];
  // There is deliberately no JS fallback: the supported export path is Rust.
  // A prebuilt native binary is optional; otherwise Cargo builds the locked CLI.
  const native = process.env.TOKEN_STATS_RUST_BIN;
  const command = native || "cargo";
  const prefix = native ? [] : ["run", "--quiet", "--release", "--locked", "--manifest-path", join(root, "tools", "token-stats", "Cargo.toml"), "--"];
  const result = spawnSync(command, [...prefix, ...args], { cwd: root, stdio: "inherit" });
  if (result.error) console.error(`Cannot run the Rust exporter: ${result.error.message}. Install Rust/Cargo or set TOKEN_STATS_RUST_BIN to the compiled CLI.`);
  process.exitCode = result.status ?? 1;
}

if (import.meta.main) main();
