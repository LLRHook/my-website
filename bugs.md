# my-website (Victor Ivanov Portfolio) — Bug Tracker

This file is the working list of known issues. New bugs are appended here as they
are found. When a bug is fixed, tick its checkbox and move the entry (with the fix
note) to `CHANGELOG.md` so this file stays focused on outstanding work.

## Conventions

Each entry uses the form:

```
### [<id>] <short title>
- [ ] **Severity:** crit | high | med | low
- **Area:** <stack-specific tags — see below>
- **File(s):** comma-separated paths (or "n/a")
- **Observation:** what was seen, with line refs where useful.
- **Expected:** what should happen, citing the spec section if relevant.
- **Repro / Notes:** how to confirm, or why it matters.
- **Bump:** major | minor | patch  (version impact when shipped; a bug fix defaults **patch**, a behaviour-breaking fix is **major**)
- **Status:** open | in-progress | fixed-pending-migration
```

Tick `- [x]` once verified fixed. The fixer also adds a `**Fix:**` line summarising
the change before migrating the entry to `CHANGELOG.md`.

Severity guide:
- **crit** — blocks build, run, or a hard product constraint.
- **high** — data loss, crash, or a defining feature is wrong.
- **med** — a documented feature is missing or noticeably broken.
- **low** — UX polish, minor spec drift, or test-quality issue.

Area tags for this project: `frontend`, `github-api`, `ui`, `animation`, `seo`, `tests`, `ci`, `docs`, `deploy`

IDs are UNIX-epoch timestamps (`BUG-$(date +%s)`), never sequential — appended at
the end of their section, sorted by id on read.

---

## Open

### [BUG-1781504214] Outdated dependency tree includes high-severity advisories
- [x] **Severity:** high
- **Area:** ci, deploy
- **File(s):** package.json, package-lock.json
- **Observation:** `npm audit` reports a high-severity set of Next.js advisories on the installed Next 15.5.x (HTTP request smuggling in rewrites, several DoS vectors, middleware/proxy bypass, cache poisoning, XSS in App Router CSP nonces, image-optimization DoS, SSRF via WebSocket upgrades), plus a moderate postcss XSS (`<8.5.10`). Surfaced during the motion batch (`npm i lenis`); **not** introduced by Lenis (its dependency tree is clean).
- **Expected:** No high/moderate dependency CVEs; dependencies on patched versions.
- **Repro / Notes:** `npm audit`. Fix is a Next.js upgrade to a patched release plus a postcss bump (`npm audit fix` proposes it). Deliberately deferred from the motion batch (out of scope; bumping Next mid-feature is risky). Handle via a focused dependency-bump run + re-run `VERIFICATION.md`; good candidate for `/security-audit`.
- **Bump:** patch
- **Status:** fixed-pending-migration

- **September 5 follow-up:** Baseline `npm audit` reports seven high-severity package findings. Refresh current supported dependencies, migrate Next.js/ESLint configuration, and validate the room UI, API routes, image quality, unit tests and browser suites. Keep TypeScript and ESLint within the published compatibility ranges of their integrations.
- **Fix:** Updated the framework, runtime/test packages and compatible transitive dependencies; migrated Next/ESLint/tsParticles configuration and preserved image quality. Clean npm ci and npm audit report zero vulnerabilities. Lint, build/type checking, 68 unit tests and 54 browser tests pass under Node 24.19.0. Compatibility holds are documented in docs/dependency-update.md.

### [BUG-1788662454] WebKit compatibility mouse events cancel the touch-motion reset
- [x] **Severity:** med
- **Area:** animation, tests
- **File(s):** app/components/room/useRoomMotion.ts, app/components/room/useRoomMotion.test.tsx
- **Observation:** The updated WebKit browser fails the real-tap/scroll E2E test consistently: room attention remains at x=0.4359, y=-0.5174 instead of returning to zero. Event tracing shows synthetic mouse pointerleave/pointermove after the touch and scroll cancel the pending 950ms touch reset.
- **Expected:** A touch response returns to neutral and releases its animation frame loop while scrolling remains available.
- **Repro / Notes:** Run the WebKit `a real touch tap` case in e2e/room-motion.spec.ts. Preserve its assertions; model the observed synthetic mouse event sequence in a unit regression.
- **Bump:** patch
- **Status:** fixed-pending-migration
- **Fix:** Preserve the pending touch reset through compatibility mouse move/down/leave events. Two unit regressions failed before the fix and pass afterward; all 54 Chromium/WebKit browser cases now pass, including the original reproducible WebKit tap/scroll failure.

---

## Migrated to changelog

Entries below have been ticked off and copied as a one-liner into `CHANGELOG.md`.
They are kept here so each `BUG-NNN` stays resolvable.

### [BUG-1781501120] Projects never render in production ("No projects to display")
- [x] **Severity:** high
- **Area:** github-api, frontend, deploy
- **File(s):** app/lib/github.ts, app/page.tsx, app/api/repos/route.ts
- **Observation:** The production site (victorivanov.engineer) "Work" timeline always showed the empty state "No projects to display." `fetchAllRepos()` was returning `[]` because the GitHub repos-list request came back non-OK (the Vercel `GITHUB_TOKEN` was stale/invalid → 401, with unauthenticated fallback rate-limited at 60-req/hr on Vercel's shared serverless IPs). A prior commit (`25784ea`) misdiagnosed this as a timeout problem and additionally left the timeout `AbortError` uncaught in `fetchPaginatedRepos`, which could crash the render instead of degrading gracefully.
- **Expected:** The Work timeline renders the public GitHub repositories (36 non-fork public repos).
- **Repro / Notes:** Confirmed fixed end-to-end: `/` no longer contains "No projects to display"; `/api/repos` returns 36 repos across 2026/2025/2023; `/api/readme/...` returns real content.
- **Fix:** Replaced the stale Vercel `GITHUB_TOKEN` (Production) with a valid PAT and redeployed (root cause). Hardened `app/lib/github.ts` (commit `59ce141`): wrapped the paginated repos fetch in try/catch so a timeout/abort degrades to the empty state instead of throwing; fall back to the public repos endpoint when the authenticated request yields nothing; added a timeout + graceful fallback to `fetchReadme`.
- **Bump:** patch
- **Status:** fixed-pending-migration

### [BUG-1781501121] Orphaned StatementSection breaks 4 E2E "statement" tests
- [x] **Severity:** med
- **Area:** tests, ui
- **File(s):** app/components/StatementSection.tsx, app/components/ClientPage.tsx, e2e/centering.spec.ts
- **Observation:** `e2e/centering.spec.ts` asserts a `[data-testid="statement"] > div` is centered across all 4 viewports, but `ClientPage.tsx` never imports or renders `StatementSection`. The component is orphaned (nothing references it). The 4 `statement` centering tests therefore time out / fail.
- **Expected:** Either the statement section is part of the page, or it has been intentionally retired and both the component and its E2E coverage should be removed. The E2E suite must be green.
- **Repro / Notes:** `npm run test:e2e` — the 4 `statement inner div is centered` cases fail.
- **Fix:** Deleted the orphaned `app/components/StatementSection.tsx` and removed the 4 `statement` centering assertions from `e2e/centering.spec.ts`. E2E suite is now green (16/16, was 4 red).
- **Bump:** patch
- **Status:** fixed-pending-migration
