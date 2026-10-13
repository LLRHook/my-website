# Release verification

This checklist covers the 1990s HTML/CSS home page (FEAT-1790963490) and the
Codelings game on /projects (FEAT-1790968447, FEAT-1790968448, FEAT-1790968449,
FEAT-1790978717, design in `docs/game-design.md`): every route except /projects ships HTML and
CSS only, /projects adds the compiled game under a route-specific CSP, the live
GitHub projects table stays below the game, and the public route contracts hold.
Dated evidence sections below describe earlier versions.

## Build and automated checks

1. Record `git rev-parse HEAD` and inspect `git status --short`. Keep unrelated
   user changes out of the release.
2. Use Node 24.15 or later within Node 24 (`.nvmrc`) and the committed npm lockfile.
   On a clean checkout, run `npm ci`.
3. Run `npm run lint` (zero warnings), `npx tsc --noEmit`, `npm test`, and
   `npm run build`. The build first compiles `game/src` into the gitignored
   `public/game/` (`npm run build:game`) and must work without `app/layout.tsx`.
4. Start the production artifact with `npm run start -- -p 3100`, set
   `PLAYWRIGHT_BASE_URL=http://localhost:3100`, and run `npx playwright test`.
   Stop the server by the PID listening on its port when checks finish.
5. For a deployment, set `PLAYWRIGHT_BASE_URL` to its HTTPS URL and run the same
   E2E command. This skips local startup.

Current baseline: 249 Vitest cases across 20 files and 130 Playwright cases across
2 files: Chromium and WebKit run both suites (15 site and 25 game each, 4 game
cases skipped as touch-only), and the iPhone 15 (WebKit) and Pixel 7 (Chromium)
touch projects run only the game suite (25 each, 2 desktop-only cases skipped),
so 118 run and 12 skip. `e2e/visual-qa.spec.ts` (screenshot captures) runs only
when `CODELINGS_CAPTURE_DIR` is set and is not part of the baseline. Vitest covers repository listing, filtering, mapping
and fallback; HTML escaping, metadata, microdata and navigation; pure body
renderers; and the game's pure modules (RNG, storage validation, text wrapping,
MML parser and music data, maps, scripts, NPC sight lines, species, formulas,
type chart, catching and the battle state machine). Test runners provide the
authoritative counts. Historical counts below refer to their recorded builds.

## Acceptance coverage

- All six PAGES paths return 200 and text/html with one visible h1. Every page
  except /projects has no script tags and a CSP whose only script source is
  `<origin>/speculation-rules` (the JSON rules file, never executable);
  /projects has exactly one script (`/game/main.js` with an optional `?v=` query, type module) and a CSP with
  `script-src 'self'`. Navigation marks only the current page with `aria-current`.
- The game boots to `data-ready` and `data-scene="title"` with zero console and
  page errors; keyboard and on-screen START reach the intro; a new game reaches
  the overworld, changes maps through the stairs and door, and SAVE then reload
  then CONTINUE restores the map. With `?seed=1&encounter=1` a starter can be
  chosen, a tall-grass step starts a battle, a Fork Ball can be thrown, and the
  Codex opens; repository links ask YES/NO before opening. Test-only query
  parameters are documented in README.md and change no persisted state.
- On the iPhone and Pixel touch projects PLAY FULLSCREEN covers the viewport and
  locks scrolling; a thumb sliding across the D-pad without lifting turns and
  walks (`data-pos`); holding B while sliding runs farther than walking in the
  same time; landscape and 320x568 portrait fit every control in the viewport at
  screen scale 2 or more; EXIT restores scrolling. On desktop the power LED stays
  inside the bezel in fullscreen. Audio unlock, vibration and notch insets need a
  physical-device check; emulation cannot prove them.
- Evolution (FEAT-1790991962): a seeded save whose lead Codeling sits one level
  below its first evolution level wins a wild battle and reaches
  `data-scene="evolution"`; afterwards the party shows the stage 2 name. Unit
  tests pin stage-1 sprites to their pre-evolution pixels and require each later
  stage to grow (>= 110% area), keep its features and differ visibly (>= 25%).
