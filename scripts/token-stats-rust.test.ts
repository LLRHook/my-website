import { beforeAll, afterEach, describe, it, expect } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, unlinkSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { zstdCompressSync } from "node:zlib";
import { collect } from "./token-stats.mjs";
import { parseTokenStats } from "../app/lib/tokenStats";

const root = resolve(__dirname, "..");
const crate = join(root, "tools", "token-stats");
const target = resolve(root, process.env.CARGO_TARGET_DIR || join(crate, "target"));
const binary = join(target, "release", `website-token-stats${process.platform === "win32" ? ".exe" : ""}`);
const temporary: string[] = [];
const fixtures = () => {
  const dir = mkdtempSync(join(tmpdir(), "website-rust-tokens-"));
  temporary.push(dir);
  cpSync(join(__dirname, "fixtures", "token-stats"), dir, { recursive: true });
  return dir;
};
const options = (dir: string) => ({ claudeDir: join(dir, "claude"), codexDir: join(dir, "codex"), codexArchiveDir: join(dir, "archive"), today: "2026-10-14" });
const args = (dir: string) => {
  const value = options(dir);
  return ["--claude-dir", value.claudeDir, "--codex-dir", value.codexDir, "--codex-archive-dir", value.codexArchiveDir, "--today", value.today];
};
const native = (dir: string, extra: string[] = [], env = process.env) =>
  JSON.parse(execFileSync(binary, [...args(dir), "--json", ...extra], { cwd: root, env, encoding: "utf8", timeout: 10_000 }));
const compress = (dir: string, keepPlain = false) => {
  for (const name of readdirSync(dir, { recursive: true }).map(String).filter((name) => name.endsWith(".jsonl"))) {
    const file = join(dir, name);
    writeFileSync(`${file}.zst`, zstdCompressSync(readFileSync(file)));
    if (!keepPlain) unlinkSync(file);
  }
};
const assistant = (usage: object, model: unknown = "claude-opus-5-5", timestamp = "2026-10-14T12:00:00Z", id?: string) =>
  ({ timestamp, message: { id, model, usage } });
const writeRecords = (dir: string, records: unknown[]) =>
  writeFileSync(join(dir, "claude", "extra.jsonl"), records.map((record) => JSON.stringify(record)).join("\n"));

