# my-website — Project Instructions

Personal portfolio (Next.js App Router, React, TypeScript, Tailwind CSS),
deployed on Vercel at [victorivanov.engineer](https://victorivanov.engineer). The
interactive room's Projects app is populated from the owner's public GitHub repositories via
`app/lib/github.ts` (server-side, ISR `revalidate=3600`, keyed by `GITHUB_TOKEN`).
No database, no auth. Use `.nvmrc` for the Node version and `package.json` for
the current toolchain. E2E tests are Playwright (`e2e/`).

### Project-cycle files (`bugs.md` / `features.md` / `CHANGELOG.md` / `VERIFICATION.md`)

The four trackers (the five canonical files minus `README.md`) are interlocked:
defects and features are *filed*, work is *verified* against `VERIFICATION.md`, and
shipped or fixed entries are *migrated* into `CHANGELOG.md` as a permanent record.
`README.md` is the public face that links them all together.

- When you find a bug, file a `BUG-NNN` entry in `bugs.md / ## Open` in the same
  change. Never silently fix a bug.
- When a fix lands: tick the checkbox, add a `**Fix:**` line, move the entry to
  `## Migrated to changelog`, copy a one-liner into `CHANGELOG.md / Unreleased / Fixed`.
  Do not delete.
- When you scope a feature, file a `FEAT-NNN` in `features.md / ## Open` *before*
  writing code.
- When a feature ships: tick, add `**Implementation:**` line, move to `## Shipped`,
  copy a one-liner into `CHANGELOG.md / Unreleased / Added` (or `Changed`).
- When a `VERIFICATION.md` run goes green: append a `Verified` entry to
  `CHANGELOG.md / Unreleased` per `VERIFICATION.md § 6.5`, bump test counts in
  `VERIFICATION.md § 2` if the suite size changed.
- When `README.md` drifts from reality: treat the drift as a `BUG` (area `docs`).
  Do not silently update it.
- Empty `## Open` sections are the desired steady state.
- Every ticket carries a `Bump:` (`major | minor | patch` — feature⇒minor,
  bug⇒patch, breaking⇒major). Migration appends the marker to each
  `CHANGELOG.md / Unreleased` line (e.g. `... [minor]`). `/release` auto-bumps
  **minor/patch only**; a `[major]`/breaking marker is *surfaced* for the user, who
  alone decides when to cut the major (`vX+1.0.0`). The in-repo version stays at the
  last released tag between releases.
- **Merge-conflict resistance.** Ids are UNIX-epoch timestamps (`FEAT-$(date +%s)` /
  `BUG-$(date +%s)`), never sequential. New entries are **appended at the end** of
  their section, never reordered; sort by id when you need order. `bugs.md` /
  `features.md` / `CHANGELOG.md` carry `merge=union` (see `.gitattributes`) so
  concurrent appends auto-merge. Change a ticket's `Status:` **in place** — do **not**
  move entries between sections; the only physical move (`## Open` →
  `## Shipped`/`## Migrated`) happens at `/protocol-v-and-v` migration, run by one
  person at a release.

### Stack notes

- Package manager: **npm** (`package-lock.json`). CI: `.github/workflows/ci.yml`
  (`npm ci`, lint, unit tests, production build, Chromium and mobile WebKit tests).
- Before upgrading TypeScript or ESLint beyond their pinned major versions,
  check the compatibility notes in `docs/dependency-update.md` and the current
  lint plugins' peer dependencies.
- All GitHub API access goes through `app/lib/github.ts` — do not scatter
  `api.github.com` `fetch` calls into components.
- `GITHUB_TOKEN` is server-only; never reference it from a client component.
