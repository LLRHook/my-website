# my-website (Victor Ivanov Portfolio) — Feature Tracker

This file is the working list of features to implement. New features are appended
here as they are scoped. When a feature is shipped, tick its checkbox and migrate
the entry (with the implementation note) to `CHANGELOG.md` so this file stays
focused on outstanding work.

## Conventions

Each entry uses the form:

```
### [<id>] <short title>
- [ ] **Priority:** crit | high | med | low
- **Area:** <same tag set as bugs.md>
- **File(s):** comma-separated paths the feature will create or modify
- **Why:** product / user motivation
- **Approach:** the design — concrete enough that an implementer doesn't have to ask
- **Library / dependency notes:** evaluation of any third-party deps, with the recommendation called out explicitly
- **Acceptance criteria:** bullet checklist of what "done" means
- **Test plan:** unit / integration / E2E coverage to land with the feature
- **Out of scope:** explicit "we are NOT doing X in this ticket"
- **Bump:** major | minor | patch  (feature defaults **minor**, a breaking change is **major**)
- **Status:** open | in-progress | shipped-pending-migration
```

Priority guide: crit / high / med / low.

## Lifecycle
1. **File:** new entries under `## Open` with the full template.
2. **Implement:** flip status to `in-progress`, write code + tests.
3. **Verify:** set `shipped-pending-migration`, tick checkbox, add `**Implementation:**` line.
4. **Migrate:** move to `## Shipped`, append a one-liner to `CHANGELOG.md / Unreleased / Added` (or `Changed`).

IDs are UNIX-epoch timestamps (`FEAT-$(date +%s)`), never sequential — appended at
the end of their section, sorted by id on read.

> Larger product features (smoother scrolling, page/section transitions, per-project
> in-card mini-demos, code cleanup) are scoped in `docs/SRS.md` and will be filed here
> as `FEAT-NNN` entries via the `/groom` skill. The entries below are the quality/coverage
> gaps surfaced by the V&V bootstrap audit.

---

## Open

### [FEAT-1788629556] Uncrowded phone room with subtle discovery and softer ambience
- [x] **Priority:** high
- **Area:** frontend, accessibility, performance, tests
- **File(s):** app/components/room/Workspace.tsx, WindowCat.tsx, RoomAtmosphere.tsx, useRoomMotion.ts, room-mobile.css, room-motion.css, app/lib/room-audio.ts, public/room-studio.svg, public/bww-logo.svg, e2e/room-mobile.spec.ts, e2e/room-motion.spec.ts, playwright.config.ts
- **Why:** The phone screenshot exposed visual overlap despite passing earlier viewport checks. The room should feel alive while leaving its stories for a visitor to discover.
- **Approach:** Separate phone photos from the original scene proportions; replace plus badges and object labels with restrained hover/focus responses; use the official Buffalo Wild Wings mark; add bounded pointer/touch light motion and soften procedural audio.
- **Library / dependency notes:** No new packages. Existing Playwright adds WebKit mobile/motion coverage in CI. The logo is sourced from Buffalo Wild Wings' own website.
- **Acceptance criteria:** Exposed desk objects and readable close-ups on short/high-density phones; direct object and cat taps; no plus badges or footer construction copy; calm motion and audio; accessible controls; bounded resources; live domain validation.
- **Test plan:** Unit lifecycle regressions, true touch/DPR geometry and tap flows in Chromium/WebKit, native Chromium touch drag and audio signal checks, axe, screenshots, Lighthouse, repeated-interaction resource measurements, and exact-commit deployment checks.
- **Out of scope:** Resume content rewriting or publishing additional private data.
- **Bump:** minor (0.7.0)
- **Implementation:** Separated phone photos from the native scene, removed plus badges and object labels, made the cat itself open its detail, embedded the official BWW mark, added bounded light/pointer motion, and softened/faded the soundscape. Final production build and all 63 unit/54 browser tests pass; mobile axe checks are clean and local Lighthouse meets all budgets. Resource and emulated-device evidence is recorded in VERIFICATION.md. Publication uses the existing main/Vercel integration.
- **Status:** shipped-pending-migration

