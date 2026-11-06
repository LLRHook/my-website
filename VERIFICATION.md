# Release verification

This checklist covers the 1990s HTML/CSS home page (FEAT-1790963490): every route
ships HTML and CSS only under one CSP (the Codelings game was removed in
FEAT-1791988181), /projects lists the live GitHub repositories, and the public
route contracts hold.
Run history lives in `CHANGELOG.md` (Verified entries); older evidence is in
`docs/verification-history.md`.

Last verified: 2026-10-14, SHA ff1ce0f (see `CHANGELOG.md` Verified).

Local candidate checks on November 6, 2026 cover the native Rust exporter and
public-profile/photo/print changes below. These checks do not establish a
deployment, a full release, or Windows-native acceptance.

## Build and automated checks

1. Record `git rev-parse HEAD` and inspect `git status --short`. Keep unrelated
   user changes out of the release.
2. Use Node 24.15 or later within Node 24 (`.nvmrc`) and the committed npm lockfile.
   On a clean checkout, run `npm ci`.
3. With Rust/Cargo 1.93+ available, run `npm run check:rust`, `npm run test:rust`,
   `npm run lint` (zero warnings), `npx tsc --noEmit`, `npm test`, and
   `SITE_ORIGIN=http://localhost:3000 npm run build`. The build must work without
   `app/layout.tsx`. `SITE_ORIGIN` must match the origin the E2E
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
| Types | TypeScript | zero errors | `npx tsc --noEmit` (local only; CI type-checks in `next build`) |
| Rust static | Rustfmt / Clippy | no formatting differences or warnings | `npm run check:rust` |
| Native unit | Cargo release tests | 5 tests, 0 failures/skips | `npm run test:rust` |
| Unit / native parity | Vitest | 97 tests, 5 files; 16 native CLI/parity cases | `npm test` |
| Build | Next.js | succeeds | `SITE_ORIGIN=http://localhost:3000 npm run build` |
| E2E | Playwright | 66 run, 0 failed, skipped or flaky | `CI=1 npm run test:e2e` |

Playwright projects: `chromium` runs every spec; `webkit-mobile` runs the site spec.
Nothing is skipped.

## Acceptance coverage

- All six PAGES paths return 200 and text/html with one visible h1, no script
  tags, and a CSP whose only script source is `<origin>/speculation-rules` (the
  JSON rules file, never executable). `/game/main.js` returns 404. Navigation
  marks only the current page with `aria-current`.
- Public images, icons and the PDF are cached a day with a week of
  stale-while-revalidate in production.
- Inline stylesheet (FEAT-1791849859): every page inlines `public/retro.css` in
  one `<style>` element, requests no stylesheet, and its CSP `style-src` is the
  SHA-256 hash of that text, with no CSP console errors.
- Instant navigation (FEAT-1791849858): every page carries `Speculation-Rules:
  "/speculation-rules"`, served as `application/speculationrules+json`. In Chromium,
  hovering a nav link, /projects included, prerenders that page; the following click loads the speculated response
  (`deliveryType` `navigational-prefetch` under automation, because Chromium
  refuses to activate prerenders while DevTools is attached).
- Performance budget (FEAT-1791849860): `e2e/performance.spec.ts` fails CI
  when a cold load exceeds its budget against the local production server
  (`next start`: HTML uncompressed, static files gzip; headers included):

  | Page | Requests (max) | Bytes (max) | Earlier baseline (2026-10-12 unless noted) |
  |---|---|---|---|
  | / | 3 | 32,000 | Previous baseline: 3 / 32,394; AVIF reduces the image transfer |
  | /about | 4 | 48,000 | Previous baseline: 4 / 61,888; AVIF reduces the image transfers |
  | /projects | 2 | 44,000 | 2 / 38,536 (2026-10-14: game removed, token burner added) |
  | /resume | 2 | 32,000 | 2 / 24,469 |
  | /off-the-clock | 3 | 48,000 | Previous baseline: 3 / 72,423; AVIF reduces the image transfer |
  | /contact | 2 | 26,000 | 2 / 18,913 |

  Raise a budget only deliberately,
  in the same change that explains why.
