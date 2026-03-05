export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)", color: "#fff", padding: "2rem" }}>
      <div style={{ maxWidth: 600, textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 700, margin: "0 0 1rem", letterSpacing: "-0.02em" }}>
          My Website
        </h1>
        <p style={{ fontSize: "1.25rem", color: "#a0a0b0", lineHeight: 1.6, margin: "0 0 2rem" }}>
          A clean, single-page site deployed with the <code style={{ background: "rgba(255,255,255,0.1)", padding: "0.15em 0.4em", borderRadius: 4, fontSize: "0.9em" }}>/deploy</code> skill.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <span style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", padding: "0.5rem 1rem", borderRadius: 8, fontSize: "0.9rem" }}>
            Vercel
          </span>
          <span style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", padding: "0.5rem 1rem", borderRadius: 8, fontSize: "0.9rem" }}>
            Next.js
          </span>
          <span style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", padding: "0.5rem 1rem", borderRadius: 8, fontSize: "0.9rem" }}>
            Railway
          </span>
        </div>
      </div>
      <footer style={{ position: "absolute", bottom: "2rem", color: "#555", fontSize: "0.85rem" }}>
        Deployed with /deploy
      </footer>
    </main>
  )
}
