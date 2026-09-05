# Victor Ivanov's workspace

[victorivanov.engineer](https://victorivanov.engineer)

A personal portfolio inside a cozy, interactive room. Turn on the computer,
watch viOS start, and open the profile, projects, resume, interests, or contact
apps. The window cat mostly sleeps, with occasional looks around and grooming.

The room has a daylight/evening switch, photo notes, and small nods to climbing,
Magic: The Gathering, Pokémon, and Buffalo Wild Wings. Phones have a larger
computer and direct app buttons; reading windows fill the available viewport.

## Run locally

```sh
npm ci
npm run dev
```

For production validation:

```sh
npm run lint
npm test
npm run build
npm run start
npm run test:e2e
```

The app runs at `http://localhost:3000`. Playwright reuses a running local server.
Without one, it builds and starts the production app. CI already builds the app
before running Playwright.

To exercise a deployment, set `PLAYWRIGHT_BASE_URL` to its URL before running
`npm run test:e2e`; the test runner then skips local server startup.

## Implementation

Next.js 15 App Router, React 19, TypeScript, and Tailwind CSS 4. The illustrated
room is a 24 KB SVG. CSS handles ambient animation; React owns the computer's
off, booting, and on states. No WebGL engine or particle canvas runs on the
homepage. The Markdown reader loads only when a visitor opens a project.

- `app/components/room/Workspace.tsx`: room interactions, startup, app launchers.
- `app/components/room/DesktopWindow.tsx`: native dialog, app navigation, content.
- `app/components/room/ProjectReadme.tsx`: lazy Markdown rendering with safe links,
  GitHub tables, an abortable request, and a bounded display length.
- `app/components/room/WindowCat.tsx`: cat SVG and temporary greeting state.
- `app/room.css`: scene, responsive reading windows, animations, print styles.
- `public/room-studio.svg`: original vector scenery.
- `app/lib/github.ts`: existing public project data and API abstraction.

Ambient motion pauses when the page is hidden, a reading window is open, or the
visitor chooses Pause motion. Reduced-motion settings disable animation and skip
the timed startup. Effects remove listeners and clear timers on teardown.

## Content and resume

The screen resume is adapted from the August 2026 source resume. It is readable
HTML with a print/save-to-PDF action. Original resume PDFs remain unchanged and
are not copied into the public repository. See
[resume suggestions](docs/resume-suggestions.md) for proposed content edits and
source differences.

The portrait illustration comes from the linked public GitHub profile. The
conference photo was supplied through the owner's local photo collection and
authorized for publication. Public copies have no EXIF or XMP metadata.

Old links to `/#work`, `/#about`, and `/#contact` open their matching apps;
`/#resume` and `/#interests` also work. A no-JavaScript fallback contains the
professional summary and direct project/contact links.

## GitHub data

Project data is fetched on the server and revalidated hourly. `GITHUB_TOKEN` is
recommended for higher rate limits; without it the existing public endpoint
fallback is used. Only public, non-fork repositories are exposed. An empty
response leaves the biography and resume available and shows a direct GitHub
link in Projects.

Set local secrets in `.env.local` and production secrets in Vercel. Never commit
them. GitHub credentials are not sent to the browser.

## Release

The existing GitHub integration deploys `main` to the Vercel `my-website` project
and `victorivanov.engineer`. Follow [VERIFICATION.md](VERIFICATION.md) before
release and inspect deployment status afterward. Roll back with a normal revert
and the same deployment path.