- Poor-connection budget (FEAT-1791988187): every page gets a fresh Chromium
  context with cache disabled, 400 ms latency, 50 KiB/s download and 20 KiB/s
  upload. First contentful paint must be below 2,500 ms and load below 4,000 ms;
  `/projects` has 3,500/5,000 ms headroom for its table and token panel. The six
  pages completed in 7.062 s locally; measured paint was 620–648 ms and load
  617–1,263 ms. Lowering the first page's budgets to 1 ms deliberately failed
  at a measured 664 ms paint; the exact spec bytes were restored afterward.
- Responsive photos (FEAT-1791988185): Chromium and WebKit fetch AVIF at 1x and
  2x density, with the expected content type and cache headers. Removing both
  sources loads the original fallback. Display dimensions/alt/priority/lazy
  semantics remain; outputs never exceed source dimensions and have no EXIF/XMP.
  Default-density image bytes are Home 1,876 (previously 10,788), About 8,337
  (38,536), and Off the Clock 10,275 (52,578). These are image bytes, not total
  page weight, and 2x images trade additional bytes for retained detail.
- Token burner (FEAT-1791988183): /projects shows the panel above the repository
  table with four stat tiles, two tool rows, model bars, a 90-day SVG chart with an
  `aria-label` summary and a 90-row `<details>` table; no element has a `style`
  attribute, bar colours come from the stylesheet, and the page has no horizontal
  overflow at 320 px. `parseTokenStats` accepts the committed
  `data/token-stats.json`, and an invalid snapshot omits the panel.
- Projects use hourly GitHub listing and show a table or a usable empty notice
  without `GITHUB_TOKEN`. Descriptions are escaped, profile and undescribed repos
  are filtered, rows sort newest first, and demo links use HTTP(S).
- Profile HTML, descriptions, Person metadata and share card omit superseded
  location/project/specialization claims while retaining approved public copy.
  Reintroducing the superseded clearance wording deliberately failed both
  targeted unit cases; the exact source bytes were restored.
- Resume HTML links the downloadable PDF; the PDF returns 200. Generate it from
  the local production `/resume` with `npm run resume:pdf`; it is a tagged,
  single-page Letter document with the same public claims, no website chrome,
  no scripts or clipped content. Inspect rendered PNG and extracted text.
- Native export (Rust CLI, `tools/token-stats`): `npm run token-stats` executes
  Rust by default. The JS implementation remains a parity oracle. The 16 CLI
  cases cover plain/Zstandard logs, active/archive copies, message maxima,
  anonymous rows, private model IDs, counter reset/invalid-date advancement,
  future exclusions, UTC/New York/Kathmandu day boundaries, atomic replacement,
  CRLF/unchanged mtime, invalid dates, broken compression and numeric overflow.
  Failure must leave the prior output intact; the committed real snapshot is
  never modified by the synthetic tests. The frozen dated price table is shared.
- `npm run benchmark:tokens -- 64` checks identical outputs on synthetic input,
  one warmup and three alternating measured runs per collector. On the local
  Mac with Node 24.22.2, native median was 17.48 ms / 6.41 MiB peak RSS and JS
  49.84 ms / 114.77 MiB. This is a collector-process comparison with compilation,
  npm/Cargo/launcher overhead excluded; it is not a whole-site or real-log result.
- `/interests` redirects permanently to `/off-the-clock`; unknown paths return 404
  with a link home.
- No page has horizontal document overflow at 320x700.
  Capture all six pages at desktop 1280x900 and phone 390x844 for visual
  inspection.
- Reduced motion stops the CSS marquee and keeps it to one static line. The sitemap lists all six URLs with lastmod.
- Production curl checks verify script-free HTML on every page, the uniform
  CSP, the 308 redirect and 404. Confirm sitemap, robots, stylesheet, icons, share
  card and PDF bypass the catch-all.

## Runtime and deployment checks

- GET /, /about, /projects, /resume, /off-the-clock, /contact, /robots.txt,
  /sitemap.xml, /retro.css, /favicon.svg, /favicon.ico, /apple-touch-icon.png,
  /og-image.png, the resume PDF and public photos return 200; /game/main.js returns 404.
- No page contains a `<script>` element; every response allows only `script-src https://victorivanov.engineer/speculation-rules`. /interests redirects (308)
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
