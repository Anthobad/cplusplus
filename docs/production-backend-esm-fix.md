# Production backend ESM initialization fix

Deployment inspected: `dpl_GXj832G6qRZofRK3Tm3gDQyLpCUy`, production URL `https://cplusplus-6ocslpc11-anthobads-projects.vercel.app`, alias `https://cplusplus.vercel.app`. Vercel build logs identify source commit `67065f6`; that commit's lockfile confirms the versions below. Unauthenticated checks of health, progress and evaluation all returned HTTP 500, and a filtered read of recent runtime logs confirmed `ERR_REQUIRE_ESM`. No deployment or configuration change was made.

## Root cause and reproduction

The exact production chain is `firebase-admin 14.5.0 → jwks-rsa 4.1.0 → jose 6.2.3`. Importing `firebase-admin/auth` loads `lib/auth/base-auth.js`, `lib/auth/token-verifier.js`, `lib/utils/jwt.js`, then `jwks-rsa/src/utils.js`. That file executes `require('jose')` at module initialization. JOSE 6 is ESM-only. An application-level try/catch around `verifyIdToken` cannot catch an import-time crash before Express initializes.

These versions work in an ordinary supported Node runtime with synchronous `require(ESM)` available. JWKS-RSA 4 explicitly relies on that capability, as documented in its [upstream changelog](https://github.com/auth0/node-jwks-rsa/blob/master/CHANGELOG.md). The [upstream compatibility report](https://github.com/auth0/node-jwks-rsa/issues/507) reproduces the failure when it is disabled. The production exception confirms the loader cannot perform this operation; the actual production `NODE_OPTIONS` and patch-level Node version were not exposed by the retrieved metadata. The project/source specifies Node `24.x`. Local reproduction used native **Node 24.21.0**, with the runtime feature explicitly disabled to reproduce the observed loading condition.

Before the fix, running the existing built `dist/server.cjs` with `VERCEL=1 node --no-experimental-require-module dist/server.cjs` reproduced the exact reported `jwks-rsa/src/utils.js → jose/dist/webapi/index.js` error and exit status 1. Ordinary Node 24 and source-level tsx/Vitest initialization did not reveal it. The old build externalized all packages, and Vercel's API entrypoint imported the source graph instead of the separately built server. Thus a passing bundled-server test did not necessarily cover the deployed entrypoint.

The Sandbox SDK also needs this compatibility treatment: `@vercel/sandbox 3.8.0` has a CJS entry that requires both `jose 6.2.3` and ESM-only `@workflow/serde 4.1.0-beta.2`. Fixing Firebase alone would expose the next startup error.

## Changes

`scripts/build-server.mjs` bundles Firebase Admin, JWKS-RSA, JOSE, Sandbox and Workflow Serde into one CommonJS server, using the existing esbuild 0.25.12 and Node 24 target. It transforms the module boundary without patching SDK source or downgrading cryptographic libraries. Other packages remain external. External paths are resolved from each original importer so nested versions are preserved, including Admin's google-auth-library 11.3.0 and JWKS-RSA's lru-cache 11.5.3. Metafile checks fail the build if required SDK inputs were omitted or the named package imports remain external. A footer exports the Express function directly for Vercel's ESM wrapper.

`api/index.ts` now imports this exact `server-build/server.cjs` artifact. `package.json` builds it and starts it; `server/bundle.d.ts` supplies the generated artifact's TypeScript declaration. `.gitignore` excludes the generated directory. The server artifact and its source map now live outside `dist`, which is Vercel's public frontend directory. `scripts/check-frontend-bundle.mjs` rejects accidentally published server artifacts.

The authentication implementation is unchanged: `verifyIdToken(token, true)` still checks signatures, issuer, audience, expiry, revocation and disabled users; project/database pinning and production emulator prohibitions remain. Firestore transactional quotas, sandbox isolation/network policy, compiler snapshots, grading and progression code are unchanged.

| Dependency | Before | After |
| --- | --- | --- |
| firebase-admin | 14.5.0 | 14.5.0 |
| jwks-rsa | 4.1.0 | 4.1.0 |
| jose | 6.2.3 | 6.2.3 |
| @vercel/sandbox | 3.8.0 | 3.8.0 |
| @workflow/serde | 4.1.0-beta.2 | 4.1.0-beta.2 |
| body-parser | 1.20.8 | 1.20.9 |
| undici | 7.30.0 | 7.30.1 |
| Zod used by @vercel/cli-config | 4.1.11 | 4.6.7 |
| nock (new, development-only) | — | 15.0.5 |

The last three production changes address audit findings through compatible updates; the scoped Zod 4 override removes a vulnerable version pinned by CLI-config. Firebase, JOSE and Sandbox remain on their current supported versions. The lockfile records the exact resolution. Nock provides offline HTTP fixtures in tests and is not imported into the server.

## Verification

`tests/backendStartup.test.ts` builds the actual server and launches a fresh native Node subprocess with `--no-experimental-require-module`. `tests/verifyBuiltBackend.mjs` verifies the exported handler, health 200 and JSON 401 responses from progress/evaluation for missing or forged credentials. It generates ephemeral RSA fixture keys and uses the **real bundled Firebase Admin implementation**, mocking only Google's certificate, OAuth and account-lookup HTTP responses. Incorrect signatures, audience, issuer and expiry are rejected. Correctly signed fixtures reach authenticated account lookup and are rejected for disabled users or revocation. No real service-account JSON, user token, production account or database is used.

The same native script also passed against the freshly packaged Vercel `api/index.js` entrypoint produced by `@vercel/node` 24.0.0, verifying tracing, nested dependencies and CJS/ESM interop. A full local `vercel build --prod --yes` (CLI 64.0.2) subsequently passed a clean `npm ci`, the production build and function packaging. Both the ordinary API smoke test and the stronger Firebase fixture test passed against that build's `.vercel/output/functions/api/index.func/api/index.js`, with synchronous `require(ESM)` disabled. Its function metadata specifies `nodejs24.x` and the existing 240-second limit. Public static output contains no backend CJS artifact. These are local Vercel-package tests, not a redeployment or production success claim.

Commands for the final source:

```sh
npm test
npm run lint
npm run build
npm run test:backend
# After a fresh local Vercel build, without deploying:
npm run test:api-package
# Optional stronger fixture checks against the freshly packaged entrypoint:
node --no-experimental-require-module tests/verifyBuiltBackend.mjs .vercel/output/functions/api/index.func/api/index.js
```

Final local results: **242 tests pass across 21 files**, including authentication, shared quota/concurrency/lease behavior, negative progress/exam tests, real C++20 compiler/grading tests and snapshot/isolation/cleanup contracts. TypeScript, production build, frontend bundle budget and native packaged startup checks pass. The existing Vite chunk-size warning remains. `npm audit` reports **zero known advisories** for the resolved tree.

Live Firebase permissions, real distributed Firestore operations, snapshot availability and a complete authenticated Vercel Sandbox submission have not been revalidated against production in this pass; quota/sandbox coverage is through the existing local test fixtures. The Firestore emulator suite was not rerun. Production cannot demonstrate this fix until the corrected source is approved and deployed. No authentication bypass, database change, rule deployment, billing change, paid service, TTL activation or deployment occurred.

Exact changed files: `.gitignore`, `README.md`, `api/index.ts`, `package.json`, `package-lock.json`, `scripts/build-server.mjs`, `scripts/check-frontend-bundle.mjs`, `server/bundle.d.ts`, `tests/backendStartup.test.ts`, `tests/verifyBuiltBackend.mjs`, and this report.
