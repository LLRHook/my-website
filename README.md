# Victor Ivanov's workspace

[victorivanov.engineer](https://victorivanov.engineer)

A personal portfolio inside a cozy, interactive room. Turn on the computer,
watch viOS start, and open the profile, projects, resume, interests, or contact
apps. The window cat mostly sleeps, with occasional looks around and grooming.

The room has a daylight/evening switch, photo notes, and small nods to climbing,
Magic: The Gathering, Pokémon, poker, and Buffalo Wild Wings. Click the computer
for a larger monitor, or inspect eleven room details for sharp artwork, original
photos, and a short story. On phones, the three photos sit above the room and the
computer keeps its desk proportions. Tap the miniature screen for a full reading
window. The gold carton on the lower right shelf uses the official Buffalo Wild
Wings mark. Objects have quiet hover and keyboard-focus responses; their names
and stories appear in the close-up, without plus badges around the room.

A curtain catches a gentle breeze. Optional sound adds quiet music, bird calls,
insects, and wind, with separate music/nature controls and a volume slider. Sound
starts only after the visitor turns it on. Long overlapping chords and rounded
attacks keep the music quiet. Pointer movement and taps gently shift the light,
leaf shadows, and nearby objects; slow CSS animation supplies the idle movement.

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
npx playwright install chromium webkit
npm run test:e2e
```

The app runs at `http://localhost:3000`. Playwright reuses a running local server.
Without one, it builds and starts the production app. CI already builds the app
before running Playwright.

To exercise a deployment, set `PLAYWRIGHT_BASE_URL` to its URL before running
`npm run test:e2e`; the test runner then skips local server startup.

## Implementation

Next.js 15 App Router, React 19, TypeScript, and Tailwind CSS 4. The illustrated
room is a 30 KB SVG. CSS handles ambient animation; React owns the computer's
off, booting, and on states. No WebGL engine or particle canvas runs on the
homepage. The Markdown reader loads only when a visitor opens a project.

- `app/components/room/Workspace.tsx`: room interactions, startup, app launchers.
- `app/components/room/DesktopWindow.tsx`: native dialog, app navigation, content.
- `app/components/room/ProjectReadme.tsx`: lazy Markdown rendering with safe links,
  GitHub tables, an abortable request, and a bounded display length.
- `app/components/room/WindowCat.tsx`: cat SVG and temporary greeting state.
- `app/components/room/ComputerFocus.tsx`: enlarged monitor and keyboard focus.
- `app/components/room/ObjectDetail.tsx`: photo and vector close-ups with captions.
- `app/components/room/RoomBreeze.tsx`: animated curtain, air, and falling leaf.
- `app/components/room/RoomAtmosphere.tsx`: sunlight, leaf shadows, and dust motes.
- `app/components/room/useRoomMotion.ts`: bounded pointer and touch interpolation.
- `app/components/room/room-mobile.css`: phone photo row and scene composition.
- `app/components/room/RoomAudio.tsx`: opt-in sound and layer controls.
- `app/lib/room-audio.ts`: original procedural Web Audio soundscape.
- `app/room.css`: scene, responsive reading windows, animations, print styles.
- `public/room-studio.svg`: original vector scenery.
- `app/lib/github.ts`: existing public project data and API abstraction.

Ambient room motion pauses when the page is hidden, a reading window or close-up
is open, or the visitor chooses Pause motion. Reduced-motion settings disable
animation and skip the timed startup. Effects remove listeners and clear timers
on teardown. The pointer animation frame loop stops when it settles, and passive
touch handlers leave scrolling available. Audio suspends when hidden, limits concurrent voices, disconnects
finished nodes, and closes its context when disabled or unmounted.

## Content and resume

The screen resume is adapted from the August 2026 source resume. It is readable
HTML with a print/save-to-PDF action. Original resume PDFs remain unchanged and
are not copied into the public repository. See
[resume suggestions](docs/resume-suggestions.md) for proposed content edits and
source differences.

The portrait illustration comes from the linked public GitHub profile. The
conference photo was supplied through the owner's local photo collection and
authorized for publication. The Peru postcard is the owner's photograph from his
September 2026 trip, shared in Discord and authorized for this site. Public copies
have no EXIF or XMP metadata. Captions avoid unverified venue/date claims.

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
