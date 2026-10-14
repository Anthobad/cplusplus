# C++ submission latency optimization

Implemented locally on 14 October 2026. The optimized code has NOT been deployed or verified on the production URL. Deployment and production cold/warm frontend measurements require the user's approval under `specs/reduce-compilation-time.md`.

## Changes

The old runner installed GCC for every submission and used separate supervisor and result-fetch calls for compilation and every test. The optimized runner restores a trusted compiler snapshot into a new unnamed, nonpersistent sandbox, with `deny-all` already applied at creation. A single root-owned supervisor invocation compiles once and runs each test in its own process and unprivileged UID. Student children see only their own stdin; future inputs remain in the root supervisor's memory. Expected answers remain on the backend.

Snapshot-backed submissions skip apt, infrastructure uploads, the network-update call and per-test SDK commands/result fetches. The supervisor returns one protected batch result on its stdout. Student stdout is captured separately and cannot impersonate this result: different UIDs, cleared supplementary groups and `no_new_privs` prevent access to the privileged parent's memory/file descriptors. Root owns the helper, manifest and compiled binary. Existing CPU, address-space, process-count, file and output limits remain enforced; aggregate batch input/output are each limited to 256 KiB to bound transfer and response sizes.

Scoring and verified assessment remain in the existing trusted backend. Curriculum, frontend behavior, Firebase persistence and Google provider selection were not changed. Operational `cpp_runner_timing` logs contain only phase durations, snapshot-hit/recovery status and SDK method counts, never code, inputs, answers, credentials or user identifiers.

## Trusted compiler snapshot

`scripts/provisionCompilerSnapshot.ts` confirms the existing `anthobads-projects/cplusplus` project and Hobby plan through the authenticated CLI, checks storage headroom, then provisions a separate ephemeral builder. It installs signed Ubuntu compiler dependencies, including GCC 15 and `libjansson4`, removes apt caches, denies networking, installs the supervisor and a content-version manifest, and creates a snapshot. The builder never receives student code, tests, repository contents or credentials. Snapshot creation stops it; cleanup is awaited on failure too.

The created snapshot is `snap_PiJE6TrpH8ETXKyny2P9kVpCHuPj`, size 191,410,229 bytes (about 191 MB), with seven-day expiration after last use. `server/sandbox/compilerSnapshot.ts` records its non-secret ID, creation time and SHA-256 version of provisioning plus supervisor infrastructure. The generated pointer is server-only and included in the Vercel function bundle.

