interface ChevronProps {
  direction: "up" | "down";
  className?: string;
}

const PATHS = {
  down: "M19 9l-7 7-7-7",
  up: "M5 15l7-7 7 7",
};

export default function Chevron({ direction, className }: ChevronProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={PATHS[direction]} />
    </svg>
  );
}
