export const TYPES = ["python", "javascript", "typescript", "go", "swift", "shell", "dart",
  "csharp", "java", "normal"] as const;
export type TypeId = typeof TYPES[number];
const cycle: readonly TypeId[] = ["typescript", "javascript", "python", "shell", "go", "java",
  "csharp", "swift", "dart"];
export function effectiveness(attack: TypeId, defend: TypeId): number {
  if (attack === "normal" || defend === "normal") {
    return 1;
  }
  if (attack === defend) {
    return 0.5;
  }
  const index = cycle.indexOf(attack);
  return cycle[(index + 1) % cycle.length] === defend ? 2
    : cycle[(index + cycle.length - 1) % cycle.length] === defend ? 0.5 : 1;
}
