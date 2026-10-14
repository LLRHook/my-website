# Release verification

This checklist covers the 1990s HTML/CSS home page (FEAT-1790963490) and the
Codelings game on /projects (FEAT-1790968447, FEAT-1790968448, FEAT-1790968449,
FEAT-1790978717, design in `docs/game-design.md`): every route except /projects ships HTML and
CSS only, /projects adds the compiled game under a route-specific CSP, the live
GitHub projects table stays below the game, and the public route contracts hold.
Run history lives in `CHANGELOG.md` (Verified entries); older evidence is in
`docs/verification-history.md`.

Last verified: 2026-10-14, SHA 6ec878b (see `CHANGELOG.md` Verified).

## Build and automated checks

1. Record `git rev-parse HEAD` and inspect `git status --short`. Keep unrelated
   user changes out of the release.
2. Use Node 24.15 or later within Node 24 (`.nvmrc`) and the committed npm lockfile.
   On a clean checkout, run `npm ci`.
3. Run `npm run lint` (zero warnings), `npx tsc --noEmit`, `npm test`, and
   `SITE_ORIGIN=http://localhost:3000 npm run build`. The build first compiles
   `game/src` into the gitignored `public/game/` (`npm run build:game`) and must
   work without `app/layout.tsx`. `SITE_ORIGIN` must match the origin the E2E
   suite serves, because page CSPs name `<origin>/speculation-rules`.
4. With port 3000 free, run `CI=1 npm run test:e2e`. As in CI, Playwright starts
   the built artifact with `npm run start` on port 3000, retries twice, and stops
   it afterwards.
5. For a deployment, set `PLAYWRIGHT_BASE_URL` to its HTTPS URL and run
   `npx playwright test`. This skips local startup; the production build's CSP
   names `https://victorivanov.engineer`.

### Stage 2 baseline

Counts come from the runners themselves: Vitest's run summary (`npx vitest list`
counts each `it.each` table once) and `npx playwright test --list`. They are
overwritten in place after each green run.

| Layer | Runner | Count | Command (matches `.github/workflows/ci.yml`) |
|---|---|---|---|
| Lint | ESLint 9 | zero warnings | `npm run lint` |
| Types | TypeScript | zero errors | `npx tsc --noEmit` (local only; CI type-checks in `build:game` and `next build`) |
| Unit | Vitest | 251 tests, 21 files | `npm test` |
| Build | esbuild + Next.js | succeeds | `SITE_ORIGIN=http://localhost:3000 npm run build` |
| E2E | Playwright | 141 listed: 129 run, 12 skip | `CI=1 npm run test:e2e` |

Playwright projects: `chromium` runs every spec except `visual-qa`; `webkit-mobile`
runs the site and game specs; `iphone` (WebKit) and `pixel` (Chromium) run the game
spec only. Skips are touch-only or desktop-only cases. `e2e/visual-qa.spec.ts`
(screenshot captures) runs only when `CODELINGS_CAPTURE_DIR` is set and is not part
of the baseline.

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
  total). In production `/game/main.js` (always linked with a content `?v=`
  hash) is `immutable` for a year; images, icons and the PDF are
  cached a day with a week of stale-while-revalidate.
- Inline stylesheet (FEAT-1791849859): every page inlines `public/retro.css` in
  one `<style>` element, requests no stylesheet, and its CSP `style-src` is the
  SHA-256 hash of that text, with no CSP console errors.
- Instant navigation (FEAT-1791849858): every page carries `Speculation-Rules:
  "/speculation-rules"`, served as `application/speculationrules+json`. In Chromium,
  hovering a nav link prerenders that page, except /projects, which is only
  prefetched; the following click loads the speculated response
  (`deliveryType` `navigational-prefetch` under automation, because Chromium
  refuses to activate prerenders while DevTools is attached).
- Game boot (FEAT-1791849857): at 4x CPU no main-thread task on /projects
  exceeds the 300 ms CI cap (measured under 200 ms; ~780 ms before).
- Performance budget (FEAT-1791849860): `e2e/performance.spec.ts` fails CI
  when a cold load exceeds its budget against the local production server
  (`next start`: HTML uncompressed, static files gzip; headers included):

  | Page | Requests (max) | Bytes (max) | Measured 2026-10-12 |
  |---|---|---|---|
  | / | 3 | 40,000 | 3 / 32,394 |
  | /about | 4 | 75,000 | 4 / 61,888 |
  | /projects | 3 | 140,000 | 3 / 111,198 |
  | /resume | 2 | 32,000 | 2 / 24,469 |
  | /off-the-clock | 3 | 85,000 | 3 / 72,423 |
  | /contact | 2 | 26,000 | 2 / 18,913 |

  The raw game bundle is capped at 240,000 bytes (204,249 measured), and no task
  on /projects may exceed 300 ms at 4x CPU. Raise a budget only deliberately,
  in the same change that explains why.
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
  /sitemap.xml, /retro.css, /favicon.svg, /favicon.ico, /apple-touch-icon.png,
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

## Verification data

None. The site is stateless: pages are static or rebuilt from the live GitHub API,
which falls back to public repositories without `GITHUB_TOKEN`. A fresh stack is a
fresh `npm run build` of the SHA under test with no server left on port 3000.