- Region (FEAT-1790991963): a walkable-graph unit test reaches every map from the
  bedroom to Main Branch Tower; the cave warden, Route 4 ranger and tower guard
  block without their badges; seeded saves enter Branch Bay and Release Ridge and
  start the Rhea, Otto, Mira and Champion battles on all four projects; a Champion
  win plays the ending and returns the player to the tower entrance in Ridge.
- Post-game (FEAT-1790991964): before `champion` the Stack Cave door says it is
  sealed and blocks; a seeded post-game save enters the vault and starts the
  ORIGIN battle on all four projects. Unit tests gate every post-game element on
  `champion`, pin the once-per-local-day rematch cooldown and six-member parties,
  ORIGIN's constraints (id 0, level 50, catch rate 3, one form, excluded from the
  diploma), quest transitions and rewards, and that saves with species id 0 load.
- Low-bandwidth delivery (FEAT-1790991961): the game is one minified esbuild
  bundle, so a cold /projects load makes one `/game/` request (3 requests in
  total). In production `/retro.css` and `/game/main.js` (always linked with a
  content `?v=` hash) are `immutable` for a year; images, icons and the PDF are
  cached a day with a week of stale-while-revalidate. Recorded cold transfer on
  2026-10-02: / 22 KB, /about 52 KB, /projects 82 KB, /off-the-clock 62 KB; with
  400ms latency and 50 KB/s, /projects reached `data-ready` in 2.6s (7.3s before).
- Instant navigation (FEAT-1791849858): every page carries `Speculation-Rules:
  "/speculation-rules"`, served as `application/speculationrules+json`. In Chromium,
  hovering a nav link prerenders that page, except /projects, which is only
  prefetched; the following click loads the speculated response
  (`deliveryType` `navigational-prefetch` under automation, because Chromium
  refuses to activate prerenders while DevTools is attached).
- Game boot (FEAT-1791849857): at 4x CPU no main-thread task on /projects
  exceeds the 300 ms CI cap (measured under 200 ms; ~780 ms before).
- Projects use hourly GitHub listing and show a table or a usable empty notice
  without `GITHUB_TOKEN`. Descriptions are escaped, profile and undescribed repos
  are filtered, rows sort newest first, and demo links use HTTP(S).
- Resume HTML links the downloadable PDF; the PDF returns 200.
- `/interests` redirects permanently to `/off-the-clock`; unknown paths return 404
  with a link home.
- No page has horizontal document overflow at 320x700, including the handheld.
  Capture all six pages at desktop 1280x900 and phone 390x844 for visual
  inspection, plus the game's title, overworld, battle and Codex screens.
- Reduced motion stops the CSS marquee and keeps it to one static line; the game
  drops shakes and flashes. The sitemap lists all six URLs with lastmod.
- Production curl checks verify script-free HTML outside /projects, the per-route
  CSP, the 308 redirect and 404. Confirm sitemap, robots, stylesheet, icons, share
  card, game modules and PDF bypass the catch-all.

## Runtime and deployment checks

- GET /, /about, /projects, /resume, /off-the-clock, /contact, /robots.txt,
  /sitemap.xml, /retro.css (allow `?v=`), /favicon.svg, /favicon.ico, /apple-touch-icon.png,
  /og-image.png, /game/main.js (allow `?v=`), the resume PDF and public photos return 200.
- Only /projects contains a `<script>` element and carries `script-src 'self'`;
  every other response allows only `script-src https://victorivanov.engineer/speculation-rules`. /interests redirects (308)
  to /off-the-clock; unknown paths return the HTML 404 page.
- The 404 page links back to the home page.
- Run mobile Lighthouse against the production artifact/domain. Existing targets
  are Performance>=90, Accessibility>=95, and LCP<2.5s. Report the measured LCP
  separately; a high aggregate score does not establish that the LCP target passed.
- Review public copy and images against authorized sources. Keep source resume
  PDFs and credentials private; verify no EXIF/XMP metadata on public photos.
