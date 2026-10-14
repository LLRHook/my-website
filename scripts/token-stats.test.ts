import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { collect, modelLabel, normalizeModel, claudeUsage, codexUsage, DAILY_DAYS } from "./token-stats.mjs";
import { parseTokenStats } from "../app/lib/tokenStats";

const fixtures = join(__dirname, "fixtures", "token-stats");
const run = () => collect({ claudeDir: join(fixtures, "claude"), codexDir: join(fixtures, "codex"), today: "2026-10-14" });

describe("token-stats export", () => {
  it("counts each Claude message once, skips malformed and zero lines, and prices by model", () => {
    const { snapshot, unpriced } = run();
    expect(snapshot.byTool.claudeCode.tokens).toEqual({ input: 51117, output: 2100, cacheWrite: 1000, cacheRead: 70000, total: 124217 });
    // 0.01024 (Opus 5.5 with 1h writes) + 0.006 (Haiku 4.5) + 0.0004 + 0.0305 (Haiku 5.5 over 100K)
    expect(snapshot.byTool.claudeCode.costUsd).toBe(0.05);
    expect(unpriced).toEqual(["mystery-model"]);
  });

  it("sums Codex per-event deltas, including a counter reset, not cumulative totals", () => {
    const { snapshot } = run();
    expect(snapshot.byTool.codex.tokens).toEqual({ input: 301400, output: 160, cacheWrite: 100, cacheRead: 2000, total: 303660 });
    // 0.00141 + 0.00234 + 0.0011 (GPT-6.1 Sol) + 6 (GPT-6 Astra, long-context rate)
    expect(snapshot.byTool.codex.costUsd).toBe(6);
  });

  it("builds lifetime, 30-day and 90-day windows anchored on the run date", () => {
    const { snapshot } = run();
    expect(snapshot).toMatchObject({ asOf: "2026-10-14", since: "2026-05-01", pricesAsOf: "2026-10-14" });
    expect(snapshot.lifetime.tokens.total).toBe(427877);
    expect(snapshot.lifetime.costUsd).toBe(6.05);
    expect(snapshot.last30.tokens.total).toBe(425777);
    expect(snapshot.daily).toHaveLength(DAILY_DAYS);
    expect(snapshot.daily[0].date).toBe("2026-07-17");
    const day = (date: string) => snapshot.daily.find((entry) => entry.date === date);
    expect(day("2026-10-14")).toEqual({ date: "2026-10-14", tokens: 14770, costUsd: 0.02 });
    expect(day("2026-10-13")?.tokens).toBe(111007);
    expect(day("2026-09-01")?.tokens).toBe(2000);
    expect(day("2026-08-01")?.tokens).toBe(0);
  });

  it("ranks models by tokens with unknown models as Other", () => {
    expect(run().snapshot.byModel).toEqual([
      { model: "GPT-6 Astra", tokens: 300000, share: 0.7011 },
      { model: "Claude Haiku 5.5", tokens: 111000, share: 0.2594 },
      { model: "Claude Opus 5.5", tokens: 11210, share: 0.0262 },
      { model: "GPT-6.1 Sol", tokens: 3660, share: 0.0086 },
      { model: "Claude Haiku 4.5", tokens: 2000, share: 0.0047 },
      { model: "Other", tokens: 7, share: 0 },
    ]);
  });

  it("leaks no path, project, session id, prompt or tool name", () => {
    const text = JSON.stringify(run().snapshot);
    for (const secret of ["Secret", "zeta", "sess-", "abc123", "codex-777", "agent-", "Bash", "Users", "/", "\\"]) expect(text).not.toContain(secret);
  });

  it("is deterministic and produces a snapshot the site accepts", () => {
    expect(JSON.stringify(run().snapshot)).toBe(JSON.stringify(run().snapshot));
    expect(parseTokenStats(run().snapshot)).not.toBeNull();
  });

  it("names and normalizes model ids", () => {
    expect(normalizeModel("claude-opus-5-5[1m]")).toBe("claude-opus-5-5");
    expect(normalizeModel("claude-haiku-4-5-20251001")).toBe("claude-haiku-4-5");
    expect(modelLabel("claude-fable-5-1")).toBe("Claude Fable 5.1");
    expect(modelLabel("claude-opus-5")).toBe("Claude Opus 5");
    expect(modelLabel("gpt-6.1-sol")).toBe("GPT-6.1 Sol");
    expect(modelLabel("<synthetic>")).toBeNull();
    expect(modelLabel("opus")).toBeNull();
  });

  it("returns a null cost for unpriced models and clamps cache counts", () => {
    expect(claudeUsage("unknown", { input_tokens: 5 }).costUsd).toBeNull();
    expect(codexUsage("gpt-6.1-sol", { input_tokens: 10, cached_input_tokens: 50, output_tokens: 1 }).tokens)
      .toEqual({ input: 0, output: 1, cacheWrite: 0, cacheRead: 10, total: 11 });
  });
});

describe("token stats validator", () => {
  const good = () => structuredClone(run().snapshot);
  it.each<[string, (value: ReturnType<typeof good>) => unknown]>([
    ["a non-object", () => "nope"],
    ["a bad date", (value) => ({ ...value, asOf: "2026-13-45" })],
    ["a negative count", (value) => { value.lifetime.tokens.input = -1; return value; }],
    ["a total that does not add up", (value) => { value.lifetime.tokens.total += 1; return value; }],
    ["tools that do not sum to lifetime", (value) => { value.byTool.codex.tokens.input += 1; value.byTool.codex.tokens.total += 1; return value; }],
    ["markup in a model name", (value) => { value.byModel[0].model = "<b>x</b>"; return value; }],
    ["a short daily series", (value) => ({ ...value, daily: value.daily.slice(1) })],
    ["unsorted days", (value) => { [value.daily[0], value.daily[1]] = [value.daily[1], value.daily[0]]; return value; }],
    ["a non-finite cost", (value) => { value.last30.costUsd = Number.NaN; return value; }],
  ])("rejects %s", (_name, mutate) => {
    expect(parseTokenStats(mutate(good()))).toBeNull();
  });
  it("accepts the committed snapshot", () => {
    expect(parseTokenStats(JSON.parse(readFileSync(join(__dirname, "..", "data", "token-stats.json"), "utf8")))).not.toBeNull();
  });
});
