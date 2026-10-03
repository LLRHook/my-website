# Victor Ivanov's home page

[victorivanov.engineer](https://victorivanov.engineer)

A 1990s personal home page with blue links, a CSS marquee, an under-construction
notice, and browser badges. Pages ship hand-written HTML and one CSS file.
The Projects page also loads Codelings, an original pixel-art game written in
TypeScript. The repository table remains the accessible version of the same data.

## Pages

- Home (`/`): welcome and updates.
- About Me (`/about`): biography, tools, and conference photo.
- Projects (`/projects`): Codelings and an accessible table of public GitHub repositories.
- Resume (`/resume`): experience, projects, education, skills, and a PDF download.
- Off the Clock (`/off-the-clock`): climbing, cards, books, travel, and side projects.
- Contact (`/contact`): email, GitHub, LinkedIn, and an email guestbook.

`/interests` permanently redirects to `/off-the-clock`. Unknown paths return
an HTML 404 with a link home.

## Run locally

Use Node 24.15 or later within Node 24 (`.nvmrc`; `nvm use` if using nvm).
CI reads the same file. Install the committed lockfile and start development:

```sh
npm ci
npm run dev
```

The site runs at `http://localhost:3000`. Copy `.env.example` to `.env.local`
if you want to configure `GITHUB_TOKEN`. The token is optional and remains on
the server. Without it, the projects page uses GitHub's public endpoint.
Set production variables in Vercel; never commit secrets.

## Scripts and checks

- `npm run dev`: development server.
- `npm run build:game`: strictly type-check `game/src`, then bundle and minify it with esbuild into `public/game/main.js`, removing stale output first.
- `npm run dev:game`: watch and rebundle the game with esbuild alongside `npm run dev`; log each rebuild's size.
- `npm run build`: type-check and bundle the game, then create the Next.js production build.
- `npm run start`: serve the production build.
- `npm run lint`: ESLint.
- `npm test`: Vitest unit tests; `npm run test:watch` watches changes.
- `npx tsc --noEmit`: standalone TypeScript check.
- `npm run test:e2e`: Playwright in Chromium and WebKit.

Install browser engines with `npx playwright install chromium webkit` before
running E2E tests. Playwright reuses a local production server or builds and
starts one. CI builds first. Set `PLAYWRIGHT_BASE_URL` to test a deployment
without starting a local server.

## Implementation

Next.js App Router route handlers return complete HTML documents as
`Response` objects. There are no React page components, layouts, or web fonts.
Only `/projects` loads a module script, bundled and minified with esbuild after
strict TypeScript checking; its Content Security Policy uses `script-src 'self'`. All other pages
use `script-src 'none'`. The policy limits
styles and images to the same origin. CSS provides the marquee and blinking
NEW label, disables both for reduced motion, and supplies print styles.

- `app/lib/html.ts`: escaping, page metadata, schema.org Person microdata, navigation, document shell, responses.
- `app/lib/pages.ts`: pure body renderers and resume content.
- `app/lib/github.ts`: repository listing, pagination, authentication, public fallback.
- `app/lib/projectPresentation.ts`: display names and descriptions for selected repos.
- `game/`: Codelings engine, procedural creatures, battles, collection menus, and unit tests; see [the game design](docs/game-design.md).
- `game/src/world/`: overworld movement, typed map data, NPCs, and story scripts.
- `public/game/main.js`: one generated, minified browser bundle, excluded from Git.
- `public/retro.css`: the site's only stylesheet, including the CSS handheld. Both it and the game script use a content-derived `?v=` query and a one-year immutable cache in production.
- Public images, icons and the resume PDF use a one-day cache with one week of stale-while-revalidate in production. The portrait and Peru photo are resized for their display sizes; below-the-fold photos load lazily.
- `scripts/render-assets.mjs`: regenerates the committed favicon set and 1200x630 share card (`npm run assets`).
- `app/route.ts` and the route folders: Home, About, Projects, Resume, Off the Clock, Contact, and the catch-all 404.
- `app/sitemap.ts` and `app/robots.ts`: crawler metadata.
- `e2e/site.spec.ts`: HTML, navigation, headers, routing, narrow layouts, and reduced motion.

## GitHub data

The Projects table is generated on the server and revalidated hourly. It shows
public, non-fork repositories with descriptions, excluding the profile repo.
Rows sort by the most recent push and include language, stars, update date, and
HTTP(S) demo links. Listing requests use the existing authenticated-to-public
fallback. An unavailable list shows a direct GitHub link. No language, commit,
or README requests are made per repository.

## Content and resume

The HTML resume retains the September 2026 copy and links to
`public/Victor_Ivanov_Resume.pdf`. The portrait comes from the public GitHub
profile. The conference photo and September 2026 Peru photograph were supplied
by the owner and authorized for publication. Public copies have no EXIF or XMP
metadata. The original source resume files remain unchanged.

## Release

The existing GitHub integration deploys `main` to the Vercel `my-website`
project and `victorivanov.engineer`. Follow [VERIFICATION.md](VERIFICATION.md)
before release and inspect deployment status afterward. Roll back with a
normal revert and the same deployment path.

### Codelings battles and collection

Choose a level-5 starter in Prof. Ivanov's lab, then explore Route 1, Route 2 and
Stack Cave. Each public repository has a deterministic Codeling, with older
repositories deeper in the cave. Fight, catch and train a party of six, store
extras in the Center PC, buy or sell supplies at the Mart, and challenge Reviewer
Rhea for the green-check badge and credits. Completing the Codex earns a diploma.
Codelings evolve after levelling up in battle; press B during the animation to cancel.
Caught Codex entries open the repository after a YES/NO confirmation; HTTP(S)
homepages also offer a demo link. Saves stay in this browser's local storage.

On phones, tap PLAY FULLSCREEN for a screen and controls fitted to portrait or
landscape. Slide your thumb across the D-pad and hold B with your other thumb to
run. EXIT returns to the scrolling page. HAPTICS in Options toggles button ticks
on browsers that support vibration. The game pauses when scrolled out of view.

Keyboard: arrows/WASD to walk, Z/Space to confirm, X/Shift to cancel or run,
Enter for START and Tab for SELECT. In battle, FIGHT opens moves, BAG uses supplies,
TEAM switches a Codeling and RUN attempts to escape a wild battle. SELECT switches
buy/sell at the Mart and party/box at the PC. On the trainer card, SELECT reopens
an earned diploma.

For browser tests only, `/projects?hour=12&seed=1&encounter=1` fixes the local
lighting hour (0-23), seeds the runtime RNG, and forces the next eligible grass
or cave step to encounter a Codeling. Parameters are parsed only in `main.ts`
when present and do not modify persisted state. They are not cheats or save fields.