- Check GitHub Actions and Vercel status for the exact pushed commit, then repeat
  the critical browser flows on victorivanov.engineer.

## September 5 local evidence

The production build passed lint, type checking, 40 unit tests and 17 browser
cases. A mobile Lighthouse 13.4.1 run measured Performance 98, Accessibility 100,
Best Practices 100 and SEO 100, with LCP 2.2s, TBT 10ms and CLS 0.001. This local simulated-mobile LCP meets the 2.5s target; production must be measured too.
The final audit used Lighthouse through an existing headless Chromium session.

After 10 warm Resume cycles plus 100 more open/close cycles, Chromium DOM counters
remained 2 documents, 1,096 nodes, 338 listeners and 337 page elements. Heap samples
were 3,840,792 bytes at the warm baseline, 3,797,284 at 50 cycles, and 3,961,280 at 100
cycles: net retained growth 120,488 bytes. No page errors or remaining scroll lock
were observed. This bounded run does not prove the absence of every memory leak.

A dedicated review found and fixed focus restoration, focus loss on project
navigation, README relative-link routing, and missing GFM table rendering.
Original resume PDFs remain unchanged. The user's pre-existing CLAUDE.md deletion
is outside the release.

A repeated live README check exposed GitHub API rate limiting. Public raw-file
fallbacks now recover README content; 14 provider regression tests cover limits,
timeouts, missing files, validated URL paths, and omitted authorization headers.

## September 5 version 0.6.0 evidence

Lint, TypeScript, the production build, 55 unit tests, and all 34 Chromium browser
tests passed. A separate production-artifact smoke covered Chromium and WebKit at
320, 390, and 1440px, with screenshots of the room, computer startup/desktop,
photos, objects, apps, and sound settings. No page exceptions or horizontal
overflow were observed. All eleven objects also received a WebKit pointer/focus
review at 320 and 390px. That review caught and fixed mobile hit targets, a narrow
desktop overlap, and WebKit's different pointer-focus behavior.

The native Chromium audio tests measure output from the actual audio graph,
exercise independent layers and volume, verify hidden-tab suspension, and confirm
each context closes over repeated enable/disable cycles. The Windows Playwright
WebKit build exposes no Web Audio API: it verifies the unsupported-browser
message and layout, not audio playback on a physical Safari device.

After ten warm cycles, another 100 cycles each opened and closed an object and
the computer. Chromium counters stayed at 2 documents, 1,238 nodes, and 359
listeners, with no remaining open dialogs. Forced-GC heap samples were 4,011,996,
4,075,440, and 4,124,816 bytes (baseline, 50, 100): net retained growth 112,820
bytes. This bounded measurement does not prove the absence of every memory leak.

The new photo is a 2400×1800 WebP without EXIF, XMP, or ICC metadata. Original
resume files remain unchanged. A local anonymous GitHub rate limit was resolved
for the build using existing authenticated access without saving a credential.

The final local Lighthouse 13.4.1 mobile audit measured Performance 98,
Accessibility 100, Best Practices 100, and SEO 100. LCP was 2.3s, TBT 10ms, and
CLS 0.001. Accurate photo thumbnail sizes and deferred handwriting-font preload
reduced loading contention. The audit also verified corrected accessible labels
and unobstructed mobile controls.

Additional touch-target checks use axe 4.12.1 and actual pointer clicks at 320,
390, and 412px. All eleven details, the physical power switch, and the project
reminder pass, with no target-size violations. The browser suite also checks a
clear 24px square inside the power switch and reminder before opening them.

## September 5 version 0.7.0 evidence

The final production build, lint/type checks, 63 unit tests, and all 54 browser
tests passed. The seven touch configurations are 320×568 and 375×667 at DPR2;
390×844, 393×852, 412×915, 430×932, and 844×390 at DPR3. Both Chromium and WebKit
check these layouts, real taps, photo/screen separation, exposed desk objects,
zoomed computer/resume flows, and dialog bounds after the viewport becomes 96px
shorter. The Playwright report contains a composition screenshot for each case.

