# Production submission latency investigation — 25 October 2026

The production bottleneck is confirmed in live logs: every measured submission rebuilt the compiler environment. The deployed snapshot pointer was over eleven days old, beyond the seven-day freshness limit. Its metadata lookup returned `not_found`. A refreshed GCC 15 snapshot and per-request instrumentation are ready locally. **No deployment has been performed, so production after-change latency is not yet measured.**

## Production evidence

The `cplusplus.vercel.app` alias pointed to deployment `dpl_86upoMnxPsjX7puj984uBV89JW4D` (`cplusplus-mugjm0nvw-anthobads-projects.vercel.app`). Build logs identify commit `060eb27` and region `iad1`. That commit contains the same old pointer, `snap_PiJE6TrpH8ETXKyny2P9kVpCHuPj`, created `2026-10-14T18:02:04.178Z`. No snapshot-ID environment variable is involved: the generated `server/sandbox/compilerSnapshot.ts` is compiled into the function. The live runner events establish that production uses Vercel Sandbox, rather than another compiler provider.

The user ran two real production submissions during this investigation:

| Production observation | Time |
| --- | ---: |
| Practice, including qualitative AI review | 45.89 s |
| Assessment | 14.22 s |
| Runner sample 1 | 13.113 s |
| Runner sample 2 | 13.867 s |
| Apt provisioning in those runner samples | 10.834 / 11.551 s |
| Compiler process | 0.337 / 0.321 s |
| Test processes | 0.014 / 0.016 s |
| Awaited sandbox stop | 1.126 / 1.081 s |

Both live runner events report `snapshotHit: false`, `recovery: snapshot_version_or_age_mismatch`, eleven SDK calls and an apt phase. Apt accounts for approximately 83% of runner time. This is direct production evidence, not an inference from local timings. Sanitized observations are retained in [sandbox-latency-production-before.json](sandbox-latency-production-before.json).

The extra 31.67 seconds between the two browser measurements is consistent with the synchronous AI-review path. It is **not** a measured AI-only duration: old logs cannot separate authentication, Firestore reservation, progress persistence or model retries, and the two responses were not correlated by request ID. The production challenge ID was not reported. Function cold/warm state is unclassified; these samples must not be labeled as proven function cold starts.

## Snapshot refresh and real runner comparison

The existing team was checked through the Vercel API and confirmed `hobby`. SDK project/team targeting matched the existing linked project. Inventory reported about 5.41 GB of active snapshot storage before refresh. Existing snapshots belonging to other uses were not removed.

One ephemeral infrastructure-only builder installed signed Ubuntu packages and confirmed **`g++ (Ubuntu 15.2.0-16ubuntu1) 15.2.0`**. The new snapshot is `snap_w1pYiZsVMGVZSoGZLzHc4saYgVlQ`, size 191,471,434 bytes, created `2026-10-25T21:17:44.846Z`. Its supervisor/provisioning hash remains `7ff4220ca6019224d52af4e7367730d9ff759c18d54ee9677185d4371ee8237f`. Snapshotting stops the builder, and the maintenance script also awaits stop in `finally`. It never receives student code, tests, credentials or repository contents.

Before and after benchmarks used the same `cc-t1` C++20 program and the registered three public/two hidden tests, through the local trusted evaluator invoking **real** Vercel sandboxes:

| Sample | Before refresh | After refresh |
| --- | ---: | ---: |
| First observed runner call | 26.263 s | 6.817 s |
| Next fresh sandbox | 21.257 s | 5.349 s |
| Next fresh sandbox | 27.047 s | 3.856 s |
| Mean | 24.856 s | 5.340 s |
| Apt provisioning | 15.499–19.205 s | 0 |
| Snapshot used | No, all three | Yes, all three |
| Explicit SDK calls | 11 | 7 |

Every sample returned HTTP-style status 200 from `evaluateSubmission`, passed all five tests and received verified status. Every created submission sandbox was subsequently confirmed stopped. Raw metrics are in [before](sandbox-latency-before-refresh.json) and [after](sandbox-latency-after-refresh.json). The mean local runner time fell about 79%; only the last two restored samples were within 3–6 seconds.

These measurements exclude Firebase authentication, quotas, API/platform startup, progress persistence, AI review and browser/network latency. The first restored sample is a first observed restore into a fresh VM, **not proof of a Vercel function cold start**. Every submission still uses a new unnamed, nonpersistent sandbox. These results cannot be presented as production after-change improvements.

## Instrumentation and changes

