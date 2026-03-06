"use client";

export default function MeshGradient() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10">
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.12) 0%, transparent 50%)",
            "radial-gradient(ellipse at 80% 20%, rgba(37,99,235,0.10) 0%, transparent 50%)",
            "radial-gradient(ellipse at 60% 80%, rgba(76,29,149,0.08) 0%, transparent 50%)",
            "radial-gradient(ellipse at 40% 30%, rgba(220,38,38,0.06) 0%, transparent 40%)",
          ].join(", "),
          backgroundSize: "200% 200%",
          animation: "mesh-shift 60s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse at 70% 60%, rgba(30,64,175,0.10) 0%, transparent 50%)",
            "radial-gradient(ellipse at 30% 70%, rgba(124,58,237,0.08) 0%, transparent 50%)",
            "radial-gradient(ellipse at 50% 10%, rgba(37,99,235,0.06) 0%, transparent 40%)",
          ].join(", "),
          backgroundSize: "200% 200%",
          animation: "mesh-shift 75s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}
