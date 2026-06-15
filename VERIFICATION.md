# my-website (Victor Ivanov Portfolio) — End-to-End Verification & Validation Protocol

This document is the canonical checklist for taking the portfolio from "compiles"
to "ship-ready". Run it before any release, after any large refactor, and any time
you suspect a regression. It is **executable from a cold start** — every command is
written verbatim, every expected output is named, and every "manual" step has
unambiguous accept / reject criteria.

The portfolio is a **single-tier Next.js 15 (App Router) application** deployed on
**Vercel**. The homepage is a Server Component rendered with **ISR**
(`revalidate = 3600`) that fetches the owner's public GitHub repositories at
build/revalidate time via the GitHub REST API (`app/lib/github.ts`, keyed by the
`GITHUB_TOKEN` env var) and renders them as a timeline. There is **no database and
no auth**. The only external provider is the **GitHub REST API**.

See also: [`bugs.md`](./bugs.md), [`features.md`](./features.md),
[`CHANGELOG.md`](./CHANGELOG.md), [`README.md`](./README.md).

## How to use this file

1. Work top-to-bottom. Do not skip stages.
2. Tick each step locally as you go.
3. Every failed step files a `BUG-NNN` entry in `bugs.md`.
4. Every gap that is a missing feature, not a defect, files a `FEAT-NNN` in `features.md`.
5. Fill in the summary table (§ 6.3) and either declare the build green or block on open `BUG-NNN`s.

Time estimate: 15–30 minutes (dominated by the Playwright E2E run, which builds and
starts the production server).

## Roles & abbreviations

- **DUT** — the built Next.js app under `npm run build && npm run start` on `http://localhost:3000`.
- **prod artifact** — the production build (`next build`), not the dev server (`next dev`).
- **provider** — the GitHub REST API (`https://api.github.com`).

---

## Stage 0 — Pre-flight

- [ ] 0.1 Record the exact commit SHA under test: `git rev-parse --short HEAD`. Every result and the final Verified entry bind to it.
- [ ] 0.2 Toolchain: `node -v` (expect ≥ 22, matching `.github/workflows/ci.yml`), `npm -v`.
- [ ] 0.3 Clean install exactly as CI does: `npm ci` (CI uses `npm ci`, not `npm install`).
- [ ] 0.4 Env: ensure `GITHUB_TOKEN` is available for a fully-populated build (`.env.local` locally; Vercel Production env for the deployed artifact). Without it the build still succeeds but falls back to the public GitHub endpoint (rate-limited from shared IPs). See `.env.example`.
- [ ] 0.5 Port 3000 free.
- [ ] 0.6 Determinism posture: data comes from a live external API (GitHub). Repo counts vary as repos are pushed; assertions must test **structure/non-emptiness**, not exact counts.

> **Protocol vs CI.** CI (`.github/workflows/ci.yml`) runs `npm ci` + `next build` on every push/PR to main — build only. This protocol is the deeper release-readiness gate at a chosen SHA. **CI gap:** CI runs neither the test suite nor a linter (see FEAT-1781501124 / FEAT-1781501123) — until those land, this protocol is the only place tests run.

**Command fidelity.** CI's canonical commands are `npm ci` and `npm run build`. Run those verbatim in Stages 1–2. (No lint/test invocations exist in CI yet to mirror.)

## Stage 1 — Static / spec compliance review

- [ ] 1.1 Type-check: `npx tsc --noEmit` → no errors. (`next build` also type-checks; this is the isolated check.)
- [ ] 1.2 Lint: `npm run lint` → **NOT YET AVAILABLE** — no ESLint is configured (FEAT-1781501123). Flag and skip until that ships; do not paraphrase a lint command that doesn't exist.
- [ ] 1.3 Secrets scan: confirm no token/secret is committed. `git grep -nE "gh[ps]_[A-Za-z0-9]{20,}|github_pat_"` → no matches. Confirm `.env*.local` and `.vercel` are git-ignored (`.gitignore`).
- [ ] 1.4 Provider abstraction intact: all GitHub access goes through `app/lib/github.ts` (no raw `api.github.com` `fetch` calls scattered in components). `git grep -n "api.github.com" -- app` → only `app/lib/github.ts`.
- [ ] 1.5 Resilience invariant (regression guard for BUG-1781501120): `app/lib/github.ts` `fetchPaginatedRepos` wraps its fetch in try/catch (a timeout/abort must not throw through the Server Component), and `fetchAllRepos` falls back to the public endpoint when the authenticated request yields nothing.
- [ ] 1.6 Performance anti-pattern scan: the homepage fetches languages + commit activity per repo via `Promise.all` (bounded by repo count, acceptable). Confirm no unbounded/synchronous per-item I/O was added on the render path; confirm `fetchCommitActivity` keeps its short timeout. No N+1 against a DB (there is none).
- [ ] 1.7 Security headers present in `next.config.js` (CSP-adjacent: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS).

