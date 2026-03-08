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
