"use client";

interface ActivitySparklineProps {
  weeks: number[];
  weeksToShow?: number;
}

export default function ActivitySparkline({
  weeks,
  weeksToShow = 26,
}: ActivitySparklineProps) {
  if (!weeks || weeks.length === 0) return null;

  const recent = weeks.slice(-weeksToShow);
  const max = Math.max(...recent, 1);
  const total = recent.reduce((a, b) => a + b, 0);

  return (
    <div
      className="flex items-end gap-px h-5"
      role="img"
      aria-label={`${total} commits in last ${recent.length} weeks`}
      title={`${total} commits · last ${recent.length} weeks`}
    >
      {recent.map((count, i) => {
        const height = Math.max(2, (count / max) * 20);
        const opacity = count === 0 ? 0.15 : 0.4 + (count / max) * 0.6;
        return (
          <span
            key={i}
            className="inline-block w-[3px] rounded-sm bg-accent"
            style={{ height: `${height}px`, opacity }}
          />
        );
      })}
    </div>
  );
}
