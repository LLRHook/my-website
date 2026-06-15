// Shared date formatting helpers (FEAT-1781502128).
// Pure functions — safe to import from both server and client modules.

/** Full month name for a 0-based month index (0 = January). */
export function monthName(index: number): string {
  return new Date(2000, index).toLocaleString("en-US", { month: "long" });
}

/** Short human date, e.g. "Jun 15, 2026". */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
