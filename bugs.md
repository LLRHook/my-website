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

### [BUG-1781504214] Dependency CVEs: Next.js (high) + postcss (moderate)
- [ ] **Severity:** high
- **Area:** ci, deploy
- **File(s):** package.json, package-lock.json
- **Observation:** `npm audit` reports a high-severity set of Next.js advisories on the installed Next 15.5.x (HTTP request smuggling in rewrites, several DoS vectors, middleware/proxy bypass, cache poisoning, XSS in App Router CSP nonces, image-optimization DoS, SSRF via WebSocket upgrades), plus a moderate postcss XSS (`<8.5.10`). Surfaced during the motion batch (`npm i lenis`); **not** introduced by Lenis (its dependency tree is clean).
- **Expected:** No high/moderate dependency CVEs; dependencies on patched versions.
- **Repro / Notes:** `npm audit`. Fix is a Next.js upgrade to a patched release plus a postcss bump (`npm audit fix` proposes it). Deliberately deferred from the motion batch (out of scope; bumping Next mid-feature is risky). Handle via a focused dependency-bump run + re-run `VERIFICATION.md`; good candidate for `/security-audit`.
- **Bump:** patch
- **Status:** open

### [BUG-1788653836] Dialog focus trap includes inputs disabled by a fieldset
- [x] **Severity:** med
- **Area:** frontend, accessibility
- **File(s):** app/components/room/ComputerFocus.tsx, ComputerFocus.test.tsx
- **Observation:** Browser QA of a pending roulette spin found Tab could leave the close button because the focus list included radio inputs disabled through their fieldset.
- **Expected:** Tab wraps among enabled controls inside the open dialog.
- **Repro / Notes:** A dialog containing one close button and a disabled fieldset reproduces the incorrect boundary list.
- **Bump:** patch
- **Status:** fixed-pending-migration
- **Fix:** Exclude controls matching :disabled, including fieldset descendants; regression covers forward and reverse Tab wrapping.

### [BUG-1788655093] Standalone typecheck rejects injected browser test helper assertion
- [x] **Severity:** low
- **Area:** tests
- **File(s):** e2e/room-motion.spec.ts
- **Observation:** Standalone tsc reports TS2352 for the roomFrameSnapshot helper injected by the test setup, because the DOM Window type does not declare the injected function.
- **Expected:** Typecheck the existing browser test helper without weakening the application types.
- **Fix:** Assert through unknown before the narrow injected-helper type; runtime behavior is unchanged.
- **Bump:** patch
- **Status:** fixed-pending-migration

### [BUG-1788655652] Evening caption loses contrast and room computer is off center
- [x] **Severity:** med
- **Area:** ui, accessibility
- **File(s):** app/room.css, app/components/room/room-mobile.css, related browser tests
- **Observation:** Evening wash darkens the room behind the unchanged dark location caption and extends behind the introduction without matching the scene’s top fade. Browser geometry measured the monitor center7.96px right of room center at1280px.
- **Expected:** Readable labels in evening and a horizontally centered computer at desktop/mobile sizes.
- **Repro / Notes:** Toggle Evening; inspect caption and compare computer/room bounding-box centers.
- **Bump:** patch
- **Status:** fixed-pending-migration

---
- **Fix:** Centered the computer using its shared width variable, added a high-contrast evening caption plate, and tapered the night wash below the overlapping introduction. Browser checks found less than 0.01px stationary center offset, readable evening copy, and no mobile overflow.

### [BUG-1788656593] Interrupted ambient audio cannot resume with an existing scheduler
- [x] **Severity:** med
- **Area:** frontend, tests
- **File(s):** app/lib/room-audio.ts, app/lib/room-audio.test.ts, app/components/room/RoomAudio.test.tsx
- **Observation:** setVisible(true) returns early while a timer exists even if the browser has externally suspended or interrupted its AudioContext. Review also found mismatched retry instructions, silent settings reporting playback, and gesture listeners retained for already-running contexts. The default-audio test fixture encountered Node's partial localStorage global instead of usable browser storage.
- **Expected:** A fresh visitor gesture resumes an interrupted context without duplicating its scheduler; status and retry instructions match behavior; fallback listeners detach after playback starts; preference tests have isolated, usable storage.
- **Repro / Notes:** Start the engine, externally suspend its context, then call setVisible(true) while its timer remains allocated.
- **Bump:** patch
- **Status:** fixed-pending-migration


## Migrated to changelog

Entries below have been ticked off and copied as a one-liner into `CHANGELOG.md`.
They are kept here so each `BUG-NNN` stays resolvable.
- **Fix:** Resume now checks actual running state before returning early; the real-engine regression verifies one scheduler after interruption/recovery. Audio status and retry instructions match actual behavior, successful playback removes gesture fallback listeners, and preference tests use isolated storage. All 99 unit/component tests pass.

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
