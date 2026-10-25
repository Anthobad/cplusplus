# Timed exam sessions and cleanup

This change is local. No deployment, production deletion, TTL policy activation or billing change has been performed.

The server sets `deadlineAt` when issuing a session, using the existing authored 45/60/60/90-minute durations. The first valid answer submission must be committed by that deadline plus the approved **10-second delivery grace**. Client timestamps and duration overrides are not accepted. Deadline checks happen before compiler or explanation-grading work. A new retake still creates a new session, as before; attempts are not limited and this is not proctoring.

The first accepted submission atomically freezes its answers, receipt time and tab-switch count. Grading can finish after the deadline. If the compiler or model is unavailable, retrying the same answers reuses validated partial grades until the existing 24-hour retention boundary. Changed answers are rejected with 409 before more grading. A first submission after the grace period receives 410 without an awarded attempt. Saved outcomes remain idempotent within retention; permanent history remains under the user's history collection afterward. Quotas continue to apply to rejected requests and retries.

The frontend uses the server's deadline/time response and a monotonic countdown rather than subtracting one second per timer callback. It subtracts the measured request duration conservatively, so the displayed timer may expire slightly early. Editing and question shuffling are disabled once submission starts; the retry button sends the frozen answers again. Shuffling now updates the existing session and preserves its original deadline. If a shuffle races a submission, a stale question set is rejected rather than graded against different questions. A suspended browser or disconnected client can miss the deadline; grace is bounded and the browser cannot extend server time.

Existing completed exam records, lesson/exam IDs, pass thresholds, compiler grading, progress and saved history are unchanged. Existing unfinished sessions without `deadlineAt` derive it from their server-recorded `createdAt` plus authored duration. An old unfinished/partially graded session already past that deadline cannot begin a new frozen submission after this update; take a new attempt. Deploy between active exam windows and publish the client/server together.

## Prepared automatic cleanup

New sessions include `deleteAfter` as a Firestore timestamp corresponding to their existing numeric `expiresAt` (24 hours after creation). Logical expiry is enforced by the API independently of physical deletion. The prepared [TTL flags file](../ops/assessment-session-ttl.yaml) targets only the `_assessmentSessions` collection group in `cpp-interview-prep`, database `(default)`. Check these targets and any existing TTL policy before approval. It is not referenced by builds or deployment hooks.

After explicit approval, an authorized operator can apply this prepared configuration:

```sh
gcloud firestore fields ttls update deleteAfter --flags-file=ops/assessment-session-ttl.yaml
```

Do not run it as part of application deployment. Firestore TTL deletes require billing and do not receive free usage; enabling billing is a separate approval. [Firebase pricing](https://firebase.google.com/docs/firestore/pricing). TTL deletion is asynchronous, usually within 24 hours of expiry. It requires a timestamp field; numeric `expiresAt` alone is insufficient. [Firebase TTL documentation](https://firebase.google.com/docs/firestore/ttl). The flags file follows the documented [gcloud flags-file format](https://docs.cloud.google.com/sdk/gcloud/reference/topic/flags-file).

Older sessions lack `deleteAfter` and are not automatically covered by this policy. Once the last old deployment's 24-hour sessions have expired, review and delete them with the bounded maintenance command below. No production backfill or deletion was run. Per-user quota documents are outside this cleanup policy.

## Bounded maintenance fallback

With explicit server credentials configured securely in the shell, these commands use the existing pinned Firebase project/database. They never print credentials or learner records:

```sh
npm run cleanup:assessment-sessions
# Only after reviewing the dry-run and authorizing deletion:
npm run cleanup:assessment-sessions -- --delete
```

The default is a dry run. Each invocation selects at most 500 temporary sessions with numeric `expiresAt <=` the invocation time. Deletion uses batches of 100 with update-time preconditions, so a concurrent document change aborts that batch. Earlier batches may already have committed if a later batch fails. Repeat the dry run to inspect remaining counts; a `bounded: true` result means the selection limit was reached. Permanent user history, progress, shared exams and unexpired sessions are not targeted. Reads and ordinary deletes still consume normal Firestore usage.

## Validation

Added checks cover issued deadlines/TTL timestamp types, rejection after grace before grading, the exact grace boundary, competing answer snapshots, immutable retries after an outage crosses the deadline, ownership, rejection of unmatched finalization, retention expiry, deadline-preserving shuffles, stale question sets and legacy-session deadlines. Cleanup checks cover default dry runs, the target collection/query, bounded batches, update-time preconditions and aborted batches.

All 241 tests across 20 files, TypeScript checking and the production build pass. A fresh Vercel Node package also passes native Node startup, health (200) and unauthenticated protected-route checks (401). The existing Vite bundle-size warning remains. These are local service/HTTP and mocked-cleanup tests; no real TTL deletion, production credential use or interactive browser timing test was performed. Firestore rule behavior is unchanged; the emulator suite was not rerun for this change.
