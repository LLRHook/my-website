# Verification history

Superseded evidence moved out of `VERIFICATION.md` during compaction on 2026-10-13.
It describes earlier versions of the site (the React room portfolio and the first
static build) and has no matching `CHANGELOG.md` Verified entry. Append-only; no
skill reads this file.

## From "Build and automated checks" (baseline before FEAT-1791849857)

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

## From "Acceptance coverage", low-bandwidth delivery (FEAT-1790991961)

Recorded cold transfer on 2026-10-02: / 22 KB, /about 52 KB, /projects 82 KB,
/off-the-clock 62 KB; with 400ms latency and 50 KB/s, /projects reached
`data-ready` in 2.6s (7.3s before).

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
