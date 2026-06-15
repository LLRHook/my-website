# Victor Ivanov — Portfolio

[victorivanov.engineer](https://victorivanov.engineer)

Personal portfolio site built with Next.js, featuring ambient animations and a glassmorphism design system.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4
- **Animations**: Motion (Framer Motion), tsParticles, CSS keyframes
- **Language**: TypeScript, React 19

## Features

- **Aurora Background** — 3-layer animated gradient with purple, teal, blue, and red accents
- **Noise Overlay** — SVG feTurbulence film grain texture at 3% opacity
- **Floating Particles** — 50 interactive dots with grab interaction (desktop only)
- **Shimmer Card Borders** — Rotating conic-gradient light on glass cards, red accent on hover
- **Timeline** — Chronological project showcase with alternating left/right cards, paginated (6 at a time) with "Show More" lazy loading
- **Scroll Animations** — Parallax hero, fade-in sections, opacity-driven statement text
- **Glassmorphism** — Frosted glass cards with backdrop blur and hover glow

## Project Structure

```
app/
  components/
    ui/           # Reusable: Container, GlassCard, AuroraBackground, NoiseOverlay, ParticlesBackground, etc.
    work/         # Timeline: TimelineSection, TimelineCard, ProjectCardExpanded
    about/        # SkillBadge
  lib/            # Types, constants
  globals.css     # Theme tokens, glass utilities, shimmer borders, keyframes
  layout.tsx      # Root layout with background layers + z-index stacking
```

## Z-Index Layering

| Layer      | z-index | Position |
|------------|---------|----------|
| Aurora     | -10     | fixed    |
| Noise      | 1       | fixed    |
| Particles  | 2       | fixed    |
| Content    | 5       | relative |
| Navbar     | 50      | fixed    |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Configuration

The Work timeline is populated from the owner's public GitHub repositories, fetched
server-side at build / ISR-revalidate time (`app/lib/github.ts`).

| Env var | Required | Purpose |
|---------|----------|---------|
| `GITHUB_TOKEN` | Recommended | GitHub PAT used to authenticate REST API calls (5000 req/hr). Without it the app falls back to the public endpoint, which is rate-limited to **60 req/hr per IP** — unreliable on serverless/shared IPs (this caused the "No projects to display" outage; see `CHANGELOG.md`, BUG-1781501120). Public-repo read is all that's needed (no scopes required). See `.env.example`. |

Set it locally in `.env.local` and in the Vercel project's **Production** environment
variables. Editing the Vercel value requires a redeploy to take effect.

## Testing & Verification

```bash
npm run test:e2e     # Playwright E2E (auto-builds + starts the prod server)
npx tsc --noEmit     # type-check
```

[`VERIFICATION.md`](./VERIFICATION.md) is the canonical, cold-start release-readiness
protocol (six staged gates). Run it before any release or after a large refactor.

## Contributing — project cycle

This repo follows a tracked dev cycle:

- [`bugs.md`](./bugs.md) — open defects (`BUG-NNN`).
- [`features.md`](./features.md) — scoped features (`FEAT-NNN`).
- [`CHANGELOG.md`](./CHANGELOG.md) — fixes/features migrated here once verified.
- [`VERIFICATION.md`](./VERIFICATION.md) — the V&V protocol.

File a `BUG-NNN`/`FEAT-NNN` before fixing/building; migrate it to `CHANGELOG.md` once
verified. See [`CLAUDE.md`](./CLAUDE.md) for the full lifecycle rules.
