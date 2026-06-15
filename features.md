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
- **Why:** The project has only E2E (Playwright) coverage. Pure logic — `buildTimelineData`, `toLanguageSlices`, the `fetchAllRepos` fallback path, pagination — has no fast unit coverage, so regressions in the data layer (the class of bug that took the projects offline) are only caught by a full browser run, if at all.
- **Approach:** Add Vitest with `@testing-library/react` + `jsdom`. Unit-test `app/lib/github.ts` pure transforms with `fetch` mocked (success, non-OK, empty, token→public fallback). Component-test `TimelineSection` empty-state vs populated. Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts.
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

---

## Shipped
