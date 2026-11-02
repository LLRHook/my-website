# Victor Ivanov's home page

[victorivanov.engineer](https://victorivanov.engineer)

A 1990s personal home page with blue links, a CSS marquee, an under-construction
notice, and browser badges. Pages ship hand-written HTML and one CSS file, with
no JavaScript in the browser.

## Pages

- Home (`/`): welcome and updates.
- About Me (`/about`): biography, tools, and conference photo.
- Projects (`/projects`): the token burner (AI coding-agent token usage) and a table of public GitHub repositories.
- Resume (`/resume`): experience, projects, education, skills, and a PDF download.
- Off the Clock (`/off-the-clock`): climbing, cards, books, travel, and side projects.
- Contact (`/contact`): email, GitHub, LinkedIn, and an email guestbook.

`/interests` permanently redirects to `/off-the-clock`. Unknown paths return
an HTML 404 with a link home.

## Run locally

Use Node 24.15 or later within Node 24 (`.nvmrc`; `nvm use` if using nvm) and
npm with the committed `package-lock.json`. CI reads the same Node version file.
Install dependencies and start development:

```sh
npm ci
npm run dev
```

The site runs at `http://localhost:3000`. Copy [.env.example](.env.example) to
`.env.local` to configure the optional GitHub token. Set production variables
in Vercel; never commit secrets.

| Variable | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | Optional, server-only token for higher GitHub API rate limits. The site always lists LLRHook's public repositories. |
| `SITE_ORIGIN` | Origin used in the build's Content Security Policy. Defaults to `https://victorivanov.engineer`; use `http://localhost:3000` for local production checks. |
| `PLAYWRIGHT_BASE_URL` | Optional deployment URL for Playwright. When set, the tests use that deployment and skip local server startup. |

## Scripts and checks

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Create a Next.js production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | Run ESLint. |
| `npm test` | Run Vitest unit tests. |
| `npm run test:watch` | Watch and rerun unit tests. |
| `npx tsc --noEmit` | Run the standalone TypeScript check. |
| `npm run test:e2e` | Run Playwright site checks in Chromium and WebKit, plus Chromium performance checks. |
| `npm run assets` | Regenerate the committed favicons and share card. |
| `npm run token-stats` | Rebuild the public token-usage snapshot from available local logs; see [Token stats](#token-stats). |

Install browser engines with `npx playwright install chromium webkit` before
running E2E tests. Playwright reuses a local production server or builds and
starts one. CI builds first. Set `PLAYWRIGHT_BASE_URL` to test a deployment
without starting a local server. For a fresh local production check, leave port
3000 free and use the build's matching origin. In Bash:

```sh
npm run lint
npx tsc --noEmit
npm test
npx playwright install chromium webkit
SITE_ORIGIN=http://localhost:3000 npm run build
CI=1 npm run test:e2e
```

In PowerShell, use the same first four commands, then:

```powershell
$env:SITE_ORIGIN = 'http://localhost:3000'
npm run build
$env:CI = '1'
npm run test:e2e
Remove-Item Env:CI, Env:SITE_ORIGIN
```

[VERIFICATION.md](VERIFICATION.md) records the complete release checklist and
performance budgets. To inspect dependency advisories, run `npm audit` for the
whole tree or `npm audit --omit=dev` for production dependencies. Dependency
maintenance and compatibility holds are recorded in
[the dependency guide](docs/dependency-update.md) and
[the October security follow-up](docs/dependency-security-2026-10-22.md).

## Implementation

Next.js App Router route handlers return complete HTML documents as
`Response` objects. There are no React page components, layouts, or web fonts.
No page loads a script. Every page's Content Security Policy uses
`script-src <origin>/speculation-rules`: no script can run, and WebKit may still fetch the
speculation rules JSON (`SITE_ORIGIN` sets the origin; production by default). The policy limits
images to the same origin and styles to the inlined stylesheet's hash. CSS provides the marquee and blinking
NEW label, disables both for reduced motion, and supplies print styles.

- `app/lib/html.ts`: escaping, page metadata, schema.org Person microdata, navigation, document shell, responses.
- `app/lib/pages.ts`: pure body renderers and resume content.
- `app/lib/github.ts`: repository listing, pagination, authentication, public fallback.
- `app/lib/projectPresentation.ts`: display names and descriptions for selected repos.
- `public/retro.css`: the site's only stylesheet. `next.config.js` inlines it in a `<style>` element on every page, so first paint never waits on a CSS request, and the CSP `style-src` allows exactly that text by its SHA-256 hash.
- Public images, icons and the resume PDF use a one-day cache with one week of stale-while-revalidate in production. The portrait and Peru photo are resized for their display sizes; below-the-fold photos load lazily.
- `app/speculation-rules/route.ts`: speculation rules sent through a `Speculation-Rules` response header on every page (no `<script>`). Chromium prerenders a same-origin page when its link is hovered or pressed; other browsers ignore the header.
- `scripts/render-assets.mjs`: regenerates the committed favicon set and 1200x630 share card (`npm run assets`).
- `app/route.ts` and the route folders: Home, About, Projects, Resume, Off the Clock, Contact, and the catch-all 404.
- `app/sitemap.ts` and `app/robots.ts`: crawler metadata.
- `e2e/site.spec.ts`: HTML, navigation, headers, routing, narrow layouts, and reduced motion.
- `e2e/performance.spec.ts` (Chromium, runs in CI): per-page cold-load request and byte budgets and prerendering of hovered links. Budgets are recorded in [VERIFICATION.md](VERIFICATION.md).

## GitHub data

The Projects table is generated on the server and revalidated hourly. It shows
public, non-fork repositories with descriptions, excluding the profile repo.
Rows sort by the most recent push and include language, stars, update date, and
HTTP(S) demo links. Requests always list LLRHook's public repositories; an optional
token supplies rate-limit headroom. An empty or failed authenticated listing is
retried without credentials, so an expired token does not hide public projects.
Page timeouts include reading the response body, and a failed page preserves
repositories already fetched. An unavailable list shows a direct GitHub link. No
language, commit, or README requests are made per repository.

## Token stats

`scripts/token-stats.mjs` (Node built-ins only) ports the owner's usage-widget
parsing. It reads Claude Code logs in `~/.claude/projects` and Codex logs in
`~/.codex/sessions` and `~/.codex/archived_sessions`.
Claude Code assistant messages are counted once per message id, at the
largest usage logged for that id (Claude Code logs partial usage while a message
streams), and Codex token counts are summed as per-event deltas of each rollout's cumulative
totals. Both plain `.jsonl` and Zstandard-compressed `.jsonl.zst` logs are read,
including archived Codex sessions; duplicate plain/compressed or active/archived
copies of a rollout count once. Malformed lines are skipped. It writes
`data/token-stats.json`: lifetime and 30-day totals, a Claude Code / Codex split,
the top six models, and 90 local
days, each split into input, output, cache-write and cache-read tokens with an
API-equivalent cost from the dated list-price table in the script. Only priced
models are named; others count tokens, no cost, and appear as Other. It covers
all available Claude Code and Codex sessions on the machine; deleting source logs
removes their usage from later exports. The file holds no paths, project
names, session ids, prompts or tool names, and is rewritten only when it changes.
`app/lib/tokenStats.ts` defines its type and validator.

`/projects` imports the committed snapshot at build time and renders it as the
token burner panel above the repository table: four stat tiles, the Claude Code /
Codex split, per-model bars and a 90-day chart. Bars and the chart are inline SVG
sized by attributes (the CSP allows no inline styles), each bar has a `<title>`,
and a `<details>` table lists every day as text. An invalid snapshot omits the
panel. Run `npm run token-stats` and commit `data/token-stats.json` to refresh it.
The public site reads this committed file; it does not read local agent logs.
Export and publication automation is tracked in
[features.md](features.md#open).

## Content and resume

The HTML resume carries the October 2026 copy and links to
`public/Victor_Ivanov_Resume.pdf`, a PDF export of the owner's resume with the
phone number removed and the same public wording as the HTML. The portrait comes from the public GitHub
profile. The conference photo and September 2026 Peru photograph were supplied
by the owner and authorized for publication. Public copies have no EXIF or XMP
metadata. The original source resume files remain unchanged.

## Project records

| Document | Purpose |
| --- | --- |
| [Requirements](docs/SRS.md) | Product requirements and constraints. |
| [Bug tracker](bugs.md) | Known issues and fixes awaiting verification or migration. |
| [Feature tracker](features.md) | Planned work and implementation records. |
| [Changelog](CHANGELOG.md) | Release history, changes, and verification evidence. |
| [Verification](VERIFICATION.md) | Release checks, test baselines, and performance budgets. |

## Release

The existing GitHub integration deploys `main` to the Vercel `my-website`
project and `victorivanov.engineer`. Follow [VERIFICATION.md](VERIFICATION.md)
before release and inspect deployment status afterward. Roll back with a
normal revert and the same deployment path.
