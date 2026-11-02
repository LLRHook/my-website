# Dependency security follow-up — October 22, 2026

Scope: BUG-1791951243. Preserve the HTML/CSS site, existing regression tests,
lint rules, browser configuration, and Node 24 runtime. This follows the
[September dependency maintenance record](dependency-update.md).

## Baseline and compatible remediation

The npm registry audit at implementation commit `71421b5` reports 11 affected
packages: one critical, eight high, and two moderate. These are package findings,
including propagated findings along dependency chains, rather than 11 distinct
vulnerabilities.

| Package | Before | Selected stable version | Reason |
| --- | --- | --- | --- |
| next | 16.3.8 | 16.4.2 | Same-major security update; upstream fixes the October Next.js RCE and Server Actions DoS advisories starting at 16.4.1. |
| eslint-config-next | 16.3.8 | 16.4.2 | Match the framework and retain its supported flat configuration. |
| vitest / @vitest/mocker | 5.0.0 | 5.0.5 | Same-major patches; mock-registration and redirect traversal fixes start at 5.0.3. |
| vite | 8.2.2 | 8.3.5 | Supported 8.x release within Vitest's `^8.0.0` peer range, addressing the audited development-server/editor issues. |
| sharp | 0.35.4 | 0.35.5 | Compatible patch containing the librsvg security fix. |
| source-map-js | 1.2.1 | 1.2.2 | Compatible patch for indexed source-map section-offset DoS. |

The manifest raises the Next.js, matching ESLint configuration, and Vitest
minimums to the selected stable versions. Vite, sharp, and source-map-js remain
transitive dependencies resolved by npm within upstream ranges and recorded in
the lockfile; `npm ci` reproduces those resolutions. No override, fork, forced
resolution, or direct major-version migration is needed.

ESLint stays at 9.39.5: the current `eslint-plugin-react@7.37.5` peer range ends
at ESLint 9 (`^9.7`). TypeScript stays at 6.0.3: the current TypeScript ESLint
parser supports `>=4.8.4 <6.1.0`, excluding the latest TypeScript 7. Node 24.22.1
satisfies the framework, Vitest, Vite, and parser runtime ranges. The published
ESLint 9 support/deprecation warning remains a documented compatibility hold.

## Remaining upstream constraint

The official latest `braces` release is still 3.0.3 and is affected by
GHSA-vfj7-8cjw-p6xm (deeply nested pattern stack exhaustion). The latest matching
`eslint-config-next@16.4.2` still depends on `@next/eslint-plugin-next@16.4.2`,
which depends on `fast-glob@3.3.1`, then `micromatch`, then `braces`.
An official safe release for this chain was not available at the time checked.

This is development lint tooling, driven here by repository configuration and
paths. No application source imports the glob packages. This limits runtime
exposure, but does not establish that the tooling is unreachable under all
inputs. Keep BUG-1791951243 open. npm's proposed `eslint-config-next@14.2.35`
downgrade is unsuitable for Next 16, and an unofficial patched fork would require
an override. Neither is applied. Audit findings remain visible.

## Upstream evidence

Package functionality, current stable tags, dependency ranges, and runtime/peer
requirements were checked against official npm registry metadata before mutation.
The audit JSON and registry metadata are in the ignored `.vv/local-gate/` evidence
directory. Primary-source documentation reviewed:

- [Next.js October security update](https://nextjs.org/blog/nextjs-security-update-october-14-2026)
- [Next.js 16.4.2 release](https://github.com/vercel/next.js/releases/tag/v16.4.2)
- [Next.js 16 upgrade guidance](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js ESLint configuration](https://nextjs.org/docs/app/api-reference/config/eslint)
- [Vitest 5.0.5 release](https://github.com/vitest-dev/vitest/releases/tag/v5.0.5)
- [Vitest migration/API guidance](https://vitest.dev/guide/migration/)
- [Vite support policy](https://vite.dev/releases)
- [Vite 8.3.5 release](https://github.com/vitejs/vite/releases/tag/v8.3.5)
- [Vite native tsconfig path configuration](https://vite.dev/config/shared-options#resolve-tsconfigpaths)
- [sharp 0.35.5 release](https://sharp.pixelplumbing.com/changelog/v0.35.5/)
- [source-map-js API](https://github.com/7rulnik/source-map-js)
- [source-map-js 1.2.2 release](https://github.com/7rulnik/source-map-js/releases/tag/v1.2.2)
- [braces upstream unresolved release issue](https://github.com/micromatch/braces/issues/73)
- [TypeScript ESLint compatibility](https://typescript-eslint.io/users/dependency-versions/)
- [React ESLint plugin peer requirements](https://github.com/jsx-eslint/eslint-plugin-react/blob/master/package.json)

## Validation

Run on Node 24.22.1 and npm 11.19.1, after a clean install of the final lockfile.
The build and browser server received an empty `GITHUB_TOKEN`; no authenticated
account or deployment was exercised.

| Check | Result |
| --- | --- |
| `npm ci` | Passed; 374 packages installed from the final lockfile. |
| `npm ls --all --json` | Passed; no invalid dependency or peer graph. |
| `npm audit --json` | 5 high development-tool findings, 0 critical/moderate; exit 1 remains visible. |
| `npm audit --omit=dev --json` | 0 vulnerabilities; exit 0. |
| `npm run lint` | Passed, zero warnings. |
| `npx tsc --noEmit` | Passed, zero errors. |
| `npm test` | 71 passed across 4 files; zero failed/skipped. |
| `SITE_ORIGIN=http://localhost:3000 npm run build` | Passed on Next.js 16.4.2, including type checking and all 11 generated pages. |
| `CI=1 npm run test:e2e` | 43 passed in 18.3 seconds; zero failed, flaky, or skipped. Existing Chromium/WebKit configuration and all performance budgets retained. |
| `git diff --check` | Passed. |

Pinned Playwright 1.63.0 used Chromium/headless-shell build 1243 and WebKit
2359 installed by the parent. No additional browser installer was started.
The original implementation's two new keyboard-table cases ran in this complete
suite, alongside the 41 previously declared browser cases.

Nonblocking diagnostics remain visible: Vite warns that the existing CommonJS
package with ESM TypeScript configuration will need attention before a future
native-config-loader default; npm reports the ESLint 9 deprecation and its
existing unapproved dependency lifecycle scripts. No warning suppression, lifecycle
approval change, lint relaxation, or hook bypass was applied.

Detailed logs, the detected test matrix, lockfile hashes, semantic dependency
diff, audit JSON, and registry metadata are in `.vv/local-gate/security-*`.
These generated files are ignored. This is the full declared local automated
gate, not a new end-to-end V&V/deployment sign-off; the historical verification
baseline and tracker migration state remain unchanged.
