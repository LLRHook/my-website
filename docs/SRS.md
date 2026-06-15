# Software Requirements Specification — Portfolio Polish & Project-Card Upgrade

- **Project:** my-website (Victor Ivanov Portfolio) — Next.js 15 / React 19 / TS / Tailwind 4, deployed on Vercel.
- **Status:** Draft for `/groom` (this document is the input the groom skill decomposes into `FEAT-NNN` / `BUG-NNN`).
- **Date:** 2026-06-15
- **Author:** Victor Ivanov

## 1. Purpose & goals

Elevate the portfolio from "working" to "polished and memorable" along four axes the
owner requested:

- **G1 — Code cleanup:** remove dead code and reduce duplication (behavior-preserving) so the site is easier to extend.
- **G2 — Smoother scrolling:** replace native smooth-scroll with momentum/eased scrolling for a premium feel, without breaking accessibility.
- **G3 — Transitions:** add tasteful section/element transitions so navigation and reveals feel fluid.
- **G4 — Richer project cards ("mini-demo"):** make each project in the timeline more interactive and informative. **Chosen direction (decided 2026-06-15):** a *richer metadata card*, built entirely from data we already fetch or can fetch from the GitHub API — **no external embed/screenshot services**, since only 1 of 36 repos has a live deployment URL.

### Success criteria
- The site keeps its SSR/ISR model and current visual identity (aurora, glassmorphism, timeline).
- All changes honor `prefers-reduced-motion` and keep Lighthouse Performance ≥ 90 / Accessibility ≥ 95.
- The E2E suite is green (the polish work also clears `BUG-1781501121`).
- No regression to the just-fixed project-loading path (`app/lib/github.ts`).

## 2. Current state (from the 2026-06-15 site map)

- **Scroll/animation:** native `scroll-behavior: smooth` (`globals.css`), `motion` v12 for parallax (HeroSection) and `whileInView` reveals (`FadeInOnScroll`). Reduced-motion fully honored. No smooth-scroll library; no View Transitions.
- **Cards:** `TimelineCard` expands to `ProjectCardExpanded`, which fetches the README from `/api/readme/[owner]/[repo]` and renders it (react-markdown + remark-gfm + rehype-raw). Collapsed card shows language badge, stars, `ActivitySparkline`, `LanguageBar`, pushed date. `RepoCardData` already carries `id, name, description, htmlUrl, homepage, language, languages, stars, commitActivity, pushedAt, createdAt, owner`.
- **Dead code:** `StatementSection.tsx` (orphaned — `BUG-1781501121`) and `GlassCard.tsx` (unused) are both unreferenced.
- **Duplication:** magic numbers across animation code, inline SVG icons duplicated, skills array duplicated in `AboutSection` and `JsonLd`, README content handling duplicated.
- **Repo reality (decides G4):** 36 public non-fork repos; **1** has a deployment URL; **10** READMEs contain demo media; **~13** are browser-runnable (JS/TS/Astro); languages are polyglot (Python 11, JS 8, TS 5, Go 3, …).

## 3. Functional requirements

Each FR is scoped to become one (or a small set of) `FEAT-NNN`. Proposed `area` /
`priority` / `bump` are hints for `/groom`.

### FR-1 — Remove dead code (cleanup) `area: frontend` `priority: med` `bump: patch`
Delete `app/components/StatementSection.tsx` and `app/components/ui/GlassCard.tsx` (both unreferenced; verify no imports first). Because removing `StatementSection` makes the orphaned section permanent, also **remove the `statement` assertions from `e2e/centering.spec.ts`** so the suite is green. This resolves **`BUG-1781501121`**.
- **Acceptance:** `git grep` finds no references to the deleted components; `npm run test:e2e` green; no visual change to the live page.

### FR-2 — Centralize animation/UI constants (cleanup) `area: frontend` `priority: low` `bump: patch`
Create `app/lib/animationConfig.ts` and move magic numbers there: scroll thresholds (600/400 in HeroSection, 600 in BackToTop), reveal offset (40px) and viewport margin (-80px) in `FadeInOnScroll`, stagger multiplier (0.05) in `TimelineCard`, particle distance/speed. Replace literals with named imports.
- **Acceptance:** no behavior change; literals replaced by named constants; values match prior behavior.

