export default function AuroraBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden">
      {/* Layer 1 — slow purple/blue sweep */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 30% 50%, #7c3aed, transparent 70%)",
          animation: "aurora-1 25s ease-in-out infinite alternate",
        }}
      />
      {/* Layer 2 — mid-speed teal drift */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 70% 40%, #0d9488, transparent 70%)",
          animation: "aurora-2 18s ease-in-out infinite alternate-reverse",
        }}
      />
      {/* Layer 3 — faster blue/red accent */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 60%, #2563eb, transparent 60%), radial-gradient(ellipse 40% 30% at 60% 30%, #dc2626, transparent 70%)",
          animation: "aurora-3 12s ease-in-out infinite alternate",
        }}
      />
    </div>
  );
}
