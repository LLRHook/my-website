# Changelog

Bug fixes are migrated here from `bugs.md` once verified. Features are migrated
from `features.md`. Each entry keeps the original `BUG-<id>` / `FEAT-<id>` so
history can be traced both ways.

The format is loosely [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
with `Verified`, `Added`, `Changed`, `Fixed`, `Removed`, and `Security` sections
under each release/date heading.

---

## Unreleased

### Verified

### Added

### Changed

### Fixed

### Removed

### Security

## [v0.4.0] - 2026-06-18

### Verified

- 2026-06-18 V&V pass at SHA 63ea219 (local DUT build/test/E2E + Vercel prod smoke): 8 unit (2 files, Vitest) + 20 E2E (3 specs, run twice with no flake), all automated + prod-smoke stages green. This release is dev-infra only (FEAT-1781501122/123/124 — Vitest, ESLint, CI test/lint gates); the app runtime is byte-identical to the v0.3.0 Verified build, so the Stage 3–5 functional/adversarial/perf results carry forward (Lighthouse not re-run). The FEAT-1781501122 unit-coverage gap flagged in the prior Verified entries is now closed for the `github.ts` data layer (0 → 8 unit tests).

### Added

- [FEAT-1781501122] Unit/component test layer — Vitest 4 + Testing Library + jsdom; 8 tests over the `github.ts` data layer (incl. the BUG-1781501120 fallback) and `TimelineSection`. [minor]
- [FEAT-1781501123] ESLint 9 flat config (`next/core-web-vitals` + `next/typescript`) wired to `npm run lint`. [minor]
- [FEAT-1781501124] CI runs lint + unit tests + build + Playwright E2E (was build-only); data-driven build/E2E authenticated via `secrets.GITHUB_TOKEN`. [minor]

## [v0.3.0] - 2026-06-16

### Verified

- 2026-06-16 V&V pass on Vercel prod (SHA 3c64a56): 0 unit, 20 E2E (3 specs), all automated + prod-smoke stages green. Coverage caveat: the particle field (FEAT-1781507205) and the perf lazy-load (FEAT-1781586642) lack dedicated unit tests (tracked by FEAT-1781501122) — verified via E2E + live prod smoke + the Run-tab leak-safety E2E.

### Added

- [FEAT-1781507205] Restore the full interactive star/aurora background for all visitors (now renders under reduce-motion + mobile). [minor]
- [FEAT-1781586642] Performance: lazy-load the expanded card + defer particles to idle; leak-harden card fetches — First Load JS 251 → 155 kB (-38%). [patch]
- [FEAT-1781587502] Live "Run" tab — StackBlitz embed for web repos (click-to-load, leak-safe). [minor]

## [v0.2.0] - 2026-06-15

### Verified

- 2026-06-15 V&V pass on Vercel prod (SHA 6fde137): 0 unit, 19 E2E (3 specs), all automated + prod-smoke stages green. Coverage caveat: FEAT-1781502130 and the FEAT-1781502131/132 data layers lack dedicated unit tests (tracked by FEAT-1781501122) — verified via E2E + live prod smoke.

### Added

- [FEAT-1781502127] Centralize animation/UI constants in `app/lib/animationConfig.ts`. [patch]
- [FEAT-1781502128] Consolidate inline SVG icons, dedupe skills + date utils, remove dead `GlassCard`. [patch]
- [FEAT-1781502129] Momentum smooth scrolling via Lenis (reduced-motion-guarded). [minor]
- [FEAT-1781502130] Section/element transitions + site-wide reduced-motion respect (MotionConfig). [minor]
- [FEAT-1781502131] Project card: repo topics + recent commits (Activity tab). [minor]
- [FEAT-1781502132] Project card: lazy server-side syntax-highlighted source peek (shiki). [minor]
- [FEAT-1781502133] Faceted README/Code/Activity project card with skeleton loader. [minor]

### Fixed

- [BUG-1781501121] Removed orphaned `StatementSection` and its 4 stale E2E `statement` assertions; E2E suite green. [patch]
- [BUG-1781501120] Projects now render in production — replaced the stale Vercel `GITHUB_TOKEN` and hardened `app/lib/github.ts` (try/catch around the paginated repos fetch so a timeout can't crash the render, fallback to the public repos endpoint when the authenticated request yields nothing, and a timeout + graceful fallback in `fetchReadme`). Fixes the always-empty "No projects to display" Work timeline. [patch]
