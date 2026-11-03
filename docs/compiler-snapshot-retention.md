# Non-expiring compiler snapshot — 3 November 2026

The old `snap_w1pYiZsVMGVZSoGZLzHc4saYgVlQ` lookup returned `status: deleted` and `expiresAt: 2026-11-01T21:34:48.001Z`. The application also rejected snapshots older than seven days independently of provider retention. Either condition prevented the restore fast path. This explains renewed provisioning overhead, but no new production submission was measured in this pass.

Created `snap_DidiHNszeeWO0Qym4Su1ARCXlvCZ` on the existing confirmed Hobby project, using a trusted builder with GCC 15.2.0. Size: 184,255,909 bytes. A separate provider lookup confirmed `status: created`, `expiresAt: null`. Vercel supports [expiration 0 for no expiration](https://vercel.com/docs/vercel-sandbox/concepts/snapshots); the installed SDK documents the same option.

## Changes

- `server/sandbox/compilerEnvironment.ts`: snapshot expiration is now 0; removed the seven-day maximum age.
- `server/sandbox/compilerSnapshot.ts`: generated replacement pointer.
- `server/vercelSandboxCodeRunner.ts`: select compatible snapshots by infrastructure hash, regardless of age. Existing runtime manifest verification, deny-all student networking, fresh isolated nonpersistent sandboxes, grading, resource limits and awaited cleanup remain intact. Timing metadata records `maxAgeMs: null`.
- `scripts/provisionCompilerSnapshot.ts`: reuse only a compatible available non-expiring snapshot; otherwise create a replacement. Reject an unexpectedly expiring result before publishing its pointer. Existing Hobby targeting, storage guard and builder cleanup remain.
- `scripts/checkCompilerSnapshot.ts`: report version compatibility and the non-expiring policy, without a misleading weekly refresh deadline. This local build check does not verify provider availability.
- `tests/vercelSandboxRunner.test.ts`: verify non-expiring configuration and successful restoration of a year-old compatible snapshot; keep incompatible-version rebuilding coverage.
- Earlier latency reports link here to distinguish their historical seven-day policy from the current behavior.

## Validation

All 255 tests across 23 files, TypeScript checking and production build passed. The existing Vite bundle-size warning remains. Three real C++20 evaluations restored the new snapshot (`snapshotHit: true`) with no apt provisioning, passed all five public/hidden tests, returned verified success, and confirmed every sandbox stopped.

| Direct sandbox sample | Total | Compile | Tests |
| --- | ---: | ---: | ---: |
| 1 | 6.15 s | 496 ms | 18 ms |
| 2 | 8.75 s | 558 ms | 20 ms |
| 3 | 6.40 s | 560 ms | 27 ms |

Evidence: [sandbox-latency-non-expiring.json](sandbox-latency-non-expiring.json). These runs originate locally and exclude production authentication, quota transactions, browser networking and AI review. They do not establish production after-change performance or a 3–6-second guarantee. Source-upload phase latency varied from 1.53 to 4.68 seconds.

## Operation and tradeoffs

Deploy the reviewed source to activate the new pointer and selection policy. No deployment, billing change, quota reset, database change or paid service was performed.

No weekly refresh or scheduled service is needed for expiration. Explicit deletion, provider unavailability, or an infrastructure-version change can still invalidate an image. The existing safe fresh-provision fallback remains; it does not automatically publish a shared replacement pointer. Run `node --import tsx scripts/provisionCompilerSnapshot.ts` and deploy the pointer when replacement is needed.

Removing age rejection also removes the former patch-age bound. Non-expiring images do not receive package updates automatically: refresh deliberately for compiler/OS security updates by replacing the trusted image through reviewed maintenance. Snapshot storage remains allocated until deletion and counts against the existing Hobby allowance; no unrelated images were deleted.
