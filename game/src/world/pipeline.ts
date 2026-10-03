export type PipelineState = 0 | 1 | 2 | 3;
export type PipelineSwitch = "lint" | "test" | "build";

const ORDER: readonly PipelineSwitch[] = ["lint", "test", "build"];

export function pressSwitch(state: PipelineState, which: PipelineSwitch): {
  state: PipelineState;
  opened: number;
  reset: boolean;
} {
  if (state === 3) {
    return { state, opened: 3, reset: false };
  }
  if (ORDER[state] !== which) {
    return { state: 0, opened: 0, reset: true };
  }
  const next = (state + 1) as PipelineState;
  return { state: next, opened: next, reset: false };
}