### FR-3 — Consolidate icons & de-duplicate data (cleanup) `area: frontend` `priority: low` `bump: patch`
Extract inline SVGs (star, external-link, social icons in `ContactSection.ICON_PATHS`, `TimelineCard`, `ProjectCardExpanded`) into a single `app/components/ui/icons.tsx`. Move the skills array to `app/lib/constants.ts` and import it in both `AboutSection` and `JsonLd` (single source of truth). Extract the month-name helper to `app/lib/dateUtils.ts`.
- **Acceptance:** one icon module; skills defined once; no duplicated SVG paths; build + types clean.

### FR-4 — Momentum smooth scrolling (Lenis) `area: animation` `priority: high` `bump: minor`
Introduce a momentum/eased smooth-scroll layer (recommended: **Lenis** via `lenis/react` `ReactLenis`) wrapping the app. It must:
- Be **disabled when `prefers-reduced-motion: reduce`** (fall back to native).
- Integrate with the existing `motion` `useScroll` parallax/progress so HeroSection parallax and the ScrollProgress bar still track correctly.
- Not break anchor navigation (`#work`, `#about`, `#contact`, back-to-top) or the navbar IntersectionObserver scroll-spy.
- **Library note (per repo policy — confirm latest stable + API before install):** evaluate `lenis` / `lenis/react`; document version. Reject if it conflicts with `motion` scroll tracking or adds jank on mobile.
- **Acceptance:** scrolling has eased momentum on desktop; reduced-motion users get native scroll; anchors + scroll-spy + parallax all still work; no Lighthouse perf regression; no main-thread long-tasks on mid-tier mobile.

### FR-5 — Section & element transitions `area: animation` `priority: med` `bump: minor`
Add tasteful transitions beyond the current fade-ins:
- A subtle initial page-load transition (staggered hero/section entrance).
- Smooth the "Show More Projects" reveal (animate newly added cards in, not just mount).
- Coordinate skill-badge reveal with a motion `variants` container/item stagger (currently appears at once).
- Optionally adopt the **View Transitions API** for the card expand/collapse where supported (progressive enhancement; CSS-guarded).
- **Acceptance:** transitions are smooth and consistent; all gated by reduced-motion; no layout shift (CLS) introduced.

