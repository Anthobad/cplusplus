# Compiler-backed exam coding

Exam coding answers now use the existing `/api/evaluate-code` endpoint in unassisted assessment mode. Coding points are derived from passed public/hidden tests; matching rubric words no longer earns coding credit. The subsequent priority-2 update adds [rubric-based explanation and code-analysis grading](rubric-based-explanation-grading.md).

## Contracts and scoring

All eight pooled coding questions and four fallback coding questions have public submission contracts. Two fallback questions share pooled contracts, giving ten distinct server registrations. Stable `codingChallengeId` values survive the exam sampler's question-ID suffixes.

The server supplies standard headers, any fixed class context, a driver and trusted tests. For exam fragments it always assembles the driver; defining a separate student `main` cannot select the ordinary standalone-program path. Client-supplied tests and drivers remain ignored for registered assessment submissions.

Tests cover move ownership and cleanup, RAII/noncopyability, normalized anagram groups, duplicate-aware kth selection, synchronized queue insertion/notification, lock exclusion, ASCII-space compaction, perfect forwarding, reverse-buffer bounds and independent deep copying. Hidden inputs/expected outputs remain server-side and are stripped from responses.

The two allocation-counter probes disable GCC optimization for their own translation units so allocation elision cannot hide a missing release or distort cleanup counts. This does not change runner flags or other challenges.

For a coding question worth P points with T tests and K passing tests, points are `round(P * K / T)` after successful compilation. Compilation failures and unanswered coding questions earn zero. Runtime failures and timeouts fail affected tests. Partial credit is based on tested behavior, not keywords. Concurrency tests and example-based tests provide evidence; they do not prove correctness for every schedule, asymptotic complexity or all possible inputs.

Exam weights, durations, pass thresholds, sampling and progress gates are preserved. A passing total exam score does not require every coding test to pass; that would be a separate progression-policy change. Coding results are saved alongside the existing attempt, without marking the whole exam compiler-verified or resetting historical progress.

Overall exam scoring and persistence still follow the existing frontend flow; server verification applies to the coding evaluations.

## Submission behavior

Submission awaits coding results before displaying or saving a final score. Edits, pool resampling and duplicate submission are blocked while evaluation runs. Evaluator outages, configuration errors and malformed responses retain answers and do not finalize/save the attempt. A retry is available. On timer expiry the latest answers are used and editing stays locked, including while an outage awaits retry. Results from a departed/replaced exam view are not finalized later.

The UI reports coding points, test counts, compilation errors and public test failures. AI feedback is disabled for exam evaluation. The existing sandbox runner, compiler snapshot/provisioning, execution limits and cleanup mechanisms are reused without changing their implementation.

## Validation

- All 168 tests pass, along with TypeScript checking and the production build. Tests were run sequentially with Node 24 to avoid concurrent compiler contention on this workstation.
- Real g++ runs for all ten reference submissions against every public/hidden test.
- Negative runs for keyword-only prose, separate-main bypass, hidden-test failures, runtime termination, infinite loops, missing notification, leaking owners and a no-op lock.
- Local HTTP health/evaluation check through the existing authenticated runner service.
- Browser submission check using disposable guest state: evaluator outage saves no attempt, answers survive, retry compiles real code and persists the score/coding result.
- Accelerated-clock browser check: expiry submits the latest answers, an outage keeps editing locked, and retry finalizes the retained answers.

These are local checks, not deployed-production verification. No deployment, credential or environment-setting changes were performed. The existing frontend bundle-size warning remains.

## Files

Public contracts: `src/data/examCoding.ts`. Trusted drivers/tests: `server/examChallengeRegistry.ts`. Source assembly: `server/evaluateSubmission.ts`. Points/API handling: `src/lib/examGrading.ts`. Submission lifecycle and feedback: `src/components/ExamView.tsx`.
