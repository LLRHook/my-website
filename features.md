# my-website (Victor Ivanov Portfolio) — Feature Tracker

This file is the working list of features to implement. New features are appended
here as they are scoped. When a feature is shipped, tick its checkbox and migrate
the entry (with the implementation note) to `CHANGELOG.md` so this file stays
focused on outstanding work.

## Conventions

Each entry uses the form:

```
### [<id>] <short title>
- [ ] **Priority:** crit | high | med | low
- **Area:** <same tag set as bugs.md>
- **File(s):** comma-separated paths the feature will create or modify
- **Why:** product / user motivation
- **Approach:** the design — concrete enough that an implementer doesn't have to ask
- **Library / dependency notes:** evaluation of any third-party deps, with the recommendation called out explicitly
- **Acceptance criteria:** bullet checklist of what "done" means
- **Test plan:** unit / integration / E2E coverage to land with the feature
- **Out of scope:** explicit "we are NOT doing X in this ticket"
- **Bump:** major | minor | patch  (feature defaults **minor**, a breaking change is **major**)
- **Status:** open | in-progress | shipped-pending-migration
```

Priority guide: crit / high / med / low.

## Lifecycle
1. **File:** new entries under `## Open` with the full template.
2. **Implement:** flip status to `in-progress`, write code + tests.
3. **Verify:** set `shipped-pending-migration`, tick checkbox, add `**Implementation:**` line.
4. **Migrate:** move to `## Shipped`, append a one-liner to `CHANGELOG.md / Unreleased / Added` (or `Changed`).

IDs are UNIX-epoch timestamps (`FEAT-$(date +%s)`), never sequential — appended at
the end of their section, sorted by id on read.

> Larger product features (smoother scrolling, page/section transitions, per-project
> in-card mini-demos, code cleanup) are scoped in `docs/SRS.md` and will be filed here
> as `FEAT-NNN` entries via the `/groom` skill. The entries below are the quality/coverage
> gaps surfaced by the V&V bootstrap audit.

---

## Open