### FR-6 — Richer project card (the "mini-demo") `area: frontend, github-api` `priority: high` `bump: minor`
Upgrade `ProjectCardExpanded` into an interactive, multi-facet view built from GitHub data (no external services). Add the following, each gracefully hidden when data is absent:
- **6a — Repo topics:** fetch and display GitHub repo `topics` as chips. Add `topics: string[]` to `RepoCardData`; populate in `fetchAllRepos` (topics are included on the repos response; verify).
- **6b — Recent commits:** show the latest ~5 commits (message + relative date) via `/repos/{owner}/{repo}/commits?per_page=5`. Add a typed `recentCommits` field; fetch alongside languages/commitActivity (bounded, timeout-guarded, graceful-empty like the existing calls).
- **6c — Source peek:** a syntax-highlighted view of the project's key file (heuristic: language-appropriate entrypoint — `main.py` / `index.ts` / `main.go` / `Cargo.toml`, else the repo's most prominent file, else the first fenced code block in the README). Use a lightweight, build-time-friendly highlighter (**evaluate `shiki` vs `rehype-pretty-code` vs `highlight.js`** — confirm latest + bundle cost before install; prefer one that doesn't bloat the client bundle).
- **6d — Faceted layout:** present README / Code / Activity as tabs or stacked sections within the expanded card; keep the existing README rendering. Improve the README loading state from a spinner to a content-shaped skeleton.
- **Performance constraint:** the extra per-repo fetches (topics, commits, source file) must stay within ISR (`revalidate=3600`), be `Promise.all`-batched, individually timeout-guarded, and degrade to empty on failure — never block or crash the render (uphold the `BUG-1781501120` resilience invariant).
- **Acceptance:** expanded card shows topics, recent commits, and a highlighted source peek for repos where the data exists; absent data hides the relevant facet cleanly; `/api/repos` and `/` still render with all calls failing (graceful empty); no client bundle regression beyond an agreed budget.

### FR-7 (optional, post-polish) — Re-add a statement section `area: ui` `priority: low` `bump: minor`
The README advertises "opacity-driven statement text," and `StatementSection` was designed for it. If desired (decide during grooming), re-introduce a statement section into `ClientPage` with refreshed copy instead of deleting it under FR-1. **FR-1 and FR-7 are mutually exclusive** — groom picks one.

## 4. Non-functional requirements

- **NFR-1 Accessibility:** every animation/scroll change honors `prefers-reduced-motion`; keyboard navigation and focus order preserved; expanded card facets are screen-reader friendly (`aria-live` on async content).
- **NFR-2 Performance:** Lighthouse Performance ≥ 90, Accessibility ≥ 95 on the production build; LCP < 2.5 s; no new long-tasks on mid-tier mobile; client JS bundle growth budgeted and justified per new dependency.
- **NFR-3 Architecture integrity:** keep SSR/ISR; all GitHub access stays inside `app/lib/github.ts`; `GITHUB_TOKEN` server-only; preserve the resilience invariants from `BUG-1781501120`.
- **NFR-4 Maintainability:** new constants/icons/util modules as specified; no behavior change from cleanup FRs (prove via E2E).
- **NFR-5 Testing:** behavioral changes land with coverage (complements `FEAT-1781501122` unit layer and `FEAT-1781501124` CI). At minimum, E2E stays green and new data-layer logic gets unit tests if the unit layer exists by then.

## 5. Out of scope (explicit)

- Live deployment demos, `<iframe>` embeds of project sites, third-party **screenshot services** (Microlink/Thum.io), and recorded GIF/video demos — infeasible/undesired given 1/36 repos are deployed.
- **StackBlitz/CodeSandbox** interactive embeds — considered and deferred (could be a future tier-2 enhancement for web repos; not in this scope).
- Any backend, database, auth, or CMS.
- Visual redesign of the overall theme (keep the current identity).

## 6. Dependencies to evaluate (per repo policy: web-search latest stable + API/docs before installing)

| Need | Candidate | Notes |
|------|-----------|-------|
| Momentum scroll (FR-4) | `lenis` / `lenis/react` | Confirm motion-`useScroll` compatibility + reduced-motion handling. |
| Syntax highlighting (FR-6c) | `shiki` / `rehype-pretty-code` / `highlight.js` | Prefer build-time/SSR highlighting to avoid client bundle bloat. |
| (Already present) | `motion`, `react-markdown`, `remark-gfm`, `rehype-raw` | Reuse for transitions and README/source rendering. |

## 7. Plan of action — running `/groom`

1. **Input:** run `/groom docs/SRS.md`. Groom reads this SRS plus the repo to verify each FR against the actual code.
2. **Output:** groom appends well-formed `FEAT-NNN` entries to `features.md / ## Open` (and any new `BUG-NNN` it discovers) using the templates in `features.md`/`bugs.md`, with epoch IDs, `area`/`priority`/`bump`, acceptance criteria, and test plans. It should:
   - Map FR-1 → resolve `BUG-1781501121` (do not double-file); FR-2, FR-3 → cleanup FEATs; FR-4, FR-5 → animation FEATs; FR-6 → one FEAT (optionally split 6a–6d into a related set for `/implement-batch`).
   - Cross-link the existing `FEAT-1781501122/123/124` (tests/ESLint/CI) as complementary, not duplicate.
   - Decide FR-1 vs FR-7 (delete vs re-add statement section) and file only the chosen one.
3. **Prioritize:** run `/prioritize` to sequence the groomed backlog (dependency-aware: cleanup constants/icons before the card upgrade that uses them; Lenis before transition tuning).
4. **Implement:** `/implement` the top item, or `/implement-batch` the FR-6 set, following the V&V cycle (`VERIFICATION.md`).
5. **Verify & ship:** `/protocol-v-and-v` green, then `/release`.