Snapshots and fresh restores are [officially supported](https://vercel.com/docs/sandbox/concepts/snapshots). [Hobby pricing and quotas](https://vercel.com/docs/sandbox/pricing) include 15 GB lifetime snapshot storage, 5 CPU hours/month, 420 GB-hours/month memory, 5,000 creations/month and 10 concurrent sandboxes. Hobby usage over quota pauses creation rather than incurring additional charges. The account's CLI plan was actually confirmed as `hobby`; no billing or plan settings were changed.

The environment is refreshed after seven days even if its storage expiration has been extended by use, limiting stale compiler/security patches. A version/age mismatch, or a specifically missing/expired snapshot, safely provisions dependencies in a fresh sandbox before uploading student data, still on Vercel Sandbox. Authentication, quota, infrastructure and execution failures are never retried through another provider. A supervisor/manifest mismatch fails closed. This recovery avoids broken grading but is slower; it does not create per-student snapshots.

Refresh with `npx tsx scripts/provisionCompilerSnapshot.ts`, then deploy the generated pointer with explicit approval. The script reuses a still-current snapshot, otherwise builds only trusted infrastructure. Old snapshots are allowed to expire; no scheduled worker, permanently running VM or idle compute service was introduced.

## Actual measurements

All optimized timings below used REAL Vercel sandboxes through the LOCAL evaluator/browser, not the deployed production API. The same local evaluator and five registered public/hidden tests were used for the before/after runner comparison.

| Measurement | Total |
| --- | ---: |
| Before: fresh image, apt, separate supervisor calls | 32.69 s |
| After: first restore of the newly built compiler snapshot | 6.30 s |
| After: repeated restore into another fresh sandbox | 4.69 s |
| Local browser: first click until verified result displayed | 4.93 s |
| Local browser: next click until verified result displayed | 4.37 s |
| Safe recovery: compiler provisioning plus batched execution | 27.78 s |

The repeated runner sample was about 86% faster than its measured baseline. Under-five-second results were achieved in repeated snapshot-backed samples and both local frontend samples, but this is not a latency guarantee. The first snapshot restore exceeded five seconds. These are single samples, not percentile/load benchmarks.

| Phase | Baseline | First snapshot restore | Repeated snapshot restore |
| --- | ---: | ---: | ---: |
| Sandbox creation / restoration | 1,547 ms | 1,908 ms | 1,122 ms |
| Apt provisioning (SDK round trip) | 18,221 ms | 0 | 0 |
| Network lockdown call | 1,100 ms | 0 | 0 |
| Upload source/infrastructure or batch stdin | 259 ms | 1,580 ms | 806 ms |
| Supervisor infrastructure setup | 301 ms | 0 | 0 |
| Supervisor command start | Included below | 296 ms | 263 ms |
| Compile/test command calls or batch wait | 8,100 ms | 935 ms | 798 ms |
| Result fetch calls | 1,858 ms | 251 ms | 404 ms |
| Cleanup | 1,305 ms | 1,331 ms | 1,299 ms |
| Compiler process duration (subset, not additive) | 540 ms | 872 ms | 755 ms |
| Test process durations (subset, not additive) | 50 ms | 40 ms | 35 ms |

Baseline apt's remote command duration was 17,716 ms; its SDK round trip was 18,221 ms. Baseline source-file upload and optimized batch stdin upload are different transfer mechanisms. The optimized upload measurement includes sending source/test inputs and closing stdin. SDK-facing phases include transport and service overhead; compiler/test durations are measured inside the sandbox and must not be added again. Seven explicit SDK method calls handle normal snapshot-backed submissions, independent of test count; the baseline instrumentation recorded eighteen outer method calls, with additional stdin handling hidden inside its per-test commands.

“First restore” means the first new sandbox restored from this snapshot in the benchmark. It does NOT establish a Vercel function cold-start measurement. The local frontend reused the local Express process and the already-used snapshot, while each student submission still created a fresh VM. True production function cold-start and warm-start click-to-display measurements remain pending deployment approval. Previous production measurements were approximately 21.58 s API and 22.22 s frontend; they are context, not an identical-environment before/after comparison.

## Validation

- All 125 automated tests passed across nine test files, including existing assessment, verified progress, progression/migration, Wandbox and isolated/Google runner behavior, plus snapshot recovery and batching regressions.
- Type checking, the local Vercel production build, and native Node ESM artifact startup/health/evaluation-routing checks passed.
- Real optimized C++20 submissions passed all three public and two hidden tests and received verified status.
- Real compilation failure, runtime failure, timeout, excessive output and incorrect-answer cases were correctly classified.
- Real student processes could not read the root manifest, privileged parent memory or its stdout descriptor. Hidden input was absent from returned results.
- Two concurrent real submissions used different fresh sandboxes and produced their own correct sums.
- Restoring the reusable snapshot for inspection found no compiled submission binary, student source or student work directories.
- The control plane confirmed the test sandboxes stopped. Final inventory reported zero active sandboxes and a ready compiler snapshot.
- Both local frontend browser submissions displayed a verified 5/5 pass. Guest progress was isolated to temporary browser contexts. Authenticated Firebase writes and the remote Google deployment were not exercised; their implementation/provider paths remain unchanged and their existing regressions pass.

Evidence: `sandbox-quickstart/latency-baseline.json`, `latency-optimized.json`, `latency-recovery.json`, `latency-frontend-local.json`, `optimized-security-results.json`, and `optimized-cleanup.json`.

Re-run with Node.js 24 and existing ignored OIDC authentication:

```sh
npx tsx scripts/benchmarkSandbox.ts
npx tsx scripts/checkOptimizedSandbox.ts
```

The optional frontend benchmark uses Playwright: install browser tooling separately and set `PLAYWRIGHT_MODULE` to its module path if it is outside this project's dependencies, then run `npx tsx scripts/benchmarkFrontend.ts`. No browser tooling was added to the application dependency graph.

## Deployment approval required

The changes are ready for deployment to the existing project. No push or deployment has occurred. After explicit approval or after the user deploys, verify production health, API routing, real compilation/public/hidden tests, failure classification and cleanup again, and record production first-function-invocation versus repeated-request API and frontend click-to-visible-result latency. These production checks cannot be replaced by the local results above.
