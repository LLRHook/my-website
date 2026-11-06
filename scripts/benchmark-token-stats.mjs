// Synthetic collector-process comparison. No real logs are read; npm/Cargo
// orchestration and compilation are excluded. Build the release CLI first.
import { spawnSync } from "node:child_process";
import { closeSync, mkdirSync, mkdtempSync, openSync, rmSync, writeSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(root, process.env.CARGO_TARGET_DIR || "tools/token-stats/target");
const binary = process.env.TOKEN_STATS_RUST_BIN || join(target, "release", `website-token-stats${process.platform === "win32" ? ".exe" : ""}`);
const mib = Number(process.argv[2] || 64);
if (!Number.isSafeInteger(mib) || mib < 1 || mib > 1024) throw new Error("Choose a synthetic size from 1 to 1024 MiB.");
const dir = mkdtempSync(join(tmpdir(), "website-token-benchmark-"));
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const summarize = (rows) => ({ medianMs: median(rows.map((row) => row.ms)),
  minMs: Math.min(...rows.map((row) => row.ms)), maxMs: Math.max(...rows.map((row) => row.ms)),
  peakRssBytes: rows.every((row) => row.rss !== null) ? median(rows.map((row) => row.rss)) : null });

try {
  const claudeDir = join(dir, "claude");
  mkdirSync(claudeDir);
  const fd = openSync(join(claudeDir, "synthetic.jsonl"), "wx");
  let bytes = 0;
  let lines = 0;
  try {
    const noise = `${JSON.stringify({ type: "progress", content: "synthetic padding ".repeat(512) })}\n`;
    while (bytes < mib * 1024 * 1024) {
      const line = lines % 256 ? noise : `${JSON.stringify({ timestamp: "2026-10-14T12:00:00Z", message: {
        id: `benchmark-${lines}`, model: "claude-opus-5-5", usage: { input_tokens: 100, output_tokens: 20 },
      } })}\n`;
      bytes += writeSync(fd, line);
      lines++;
    }
  } finally { closeSync(fd); }
  const options = { claudeDir, codexDir: join(dir, "absent"), codexArchiveDir: join(dir, "archive"), today: "2026-10-14" };
  const code = `import {collect} from ${JSON.stringify(pathToFileURL(join(root, "scripts/token-stats.mjs")).href)};console.log(JSON.stringify(collect(${JSON.stringify(options)})));`;
  const rustArgs = ["--claude-dir", claudeDir, "--codex-dir", options.codexDir, "--codex-archive-dir", options.codexArchiveDir, "--today", options.today, "--json"];
  const timed = (command, args) => {
    const timer = process.platform === "darwin" ? ["/usr/bin/time", "-l"] : process.platform === "linux" ? ["/usr/bin/time", "-v"] : null;
    const started = performance.now();
    const result = spawnSync(timer?.[0] || command, timer ? [timer[1], command, ...args] : args,
      { cwd: root, env: { ...process.env, TZ: "UTC" }, encoding: "utf8", timeout: 60_000, maxBuffer: 2 * 1024 * 1024 });
    const ms = performance.now() - started;
    if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr);
    const match = process.platform === "darwin" ? /\b(\d+)\s+maximum resident set size/.exec(result.stderr)
      : /Maximum resident set size \(kbytes\):\s*(\d+)/.exec(result.stderr);
    return { ms, rss: match ? Number(match[1]) * (process.platform === "darwin" ? 1 : 1024) : null,
      output: JSON.parse(result.stdout) };
  };
  const run = (kind) => kind === "node" ? timed(process.execPath, ["--input-type=module", "-e", code]) : timed(binary, rustArgs);
  const expected = run("node").output;
  if (!isDeepStrictEqual(expected, run("rust").output)) throw new Error("Collector outputs differ in warmup.");
  const samples = { node: [], rust: [] };
  for (let round = 0; round < 3; round++) {
    for (const kind of round % 2 ? ["rust", "node"] : ["node", "rust"]) {
      const result = run(kind);
      if (!isDeepStrictEqual(expected, result.output)) throw new Error(`${kind} collector output differs.`);
      samples[kind].push({ ms: result.ms, rss: result.rss });
    }
  }
  console.log(JSON.stringify({ schemaVersion: 1, platform: process.platform, nodeVersion: process.version,
    workload: { bytes, lines, measuredRunsPerCollector: 3, warmupRunsPerCollector: 1, scope: "synthetic collector processes; compilation/npm/Cargo excluded" },
    equivalentOutput: true, node: summarize(samples.node), rust: summarize(samples.rust), samples }, null, 2));
} finally {
  // This exact directory was exclusively created by this invocation.
  rmSync(dir, { recursive: true, force: true });
}
