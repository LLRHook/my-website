# Release verification

This checklist covers the 1990s HTML/CSS home page (FEAT-1790963490): every
route ships HTML and CSS only, the live GitHub projects table, and the public
route contracts. Dated evidence sections below describe earlier versions.

## Build and automated checks

1. Record `git rev-parse HEAD` and inspect `git status --short`. Keep unrelated
   user changes out of the release.
2. Use Node 24.15 or later within Node 24 (`.nvmrc`) and the committed npm lockfile.
   On a clean checkout, run `npm ci`.
3. Run `npm run lint` (zero warnings), `npx tsc --noEmit`, `npm test`, and
   `npm run build`. A build must work without `app/layout.tsx`.
4. Start the production artifact with `npm run start -- -p 3100`, set
   `PLAYWRIGHT_BASE_URL=http://localhost:3100`, and run `npx playwright test`.
   Stop the server by the PID listening on its port when checks finish.
5. For a deployment, set `PLAYWRIGHT_BASE_URL` to its HTTPS URL and run the same
   E2E command. This skips local startup.

Current baseline: 28 Vitest cases across 3 files and 22 Playwright cases across
1 file (11 Chromium and 11 WebKit). Both browser projects run the whole site suite.
Vitest covers repository listing, filtering, mapping and fallback; HTML escaping,
metadata and navigation; and pure body renderers. Test runners provide the
authoritative counts. Historical counts below refer to their recorded builds.

## Acceptance coverage

- All six PAGES paths return 200 and text/html, one visible h1, and no script tags.
- Every response includes CSP with `script-src 'none'`; navigation marks only the
  current page with `aria-current`.
- Projects use hourly GitHub listing and show a table or a usable empty notice
  without `GITHUB_TOKEN`. Descriptions are escaped, profile and undescribed repos
  are filtered, rows sort newest first, and demo links use HTTP(S).
- Resume HTML links the downloadable PDF; the PDF returns 200.
- `/interests` redirects permanently to `/off-the-clock`; unknown paths return 404
  with a link home.
- No page has horizontal document overflow at 320x700. Capture all six pages at
  desktop 1280x900 and phone 390x844 for visual inspection.
- Reduced motion disables the CSS marquee. The sitemap lists all six URLs.
- Production curl checks verify script-free HTML, CSP, the 308 redirect and 404.
  Confirm sitemap, robots, stylesheet, favicon and PDF bypass the catch-all.

## Runtime and deployment checks

- GET /, /about, /projects, /resume, /off-the-clock, /contact, /robots.txt,
  /sitemap.xml, /retro.css, /favicon.svg, /favicon.ico, /apple-touch-icon.png, the resume PDF and public photos return 200.
- No page contains a `<script>` element; every response carries a CSP with
  `script-src 'none'`. /interests redirects (308) to /off-the-clock; unknown
  paths return the HTML 404 page.
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