`server/submissionPerformance.ts` creates a server-generated `X-Submission-Id`, isolates metrics with AsyncLocalStorage, and emits one `cpp_submission_timing` event. Authentication and transactional quota reservation/release are measured in `server/security/access.ts`. `server.ts` measures evaluation, progress persistence, total qualitative AI review and individual model attempts. `Server-Timing` exposes phases completed before the response; final logs include quota release as well.

`server/vercelSandboxCodeRunner.ts` retains SDK-phase timing and adds snapshot selection metadata, a correlated request ID, restoration duration and cleanup success. Compilation and test-process durations come from the trusted supervisor. `sandboxCreation` includes the restore call; `snapshotRestoration` is its separately named subset, since the SDK does not expose independent VM-creation and disk-restoration intervals. Do not add those two values together. Likewise, compiler/test durations are subsets of supervisor wait, runner time is within API evaluation, and per-model attempts are within AI-review time.

`responseMs` starts after Express JSON parsing and ends on response completion/close. `finalizedMs` includes final quota release. Neither includes time before Express middleware starts. `firstRequestInProcess` means the first measured evaluation request in that Node process; health checks, platform prewarming and import time mean it is not a reliable function-cold-start flag. Compare browser end-to-end time and Vercel platform information as well.

Logs never contain tokens, service-account JSON, learner IDs, source, test inputs or expected answers. Only timings, HTTP status, a random correlation ID and trusted infrastructure metadata are recorded. No monitoring service or extra Firestore metric writes were added.

Practice now has an **Include AI review (slower)** checkbox, enabled by default to preserve the existing behavior. Disabling it uses the already-supported `requestAiFeedback: false` path. Tests and scoring still run; it does not turn a practice pass into verified assessment. Assessment remains without optional review. The 3–6-second goal is plausible for simple **tests-only** submissions with a restored snapshot, but is not a promise for external model latency or production percentiles.

`scripts/checkCompilerSnapshot.ts`, run before builds, warns when the pointer is stale or the infrastructure hash changed. It does not contact cloud services or silently extend snapshot freshness. Maintenance and benchmark scripts check the existing project/team and Hobby plan before creating resources. A local `VERCEL_MAINTENANCE_CLI` path can select an already installed CLI; otherwise npx runs noninteractively with a 45-second preflight timeout. A stalled initial npx preflight was stopped before creating any builder; the refresh then succeeded using the existing CLI.

## Tradeoffs and maintenance

The original seven-day maximum compiler age, deny-all policy before student data, per-test UIDs/process limits, one vCPU, hidden-test protection, awaited cleanup, authentication/revocation checks and distributed quotas remain enforced. No warm student VM, server-host compiler, cross-user workspace, unauthenticated fast path or paid cache was introduced.

The generated pointer must be refreshed **and deployed at least weekly** to keep the fast path. A build warning cannot refresh an already running deployment. Refreshing a snapshot without deploying its pointer leaves production using the old one. Snapshot provider retention is separate: Vercel resets retention on use, but this application still rejects compiler images older than seven days. [Vercel retention behavior](https://vercel.com/changelog/sandboxes-now-expire-based-on-last-use).

Run with Node 24 and existing local SDK/CLI authentication:

```sh
npm run check:compiler-snapshot
node --import tsx scripts/provisionCompilerSnapshot.ts
# Review/commit the generated pointer and deploy only after approval.
```

Snapshot refresh consumes the existing Hobby allowance, including lifetime snapshot storage. Inventory headroom is not a complete lifetime-usage audit. Vercel states that Hobby Sandbox is free within its quotas and pauses creation when exceeded, rather than charging extra. [Vercel Sandbox pricing](https://vercel.com/docs/sandbox/pricing). No billing setting, plan, database, paid service or cron job was changed. Existing snapshots were not deleted.

## Validation and production follow-up

All **255 tests across 23 files** pass, including real C++ grading regressions, snapshot/fallback/isolation tests, auth/quota failures, timing privacy and concurrent request isolation, and the Practice AI opt-out. TypeScript and production build pass; the existing Vite chunk-size warning remains. The live six-submission benchmark additionally verified actual compilation, public/hidden passing and cleanup. It did not exercise every possible malicious program in production.

To finish production after measurements, deploy the reviewed source/pointer, then run repeated submissions with identical code/challenge, first without AI feedback, then with it. Respect the existing quota (six execution units/minute per signed-in user). Correlate `X-Submission-Id` with both timing events. Confirm `snapshotHit: true`, no apt phase, separate authentication/quota/persistence/AI durations and successful cleanup. Record first-observed and subsequent requests without claiming guaranteed function coldness. No new telemetry or refreshed pointer is active in production until that deployment occurs.
