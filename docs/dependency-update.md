# Dependency maintenance — September 5, 2026

Base: `814acf8`, synced by fast-forward from `origin/main`; the local checkout
previously lacked three commits containing the current room portfolio.

Scope: resolve BUG-1781504214, update compatible application/test dependencies
and CI actions, preserve the existing room and API behavior.

Plan:
1. Verify published package versions, peer requirements, and migration docs.
2. Update npm manifests and lockfile; adapt Next.js image and lint configuration.
3. Run a clean install, lint, type checking, 63 unit tests, production build,
   all 54 browser tests, route/header smoke, and the dependency audit.
4. Review the complete diff and record version compatibility exceptions and results.

The baseline lint and all 63 unit tests passed. `npm audit` reported seven
high-severity package findings. The work is isolated on a maintenance branch;
rollback is a revert of the maintenance change. Deployment uses the existing
Vercel integration after review; this report does not establish live deployment.

## Changes

- Upgrade Next.js 15.5.12 to 16.3.4 and React/React DOM 19.2.4 to 19.2.8.
- Refresh Tailwind/PostCSS, Motion, tsParticles, Shiki, Lenis, Playwright,
  Testing Library, Vitest, jsdom, and their compatible transitive packages.
- Use native Next flat ESLint configuration and native Vite path resolution;
  remove the superseded compatibility helpers.
- Migrate the legacy particle component to the v4 provider API. Derive legacy
  project-tab loading from unresolved data; cover cached responses, abort/retry,
  unmount cancellation, and error fallbacks with three regression tests.
- Keep photo quality 90 explicitly allowed under Next 16 and use eager loading
  for the room artwork. Retain Next's generated TypeScript configuration updates.
- Standardize on Node 24 LTS with a 24.15 minimum. CI reads `.nvmrc`, and Node
  typings match this runtime. Update checkout, setup-node and upload-artifact
  to their published v7 releases.
- Address BUG-1788662454, discovered by the updated WebKit suite: synthetic mouse
  events following a phone tap and scroll must preserve the touch-motion reset.

## Compatibility decisions

ESLint remains on 9.39.5, the newest compatible 9.x release. Although this major
now emits an upstream support/deprecation warning, Next's current React lint
plugin excludes ESLint 10. Do not force the peer dependency graph or remove rules
just to obtain a newer version. TypeScript is updated to 6.0.3 because the current
TypeScript ESLint parser requires `<6.1.0`, excluding TypeScript 7.

`@types/node` stays on the newest verified 24.x line to match Node 24 rather than
adopting Node 26 APIs that the deployment runtime does not provide.

Sources checked on September 5:

- [Next 16 migration](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next ESLint configuration](https://nextjs.org/docs/app/api-reference/config/eslint)
- [React lint plugin peer dependencies](https://registry.npmjs.org/eslint-plugin-react/latest)
- [TypeScript parser peer dependencies](https://registry.npmjs.org/@typescript-eslint/parser/latest)
- [Motion upgrade guide](https://motion.dev/docs/react-upgrade-guide)
- [Vite native tsconfig paths](https://vite.dev/config/shared-options#resolve-tsconfigpaths)
- [Vitest 5 migration](https://vitest.dev/guide/migration/)
- [jsdom releases](https://github.com/jsdom/jsdom/releases)
- [tsParticles React component](https://github.com/tsparticles/react)
- [Node release support](https://nodejs.org/en/about/previous-releases)
- [Checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1)
- [Setup Node v7.0.0](https://github.com/actions/setup-node/releases/tag/v7.0.0)
- [Upload Artifact v7.0.1](https://github.com/actions/upload-artifact/releases/tag/v7.0.1)

## Validation results

Run locally against the final maintenance source, with Node 24.19.0 and npm
11.12.1. Build and production-server GitHub access used the existing authenticated
account in process memory; credentials were not written to source files.

| Check | Result |
| --- | --- |
| Clean `npm ci` | Passed |
| `npm audit` | 0 vulnerabilities, down from 7 high-severity package findings |
| `npm run lint` | Passed |
| Type checking and `npm run build` | Passed; Next 16 Turbopack production artifact |
| `npm test` | 68 passed across 9 files |
| `npm run test:e2e` | 54 passed: 44 Chromium + 10 WebKit, no retries |
| Public route smoke | 15 routes checked; expected 200 responses and unknown-route 404 |
| GitHub data | Nonempty repo groups, real README text, source HTML returned |
| Image migration | Optimized Peru photo at quality 90 returns 200 |
| Security headers | Expected headers present, no X-Powered-By header |
| Diff review | Whitespace check and changed-file credential-pattern scan passed |

The browser run covers project search/README/error handling, room startup and
navigation, responsive layouts and real touch taps, focus restoration, motion,
audio behavior and resume printing. The first run exposed the WebKit touch-reset
bug; it reproduced independently, gained failing unit regressions, and the full
browser suite passed after the source fix. An independent reviewer also checked
the dependency/configuration migrations and ran lint and unit validation.

Nonblocking unit-run diagnostics include Vite's ESM-config filename warning and
jsdom's unimplemented scrollTo notice. This maintenance run did not repeat the
full Lighthouse, long-run memory, or physical-device release protocol. The source
API's pre-existing config-file selection behavior remains tracked separately as
FEAT-1781505473.

Before maintenance, the latest successful production deployment matched base
commit `814acf811a840f59ef82fca69f51203bf11f533e`. These updates are prepared on a
separate branch for review; production publication is a separate step.
