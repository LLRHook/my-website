# Interactive workspace makeover

Requested September 5, 2026. Full implementation, independent browser validation,
and release review using the existing GitHub-to-Vercel deployment.

## Stack profile

Next.js 15 / React 19 / TypeScript / Tailwind 4, npm lockfile, GitHub Actions,
Vercel production hosting. Public GitHub data comes through `app/lib/github.ts`.
Checks: `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`.
Existing user deletion of `CLAUDE.md` is outside this change.

## Implementation

1. Build a responsive SVG room with a central computer, photography notes,
   warm lighting, plants, books, hobby details, and an animated window cat.
2. Implement off/booting/desktop states, a skip-startup control, accessible
   desktop applications, and a full-size reading view on small screens.
3. Use verified biography and public project data. Reformat resume information
   for the screen; keep original resume files unchanged and record suggestions.
4. Replace homepage-only particle and smooth-scroll runtime work with CSS/SVG.
   Clean up timers/listeners, pause ambient motion when hidden, and respect
   reduced motion and a manual motion setting.
5. Validate production builds, desktop/mobile interaction, keyboard use,
   project fallback, repeated open/close cycles, console errors, and SEO routes.
6. Commit only this task's changes, push to main, verify Vercel's deployment,
   and repeat the critical browser flows on victorivanov.engineer.

## Risks and rollback

Small room controls need separate accessible navigation on phones. Startup must
remain skippable. GitHub downtime must not erase core portfolio content.
Professional dates and claims require source evidence. The original resume is
unchanged. Rollback is a normal revert of the makeover commit followed by the
existing production deployment. Previous production commit: `aa7f7cd`.
