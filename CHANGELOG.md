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

## [v1.0.0] - 2026-10-14

### Verified

- 2026-10-14 V&V pass on a local production build (`npm ci`, `SITE_ORIGIN=http://localhost:3000 npm run build`, `next start`), SHA 6ec878b: lint zero warnings, tsc zero errors, 251 Vitest (21 files), Playwright 141 listed (129 passed, 12 skipped; new and affected specs rerun without retries, no flips); batch FEAT-1788629556, FEAT-1788611335, FEAT-1788650818, FEAT-1788652720, FEAT-1788653835, FEAT-1788655296, FEAT-1788655651, FEAT-1790801371, FEAT-1790806476, FEAT-1790821648, FEAT-1790963490, FEAT-1790966739, FEAT-1790966740, FEAT-1790968447, FEAT-1790968448, FEAT-1790968449, FEAT-1790969283, FEAT-1790978717, FEAT-1791849857, FEAT-1791849858, FEAT-1791849859, FEAT-1791849860, BUG-1781504214, BUG-1788662454, BUG-1788653836, BUG-1788655093, BUG-1788655652, BUG-1788656593, BUG-1788663409, BUG-1788663454, BUG-1790801366, BUG-1790801367, BUG-1790801368, BUG-1790801370, BUG-1790822531, BUG-1790964596, BUG-1790966738, BUG-1790972091, BUG-1790979920, BUG-1790991960, BUG-1791851972, BUG-1791949998, BUG-1791949999; stack fresh, data none (stateless); gui pass. Since v0.4.0 the React room site was replaced by the HTML/CSS site and Codelings, so the room tests were retired and the suites grew from 8 unit and 20 E2E.
- 2026-10-14 V&V pass on a local production build (`npm ci`, `SITE_ORIGIN=http://localhost:3000 npm run build`, `next start`) in a clean worktree, SHA 1344f04: lint zero warnings, tsc zero errors, 64 Vitest (4 files), Playwright 41 listed (41 passed, 0 skipped; site and performance specs rerun without retries, no flips); batch FEAT-1790991961, FEAT-1790991962, FEAT-1790991963, FEAT-1790991964, FEAT-1791988181, FEAT-1791988182, FEAT-1791988183, BUG-1791980560, BUG-1791991388; stack fresh, data none (stateless); gui pass. The Codelings game and its tests were removed (FEAT-1791988181), so the suites shrank from 251 unit and 141 E2E, and webkit-mobile now runs only the site spec, leaving no skips.

### Added

- [FEAT-1788629556] Uncrowded phone room with subtle discovery and softer ambience. [minor]
- [FEAT-1788611335] Room close-ups, poker details, and optional ambient sound. [minor]
- [FEAT-1788650818] Professional profile copy and curated work inside the room. [minor]
- [FEAT-1788652720] Replace poker desk detail with a playful roulette toy. [minor]
- [FEAT-1788653835] Simplify room close-ups and give the cat a varied idle rhythm. [minor]
- [FEAT-1788655296] Red Rising reading shelf and default quiet room ambience. [minor]
- [FEAT-1788655651] Direct room interactions and education frame. [minor]
- [FEAT-1790801371] Addressable desktop apps and public resume PDF. [minor]
- [FEAT-1790806476] Photoreal room renders and web asset export. [minor]
- [FEAT-1790821648] Photoreal room on the site (phase 2). [minor]
- [FEAT-1790963490] Rebuild the site as a 1990s HTML/CSS home page. [major]
- [FEAT-1790966739] 1990s pixel-art favicon set. [minor]
- [FEAT-1790966740] SEO pass: share card, name-focused metadata, breadcrumbs. [minor]
- [FEAT-1790968447] Codelings game, part 1: engine, embed and title screen. [minor]
- [FEAT-1790968448] Codelings game, part 2: overworld, maps and story. [minor]
- [FEAT-1790968449] Codelings game, part 3: Codelings, battles, Codex and ending. [minor]
- [FEAT-1790969283] Plain Off the Clock copy. [minor]
- [FEAT-1790978717] Codelings on phones: fullscreen play, sliding D-pad, haptics. [minor]
- [FEAT-1791849857] Codelings boot without a long main-thread task. [minor]
- [FEAT-1791849858] Instant page-to-page navigation with header-delivered speculation rules. [minor]
- [FEAT-1791849859] Inline the stylesheet to remove the render-blocking CSS request. [minor]
- [FEAT-1791849860] CI performance budget for page weight, requests, game bundle and long tasks. [minor]
- [FEAT-1790991961] Fast loading on slow or metered connections. [minor]
- [FEAT-1790991962] Codelings evolve. [minor]
- [FEAT-1790991963] Codelings region expansion: two towns, two routes, two gyms and the Champion. [minor]
- [FEAT-1790991964] Codelings post-game: rematches, a legendary and side quests. [minor]
- [FEAT-1791988182] Token-usage snapshot export (`npm run token-stats` writes `data/token-stats.json`). [minor]
- [FEAT-1791988183] Token burner panel on /projects. [minor]

### Fixed

- [BUG-1781504214] Outdated dependency tree includes high-severity advisories. [patch]
- [BUG-1788662454] WebKit compatibility mouse events cancel the touch-motion reset. [patch]
- [BUG-1788653836] Dialog focus trap includes inputs disabled by a fieldset. [patch]
- [BUG-1788655093] Standalone typecheck rejects injected browser test helper assertion. [patch]
- [BUG-1788655652] Evening caption loses contrast and room computer is off center. [patch]
- [BUG-1788656593] Interrupted ambient audio cannot resume with an existing scheduler. [patch]
- [BUG-1788663409] Room documentation describes retired interactions and audio defaults. [patch]
- [BUG-1788663454] Combined desktop features fail current lint and browser checks. [patch]
- [BUG-1790801366] Resume and featured projects lag the September resume. [patch]
- [BUG-1790801367] Project shelf and README links expose junk content. [patch]
- [BUG-1790801368] Skip link does not skip the header. [patch]
- [BUG-1790801370] App text fails WCAG AA contrast. [patch]
- [BUG-1790822531] DesktopWindow local-link test times out on cold README import. [patch]
- [BUG-1790964596] next 16.3.4 is vulnerable to remote code execution (GHSA-vcvr-r3jv-pc5j). [patch]
- [BUG-1790966738] Structured data dropped and 404 page canonicalizes to home. [patch]
- [BUG-1790972091] Marquee wraps onto two static lines under reduced motion. [patch]
- [BUG-1790979920] VERIFICATION.md still describes a script-free site and the old test baseline. [patch]
- [BUG-1790991960] Handheld D-pad left and right arrows render as emoji on phones. [patch]
- [BUG-1791851972] WebKit blocks the speculation rules fetch under script-src 'none'. [patch]
- [BUG-1791949998] VERIFICATION.md build and E2E commands diverge from CI. [patch]
- [BUG-1791949999] CLAUDE.md cites VERIFICATION.md sections that do not exist. [patch]
- [BUG-1791980560] Resume and About page describe a Secret clearance as pending eligibility. [patch]
- [BUG-1791991388] Four shipped Codelings tickets sit inside the features.md lifecycle text. [patch]

### Removed

- [FEAT-1791988181] Remove the Codelings game from /projects; every page is JavaScript free. [major]

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