### [FEAT-1781501122] Add a unit/component test layer (Vitest + Testing Library)
- [ ] **Priority:** med
- **Area:** tests, frontend
- **File(s):** package.json, vitest.config.ts (new), app/lib/github.test.ts (new), app/components/work/__tests__/* (new)
- **Why:** The project has only E2E (Playwright) coverage. Pure logic — `buildTimelineData`, `toLanguageSlices`, the `fetchAllRepos` fallback path, pagination, the `recentCommits`/`fetchKeyFile` additions, and the FEAT-1781502130 reduced-motion/stagger behaviour — has no fast unit coverage (the V&V 2a/2b gap), so data-layer and animation regressions are only caught by a full browser run, if at all.
- **Approach:** Add Vitest with `@testing-library/react` + `jsdom`. Unit-test `app/lib/github.ts` pure transforms with `fetch` mocked (success, non-OK, empty, token→public fallback, recentCommits, fetchKeyFile heuristic). Component-test `TimelineSection` empty-state vs populated. Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts.
- **Library / dependency notes:** **Vitest** (native ESM/TS, fast, Vite-aligned — recommended over Jest for a Next 15 + TS 5.9 project). `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`. Confirm latest stable versions before installing.
- **Acceptance criteria:**
  - `npm test` runs Vitest and passes.
  - `github.ts` transforms + fallback covered (success / non-OK / empty / fallback).
  - `TimelineSection` empty vs populated rendering covered.
- **Test plan:** the tests themselves; count recorded in `VERIFICATION.md § 2`.
- **Out of scope:** rewriting the Playwright E2E layer; visual-regression snapshots.
- **Bump:** minor
- **Status:** open

### [FEAT-1781501123] Add ESLint (next/core-web-vitals) config
- [ ] **Priority:** low
- **Area:** ci, frontend
- **File(s):** eslint.config.mjs (new), package.json
- **Why:** No linter is configured, so `next build` performs no lint pass and Stage 1 (static review) has nothing to run. A linter catches accessibility regressions, unused code, and React-hook misuse before they ship.
- **Approach:** Add `eslint` + `eslint-config-next` with the flat-config (`eslint.config.mjs`) using `next/core-web-vitals`. Add `"lint": "next lint"` (or `eslint .`). Fix any findings the first run surfaces (file as separate BUGs if non-trivial).
- **Library / dependency notes:** `eslint`, `eslint-config-next` (matched to Next 15). Confirm latest stable.
- **Acceptance criteria:**
  - `npm run lint` runs clean (or remaining findings are filed as BUGs).
  - Stage 1 of `VERIFICATION.md` references the lint command.
- **Test plan:** n/a (lint is the check); wire into CI via FEAT-1781501124.
- **Out of scope:** Prettier/formatting enforcement.
- **Bump:** minor
- **Status:** open

### [FEAT-1781501124] CI runs tests + lint, not just build
- [ ] **Priority:** med
- **Area:** ci
- **File(s):** .github/workflows/ci.yml
- **Why:** CI only runs `next build` on push/PR to main. It never runs the Playwright E2E suite or any lint/unit tests, so a red test suite (e.g. the current orphaned-statement failures, BUG-1781501121) can ship undetected.
- **Approach:** Extend `ci.yml`: after build, run `npm run lint` (FEAT-1781501123) and `npm test` (FEAT-1781501122), and a Playwright job (`npx playwright install --with-deps chromium` then `npm run test:e2e`). Upload the Playwright HTML report as an artifact.
- **Library / dependency notes:** none new (GitHub Actions + existing tooling).
- **Acceptance criteria:**
  - CI fails when a unit, lint, or E2E check fails.
  - Playwright report uploaded as an artifact on failure.
- **Test plan:** verify by pushing a branch with a deliberately failing test and confirming CI goes red.
- **Out of scope:** deploy steps (Vercel handles deploy via its Git integration).
- **Bump:** minor
- **Status:** open

### [FEAT-1781505473] Refine source-peek key-file heuristic
- [ ] **Priority:** low
- **Area:** github-api, frontend
- **File(s):** app/lib/github.ts
- **Why:** The source peek (FEAT-1781502132) sometimes selects a config/generated file (e.g. `next-env.d.ts`, `eslint.config.js`) when a repo has no clearly-named entrypoint at root/src — it works but isn't the most representative code. Surfaced by the 2026-06-15 V&V prod smoke.
- **Approach:** In `pickCandidate`, deprioritize obvious config/generated/dotfiles (`*.config.*`, `*-env.d.ts`, `*.lock`, dotfiles) and prefer a real source file matching the language; keep the entrypoint-name match first and the graceful-null fallback.
- **Library / dependency notes:** none.
- **Acceptance criteria:** for repos like `my-website`/`citybase`, the peek selects an app/source file rather than a config file where one exists; graceful null still returned when nothing suitable.
- **Test plan:** unit-test `pickCandidate` once the unit layer (FEAT-1781501122) exists; manual prod smoke against a few repos.
- **Out of scope:** recursing beyond root/src; ranking by code "interestingness".
- **Bump:** patch
- **Status:** open

---

## Shipped

### [FEAT-1781507205] Restore prominent interactive star/aurora background
- [x] **Priority:** med
- **Area:** ui, animation
- **File(s):** app/components/ui/ParticlesBackground.tsx, app/components/ui/AuroraBackground.tsx, app/lib/animationConfig.ts
- **Why:** The particle "stars" + aurora background rendered but was so faint (dots opacity 0.2, links 0.05, aurora 0.05–0.07) it read as missing — user reported it "gone". Diagnosis (headless probe) confirmed the engine + canvas were fine; the issue was visual prominence, not absence.
- **Approach:** Twinkling stars (animated opacity 0.2–0.6), visible constellation links (0.18), crisp hover-grab (links 0.5, `detectsOn: window`), 70 particles; bolder aurora opacities. Desktop (>=768px) + reduced-motion guards preserved.
- **Library / dependency notes:** none (existing tsParticles + CSS aurora).
- **Acceptance criteria:** the FULL animated + hover-interactive star-field renders in ALL conditions (desktop + mobile, regardless of reduce-motion); lighter count on mobile; grab-on-hover works; no console errors; build + E2E green.
- **Test plan:** live-site headless matrix (viewport × reduced-motion) + a hover-grab interactivity probe; existing Playwright suite (no regression).
- **Out of scope:** new background concepts (WebGL shaders, etc.); changing the z-index stack.
- **Implementation:** Restored the early interactive star-field per owner request. `ParticlesBackground` always renders client-side with the FULL animated + hover-grab config (twinkle opacity 0.2–0.6, drift, `detectsOn: window` grab, links 0.18 / grab 0.5, count 70, 35 on mobile). Removed the reduced-motion gate AND the earlier static fallback — the original (cc9a83e) had no reduced-motion gate; the gate added in 65c772b is what hid the stars for reduce-motion users (the likely cause of "it's gone"). Aurora opacities raised (0.07/0.06/0.05 → 0.12/0.10/0.09). **Deliberate owner decision:** the particle field intentionally ignores `prefers-reduced-motion` (the rest of the site still honors it via MotionConfig/CSS). Verified on live across the desktop/mobile × motion/reduce matrix + a hover-grab interactivity check.
- **Bump:** minor
- **Status:** shipped-pending-migration

### [FEAT-1781586642] Performance: lazy-load expanded card + defer particles; leak-harden card
- [x] **Priority:** high
- **Area:** frontend, animation
- **File(s):** app/components/work/TimelineCard.tsx, app/components/ui/ParticlesBackground.tsx, app/components/work/ProjectCardExpanded.tsx
- **Why:** Cut initial load (react-markdown + remark-gfm + rehype-raw shipped in the homepage bundle though only needed once a card is opened) and remove memory-leak risk in the interactive components.
- **Approach:** Lazy-load `ProjectCardExpanded` via `next/dynamic` (markdown chunk out of the initial bundle); defer the tsParticles engine init to `requestIdleCallback`; replace cancelled-flag fetch guards with `AbortController` so in-flight requests abort on unmount/tab-switch.
- **Library / dependency notes:** none (uses `next/dynamic` + platform `AbortController` / `requestIdleCallback`).
- **Acceptance criteria:** First Load JS for `/` drops materially; E2E green (lazy card still works); no setState-after-unmount; build + tsc clean.
- **Test plan:** build First Load JS before/after; Playwright suite.
- **Out of scope:** live interactive per-project embeds (infeasible for the ~23 non-web / non-deployed repos; a StackBlitz opt-in for the ~13 web repos would be a separate ticket).
- **Implementation:** Lazy-loaded `ProjectCardExpanded` → First Load JS `/` **251 kB → 155 kB** (route JS 148 → 52.4 kB); deferred particle init to idle with `cancelIdleCallback` cleanup; `AbortController` on README + source fetches. tsc clean, E2E 19/19.
- **Bump:** patch
- **Status:** shipped-pending-migration

### [FEAT-1781587502] Live "Run" tab: StackBlitz embed for web repos
- [x] **Priority:** med
- **Area:** frontend
- **File(s):** app/components/work/ProjectCardExpanded.tsx, e2e/card-tabs.spec.ts
- **Why:** Deliver a genuinely runnable per-project demo (the "fully functional mini demo" ask) for browser-runnable repos, beyond the metadata/code/activity card.
- **Approach:** Add a "Run" tab (shown only for JS/TS/Astro/Vue/Svelte/HTML repos) embedding `stackblitz.com/github/<owner>/<repo>` via an iframe with `ctl=1` (click-to-load — no WebContainer boots until the user clicks). The iframe is mounted only while the Run tab is active, so switching tabs / collapsing the card unmounts it and tears down the runtime (leak-safe). Non-runnable repos never get the tab.
- **Library / dependency notes:** none — plain iframe (no `@stackblitz/sdk` dep) for full React-controlled mount/unmount.
- **Acceptance criteria:** Run tab appears for web repos only; clicking it mounts the StackBlitz iframe; switching tabs unmounts it (no lingering iframe/WebContainer); no client-bundle growth; build/tsc/E2E green.
- **Test plan:** `e2e/card-tabs.spec.ts` asserts mount on Run + unmount on switch (leak-safe); manual prod check of a live boot.
- **Out of scope:** auto-booting the runtime; embeds for non-web repos; the `@stackblitz/sdk`.
- **Implementation:** Added "Run" tab to `ProjectCardExpanded` gated on `RUNNABLE_LANGS`; StackBlitz click-to-load iframe (`ctl=1&view=preview`), mounted only while active → leak-safe unmount on tab-switch/collapse. First Load JS unchanged (155 kB; embed lives in the iframe). tsc clean, E2E 20/20 (incl. the leak-safe mount/unmount test).
- **Bump:** minor
- **Status:** shipped-pending-migration

### [FEAT-1781502127] Centralize animation/UI constants
- [x] **Priority:** low
- **Area:** frontend
- **File(s):** app/lib/animationConfig.ts (new), app/components/HeroSection.tsx, app/components/ui/BackToTop.tsx, app/components/ui/FadeInOnScroll.tsx, app/components/work/TimelineCard.tsx, app/components/ui/ParticlesBackground.tsx
- **Why:** SRS FR-2. Animation magic numbers are scattered (scroll thresholds 600/400, reveal offset 40px, viewport margin -80px, stagger 0.05, particle distance/speed), making tuning error-prone and the transition work (FEAT-1781502130) harder.
- **Approach:** Create `app/lib/animationConfig.ts` exporting named constants; replace literals with imports. Pure refactor — values identical, no behavior change.
- **Library / dependency notes:** none.
- **Acceptance criteria:** literals replaced by named constants; values match prior behavior; `npm run build` + `npx tsc --noEmit` clean; E2E green.
- **Test plan:** existing Playwright suite (no visual change); `npx tsc --noEmit`.
- **Out of scope:** changing any animation values or behavior.
- **Implementation:** Added `app/lib/animationConfig.ts`; replaced hard-coded scroll thresholds, reveal offset/margin/duration, stagger step, and particle tunables across HeroSection, BackToTop, FadeInOnScroll, TimelineCard, ParticlesBackground with named imports. Values unchanged; tsc + build + E2E (16/16) green.
- **Bump:** patch
- **Status:** shipped-pending-migration

### [FEAT-1781502128] Consolidate icons, dedupe skills/month-util, remove unused GlassCard
- [x] **Priority:** low
- **Area:** frontend
- **File(s):** app/components/ui/icons.tsx (new), app/lib/constants.ts (new), app/lib/dateUtils.ts (new), app/components/ContactSection.tsx, app/components/work/TimelineCard.tsx, app/components/work/ProjectCardExpanded.tsx, app/components/AboutSection.tsx, app/components/JsonLd.tsx, app/lib/github.ts, app/components/ui/GlassCard.tsx (delete)
- **Why:** SRS FR-3. Inline SVGs duplicated across components; skills array duplicated in AboutSection and JsonLd; month-name helper buried in github.ts; `GlassCard` is dead code.
- **Approach:** Extract icons to a single `icons.tsx`; move skills to `constants.ts` imported by both consumers; extract month-name to `dateUtils.ts`; delete `GlassCard` after confirming no imports.
- **Library / dependency notes:** none.
- **Acceptance criteria:** one icon module; skills defined once; `GlassCard` gone with no broken imports; build/tsc/E2E green; no visual change.
- **Test plan:** `git grep` for removed symbols; Playwright; `npx tsc --noEmit`.
- **Out of scope:** restyling icons; changing skill content.
- **Implementation:** Added `app/components/ui/icons.tsx` (StarIcon, ExternalLinkIcon, SOCIAL_ICON_PATHS, SocialIconSvg) consumed by ContactSection/TimelineCard/ProjectCardExpanded; added `SKILLS` to `constants.ts` (AboutSection imports it; `JsonLd.knowsAbout` left as its curated SEO subset); added `app/lib/dateUtils.ts` (monthName + formatDate) used by github.ts and TimelineCard; deleted unused `GlassCard.tsx`. No visual change; tsc + build + E2E (16/16) green.
- **Bump:** patch
- **Status:** shipped-pending-migration

### [FEAT-1781502129] Momentum smooth scrolling (Lenis)
- [x] **Priority:** high
- **Area:** animation
- **File(s):** app/components/ui/SmoothScroll.tsx (new), app/layout.tsx, package.json
- **Why:** SRS FR-4. Native smooth-scroll feels basic; momentum/eased scrolling gives a premium feel.
- **Approach:** Wrap the app in Lenis (`lenis/react` `ReactLenis`). Disable when `prefers-reduced-motion: reduce` (fall back to native). Integrate with `motion` `useScroll` (Hero parallax, ScrollProgress) and preserve anchor nav + navbar IntersectionObserver scroll-spy. Use animationConfig constants (FEAT-1781502127) where applicable.
- **Library / dependency notes:** Evaluate `lenis` / `lenis/react` — confirm latest stable + `motion` compatibility before install; reject if it conflicts with `useScroll` or janks on mobile.
- **Acceptance criteria:** eased momentum on desktop; reduced-motion → native; anchors, scroll-spy, parallax, progress bar all still work; no Lighthouse perf regression; no mobile long-tasks.
- **Test plan:** manual scroll QA across viewports; Playwright (anchors still navigate); Lighthouse perf.
- **Out of scope:** scroll-jacking / section-snapping; horizontal scroll.
- **Implementation:** Added `lenis@1.3.23`; new `app/components/ui/SmoothScroll.tsx` wraps the app in `ReactLenis root` (lerp 0.1, smoothWheel, `anchors: true`), guarded so `prefers-reduced-motion` users get native scroll (Lenis never initialized). Removed CSS `scroll-behavior: smooth` and added Lenis's recommended CSS to `globals.css`; wired `<SmoothScroll>` into `layout.tsx`. E2E (`e2e/smooth-scroll.spec.ts`) proves Lenis activates (`html.lenis`) and anchor nav scrolls; centering suite still green; build green.
- **Bump:** minor
- **Status:** shipped-pending-migration

### [FEAT-1781502130] Section & element transitions
- [x] **Priority:** med
- **Area:** animation
- **File(s):** app/components/ClientPage.tsx, app/components/work/TimelineSection.tsx, app/components/AboutSection.tsx, app/components/HeroSection.tsx, app/globals.css
- **Why:** SRS FR-5. Beyond the current fade-ins, add fluid load/section/element transitions.
- **Approach:** Staggered initial page-load entrance; animate newly-revealed cards on "Show More" (not just mount); skill-badge stagger via `motion` variants container/item; optionally View Transitions API for card expand/collapse (CSS `@supports`-guarded progressive enhancement). All reduced-motion gated. Depends on FEAT-1781502129 (scroll) and FEAT-1781502127 (constants).
- **Library / dependency notes:** reuse `motion`; View Transitions need no dependency.
- **Acceptance criteria:** smooth, consistent transitions; reduced-motion respected; no CLS introduced; E2E green.
- **Test plan:** manual QA; Playwright centering still passes; check CLS in Lighthouse.
- **Out of scope:** full route-level page transitions (single-page site).
- **Implementation:** Staggered skill-badge entrance via motion `variants` container/item (AboutSection; `SKILL_STAGGER_STEP` in animationConfig; SkillBadge now accepts `variants`). Added `MotionConfig reducedMotion="user"` in SmoothScroll so motion-driven transform/parallax animations respect `prefers-reduced-motion` site-wide (NFR-1 — previously only CSS animations did). "Show More" card reveals and hero/section entrances already animate via the existing FadeInOnScroll/whileInView (verified unchanged). View Transitions API deferred per plan. Build + E2E (18/18) green.
- **Bump:** minor
- **Status:** shipped-pending-migration

### [FEAT-1781502131] Card facet: repo topics + recent commits
- [x] **Priority:** high
- **Area:** frontend, github-api
- **File(s):** app/lib/types.ts, app/lib/github.ts, app/components/work/ProjectCardExpanded.tsx, app/components/work/TimelineCard.tsx
- **Why:** SRS FR-6 (6a, 6b). Make each project card richer from GitHub data we can fetch (the chosen "mini-demo" direction).
- **Approach:** Add `topics: string[]` and a typed `recentCommits` to `RepoCardData`; populate in `fetchAllRepos` (topics from the repos response; commits via `/repos/{owner}/{repo}/commits?per_page=5`). Batch into the existing `Promise.all`, timeout-guarded, graceful-empty. Display topic chips + recent commits (message + relative date) in the expanded card; hide facets when empty.
- **Library / dependency notes:** none (GitHub REST).
- **Acceptance criteria:** topics + recent commits show where present; absent data hidden cleanly; `/api/repos` and `/` still render if these calls fail (graceful empty — upholds the BUG-1781501120 resilience invariant); no perf regression.
- **Test plan:** unit-test the new `github.ts` mapping if the unit layer (FEAT-1781501122) exists; manual card QA; E2E green.
- **Out of scope:** commit pagination; commit diffs.
- **Implementation:** Added `topics` + `recentCommits` (typed `CommitInfo`) to `RepoCardData`; `github.ts` maps `r.topics` (free from the repos response) and fetches `/commits?per_page=5` per repo (timeout-guarded, graceful, batched into the existing Promise.all). Rendered in the Activity tab as topic chips + a recent-commits list. (Topics are empty until repos are tagged on GitHub — graceful-hidden.) Build + E2E (19/19) green; prod smoke shows 35/36 repos with recent commits.
- **Bump:** minor
- **Status:** shipped-pending-migration

### [FEAT-1781502132] Card facet: syntax-highlighted source peek
- [x] **Priority:** high
- **Area:** frontend, github-api
- **File(s):** app/lib/types.ts, app/lib/github.ts, app/api/source/[owner]/[repo]/route.ts (new), app/components/work/ProjectCardExpanded.tsx, package.json
- **Why:** SRS FR-6 (6c). Show a highlighted peek at the project's key source file — the centerpiece of the richer card.
- **Approach:** Pick the key file by heuristic — language entrypoint (`main.py` / `index.ts` / `main.go` …) → root/src extension match → graceful null. Fetch its contents (timeout-guarded, size-capped). Highlight with `shiki` server-side in a lazy API route (no client highlighter cost).
- **Library / dependency notes:** Evaluated `shiki` vs `rehype-pretty-code` vs `highlight.js` — chose `shiki@4.2.0`, server-side only.
- **Acceptance criteria:** highlighted source peek for repos where a file resolves; hidden cleanly otherwise; client bundle within agreed budget; graceful on fetch failure.
- **Test plan:** unit-test the file-selection heuristic if the unit layer exists; manual QA across a Python, a JS/TS, and a Go repo; E2E green.
- **Out of scope:** full file browser; editing; multi-file view.
- **Implementation:** Added `shiki@4.2.0`; new `app/api/source/[owner]/[repo]/route.ts` picks a representative source file via `github.ts` `fetchKeyFile` (root/src entrypoint+extension heuristic, size- and line-capped, graceful null) and highlights it server-side (`github-dark`) — zero client bundle cost (First Load stayed flat). The Code tab lazy-loads it on open and renders the shiki-escaped HTML; degrades to "No source preview available." Build + E2E green; prod smoke renders highlighted source for 4/6 sampled repos (graceful null for the rest). Heuristic refinement filed as FEAT-1781505473.
- **Bump:** minor
- **Status:** shipped-pending-migration

### [FEAT-1781502133] Faceted/tabbed expanded card + skeleton loader
- [x] **Priority:** high
- **Area:** frontend
- **File(s):** app/components/work/ProjectCardExpanded.tsx, app/components/work/TimelineCard.tsx, app/globals.css
- **Why:** SRS FR-6 (6d). Organize the richer facets (README / Code / Activity) into a clean tabbed layout and replace the README spinner with a content-shaped skeleton.
- **Approach:** Restructure `ProjectCardExpanded` into tabs — README (existing render), Code (source peek, FEAT-1781502132), Activity (sparkline + recent commits + topics, FEAT-1781502131). Content-shaped skeleton during fetch; `aria-live` for async announcements. Depends on FEAT-1781502131 and FEAT-1781502132.
- **Library / dependency notes:** reuse `motion` for tab transitions.
- **Acceptance criteria:** tabbed card with README/Code/Activity; skeleton replaces the spinner; keyboard-accessible tabs; reduced-motion respected; E2E green.
- **Test plan:** manual QA + a11y keyboard check; extend Playwright to assert tab presence; `npx tsc --noEmit`.
- **Out of scope:** persisting the selected tab across cards; deep-linking to a tab.
- **Implementation:** Restructured `ProjectCardExpanded` into accessible README / Code / Activity tabs (role=tablist/tab/tabpanel, aria-selected, aria-live). Activity uses already-loaded data (language bar, 52-week sparkline, recent commits, topics) — instant; README + Code lazy-load per tab. Replaced the spinner with a content-shaped skeleton. `TimelineCard` now passes the full `repo`. New `e2e/card-tabs.spec.ts` verifies tabs render + switch (19/19 E2E green).
- **Bump:** minor
- **Status:** shipped-pending-migration
