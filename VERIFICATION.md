# Workspace release verification

This checklist covers the interactive room introduced in version 0.5.0. It
supersedes the old timeline and Lenis UI checks. The GitHub API tests and public
route contracts remain in scope.

## Build and automated checks

1. Record `git rev-parse HEAD` and inspect `git status --short`. Keep unrelated
   user changes out of the release.
2. Use Node 22 or later and the committed npm lockfile. On a clean checkout,
   run `npm ci`.
3. Run `npm run lint`, `npm test`, and `npm run build`.
4. Start the production artifact with `npm run start` on port 3000, then run
   `npm run test:e2e`. Playwright reuses that server.
5. For a deployed build, set `PLAYWRIGHT_BASE_URL` to the HTTPS deployment URL
   and run the same E2E command. This skips local startup.

Current baseline: 40 Vitest cases across 5 files; 17 Playwright cases across
3 files. Test runners provide the authoritative counts. Run `npx playwright
test --list` when updating the baseline.

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
- README tables render and relative links resolve correctly. Raw HTML and remote
  images do not execute or load; unsafe link schemes are rejected.
- Existing #work/#about/#contact links open the right app. #resume/#interests
  also work. JavaScript-disabled users get a summary and contact/project links.
- Resume print mode shows readable professional content without room controls.
- Daylight/evening and pause controls work; reduced motion is respected.
- The cat sleeps, wakes and looks around, grooms, and returns to sleep. Clicking
  the cat triggers a temporary greeting. Ambient animation pauses when hidden or
  while a reading window is open.

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
