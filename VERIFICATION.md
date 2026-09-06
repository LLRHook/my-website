# Workspace release verification

This checklist covers the interactive room, professional project content,
roulette, mobile composition, motion, and remembered sound preferences. It
supersedes the old timeline and Lenis UI checks. The GitHub API tests and public
route contracts remain in scope.

## Build and automated checks

1. Record `git rev-parse HEAD` and inspect `git status --short`. Keep unrelated
   user changes out of the release.
2. Use Node 24.15 or later within Node 24 (`.nvmrc`) and the committed npm lockfile. On a clean checkout,
   run `npm ci`.
3. Run `npm run lint`, `npm test`, and `npm run build`.
4. Start the production artifact with `npm run start` on port 3000, then run
   `npm run test:e2e`. Playwright reuses that server.
5. For a deployed build, set `PLAYWRIGHT_BASE_URL` to the HTTPS deployment URL
   and run the same E2E command. This skips local startup.

Current baseline: 104 Vitest cases across 11 files and 64 Playwright cases
across 8 files (50 Chromium and 14 WebKit). Playwright runs the
complete suite in Chromium and the mobile, motion, and roulette suites in WebKit.
Test runners provide the authoritative browser counts; run
`npx playwright test --list` when updating the baseline. Historical counts below
refer to their recorded builds.

## Acceptance coverage

- Power off, full six-stage startup, skipped startup, immediate startup under
  reduced motion, shutdown during startup, and subsequent reboot.
- About, Projects, Resume, Off the clock, and Contact apps open correctly.
- The native dialog contains focus. Escape and the close button return focus to
  the launcher, including notes used before startup. Project details focus their
  heading and the back button restores search focus.
- Every app stays inside 320, 390, 768, and 1440px viewports. Main reading copy
  is at least 14px; content scrolls without horizontal page overflow.
- Search works for names, descriptions, topics, and languages. Missing projects
  show a direct GitHub link. README requests use the actual text/plain endpoint;
  errors have a usable fallback and requests abort when their view closes.
- Featured Billington, Citybase, and Kilo work remains readable in the Projects
  app on desktop and phone widths, alongside the searchable repository collection.
- README tables render and relative links resolve correctly. Raw HTML and remote
  images do not execute or load; unsafe link schemes are rejected.
- Existing #work/#about/#contact links open the right app. #resume/#interests
  also work. JavaScript-disabled users get a summary and contact/project links.
- Resume print mode shows readable professional content without room controls.
- Daylight/evening and pause controls work; reduced motion is respected. Tapping
  the window changes the time of day directly, and the lamp toggles its glow.
- True touch/DPR emulation covers 320, 375, 390, 393, 412, and 430px phone widths
  plus landscape. Photos stay clear of the monitor; the keyboard, lamp, roulette,
  and wings carton remain exposed. Check dialog bounds again after shrinking the
  viewport height to represent browser controls expanding.
- Pointer and touch response stays small, settles without a JavaScript frame
  loop, and resets when paused, hidden, under a dialog, or using reduced motion.
- The official winged-buffalo mark appears on the gold carton and in Interests.
  The footer contains only copyright; no construction or inspiration copy remains.
- The computer zooms into a readable startup and returns with its power state
  intact. Photo/object close-ups respond to ordinary pointer clicks
  at 320, 390, and 1440px, contain Tab focus, and restore their launcher's focus.
- True touch cases spin roulette once, show a valid 0–36 result without opening
  a dialog, and keep the result within the viewport. Reading and diploma notes
  open, fit the screen, close, and restore focus at every touch configuration.
- Roulette locks repeat activation during a spin, preserves keyboard focus,
  and hides the result after its display interval. Pausing or reduced motion
  settles the round immediately without confetti; later motion does not replay it.
- The Peru original returns a 2400×1800 WebP; vector details crop the original
  SVG. The breeze follows pause, page visibility, and reduced-motion preferences.
- First-visit audio requests nature only at 18% volume. A blocked browser reports
  waiting and retries on the first gesture. Remembered mute prevents context
  creation; volume and layer preferences survive remounts. The sound toggle does
  not accidentally trigger the fallback before muting.
- Real browser audio produces signal with either layer enabled and silence at
  zero volume or with both layers disabled. Hidden pages suspend audio; repeated
  sound cycles close each context. Failed playback permits a later retry.
- The cat sleeps, looks around, blinks, flicks its ears and tail, and stretches.
  Clicking or tapping triggers a temporary greeting without opening a dialog.
  Ambient animation pauses when hidden or while a reading window is open.

## Runtime and deployment checks

- GET /, /api/repos, /robots.txt, /sitemap.xml, /manifest.webmanifest,
  /opengraph-image, /twitter-image, /room-studio.svg and public photos return 200.
- /api/readme/LLRHook/my-website returns text, not JSON. Source-peek API behavior
  remains covered by the existing provider abstraction.
- An unknown route returns 404 with a readable return-to-workspace link.
- Browser console has no page exceptions or hydration errors.
- Repeated app cycles do not accumulate DOM nodes or listeners. Check retained
  heap after warm-up and forced GC; report measurements, not a leak-free claim.
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
