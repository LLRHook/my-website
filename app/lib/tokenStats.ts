// Shape of data/token-stats.json, written by scripts/token-stats.mjs from local
// Claude Code and Codex logs. Only totals by day, tool and model: no paths,
// project names, session ids, prompts or tool names.

export interface TokenCounts { input: number; output: number; cacheWrite: number; cacheRead: number; total: number }
export interface TokenUsage { tokens: TokenCounts; costUsd: number }
export interface ModelShare { model: string; tokens: number; share: number }
export interface DailyUsage { date: string; tokens: number; costUsd: number }

export interface TokenStats {
  asOf: string;
  since: string;
  pricesAsOf: string;
  lifetime: TokenUsage;
  last30: TokenUsage;
  byTool: { claudeCode: TokenUsage; codex: TokenUsage };
  byModel: ModelShare[];
  daily: DailyUsage[];
}

export const DAILY_DAYS = 90;
const MAX_MODELS = 8;

type Data = Record<string, unknown>;
const isObject = (value: unknown): value is Data => typeof value === "object" && value !== null && !Array.isArray(value);
const isCount = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
const isMoney = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const isDay = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

function isCounts(value: unknown): value is TokenCounts {
  if (!isObject(value)) return false;
  const { input, output, cacheWrite, cacheRead, total } = value;
  return [input, output, cacheWrite, cacheRead, total].every(isCount)
    && (input as number) + (output as number) + (cacheWrite as number) + (cacheRead as number) === total;
}
const isUsage = (value: unknown): value is TokenUsage => isObject(value) && isCounts(value.tokens) && isMoney(value.costUsd);
const isModel = (value: unknown): value is ModelShare => isObject(value) && typeof value.model === "string"
  && /^[\w .-]{1,40}$/.test(value.model) && isCount(value.tokens) && isMoney(value.share) && value.share <= 1;
const isDaily = (value: unknown): value is DailyUsage => isObject(value) && isDay(value.date) && isCount(value.tokens) && isMoney(value.costUsd);

// Returns the snapshot only if every field has the expected shape, else null, so a
// bad or missing file omits the panel instead of breaking /projects.
export function parseTokenStats(value: unknown): TokenStats | null {
  if (!isObject(value)) return null;
  const { asOf, since, pricesAsOf, lifetime, last30, byTool, byModel, daily } = value;
  if (!isDay(asOf) || !isDay(since) || !isDay(pricesAsOf) || since > asOf) return null;
  if (!isUsage(lifetime) || !isUsage(last30) || last30.tokens.total > lifetime.tokens.total) return null;
  if (!isObject(byTool) || !isUsage(byTool.claudeCode) || !isUsage(byTool.codex)) return null;
  if (byTool.claudeCode.tokens.total + byTool.codex.tokens.total !== lifetime.tokens.total) return null;
  if (!Array.isArray(byModel) || byModel.length > MAX_MODELS || !byModel.every(isModel)) return null;
  if (!Array.isArray(daily) || daily.length !== DAILY_DAYS || !daily.every(isDaily)) return null;
  if (daily.some((day, index) => index > 0 && day.date <= daily[index - 1].date) || daily[DAILY_DAYS - 1].date !== asOf) return null;
  return { asOf, since, pricesAsOf, lifetime, last30, byTool: { claudeCode: byTool.claudeCode, codex: byTool.codex }, byModel, daily };
}