The room contains no plus badges, object-name tooltips, or startup arrow. Names
and stories appear after a click or tap. The cat itself opens its detail, whose
wake/sleep interaction is covered. The official BWW vector is used on the gold
carton and in Interests. Original source resume files remain unchanged.

Motion tests observe real browser animation-frame scheduling: the page has zero
queued JavaScript frames at rest, and pause, modal display, and reduced-motion
preferences cancel the response. Chromium performs a native 120px touch drag to
verify scrolling. Playwright's mobile WebKit interface supports native taps but
not drag gestures; its scroll check uses browser scrolling. These are emulated
devices, not a physical iPhone/Safari test.

Native Chromium audio checks pass for independent layers, volume, hidden-page
suspension, and repeated context closure. An 84-second offline render measured
the largest adjacent one-second music RMS change falling from 19.10dB to 1.83dB;
the default combined peak fell from −28.58 to −33.54dBFS. At most 14 voices were
retained, below the 24-voice cap. Layer changes fade over 450ms and cancel their
release timers on hide or close. Audio was measured; physical Safari playback
and subjective listening were not verified in this environment.

Axe 4.12.1 reported zero violations for the powered-off room, powered-on room,
BWW close-up, and Interests at 320, 390, and 430px. The audit caught and corrected
contrast in small labels and a keyboard-scroll issue in the content pane. A
rotated sticky note also gained 2px to preserve a clear 24px touch square.

With ambient motion enabled, ten warm cycles followed by 100 cycles each opening
an object and the computer retained 2 documents, 1,219 DOM nodes, and 364 listeners.
Forced-GC heap samples were 3,902,136 bytes at baseline, 3,932,608 at 50 cycles, and
3,995,900 at 100 cycles (net 93,764 bytes). No dialogs or scroll locks remained.
This bounded measurement does not prove the absence of every possible leak.

The final local mobile Lighthouse run measured Performance 97, Accessibility
100, Best Practices 100, and SEO 100: LCP 2.4s, TBT 10ms, CLS 0.001. The room SVG
is 30,092 bytes and the homepage's initial JavaScript is 129kB. A separate smoke
checked public routes, all app views, photos, close-ups, sound settings, and the
no-JavaScript fallback without page exceptions or horizontal overflow.


## September 5 dependency maintenance evidence

The maintenance source uses Node 24.19.0, Next 16.3.4, React 19.2.8 and the refreshed
npm lockfile. Clean installation, lint, type checking, production build, 68 unit
tests and all 54 browser cases passed. npm audit reported zero vulnerabilities.
The updated WebKit engine exposed a touch-reset bug (BUG-1788662454); event tracing
identified synthetic mouse events canceling the reset timer. Two regression tests
failed before the fix, and the unchanged browser assertion passed afterward.

See [dependency maintenance](docs/dependency-update.md) for package compatibility
holds, route/header/image smoke results, and validation limits. These results
cover the local production artifact, not a new production deployment or a full
repeat of the performance and memory protocol.


## September 5 combined desktop and mobile rollout evidence

Integrated the professional-room branch through `1afd089` with the dependency
maintenance branch. The combined source passed lint, standalone TypeScript
checking, the production build, all 104 unit tests, and all 64 browser cases
without retries. No application dependency changed during this integration.

Real touch taps verified roulette, lamp/window toggles, reading/diploma details,
photo close-ups and computer/app navigation across seven portrait/landscape
configurations in Chromium and WebKit. Animated roulette, repeat-spin locking,
keyboard activation, pause and reduced motion also passed in both engines.
The 390px rendered mobile page was visually inspected. Devices are emulated.

The first combined browser run exposed two retired display-label locators and
an autoplay probe affected by automation activation. Corrected those fixtures
while retaining real endpoint, native audio, mute and navigation assertions.
The final rerun passed every case. See BUG-1788663454.

The owner explicitly requested immediate publication of these shared desktop
and mobile features. Deployment and live-site verification follow the commit;
this source record does not itself claim a successful production deployment.
The full performance/memory release protocol was not repeated.