## Stage 2 — Automated builds & tests

- [ ] 2.1 Production build (CI-fidelity command): `npm run build` → "Compiled successfully", static pages generated, no errors. Record the route table.
- [ ] 2.2 Unit/component tests: `npm test` → **NOT YET AVAILABLE** — no unit layer (FEAT-1781501122). Flag and skip until it ships.
- [ ] 2.3 E2E (Playwright): `npm run test:e2e` (config builds + starts the prod server, runs chromium). Record results.

**Baseline test counts (update on drift — § 3.1.1):**

| Layer | Tool | Files | Cases |
|-------|------|-------|-------|
| Unit/component | (none yet — FEAT-1781501122) | 0 | 0 |
| E2E | Playwright (chromium) | 1 (`e2e/centering.spec.ts`) | 20 (4 viewports × 5 sections) |

> **Known red (BUG-1781501121):** 4 of the 20 E2E cases (`statement inner div is centered` × 4 viewports) currently fail — `StatementSection` is orphaned (not rendered by `ClientPage`). This is a hard Stage 2 block until BUG-1781501121 is resolved.

- **2a — Per-ticket acceptance verification.** For each ticket shipped since the last `Verified` SHA, locate the test(s) proving its acceptance criteria. BUG-1781501120 (projects render): proven by Stage 3 smoke (`/api/repos` returns repos; `/` lacks "No projects to display"). A regression-guarding **unit** test for the fallback path is tracked by FEAT-1781501122 — its absence is a known coverage gap, not a fresh block.
- **2b — Coverage of the change.** No coverage tool is wired (FEAT-1781501122 would add Vitest coverage). Fall back to 2a per-ticket mapping; note the gap.
- **2c — Trust the green (flake check).** Run the E2E suite twice; any case that flips is quarantined and filed as a `BUG` (area `tests`). Playwright `retries` is 0 locally / 2 in CI — a case that only passes on retry is suspect.

Regression stays whole-platform: run the full E2E suite, not just the changed flow.

## Stage 3 — Functional E2E walkthrough

API smoke first (against the DUT or production domain):

- [ ] 3.1 `GET /` → 200, HTML does **not** contain "No projects to display" (regression guard for BUG-1781501120).
- [ ] 3.2 `GET /api/repos` → 200, JSON timeline array is non-empty (≥ 1 year-group, total repos ≥ 1).
- [ ] 3.3 `GET /api/readme/LLRHook/my-website` → 200, returns markdown (not the "*No README available.*" fallback).
- [ ] 3.4 `GET /sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/opengraph-image`, `/twitter-image` → 200.

UI walkthrough (manual, on the prod artifact):

- [ ] 3.5 Homepage loads: aurora background, hero, Work timeline populated with project cards.
- [ ] 3.6 "Show More Projects" pagination reveals additional cards.
- [ ] 3.7 Expanding a project card loads its README (exercises `/api/readme`).
- [ ] 3.8 Navbar anchors scroll to `#work`, `#about`, `#contact`; Back-to-top works.
- [ ] 3.9 Accessibility manual pass: keyboard-tab through interactive elements; headings/landmarks present; `prefers-reduced-motion` respected by animations.

## Stage 4 — Adversarial, stress & performance checks

- [ ] 4.1 Provider failure handling: with an invalid/empty `GITHUB_TOKEN`, the build still completes and the page renders the graceful empty state (not a 500). (Regression guard for the uncaught-abort class in BUG-1781501120.)
- [ ] 4.2 Unknown routes → the custom `not-found` page renders (`/this-does-not-exist` → 404 page).
- [ ] 4.3 `/api/readme/<owner>/<nonexistent-repo>` → returns the "*No README available.*" fallback, not a crash.
- [ ] 4.4 No DB / no volumes / no auth → migration, restart-preserves-data, cross-tenant isolation, and token-tampering steps are **n/a** for this stack.
- [ ] 4.5 **Performance (hot path = homepage):** Lighthouse on the production build — `npx lighthouse https://victorivanov.engineer --only-categories=performance,accessibility,best-practices,seo --quiet` (or Chrome DevTools). Budget (confirm with owner): Performance ≥ 90, Accessibility ≥ 95, LCP < 2.5 s. A crit/high budget breach is a hard block.
- [ ] 4.6 Animation cost: confirm particle/aurora animations do not pin the main thread (no long-task jank on mid-tier hardware); honor `prefers-reduced-motion`.

