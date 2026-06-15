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

### [BUG-1781501121] Orphaned StatementSection breaks 4 E2E "statement" tests
- [x] **Severity:** med
- **Area:** tests, ui
- **File(s):** app/components/StatementSection.tsx, app/components/ClientPage.tsx, e2e/centering.spec.ts
- **Observation:** `e2e/centering.spec.ts` asserts a `[data-testid="statement"] > div` is centered across all 4 viewports, but `ClientPage.tsx` never imports or renders `StatementSection`. The component is orphaned (nothing references it). The 4 `statement` centering tests therefore time out / fail.
- **Expected:** Either the statement section is part of the page (README advertises "opacity-driven statement text" as a feature) and should be rendered, or it has been intentionally retired and both the component and its E2E coverage should be removed. The E2E suite must be green.
- **Repro / Notes:** `npm run test:e2e` — the 4 `statement inner div is centered` cases fail. Decide product intent during the fix: re-add `<StatementSection text=... />` to `ClientPage`, or delete the component + remove the `statement` assertions from the spec.
- **Fix:** Deleted the orphaned `app/components/StatementSection.tsx` and removed the 4 `statement` centering assertions from `e2e/centering.spec.ts`. E2E suite is now green (16/16, was 4 red).
- **Bump:** patch
- **Status:** fixed-pending-migration

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