beforeAll(() => {
  // No silent skip or JS fallback when the native toolchain is missing.
  execFileSync("cargo", ["build", "--release", "--locked", "--manifest-path", join(crate, "Cargo.toml")], { cwd: root, timeout: 300_000 });
}, 310_000);
afterEach(() => {
  for (const dir of temporary.splice(0)) {
    if (!dir.startsWith(join(tmpdir(), "website-rust-tokens-"))) throw new Error("Unexpected fixture path");
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("Rust exporter parity", () => {
  it("matches plain fixtures including duplicate messages, counter resets and privacy", () => {
    const dir = fixtures();
    const result = native(dir);
    expect(result).toEqual(collect(options(dir)));
    expect(parseTokenStats(result.snapshot)).not.toBeNull();
    for (const secret of ["Secret", "sess-", "abc123", "Users", "/", "\\"]) expect(JSON.stringify(result.snapshot)).not.toContain(secret);
  });
  it("streams compressed-only fixtures with the same snapshot", () => {
    const dir = fixtures();
    compress(dir);
    expect(native(dir)).toEqual(collect(options(dir)));
  });
  it("deduplicates plain, compressed, active and archived rollout copies", () => {
    const dir = fixtures();
    compress(dir, true);
    cpSync(join(dir, "codex"), join(dir, "archive"), { recursive: true });
    expect(native(dir)).toEqual(collect(options(dir)));
  });
  it("uses an archive when the active root is absent", () => {
    const dir = fixtures();
    cpSync(join(dir, "codex"), join(dir, "archive"), { recursive: true });
    rmSync(join(dir, "codex"), { recursive: true });
    expect(native(dir)).toEqual(collect(options(dir)));
  });
  it("preserves anonymous rows, non-string model normalization and largest-message ordering", () => {
    const dir = fixtures();
    writeRecords(dir, [assistant({ input_tokens: 5 }), assistant({ input_tokens: 10 }, { private: "not a model label" }),
      assistant({ input_tokens: 15 }, ["CUSTOM", null, {}]), assistant({ input_tokens: 1 }, "claude-opus-5-5", "2026-10-13T12:00:00Z", "repeated"),
      assistant({ input_tokens: 100 }, "claude-opus-5-5", "2026-10-14T12:00:00Z", "repeated")]);
    expect(native(dir)).toEqual(collect(options(dir)));
  });
  it("keeps safe-integer clamping, cache bounds and the dated long-context thresholds", () => {
    const dir = fixtures();
    writeRecords(dir, [assistant({ input_tokens: 5.5, output_tokens: -1, cache_read_input_tokens: "50" }),
      assistant({ input_tokens: 100_000 }, "claude-haiku-5-5"), assistant({ input_tokens: 100_001 }, "claude-haiku-5-5"),
      assistant({ cache_creation_input_tokens: 100, cache_creation: { ephemeral_1h_input_tokens: 200 } })]);
    expect(native(dir)).toEqual(collect(options(dir)));
  });
  it.each(["UTC", "America/New_York", "Asia/Kathmandu"])("preserves local calendar days and DST boundaries: %s", (timezone) => {
    const dir = fixtures();
    writeRecords(dir, [assistant({ input_tokens: 100 }, "claude-opus-5-5", "2026-03-08T06:59:59Z"),
      assistant({ input_tokens: 200 }, "claude-opus-5-5", "2026-03-08T07:00:00Z"),
      assistant({ input_tokens: 300 }, "claude-opus-5-5", "2026-10-14T00:15:00Z"),
      assistant({ input_tokens: 400 }, "claude-opus-5-5", "2026-10-14")]);
    const env = { ...process.env, TZ: timezone };
    const code = `import {collect} from ${JSON.stringify(pathToFileURL(join(root, "scripts/token-stats.mjs")).href)};console.log(JSON.stringify(collect(${JSON.stringify(options(dir))})));`;
    const oracle = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", code], { cwd: root, env, encoding: "utf8" }));
    expect(native(dir, [], env)).toEqual(oracle);
  });
  it("ignores malformed/truncated records and retains the final record without a newline", () => {
    const dir = fixtures();
    const valid = JSON.stringify(assistant({ input_tokens: 77 }));
    writeFileSync(join(dir, "claude", "tail.jsonl"), `not json\n{"usage":\n${valid}`);
    expect(native(dir)).toEqual(collect(options(dir)));
  });
  it.each([
    ["plain", 140], ["compressed", 140], ["plain", 4096], ["compressed", 4096],
  ] as const)("counts nested tool input without decoding its content: %s depth %i", (encoding, depth) => {
    const dir = fixtures();
    const baseline = collect(options(dir)).snapshot.lifetime.tokens.total;
    const nested = "[".repeat(depth) + "0" + "]".repeat(depth);
    // Construct the source directly: JSON.stringify itself has a stack limit,
    // while the log producer and oracle can read this valid JSON without one.
    writeFileSync(join(dir, "claude", "nested.jsonl"), `{"timestamp":"2026-10-14T12:00:00Z","message":{"id":"nested","model":"claude-opus-5-5","usage":{"input_tokens":123},"content":[{"type":"tool_use","input":{"document":${nested}}}]}}\n`);
    if (encoding === "compressed") compress(dir);
    const expected = collect(options(dir));
    expect(expected.snapshot.lifetime.tokens.total).toBe(baseline + 123);
    const out = join(dir, "snapshot.json");
    writeFileSync(out, JSON.stringify(expected.snapshot, null, 2) + "\n");
    expect(native(dir, ["--output", out])).toEqual(expected);
    expect(JSON.parse(readFileSync(out, "utf8"))).toEqual(expected.snapshot);
  });
  it.each(["plain", "compressed"])("counts Codex usage despite nested context and unused counter metadata: %s", (encoding) => {
    const dir = fixtures();
    const baseline = collect(options(dir)).snapshot.lifetime.tokens.total;
    const nested = "[".repeat(4096) + "0" + "]".repeat(4096);
    writeFileSync(join(dir, "codex", "rollout-nested.jsonl"),
      `{"type":"turn_context","payload":{"model":"gpt-6.1-sol","instructions":${nested}}}\n` +
      `{"type":"event_msg","timestamp":"2026-10-14T12:00:00Z","payload":{"type":"token_count","info":{"trace":${nested},"total_token_usage":{"input_tokens":123,"output_tokens":4,"trace":${nested}}}}}\n`);
    if (encoding === "compressed") compress(dir);
    const expected = collect(options(dir));
    expect(expected.snapshot.lifetime.tokens.total).toBe(baseline + 127);
    expect(native(dir)).toEqual(expected);
  });
  it.each(["plain", "compressed"])("fails safely for unsupported accounting field nesting: %s", (encoding) => {
    const dir = fixtures();
    const nested = "[".repeat(140) + '"private-model"' + "]".repeat(140);
    writeFileSync(join(dir, "claude", "nested-accounting.jsonl"), `{"timestamp":"2026-10-14T12:00:00Z","message":{"model":${nested},"usage":{"input_tokens":123}}}\n`);
    if (encoding === "compressed") compress(dir);
    const out = join(dir, "snapshot.json");
    writeFileSync(out, "preserve me");
    const result = spawnSync(binary, [...args(dir), "--output", out], { cwd: root, encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/accounting fields/i);
    expect(result.stderr).not.toContain("private-model");
    expect(readFileSync(out, "utf8")).toBe("preserve me");
    expect(readdirSync(dir).some((name) => name.endsWith(".tmp"))).toBe(false);
  });
  it("keeps counter advancement for an invalid-date event and excludes future usage", () => {
    const dir = fixtures();
    const token = (input: number, timestamp: string) => ({ type: "event_msg", timestamp, payload: { type: "token_count", info: { total_token_usage: { input_tokens: input, output_tokens: 1 } } } });
    writeFileSync(join(dir, "codex", "rollout-edge.jsonl"), [
      { type: "turn_context", payload: { model: "gpt-6.1-sol" } }, token(10, "bad"), token(20, "2026-10-14T12:00:00Z"), token(30, "2027-01-01T12:00:00Z"),
    ].map((value) => JSON.stringify(value)).join("\n"));
    expect(native(dir)).toEqual(collect(options(dir)));
  });
  it("writes atomically and preserves unchanged snapshot bytes and mtime, including CRLF", () => {
    const dir = fixtures();
    const out = join(dir, "snapshot.json");
    native(dir, ["--output", out]);
    const crlf = readFileSync(out, "utf8").replace(/\n/g, "\r\n");
    writeFileSync(out, crlf);
    const old = new Date("2000-01-01T00:00:00Z");
    utimesSync(out, old, old);
    native(dir, ["--output", out]);
    expect(readFileSync(out, "utf8")).toBe(crlf);
    expect(statSync(out).mtimeMs).toBe(old.getTime());
    expect(readdirSync(dir).some((name) => name.endsWith(".tmp"))).toBe(false);
  });
  it.each(["\n", "\r\n"])("preserves unchanged legacy JS output, including numeric spellings: %j", (newline) => {
    const dir = fixtures();
    const out = join(dir, "snapshot.json");
    const legacy = (JSON.stringify(collect(options(dir)).snapshot, null, 2) + "\n").replace(/\n/g, newline);
    writeFileSync(out, legacy);
    const old = new Date("2000-01-01T00:00:00Z");
    utimesSync(out, old, old);
    native(dir, ["--output", out]);
    expect(readFileSync(out, "utf8")).toBe(legacy);
    expect(statSync(out).mtimeMs).toBe(old.getTime());
    expect(readdirSync(dir).some((name) => name.endsWith(".tmp"))).toBe(false);
  });
  it("replaces legacy JS output when updated usage changes the data", () => {
    const dir = fixtures();
    const out = join(dir, "snapshot.json");
    const legacy = JSON.stringify(collect(options(dir)).snapshot, null, 2) + "\n";
    writeFileSync(out, legacy);
    const old = new Date("2000-01-01T00:00:00Z");
    utimesSync(out, old, old);
    writeRecords(dir, [assistant({ input_tokens: 123 })]);
    const expected = collect(options(dir));
    expect(native(dir, ["--output", out])).toEqual(expected);
    expect(JSON.parse(readFileSync(out, "utf8"))).toEqual(expected.snapshot);
    expect(readFileSync(out, "utf8")).not.toBe(legacy);
    expect(statSync(out).mtimeMs).not.toBe(old.getTime());
  });
  it.each(["invalid-date", "broken-zstd", "unsafe-totals"])("fails without replacing an existing output: %s", (problem) => {
    const dir = fixtures();
    const out = join(dir, "snapshot.json");
    writeFileSync(out, "preserve me");
    if (problem === "broken-zstd") writeFileSync(join(dir, "claude", "broken.jsonl.zst"), "not zstd");
    if (problem === "unsafe-totals") writeRecords(dir, [assistant({ input_tokens: Number.MAX_SAFE_INTEGER }), assistant({ input_tokens: 1 })]);
    const extra = problem === "invalid-date" ? ["--today", "2026-02-31"] : [];
    const result = spawnSync(binary, [...args(dir), "--output", out, ...extra], { cwd: root, encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(readFileSync(out, "utf8")).toBe("preserve me");
  });
  it("runs the supported Node entry through Rust without touching the committed snapshot", () => {
    const dir = fixtures();
    const snapshot = join(root, "data/token-stats.json");
    const before = readFileSync(snapshot);
    const env = { ...process.env };
    delete env.TOKEN_STATS_RUST_BIN;
    const result = execFileSync(process.execPath, [join(root, "scripts/token-stats.mjs"), ...args(dir), "--json"], { cwd: root, env, encoding: "utf8", timeout: 120_000 });
    expect(JSON.parse(result)).toEqual(collect(options(dir)));
    expect(readFileSync(snapshot)).toEqual(before);
  }, 125_000);
});