## Stage 5 — Hard product-constraint verification

- [ ] 5.1 Provider abstraction integrity (re-tick): GitHub access is isolated to `app/lib/github.ts` (§ 1.4).
- [ ] 5.2 No third-party telemetry / analytics leaked unless intended; `poweredByHeader` disabled; security headers served (verify response headers on the live site).
- [ ] 5.3 Secrets never in the bundle: `GITHUB_TOKEN` is only read server-side (in `app/lib/github.ts`); confirm it is not referenced in any client component / not present in the client JS bundle.
- [ ] 5.4 Performance NFRs (§ 4.5 evidence): re-tick the agreed Lighthouse/LCP budgets as hard constraints.
- [ ] 5.5 SEO surface intact: `sitemap.xml`, `robots.txt`, OpenGraph/Twitter images, and JSON-LD (`JsonLd.tsx`) render correctly.

## Stage 6 — Reporting

- [ ] 6.1 every failed step has a `BUG-NNN`
- [ ] 6.2 every gap has a `FEAT-NNN`
- [ ] 6.3 fill in summary table
- [ ] 6.4 record run metadata (git SHA, node version, whether `GITHUB_TOKEN` was set, prod vs dev artifact)
- [ ] 6.5 if all green, migrate pending-migration tickets and append a `Verified` entry to `CHANGELOG.md / Unreleased`

A build is **release-ready** only if all six stages tick. A failed step in Stages 1,
2, or 5 is a hard block (this currently includes the 4 failing E2E `statement` cases —
BUG-1781501121). In Stage 4, a crit/high performance failure also blocks.

### 6.3 Summary table

```
| Stage                    | Pass / Fail | Notes |
|--------------------------|-------------|-------|
| 0 Pre-flight             |             |       |
| 1 Static review          |             |       |
| 2 Automated tests        |             |       |
| 3 Functional E2E         |             |       |
| 4 Adversarial / perf     |             |       |
| 5 Hard constraints       |             |       |
| 6 Reporting hygiene      |             |       |
```

---

## Appendix A — Inspecting persistent state
n/a — no database, cache, or persistent volume. All state is the live GitHub API
plus Next.js ISR cache (cleared by a redeploy).

## Appendix B — Reusable command recipes

```bash
# Build + run the production artifact locally
npm ci && npm run build && npm run start      # http://localhost:3000

# Run E2E (auto-builds + starts the server per playwright.config.ts)
npm run test:e2e
npx playwright show-report                     # view the HTML report

# Smoke the production deployment
curl -s https://victorivanov.engineer/ | grep -c "No projects to display"   # expect 0
curl -s https://victorivanov.engineer/api/repos | head -c 200
```

## Appendix C — Common platform commands

```bash
# Vercel (project linked via `vercel link`; auth as the project owner)
vercel ls my-website                  # recent deployments
vercel --prod                         # build + deploy current dir to production
vercel env ls production              # list production env vars (values encrypted)

# GitHub deployments record
gh api repos/LLRHook/my-website/deployments --jq '.[0] | {env:.environment, ref:.ref}'
```

## Appendix D — Toggling provider variants

The GitHub provider has two modes in `app/lib/github.ts`:
- **Authenticated** (`GITHUB_TOKEN` set): `/user/repos?affiliation=owner`, 5000 req/hr.
- **Public fallback** (no/invalid token): `/users/<username>/repos?type=owner`, 60 req/hr per IP.

To exercise the fallback locally, unset `GITHUB_TOKEN` and rebuild; the build log
prints `[github] GITHUB_TOKEN is not set — falling back to public repos`.

## Appendix E — Smoke checklist (sub-15-minute version)

1. `npm ci && npm run build` → green.
2. `npx tsc --noEmit` → clean.
3. `npm run start`, open `/` → Work timeline shows project cards (not the empty state).
4. Expand a card → README loads.
5. `curl -s localhost:3000/api/repos | head -c 80` → non-empty timeline JSON.
6. Navbar anchors + Back-to-top work.
7. `curl -s localhost:3000/sitemap.xml` → 200.