### [FEAT-1788611335] Room close-ups, poker details, and optional ambient sound
- [x] **Priority:** high
- **Area:** frontend, animation, accessibility
- **File(s):** app/components/room/*, app/lib/room-audio*, app/layout.tsx, app/room.css, public/room-studio.svg, public/peru-travel.webp, e2e/*
- **Why:** Give the room more personal detail and let visitors inspect its computer, objects, and photographs.
- **Approach:** Enlarge the existing computer; add native object dialogs with vector crops or original photos; replace coffee with poker chips/cards; animate a gentle breeze; synthesize quiet music and nature sounds on request.
- **Library / dependency notes:** Existing React, CSS, and browser Web Audio APIs; no new dependency or downloaded music.
- **Acceptance criteria:** Eleven accessible object close-ups; readable computer zoom; verified photo context; poker artwork; subtle optional sound with layer/volume controls; responsive touch layouts; bounded and cleaned-up audio resources; deployed browser validation.
- **Test plan:** Unit audio scheduling/lifecycle tests, native browser audio signal and suspension tests, desktop/mobile pointer and keyboard flows, production smoke, Lighthouse, repeated dialog cycles.
- **Out of scope:** Inventing personal anecdotes or changing the source resume.
- **Implementation:** Added a focused monitor, eleven native object dialogs, a verified Peru postcard, poker artwork, CSS breeze, and opt-in Web Audio with bounded voices and teardown. Mobile pointer/focus, native audio, accessibility, and production-build checks pass; see VERIFICATION.md.
- **Bump:** minor
- **Status:** shipped-pending-migration

### [FEAT-1788624000] Interactive cozy workspace portfolio
- [ ] **Priority:** high
- **Area:** frontend, animation, accessibility
- **File(s):** app/components/room/*, app/page.tsx, app/layout.tsx, app/globals.css, public/*, e2e/*
- **Why:** Replace the scrolling portfolio with a personal room and usable virtual computer.
- **Approach:** SVG scenery, CSS animation, accessible app windows, responsive reading view, verified professional content.
- **Library / dependency notes:** Use existing React and browser APIs; no new runtime dependency.
- **Acceptance criteria:** Power-on and skippable boot; profile/projects/resume/interests/contact apps; photo notes; sleeping/waking/grooming cat; hobby hints; mobile and keyboard support; reduced-motion control; production deployment verified.
- **Test plan:** Unit lifecycle tests, Playwright desktop/mobile/keyboard/reduced-motion flows, repeated window cycles and browser heap check, production smoke.
- **Out of scope:** Rewriting the original resume or adding unsupported professional claims.
- **Bump:** minor
- **Status:** shipped-pending-migration

### [FEAT-1781505473] Refine source-peek key-file heuristic
- [ ] **Priority:** low
- **Area:** github-api, frontend
- **File(s):** app/lib/github.ts
- **Why:** The source peek (FEAT-1781502132) sometimes selects a config/generated file (e.g. `next-env.d.ts`, `eslint.config.js`) when a repo has no clearly-named entrypoint at root/src — it works but isn't the most representative code. Surfaced by the 2026-06-15 V&V prod smoke.
- **Approach:** In `pickCandidate`, deprioritize obvious config/generated/dotfiles (`*.config.*`, `*-env.d.ts`, `*.lock`, dotfiles) and prefer a real source file matching the language; keep the entrypoint-name match first and the graceful-null fallback.
- **Library / dependency notes:** none.
- **Acceptance criteria:** for repos like `my-website`/`citybase`, the peek selects an app/source file rather than a config file where one exists; graceful null still returned when nothing suitable.
- **Test plan:** unit-test `pickCandidate` once the unit layer (FEAT-1781501122) exists; manual prod smoke against a few repos.
- **Out of scope:** recursing beyond root/src; ranking by code "interestingness".
- **Bump:** patch
- **Status:** open

### [FEAT-1788650818] Professional profile copy and curated work inside the room
- [x] **Priority:** high
- **Area:** frontend, content, seo
- **File(s):** app/components/room/Workspace.tsx, DesktopWindow.tsx, FeaturedProjects.tsx, app/lib/projectPresentation.ts, app/lib/constants.ts, app/components/JsonLd.tsx, app/page.tsx, app/room.css
- **Why:** Professional visitors need clear positioning and selected evidence while the owner retains the current interactive room.
- **Approach:** Use the owner's Senior Full-Stack Engineer / Virginia positioning, add three sourced project summaries ahead of the searchable repository shelf, label Billington by its product name, and expose X in Contact. Preserve room art, interactions, resume history, and print action.
- **Library / dependency notes:** No new dependencies; current lockfile only.
- **Acceptance criteria:** Featured evidence remains available if GitHub data fails; Billington is searchable by product and repository name; search and README flow still work; mobile layout is readable; no unverified metrics or completed Georgia Tech degree claims.
- **Test plan:** Existing unit suite plus fallback/search regressions, lint/build, desktop/mobile browser checks of project search, modal navigation, resume, and contact.
- **Out of scope:** Public profile writes, posting, deployment, historical job-title changes, Appshot and Billington code changes.
- **Bump:** minor
- **Status:** shipped-pending-migration
- **Implementation:** Local review draft preserves the interactive room, adds three sourced project summaries and product aliases, aligns Senior Full-Stack Engineer / Virginia copy, and exposes X in Contact. Verified with 85 unit tests, lint, production build, and desktop/phone browser QA. Public deployment and profile application remain pending owner review.

### [FEAT-1788652720] Replace poker desk detail with a playful roulette toy
- [x] **Priority:** med
- **Area:** frontend, accessibility, animation, tests
- **File(s):** app/components/room/RouletteToy.tsx, roulette.css, ObjectDetail.tsx, Workspace.tsx, DesktopWindow.tsx, room-details.css, room-mobile.css, app/lib/roulette.ts, public/room-studio.svg, related tests
- **Why:** Owner requested roulette in place of the poker detail, as a small secondary interaction in the existing room.
- **Approach:** Replace only the desk object and its close-up with a compact single-zero wheel. Each explicit spin uses unbiased browser crypto sampling across all 37 pockets and produces a number/color result; no wallet, payouts, payments, persistence, or autoplay. Keep the spin and a brief confetti burst in the small desk object, with a number/color chip that fades after 2.5 seconds. Remove the adjacent journal and reuse the room motion preference.
- **Library / dependency notes:** Existing React, CSS and SVG only; no dependencies added.
- **Acceptance criteria:** Roulette replaces visible poker copy/art and remains secondary to professional work; an accessible wheel control and text result; accurate wheel/result mapping; no overlapping spins or orphan timers; immediate reduced-motion result; fits desktop and phone; result expiration cannot clear a newer spin; journal removed.
- **Test plan:** Deterministic result/RNG tests, pending-spin locking/unmount/preference tests, existing unit suite, lint/build, computer-controlled desktop/mobile interaction and focus QA. Update existing E2E selectors for the renamed object.
- **Out of scope:** Real stakes, monetary balances, payouts, wagering services, publishing.
- **Bump:** minor
- **Status:** shipped-pending-migration
- **Implementation:** Replaced poker with a small keyboard-accessible in-room wheel, secure unbiased single-zero sampling, exact numbered landing, brief confetti, and a 2.5-second result followed by a 350ms fade. Removed the nearby journal. Spin/expiration timers clean up on new rounds and unmount; paused/reduced-motion results omit animation. Verified with deterministic RNG/lifecycle tests, browser desktop/mobile checks, lint, typecheck and build.

### [FEAT-1788653835] Simplify room close-ups and give the cat a varied idle rhythm
- [x] **Priority:** med
- **Area:** frontend, animation, accessibility
- **File(s):** app/components/room/ObjectDetail.tsx, WindowCat.tsx, room-details.css, app/room.css, related tests
- **Why:** Owner wants the artwork and interaction to speak, with concise labels instead of redundant descriptions and scene/mood metadata; the cat should feel subtly alive.
- **Approach:** Use visual-first object dialogs with only a title and useful actions; vary low-amplitude cat gestures with restful gaps and retain pause/reduced-motion support.
- **Library / dependency notes:** Existing React/CSS/SVG only.
- **Acceptance criteria:** Window and other object details omit editorial prose/metadata; useful links and accessible labels remain; varied cat breathing, attention, tail and ear motion stop when requested.
- **Test plan:** Unit/component checks, lint/build, browser keyboard and desktop/mobile visual QA.
- **Bump:** minor
- **Status:** shipped-pending-migration
- **Implementation:** Removed redundant descriptions and scene/mood metadata from object close-ups, retaining concise headings, art and useful actions. Added independent quiet breathing, head/eye, ear, tail and stretch layers to the cat, including attached tail markings and pause guards. Desktop and320px close-up QA and existing lifecycle tests pass.

### [FEAT-1788655296] Red Rising reading shelf and default quiet room ambience
- [x] **Priority:** med
- **Area:** frontend, audio, accessibility, content
- **File(s):** public/room-studio.svg, app/components/room/Workspace.tsx, ObjectDetail.tsx, DesktopWindow.tsx, RoomAudio.tsx, related audio code/tests/styles
- **Why:** Owner is currently reading the Red Rising trilogy and wants the room to feel more alive with quiet sound enabled by default.
- **Approach:** Replace generic shelf books with a restrained three-book illustration and Currently reading label. Prefer quiet procedural ambience on first visit, remember mute preference, respect browser autoplay limits with gesture fallback and truthful playback labels.
- **Library / dependency notes:** Reuse existing SVG, React and procedural Web Audio; no commercial recordings or new dependencies.
- **Acceptance criteria:** Red Rising, Golden Son and Morning Star are represented without completion claims; journal stays removed. Default audio is quiet, mute is visible/persistent, blocked autoplay causes no errors or false playing state, motion remains independent.
- **Test plan:** Audio preference/autoplay/cleanup tests, existing suite, lint/type/build, browser first gesture and mute checks; shelf desktop/mobile visual review.
- **Bump:** minor
- **Status:** shipped-pending-migration
- **Implementation:** Added Red Rising, Golden Son, and Morning Star cloth-spine artwork and a Currently reading close-up/interest entry. Quiet nature ambience defaults to 18% with music optional, persisted mute/settings, first-gesture autoplay fallback, truthful waiting/on/silent/off labels, and bounded cleanup. Validated in the 99-test suite, lint/type/build checks, and desktop/phone browser walkthroughs.

### [FEAT-1788655651] Direct room interactions and education frame
- [x] **Priority:** med
- **Area:** frontend, animation, accessibility, content
- **File(s):** app/components/room/Workspace.tsx, ObjectDetail.tsx, WindowCat.tsx, room-details.css, room-mobile.css, app/room.css, public/room-studio.svg, related tests
- **Why:** Owner wants window/lamp/cat actions in place, a diploma instead of the mountain print, and both journal and pencil removed.
- **Approach:** Window toggles day/evening; lamp independently toggles a soft desk light; cat responds through its existing wake gesture. Represent verified UMBC B.S. Computer Science with owner-provided May2024 date and no invented seal/honors.
- **Library / dependency notes:** Existing native React/CSS/SVG only.
- **Acceptance criteria:** No window/lamp/cat zoom-only modal; direct controls have clear accessible names/states; pause/reduced motion work; concise education artwork uses supported facts; journal and pencil absent.
- **Test plan:** Unit/control tests, lint/type/build, desktop/mobile keyboard and visual QA.
- **Bump:** minor
- **Status:** shipped-pending-migration

---

### [FEAT-1790801371] Addressable desktop apps and public resume PDF
- [x] **Priority:** high
- **Area:** frontend, seo, accessibility, content
- **File(s):** app/lib/apps.ts, app/[app]/page.tsx, app/page.tsx, app/components/room/WorkspacePage.tsx, Workspace.tsx, DesktopWindow.tsx, app/lib/constants.ts, app/layout.tsx, app/sitemap.ts, public/Victor_Ivanov_Resume.pdf, related tests
- **Why:** Visitors need shareable app URLs and an accurate downloadable resume without a phone number.
- **Approach:** One slug map and shared server component; direct initial app opening; push/replace/popstate navigation and legacy hash migration; progressive anchors; a phone-redacted conversion of the supplied DOCX; remove X from public profiles.
- **Library / dependency notes:** Use existing Next.js, React, Vitest, Playwright and installed LibreOffice/Poppler; add no dependencies.
- **Acceptance criteria:** Five static app URLs with metadata/sitemap entries; direct Resume/Contact access; browser Back closes a room-opened app; unknown route 404; PDF retains required text and original page count, with no phone number; no X link.
- **Test plan:** Unit history and content regressions, full Playwright suite, PDF text/page/render verification, lint and production build.
- **Out of scope:** Redesign, dependency upgrades, tsconfig.json, CHANGELOG.md, commits, pushes and deployment.
- **Bump:** minor
- **Status:** shipped-pending-migration
- **Implementation:** Added five static app paths with one slug/metadata map and a shared server page body; direct initial app state, history push/replace/popstate, titles, legacy hash migration, progressive navigation anchors and sitemap entries. Added a one-page, 87,376-byte phone-redacted resume PDF and print-hidden download link; removed X profiles/icons/explicit metadata. Lint, 116 unit tests, build and all 68 browser tests pass (Chromium 54, WebKit mobile 14); PDF text, page count and rendered layout verified.

### [FEAT-1790806476] Photoreal room renders and web asset export
- [x] **Priority:** high
- **Area:** rendering
- **File(s):** render/*, render/lib/*, .gitignore, public/room/*, app/lib/room-scene.json
- **Why:** Replace the illustrated room with photoreal Blender stills, roulette rotor frames and object close-ups.
- **Approach:** Deterministic metric scene built from a pinned CC0 manifest (Poly Haven) plus procedural props; four lighting variants (day/night x lamp on/off); website draws the roulette ball from exported projection geometry.
- **Library / dependency notes:** Blender 5.2.2 (Cycles CUDA + OIDN); repo's existing sharp for textures and AVIF/WebP. No new npm dependencies.
- **Acceptance criteria:** Four 2560x1440 1024-sample finals, 4x74 rotor crops, five details; AVIF/WebP at 1280/1920/2560; app/lib/room-scene.json with 14 hotspots, screen quad and roulette geometry. Window >=35% and floor plant >=50% visible, other hotspots fully in frame.
- **Implementation:** render/ pipeline (fetch, build, render, export; ~1,750 Python lines, ruff clean). 42 web images, 3.34 MB total (stills 253/449/660 KB per width set, sprites 1.74 MB, details 238 KB). All 14 hotspots pass check_hotspots; rebuild after final cleanup reproduces identical hotspot geometry. Ball overlay formula error <=1.8 px across all 37 pockets x 74 frames.
- **Status:** shipped-pending-migration

### [FEAT-1790821648] Photoreal room on the site (phase 2)
- [x] **Priority:** high
- **Area:** room, ui
- **File(s):** app/lib/room-scene.ts, app/lib/room-scene.test.ts, app/lib/roulette.ts, app/lib/roulette.test.ts, app/lib/apps.ts, app/components/room/useReducedMotion.ts, app/components/room/hotspots.ts, app/components/room/RoomScene.tsx, app/components/room/Computer.tsx, app/components/room/computer.css, app/components/room/RouletteToy.tsx, app/components/room/RouletteToy.test.tsx, app/components/room/ObjectDetail.tsx, app/components/room/Workspace.tsx, app/components/room/Workspace.test.tsx, app/components/room/DesktopWindow.tsx, app/components/room/ComputerFocus.tsx, app/components/room/RoomIcons.tsx, app/components/room/room-scene.css, app/components/room/room-details.css, app/room.css, e2e/room-roulette.spec.ts, e2e/room-details.spec.ts, e2e/room-mobile.spec.ts, e2e/room.spec.ts; delete app/components/room/WindowCat.tsx, WindowCat.test.tsx, RoomBreeze.tsx, RoomAtmosphere.tsx, useRoomMotion.ts, useRoomMotion.test.tsx, room-motion.css, room-breeze.css, room-mobile.css, roulette.css, public/room-studio.svg, e2e/room-motion.spec.ts
- **Why:** Put the exported photoreal room on the site with usable monitor, object hotspots, roulette animation, and close-ups.
- **Approach:** Implement the supplied phase 2 design exactly: typed scene geometry, stacked lighting stills, normalized hotspots, container-scaled computer, projected sprite roulette, native dialogs, and mobile horizontal pan. Depends on FEAT-1790806476 (render pipeline).
- **Library / dependency notes:** Existing React, Next.js, browser APIs, Vitest, and Playwright; no new dependency.
- **Acceptance criteria:** Four lighting variants switch after loading; eleven configured hotspots work; boot/history/focus behavior is preserved; roulette uses secure draws and projected animation; five encoded close-ups load; mobile starts with the screen centered; illustrated-room code is deleted; all checks and browser review pass.
- **Test plan:** Scene and roulette geometry units, roulette lifecycle contracts, Workspace boot/hotspot/history tests, updated desktop/mobile E2E, lint, full unit suite, build, full E2E, and production browser screenshots at 1440×900 and 390×844.
- **Out of scope:** Milestone 3 page theme/copy, render pipeline, tsconfig.json, CHANGELOG.md, commits, pushes, and deployment.
- **Bump:** minor (0.8.0)
- **Status:** shipped-pending-migration
- **Implementation:** Replaced the illustrated room with four encoded lighting stills, eleven sorted hotspots, a container-scaled computer, projected sprite roulette, and five encoded close-ups; removed the illustrated components, SVG, styles, and motion tests. Preserved app history, boot, native-dialog focus, audio, and print behavior. Recognized stills decoded before hydration and centered the audio panel within the mobile toolbar. Lint exits 0 (two requested img suppressions reported unused), 148 unit tests and 59 E2E tests pass, and production build succeeds. Chrome review on port 3100 at 1440×900 and 390×844 passed; mobile initial screen center error was 3.3px. Five screenshots are saved in C:/Users/Victor/AppData/Local/Temp/m2-shots/.

### [FEAT-1790963490] Rebuild the site as a 1990s HTML/CSS home page
- [x] **Priority:** high
- **Area:** site, ui, content
- **File(s):** app/ (route handlers, app/lib/html.ts, app/lib/pages.ts, github.ts), public/retro.css, next.config.js, package.json, vitest.config.ts, e2e/site.spec.ts, README.md, CLAUDE.md, VERIFICATION.md
- **Why:** Owner decision 2026-10-02: scrap the photoreal room, audio and React UI; the site should look like a 1990s personal home page built with only HTML and CSS.
- **Approach:** Every page is a Next.js route handler returning a hand-written HTML string plus one stylesheet; no `<script>` reaches the browser, enforced by `script-src 'none'`. Pages: home, about, projects (live GitHub table, hourly ISR), resume, off the clock, contact, and a 404 catch-all. Room components, audio, API routes, render pipeline, room assets and unused dependencies are deleted.
- **Library / dependency notes:** Removes Tailwind/PostCSS, tsparticles, lenis, motion, react-markdown, rehype-raw, remark-gfm, shiki, Testing Library, jsdom and the Vite React plugin. No new dependencies.
- **Acceptance criteria:** Every page returns 200 text/html with zero `<script>` elements and a CSP that forbids scripts. Existing URLs keep working and /interests redirects. The page reads as a 1990s home page: silver background, Times, default blue/purple links, `<hr>`, bevelled boxes, a marquee strip, a "NEW!" badge and 88x31 buttons, with motion disabled under reduced motion. No horizontal overflow at 320px. Lint, unit tests, build and E2E pass.
- **Test plan:** Unit tests for HTML escaping, the document shell and the projects table (escaping, filtering, sorting, empty state). E2E across every route on Chromium and mobile WebKit, covering no scripts, the CSP header, the redirect, the 404, overflow and reduced motion.
- **Out of scope:** CHANGELOG migration, release and version bump, GitHub repository descriptions.
- **Bump:** major
- **Implementation:** Every page is a route handler returning an HTML string from `app/lib/html.ts` (document shell, nav, footer) and `app/lib/pages.ts` (bodies; resume and about copy carried over), styled by `public/retro.css`: silver page, Times, default link colors, grooved rules, outset boxes, CSS marquee, blinking NEW!, under-construction stripes, 88x31 badges, mailto guestbook; motion off under reduced motion. Projects is a GitHub table (`fetchRepoList`, hourly ISR, error fallback). CSP `script-src 'none'`; /interests 308; HTML 404 catch-all. Deleted the room, audio, React UI, API routes, render/ pipeline, room assets and 14 dependencies. Lint clean, 28 unit tests, production build, 22/22 Chromium and mobile WebKit E2E; production curl shows no `<script>` on any page.
- **Status:** shipped-pending-migration

### [FEAT-1790966739] 1990s pixel-art favicon set
- [x] **Priority:** med
- **Area:** ui, seo
- **File(s):** scripts/render-assets.mjs, public/favicon.svg, public/favicon.ico, public/apple-touch-icon.png, app/lib/html.ts, e2e/site.spec.ts
- **Why:** The favicon is still the old green rounded "VI" tile; /favicon.ico and /apple-touch-icon.png fall through to the HTML 404.
- **Approach:** A 16x16 pixel-art "VI" on a silver bevelled tile (navy letters) generated from one grid by a Playwright script into SVG, a 16/32/48 ICO and a 180px Apple touch icon.
- **Library / dependency notes:** none (uses the existing Playwright dev dependency).
- **Acceptance criteria:** All three icons are served with image content types and linked from every page; the icon matches the site palette; lint, unit, build, E2E green.
- **Test plan:** E2E asserts status and content type for each icon and the head links.
- **Out of scope:** Web app manifest.
- **Bump:** minor
- **Implementation:** `scripts/render-assets.mjs` draws one 16x16 grid (silver Windows 95 bevel, navy "VI") to `favicon.svg` with `crispEdges`, then uses Playwright Chromium to rasterize a PNG-in-ICO (16/32/48) and a 180px Apple touch icon. `page()` links all three; E2E checks status, content type and head links.
- **Status:** shipped-pending-migration

### [FEAT-1790966740] SEO pass: share card, name-focused metadata, breadcrumbs
- [x] **Priority:** med
- **Area:** seo
- **File(s):** app/lib/constants.ts, app/lib/html.ts, app/sitemap.ts, scripts/render-assets.mjs, public/og-image.png, seo-audit.json, tests
- **Why:** Link previews use a small square portrait with a `summary` card. The title and description do not name Victor as a software engineer, which is the query the audit tracks. There are no breadcrumbs, and the sitemap has no lastmod.
- **Approach:** A 1200x630 share card in the site's 1990s style, served with `summary_large_image`, og:site_name/locale and image dimensions/alt. Name-first title and description. `rel="me"` profile links. Visible "You are here" breadcrumbs with BreadcrumbList microdata. Robots `max-image-preview:large`. Sitemap lastmod. An improvement-history entry in seo-audit.json.
- **Library / dependency notes:** none.
- **Acceptance criteria:** Every page has a unique title and description, a canonical URL, OG/Twitter tags pointing at the 1200x630 card, and (subpages) breadcrumbs; sitemap entries have lastmod; no `<script>`; lint, unit, build, E2E green.
- **Test plan:** Unit tests for head tags and breadcrumb microdata; E2E for the card image and breadcrumbs.
- **Out of scope:** Search Console submission and backlinks (owner actions in seo-backlink-strategy.md).
- **Bump:** minor
- **Implementation:** `npm run assets` also renders `public/og-image.png` (1200x630 retro card). `page()` adds author, `index,follow,max-image-preview:large`, og:site_name/locale, og:image type/size/alt, `summary_large_image`, theme-color, `profile` og:type on /about, "You are here" BreadcrumbList microdata on subpages, and rel=me GitHub/LinkedIn footer links (Contact and Resume links too). Home and Off the Clock descriptions name Victor; sitemap carries build-time lastmod; seo-audit.json history updated. 36 unit tests, 28/28 E2E.
- **Status:** shipped-pending-migration

### [FEAT-1790968447] Codelings game, part 1: engine, embed and title screen
- [x] **Priority:** high
- **Area:** projects, game
- **File(s):** app/lib/html.ts, app/lib/pages.ts, app/projects/route.ts, next.config.js, public/retro.css, game/**, package.json, vitest.config.ts, eslint.config.mjs, .gitignore, e2e/game.spec.ts, CLAUDE.md, README.md
- **Why:** The owner wants the Projects page to be a professional-grade 8-bit monster-collecting game, keeping the 1990s style. Part 1 lays the platform.
- **Approach:** Per `docs/game-design.md` §1-4, §8 (title, options, save), §10 (synth, sequencer, title theme, menu SFX): TypeScript compiled by `tsc` into `public/game/`, loaded only on /projects under a per-route `script-src 'self'` CSP; CSS handheld with on-screen buttons; fixed-step loop, input, font, text box, menus, title screen, options, versioned save. HTML table stays below.
- **Library / dependency notes:** none: compiled with the existing `typescript` dev dependency, no bundler or engine.
- **Acceptance criteria:** /projects shows the handheld and boots to an animated title screen with music after first input; other pages unchanged (`script-src 'none'`, 0 scripts); lint, unit, build, E2E green.
- **Test plan:** Vitest for rng, storage, text wrap, MML parser; Playwright `e2e/game.spec.ts` boot, CSP split, buttons, 320px overflow.
- **Out of scope:** Multiplayer, trading, evolution, online saves.
- **Bump:** minor
- **Implementation:** `game/src` TypeScript compiled by `tsc` to `public/game/` (`build:game`, run before `next build`); `/projects` loads `/game/main.js` under a route-specific `script-src 'self'` CSP, other routes keep `'none'` and 0 scripts. CSS VI-BOY handheld with 8 on-screen buttons above the table; fixed-step loop, keyboard/gamepad/touch input with focus capture, 8x8 and compact fonts, text box, menus, centred animated title with original 4-channel WebAudio theme, options, validated SaveV1 storage. 90 unit tests, 34/34 E2E.
- **Status:** shipped-pending-migration

### [FEAT-1790968448] Codelings game, part 2: overworld, maps and story
- [ ] **Priority:** high
- **Area:** projects, game
- **File(s):** game/src/world/**, game/src/gfx/tiles.ts, game/src/gfx/sprites.ts, game/src/data/text.ts, game/src/ui/**, game/src/engine/sequencer.ts tracks
- **Why:** Part 2 of the Projects page game: the world to explore.
- **Approach:** Per `docs/game-design.md` §6-8: tileset and character sprites, the 11 maps, grid movement, running, ledges, warps, connections, NPCs, signs, scripts, intro and name entry, START menu shell, trainer card, map music, day/night tint.
- **Library / dependency notes:** none: compiled with the existing `typescript` dev dependency, no bundler or engine.
- **Acceptance criteria:** A new game goes intro, bedroom, town, lab (starter choice stubbed until part 3) and every map is walkable with working warps, NPC dialogue and music; save/continue restores position.
- **Test plan:** Vitest for map validity, script interpreter; Playwright walks out of the house.
- **Out of scope:** Multiplayer, trading, evolution, online saves.
- **Bump:** minor
- **Status:** open

### [FEAT-1790968449] Codelings game, part 3: Codelings, battles, Codex and ending
- [ ] **Priority:** high
- **Area:** projects, game
- **File(s):** game/src/battle/**, game/src/data/**, game/src/gfx/creatures.ts, game/src/ui/{codex,party,summary,bag,pcBox,mart}.ts, app/lib/pages.ts
- **Why:** Part 3: the repositories become catchable Codelings and the Codex becomes the project browser.
- **Approach:** Per `docs/game-design.md` §5, §8-9: species from repos, procedural sprites, types, moves, formulas, battle state machine and scene, wild and trainer battles, catching, EXP, party, items, Center, Mart, PC box, Gym, ending, Codex with GitHub/demo links, diploma.
- **Library / dependency notes:** none: compiled with the existing `typescript` dev dependency, no bundler or engine.
- **Acceptance criteria:** Every listed repository is catchable and its Codex entry opens the repository; the Gym can be beaten and the ending plays; lint, unit, build, E2E green.
- **Test plan:** Vitest for formulas, species, battle machine, catch odds; Playwright reaches a wild battle.
- **Out of scope:** Multiplayer, trading, evolution, online saves.
- **Bump:** minor
- **Status:** open

### [FEAT-1790969283] Plain Off the Clock copy
- [x] **Priority:** low
- **Area:** content
- **File(s):** app/lib/pages.ts
- **Why:** Owner: the numbered labels ("01 / MOVE", "COLLECT", "RECHARGE") and taglines get in the way; just say it.
- **Approach:** One-word headings (Climbing, Cards, Wings, Travel, Side projects, Reading) with one plain sentence each; intro becomes "What I do when I'm not working."
- **Library / dependency notes:** none.
- **Acceptance criteria:** No numbered labels or taglines on /off-the-clock; Peru photo kept; unit tests green.
- **Test plan:** Existing page-body tests.
- **Out of scope:** Other pages.
- **Bump:** minor
- **Implementation:** Rewrote `offTheClockBody()` interests as heading/sentence pairs and the intro line.
- **Status:** shipped-pending-migration

## Shipped
- **Implementation:** Window toggles day/evening, lamp toggles its independent desk glow, and the cat responds directly with its wake gesture. Replaced the mountain print with a UMBC B.S. Computer Science May 2024 frame; removed both journal and pencil. Added control regressions and verified 320px/390px/desktop layouts and focus return.

### [FEAT-1781507205] Restore prominent interactive star/aurora background
- [x] **Priority:** med
- **Area:** ui, animation
- **File(s):** app/components/ui/ParticlesBackground.tsx, app/components/ui/AuroraBackground.tsx, app/lib/animationConfig.ts
- **Why:** The particle "stars" + aurora background rendered but was so faint (dots opacity 0.2, links 0.05, aurora 0.05–0.07) it read as missing — user reported it "gone". Diagnosis (headless probe) confirmed the engine + canvas were fine; the issue was visual prominence, not absence.
- **Approach:** Twinkling stars (animated opacity 0.2–0.6), visible constellation links (0.18), crisp hover-grab (links 0.5, `detectsOn: window`), 70 particles; bolder aurora opacities. Desktop (>=768px) + reduced-motion guards preserved.
- **Library / dependency notes:** none (existing tsParticles + CSS aurora).
- **Acceptance criteria:** the FULL animated + hover-interactive star-field renders in ALL conditions (desktop + mobile, regardless of reduce-motion); lighter count on mobile; grab-on-hover works; no console errors; build + E2E green.
- **Test plan:** live-site headless matrix (viewport × reduced-motion) + a hover-grab interactivity probe; existing Playwright suite (no regression).
- **Out of scope:** new background concepts (WebGL shaders, etc.); changing the z-index stack.
- **Implementation:** Restored the early interactive star-field per owner request. `ParticlesBackground` always renders client-side with the FULL animated + hover-grab config (twinkle opacity 0.2–0.6, drift, `detectsOn: window` grab, links 0.18 / grab 0.5, count 70, 35 on mobile). Removed the reduced-motion gate AND the earlier static fallback — the original (cc9a83e) had no reduced-motion gate; the gate added in 65c772b is what hid the stars for reduce-motion users (the likely cause of "it's gone"). Aurora opacities raised (0.07/0.06/0.05 → 0.12/0.10/0.09). **Deliberate owner decision:** the particle field intentionally ignores `prefers-reduced-motion` (the rest of the site still honors it via MotionConfig/CSS). Verified on live across the desktop/mobile × motion/reduce matrix + a hover-grab interactivity check.
- **Bump:** minor
- **Status:** shipped-pending-migration

### [FEAT-1781586642] Performance: lazy-load expanded card + defer particles; leak-harden card
- [x] **Priority:** high
- **Area:** frontend, animation
- **File(s):** app/components/work/TimelineCard.tsx, app/components/ui/ParticlesBackground.tsx, app/components/work/ProjectCardExpanded.tsx
- **Why:** Cut initial load (react-markdown + remark-gfm + rehype-raw shipped in the homepage bundle though only needed once a card is opened) and remove memory-leak risk in the interactive components.
- **Approach:** Lazy-load `ProjectCardExpanded` via `next/dynamic` (markdown chunk out of the initial bundle); defer the tsParticles engine init to `requestIdleCallback`; replace cancelled-flag fetch guards with `AbortController` so in-flight requests abort on unmount/tab-switch.
- **Library / dependency notes:** none (uses `next/dynamic` + platform `AbortController` / `requestIdleCallback`).
- **Acceptance criteria:** First Load JS for `/` drops materially; E2E green (lazy card still works); no setState-after-unmount; build + tsc clean.
- **Test plan:** build First Load JS before/after; Playwright suite.
- **Out of scope:** live interactive per-project embeds (infeasible for the ~23 non-web / non-deployed repos; a StackBlitz opt-in for the ~13 web repos would be a separate ticket).
- **Implementation:** Lazy-loaded `ProjectCardExpanded` → First Load JS `/` **251 kB → 155 kB** (route JS 148 → 52.4 kB); deferred particle init to idle with `cancelIdleCallback` cleanup; `AbortController` on README + source fetches. tsc clean, E2E 19/19.
- **Bump:** patch
- **Status:** shipped-pending-migration

### [FEAT-1781587502] Live "Run" tab: StackBlitz embed for web repos
- [x] **Priority:** med
- **Area:** frontend
- **File(s):** app/components/work/ProjectCardExpanded.tsx, e2e/card-tabs.spec.ts
- **Why:** Deliver a genuinely runnable per-project demo (the "fully functional mini demo" ask) for browser-runnable repos, beyond the metadata/code/activity card.
- **Approach:** Add a "Run" tab (shown only for JS/TS/Astro/Vue/Svelte/HTML repos) embedding `stackblitz.com/github/<owner>/<repo>` via an iframe with `ctl=1` (click-to-load — no WebContainer boots until the user clicks). The iframe is mounted only while the Run tab is active, so switching tabs / collapsing the card unmounts it and tears down the runtime (leak-safe). Non-runnable repos never get the tab.
- **Library / dependency notes:** none — plain iframe (no `@stackblitz/sdk` dep) for full React-controlled mount/unmount.
- **Acceptance criteria:** Run tab appears for web repos only; clicking it mounts the StackBlitz iframe; switching tabs unmounts it (no lingering iframe/WebContainer); no client-bundle growth; build/tsc/E2E green.
- **Test plan:** `e2e/card-tabs.spec.ts` asserts mount on Run + unmount on switch (leak-safe); manual prod check of a live boot.
- **Out of scope:** auto-booting the runtime; embeds for non-web repos; the `@stackblitz/sdk`.
- **Implementation:** Added "Run" tab to `ProjectCardExpanded` gated on `RUNNABLE_LANGS`; StackBlitz click-to-load iframe (`ctl=1&view=preview`), mounted only while active → leak-safe unmount on tab-switch/collapse. First Load JS unchanged (155 kB; embed lives in the iframe). tsc clean, E2E 20/20 (incl. the leak-safe mount/unmount test).
- **Bump:** minor
- **Status:** shipped-pending-migration

### [FEAT-1781502127] Centralize animation/UI constants
- [x] **Priority:** low
- **Area:** frontend
- **File(s):** app/lib/animationConfig.ts (new), app/components/HeroSection.tsx, app/components/ui/BackToTop.tsx, app/components/ui/FadeInOnScroll.tsx, app/components/work/TimelineCard.tsx, app/components/ui/ParticlesBackground.tsx
- **Why:** SRS FR-2. Animation magic numbers are scattered (scroll thresholds 600/400, reveal offset 40px, viewport margin -80px, stagger 0.05, particle distance/speed), making tuning error-prone and the transition work (FEAT-1781502130) harder.
- **Approach:** Create `app/lib/animationConfig.ts` exporting named constants; replace literals with imports. Pure refactor — values identical, no behavior change.
- **Library / dependency notes:** none.
- **Acceptance criteria:** literals replaced by named constants; values match prior behavior; `npm run build` + `npx tsc --noEmit` clean; E2E green.
- **Test plan:** existing Playwright suite (no visual change); `npx tsc --noEmit`.
- **Out of scope:** changing any animation values or behavior.
- **Implementation:** Added `app/lib/animationConfig.ts`; replaced hard-coded scroll thresholds, reveal offset/margin/duration, stagger step, and particle tunables across HeroSection, BackToTop, FadeInOnScroll, TimelineCard, ParticlesBackground with named imports. Values unchanged; tsc + build + E2E (16/16) green.
- **Bump:** patch
- **Status:** shipped-pending-migration

### [FEAT-1781502128] Consolidate icons, dedupe skills/month-util, remove unused GlassCard
- [x] **Priority:** low
- **Area:** frontend
- **File(s):** app/components/ui/icons.tsx (new), app/lib/constants.ts (new), app/lib/dateUtils.ts (new), app/components/ContactSection.tsx, app/components/work/TimelineCard.tsx, app/components/work/ProjectCardExpanded.tsx, app/components/AboutSection.tsx, app/components/JsonLd.tsx, app/lib/github.ts, app/components/ui/GlassCard.tsx (delete)
- **Why:** SRS FR-3. Inline SVGs duplicated across components; skills array duplicated in AboutSection and JsonLd; month-name helper buried in github.ts; `GlassCard` is dead code.
- **Approach:** Extract icons to a single `icons.tsx`; move skills to `constants.ts` imported by both consumers; extract month-name to `dateUtils.ts`; delete `GlassCard` after confirming no imports.
- **Library / dependency notes:** none.
- **Acceptance criteria:** one icon module; skills defined once; `GlassCard` gone with no broken imports; build/tsc/E2E green; no visual change.
- **Test plan:** `git grep` for removed symbols; Playwright; `npx tsc --noEmit`.
- **Out of scope:** restyling icons; changing skill content.
- **Implementation:** Added `app/components/ui/icons.tsx` (StarIcon, ExternalLinkIcon, SOCIAL_ICON_PATHS, SocialIconSvg) consumed by ContactSection/TimelineCard/ProjectCardExpanded; added `SKILLS` to `constants.ts` (AboutSection imports it; `JsonLd.knowsAbout` left as its curated SEO subset); added `app/lib/dateUtils.ts` (monthName + formatDate) used by github.ts and TimelineCard; deleted unused `GlassCard.tsx`. No visual change; tsc + build + E2E (16/16) green.
- **Bump:** patch
- **Status:** shipped-pending-migration

### [FEAT-1781502129] Momentum smooth scrolling (Lenis)
- [x] **Priority:** high
- **Area:** animation
- **File(s):** app/components/ui/SmoothScroll.tsx (new), app/layout.tsx, package.json
- **Why:** SRS FR-4. Native smooth-scroll feels basic; momentum/eased scrolling gives a premium feel.
- **Approach:** Wrap the app in Lenis (`lenis/react` `ReactLenis`). Disable when `prefers-reduced-motion: reduce` (fall back to native). Integrate with `motion` `useScroll` (Hero parallax, ScrollProgress) and preserve anchor nav + navbar IntersectionObserver scroll-spy. Use animationConfig constants (FEAT-1781502127) where applicable.
- **Library / dependency notes:** Evaluate `lenis` / `lenis/react` — confirm latest stable + `motion` compatibility before install; reject if it conflicts with `useScroll` or janks on mobile.
- **Acceptance criteria:** eased momentum on desktop; reduced-motion → native; anchors, scroll-spy, parallax, progress bar all still work; no Lighthouse perf regression; no mobile long-tasks.
- **Test plan:** manual scroll QA across viewports; Playwright (anchors still navigate); Lighthouse perf.
- **Out of scope:** scroll-jacking / section-snapping; horizontal scroll.
- **Implementation:** Added `lenis@1.3.23`; new `app/components/ui/SmoothScroll.tsx` wraps the app in `ReactLenis root` (lerp 0.1, smoothWheel, `anchors: true`), guarded so `prefers-reduced-motion` users get native scroll (Lenis never initialized). Removed CSS `scroll-behavior: smooth` and added Lenis's recommended CSS to `globals.css`; wired `<SmoothScroll>` into `layout.tsx`. E2E (`e2e/smooth-scroll.spec.ts`) proves Lenis activates (`html.lenis`) and anchor nav scrolls; centering suite still green; build green.
- **Bump:** minor
- **Status:** shipped-pending-migration

### [FEAT-1781502130] Section & element transitions
- [x] **Priority:** med
- **Area:** animation
- **File(s):** app/components/ClientPage.tsx, app/components/work/TimelineSection.tsx, app/components/AboutSection.tsx, app/components/HeroSection.tsx, app/globals.css
- **Why:** SRS FR-5. Beyond the current fade-ins, add fluid load/section/element transitions.
- **Approach:** Staggered initial page-load entrance; animate newly-revealed cards on "Show More" (not just mount); skill-badge stagger via `motion` variants container/item; optionally View Transitions API for card expand/collapse (CSS `@supports`-guarded progressive enhancement). All reduced-motion gated. Depends on FEAT-1781502129 (scroll) and FEAT-1781502127 (constants).
- **Library / dependency notes:** reuse `motion`; View Transitions need no dependency.
- **Acceptance criteria:** smooth, consistent transitions; reduced-motion respected; no CLS introduced; E2E green.
- **Test plan:** manual QA; Playwright centering still passes; check CLS in Lighthouse.
- **Out of scope:** full route-level page transitions (single-page site).
- **Implementation:** Staggered skill-badge entrance via motion `variants` container/item (AboutSection; `SKILL_STAGGER_STEP` in animationConfig; SkillBadge now accepts `variants`). Added `MotionConfig reducedMotion="user"` in SmoothScroll so motion-driven transform/parallax animations respect `prefers-reduced-motion` site-wide (NFR-1 — previously only CSS animations did). "Show More" card reveals and hero/section entrances already animate via the existing FadeInOnScroll/whileInView (verified unchanged). View Transitions API deferred per plan. Build + E2E (18/18) green.
- **Bump:** minor
- **Status:** shipped-pending-migration

### [FEAT-1781502131] Card facet: repo topics + recent commits
- [x] **Priority:** high
- **Area:** frontend, github-api
- **File(s):** app/lib/types.ts, app/lib/github.ts, app/components/work/ProjectCardExpanded.tsx, app/components/work/TimelineCard.tsx
- **Why:** SRS FR-6 (6a, 6b). Make each project card richer from GitHub data we can fetch (the chosen "mini-demo" direction).
- **Approach:** Add `topics: string[]` and a typed `recentCommits` to `RepoCardData`; populate in `fetchAllRepos` (topics from the repos response; commits via `/repos/{owner}/{repo}/commits?per_page=5`). Batch into the existing `Promise.all`, timeout-guarded, graceful-empty. Display topic chips + recent commits (message + relative date) in the expanded card; hide facets when empty.
- **Library / dependency notes:** none (GitHub REST).
- **Acceptance criteria:** topics + recent commits show where present; absent data hidden cleanly; `/api/repos` and `/` still render if these calls fail (graceful empty — upholds the BUG-1781501120 resilience invariant); no perf regression.
- **Test plan:** unit-test the new `github.ts` mapping if the unit layer (FEAT-1781501122) exists; manual card QA; E2E green.
- **Out of scope:** commit pagination; commit diffs.
- **Implementation:** Added `topics` + `recentCommits` (typed `CommitInfo`) to `RepoCardData`; `github.ts` maps `r.topics` (free from the repos response) and fetches `/commits?per_page=5` per repo (timeout-guarded, graceful, batched into the existing Promise.all). Rendered in the Activity tab as topic chips + a recent-commits list. (Topics are empty until repos are tagged on GitHub — graceful-hidden.) Build + E2E (19/19) green; prod smoke shows 35/36 repos with recent commits.
- **Bump:** minor
- **Status:** shipped-pending-migration

### [FEAT-1781502132] Card facet: syntax-highlighted source peek
- [x] **Priority:** high
- **Area:** frontend, github-api
- **File(s):** app/lib/types.ts, app/lib/github.ts, app/api/source/[owner]/[repo]/route.ts (new), app/components/work/ProjectCardExpanded.tsx, package.json
- **Why:** SRS FR-6 (6c). Show a highlighted peek at the project's key source file — the centerpiece of the richer card.
- **Approach:** Pick the key file by heuristic — language entrypoint (`main.py` / `index.ts` / `main.go` …) → root/src extension match → graceful null. Fetch its contents (timeout-guarded, size-capped). Highlight with `shiki` server-side in a lazy API route (no client highlighter cost).
- **Library / dependency notes:** Evaluated `shiki` vs `rehype-pretty-code` vs `highlight.js` — chose `shiki@4.2.0`, server-side only.
- **Acceptance criteria:** highlighted source peek for repos where a file resolves; hidden cleanly otherwise; client bundle within agreed budget; graceful on fetch failure.
- **Test plan:** unit-test the file-selection heuristic if the unit layer exists; manual QA across a Python, a JS/TS, and a Go repo; E2E green.
- **Out of scope:** full file browser; editing; multi-file view.
- **Implementation:** Added `shiki@4.2.0`; new `app/api/source/[owner]/[repo]/route.ts` picks a representative source file via `github.ts` `fetchKeyFile` (root/src entrypoint+extension heuristic, size- and line-capped, graceful null) and highlights it server-side (`github-dark`) — zero client bundle cost (First Load stayed flat). The Code tab lazy-loads it on open and renders the shiki-escaped HTML; degrades to "No source preview available." Build + E2E green; prod smoke renders highlighted source for 4/6 sampled repos (graceful null for the rest). Heuristic refinement filed as FEAT-1781505473.
- **Bump:** minor
- **Status:** shipped-pending-migration

### [FEAT-1781502133] Faceted/tabbed expanded card + skeleton loader
- [x] **Priority:** high
- **Area:** frontend
- **File(s):** app/components/work/ProjectCardExpanded.tsx, app/components/work/TimelineCard.tsx, app/globals.css
- **Why:** SRS FR-6 (6d). Organize the richer facets (README / Code / Activity) into a clean tabbed layout and replace the README spinner with a content-shaped skeleton.
- **Approach:** Restructure `ProjectCardExpanded` into tabs — README (existing render), Code (source peek, FEAT-1781502132), Activity (sparkline + recent commits + topics, FEAT-1781502131). Content-shaped skeleton during fetch; `aria-live` for async announcements. Depends on FEAT-1781502131 and FEAT-1781502132.
- **Library / dependency notes:** reuse `motion` for tab transitions.
- **Acceptance criteria:** tabbed card with README/Code/Activity; skeleton replaces the spinner; keyboard-accessible tabs; reduced-motion respected; E2E green.
- **Test plan:** manual QA + a11y keyboard check; extend Playwright to assert tab presence; `npx tsc --noEmit`.
- **Out of scope:** persisting the selected tab across cards; deep-linking to a tab.
- **Implementation:** Restructured `ProjectCardExpanded` into accessible README / Code / Activity tabs (role=tablist/tab/tabpanel, aria-selected, aria-live). Activity uses already-loaded data (language bar, 52-week sparkline, recent commits, topics) — instant; README + Code lazy-load per tab. Replaced the spinner with a content-shaped skeleton. `TimelineCard` now passes the full `repo`. New `e2e/card-tabs.spec.ts` verifies tabs render + switch (19/19 E2E green).
- **Bump:** minor
- **Status:** shipped-pending-migration

### [FEAT-1781501122] Add a unit/component test layer (Vitest + Testing Library)
- [x] **Priority:** med
- **Area:** tests, frontend
- **File(s):** package.json, vitest.config.ts (new), app/lib/github.test.ts (new), app/components/work/__tests__/* (new)
- **Why:** The project has only E2E (Playwright) coverage. Pure logic — `buildTimelineData`, `toLanguageSlices`, the `fetchAllRepos` fallback path, pagination, the `recentCommits`/`fetchKeyFile` additions, and the FEAT-1781502130 reduced-motion/stagger behaviour — has no fast unit coverage (the V&V 2a/2b gap), so data-layer and animation regressions are only caught by a full browser run, if at all.
- **Approach:** Add Vitest with `@testing-library/react` + `jsdom`. Unit-test `app/lib/github.ts` pure transforms with `fetch` mocked (success, non-OK, empty, token→public fallback, recentCommits, fetchKeyFile heuristic). Component-test `TimelineSection` empty-state vs populated. Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts.
- **Library / dependency notes:** **Vitest** (native ESM/TS, fast, Vite-aligned — recommended over Jest for a Next 15 + TS 5.9 project). `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`. Confirm latest stable versions before installing.
- **Acceptance criteria:**
  - `npm test` runs Vitest and passes.
  - `github.ts` transforms + fallback covered (success / non-OK / empty / fallback).
  - `TimelineSection` empty vs populated rendering covered.
- **Test plan:** the tests themselves; count recorded in `VERIFICATION.md § 2`.
- **Out of scope:** rewriting the Playwright E2E layer; visual-regression snapshots.
- **Bump:** minor
- **Implementation:** Added Vitest 4 + `@testing-library/react` + `jsdom` + `vite-tsconfig-paths`. `vitest.config.ts` (jsdom env, `setupFiles`, scoped `include: app/**/*.test.{ts,tsx}` so Playwright keeps `e2e/`); `vitest.setup.ts` adds jest-dom matchers + IntersectionObserver/matchMedia stubs jsdom lacks. Tests: `app/lib/github.test.ts` (shikiLang, buildTimelineData, fetchAllRepos public / empty→public-fallback / non-ok — 6) and `app/components/work/TimelineSection.test.tsx` (empty + populated — 2). `npm test` → 8/8 green. Added `test` + `test:watch` scripts.
- **Status:** shipped-pending-migration

### [FEAT-1781501123] Add ESLint (next/core-web-vitals) config
- [x] **Priority:** low
- **Area:** ci, frontend
- **File(s):** eslint.config.mjs (new), package.json
- **Why:** No linter is configured, so `next build` performs no lint pass and Stage 1 (static review) has nothing to run. A linter catches accessibility regressions, unused code, and React-hook misuse before they ship.
- **Approach:** Add `eslint` + `eslint-config-next` with the flat-config (`eslint.config.mjs`) using `next/core-web-vitals`. Add `"lint": "next lint"` (or `eslint .`). Fix any findings the first run surfaces (file as separate BUGs if non-trivial).
- **Library / dependency notes:** `eslint`, `eslint-config-next` (matched to Next 15). Confirm latest stable.
- **Acceptance criteria:**
  - `npm run lint` runs clean (or remaining findings are filed as BUGs).
  - Stage 1 of `VERIFICATION.md` references the lint command.
- **Test plan:** n/a (lint is the check); wire into CI via FEAT-1781501124.
- **Out of scope:** Prettier/formatting enforcement.
- **Bump:** minor
- **Implementation:** Added ESLint 9 flat config `eslint.config.mjs` via `@eslint/eslintrc` FlatCompat extending `next/core-web-vitals` + `next/typescript`, ignoring `.next`/`node_modules`/`playwright-report`/`test-results`/`out`/`next-env.d.ts`. `lint` script = `eslint .`. `npm run lint` runs clean. Pinned `eslint` `^9` + `eslint-config-next` `^15.5` to match Next 15.5 (avoids the 16.x/eslint-10 mismatch).
- **Status:** shipped-pending-migration

### [FEAT-1781501124] CI runs tests + lint, not just build
- [x] **Priority:** med
- **Area:** ci
- **File(s):** .github/workflows/ci.yml
- **Why:** CI only runs `next build` on push/PR to main. It never runs the Playwright E2E suite or any lint/unit tests, so a red test suite (e.g. the current orphaned-statement failures, BUG-1781501121) can ship undetected.
- **Approach:** Extend `ci.yml`: after build, run `npm run lint` (FEAT-1781501123) and `npm test` (FEAT-1781501122), and a Playwright job (`npx playwright install --with-deps chromium` then `npm run test:e2e`). Upload the Playwright HTML report as an artifact.
- **Library / dependency notes:** none new (GitHub Actions + existing tooling).
- **Acceptance criteria:**
  - CI fails when a unit, lint, or E2E check fails.
  - Playwright report uploaded as an artifact on failure.
- **Test plan:** verify by pushing a branch with a deliberately failing test and confirming CI goes red.
- **Out of scope:** deploy steps (Vercel handles deploy via its Git integration).
- **Bump:** minor
- **Implementation:** Rewrote `.github/workflows/ci.yml` into one `verify` job (Node 22, `permissions: contents: read`): `npm ci` → Lint (`npm run lint`) → Unit tests (`npm test`) → Build → install Playwright chromium → E2E (`npm run test:e2e`) → upload `playwright-report` artifact (`if: ${{ !cancelled() }}`, covers the "on failure" criterion). Build + E2E steps pass `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` so the data-driven build authenticates the GitHub API (the unauthenticated 60/hr limit otherwise empties the timeline and breaks the card E2E). Each check is its own step, so a red lint/unit/E2E fails the job. Live CI-red confirmation deferred to the first pushed run (GitHub Actions can't execute locally); each command verified to exit non-zero on failure locally.
- **Status:** shipped-pending-migration
