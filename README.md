# Victor Ivanov's home page

[victorivanov.engineer](https://victorivanov.engineer)

A 1990s personal home page with blue links, a CSS marquee, an under-construction
notice, and browser badges. Pages ship hand-written HTML and one CSS file.
No JavaScript reaches the browser.

## Pages

- Home (`/`): welcome and updates.
- About Me (`/about`): biography, tools, and conference photo.
- Projects (`/projects`): public GitHub repositories.
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
- `npm run build`: production build.
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
`Response` objects. There are no React page components, layouts, scripts, or
web fonts. The Content Security Policy includes `script-src 'none'` and limits
styles and images to the same origin. CSS provides the marquee and blinking
NEW label, disables both for reduced motion, and supplies print styles.

- `app/lib/html.ts`: escaping, page metadata, navigation, document shell, responses.
- `app/lib/pages.ts`: pure body renderers and resume content.
- `app/lib/github.ts`: repository listing, pagination, authentication, public fallback.
- `app/lib/projectPresentation.ts`: display names and descriptions for selected repos.
- `public/retro.css`: the site's only stylesheet.
- `scripts/render-assets.mjs`: regenerates the committed favicon set (`npm run assets`).
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
