# Exam-aware topic mastery and readiness

> Historical implementation report. AI-dependent behavior described below was retired by the [deterministic assessment migration](deterministic-assessment-migration.md); historical results remain preserved.


Implemented locally, 12 November 2026. No deployment or production Firebase configuration change.

## Findings and implementation plan

The existing `calculateReadiness` was consumed only by `ReadinessDashboard`. It averaged available topic quizzes, mixed the latest aggregate exam score into four categories as one extra observation, and averaged populated dimensions for the overall score. Needs Review used low quizzes and coding results only. Sparse high quiz scores could therefore produce high readiness without reflecting specific exam failures.

Canonical IDs are `topic-1` through `topic-39`. The four exam pools and fallback definitions pass through `assessmentContent`; randomized IDs add `_sN`, and MCQ options are shuffled. The authenticated server grades the session's saved question set. MCQs use strict answer equality; coding uses actual compiler/test results and rounded proportional credit; explanations, code reading, debugging and code analysis use the existing rubric assessor and rounded proportional credit. Current exam scoring sums these points; the optional `weights` interface was not applied by the existing grader and remains unchanged.

Server finalization already stores answers, generated/shuffled questions, coding results, explanation results and an integrity marker. `users/{uid}.examAttempts` keeps the latest result per exam, while `users/{uid}/exams/{sessionId}` preserves historical attempts. Finalization and the retry outcome are transactional. Firestore client writes to all user progress are denied. Older records may precede authoritative grading and must not be treated as trusted detailed outcomes.

Plan implemented: attach explicit concept metadata in existing source composition, collect exact question points alongside existing grading, maintain bounded evidence in the same finalization transaction, extend the existing readiness calculation, and update the existing dashboard. No second scoring service, AI analytics, background job or history query was added.

## Mapping coverage

`src/data/examTopics.ts` contains explicit mappings for **124 question IDs**: 96 pooled (28 foundations, 25 STL, 22 systems, 21 final) and 28 fallback questions. All currently assess identifiable curriculum concepts; none needed a general-purpose exception. Questions with genuinely shared concepts split their contribution equally. The first topic is the primary concept.

Twenty equivalent fallback aliases share an evidence ID with their pooled counterparts, giving **104 distinct evidence identities**. This prevents the same question counting again under another identifier. Suffixes `_sN` do not create new evidence. The deep-copy and move-constructor coding questions remain distinct.

The metadata supports an explicit `general-problem-solving` category with no topic IDs; such evidence is not assigned to an unrelated curriculum lesson. Unknown questions are rejected by build validation and ignored defensively by analytics. Build-time validation checks every pooled/fallback question, canonical references, duplicate topic entries, duplicate question IDs and unmapped questions. Tests also cover sampled IDs and the general category.

Only IDs and topic relationships are in the lightweight metadata module. No hidden tests, reference implementations or private rubrics were added to the browser payload.

## Exact scoring policy

All calculations are deterministic. Percentages are bounded to 0–100. Non-finite evidence is ignored. Intermediate calculations use full precision; displayed topic/category/overall percentages are rounded.

For each distinct exam question:

1. Normalize the actual awarded points: `100 × earned / possible`. Thus 6/10 supplies 60%, including partial coding and explanation credit. The existing grader's point rounding remains authoritative.
2. Keep at most three distinct attempt observations, newest first by server timestamp; ties use attempt ID deterministically. Retries replace the same observation, never append a second one.
3. Combine their percentages with weights 60/30/10, normalized over available observations. With two observations the weights are 2/3 and 1/3; one observation uses its own score.
4. Allocate one question-equivalent equally across its mapped topics. For three topics, each receives 1/3; retakes never increase this distinct weight. There is no extra weight for question point value, exam length, exam identity or question format.

For each topic:

- `L` is the mean of available quiz and verified-unassisted coding percentages. An unattempted assessment is excluded, never assigned a zero. If neither lesson source exists, `L` is absent. Legacy quiz-ID/challenge-ID lookup compatibility is retained.
- Let `n` be the sum of allocated distinct question-equivalents and `E` their weighted mean exam percentage.
- When both lesson and exam evidence exist, exam share `w = 0.8 × n / (n + 2)` and topic mastery `M = (1 − w) × L + w × E`.
- With lesson evidence only, `M = L` and exam share is zero. With exam evidence only, `M = E` and exam share is one. With neither, mastery is unknown, displayed as a dash.

The two-question smoothing term limits the influence of an isolated question. The 80% upper bound lets repeated independent exam failures outweigh perfect lesson work without completely discarding lesson evidence. Repeating a question changes its recent performance estimate but cannot grow its share. A single later success does not wipe out recent failures; after subsequent genuine attempts the oldest results leave the bounded window. There is no wall-clock decay that improves scores without new work.

A perfect quiz with no coding or exams now gives 100% on available evidence, labelled Limited rather than claiming broad confidence. Missing sources never create review recommendations. Exam-only evidence is used directly with its coverage label; missing lessons are not treated as failed work. An actual zero earned on an unanswered question in a finalized exam still counts. A started-but-unsubmitted session has no reliable quit outcome in the current backend: this change does not infer failure from a closed tab or manufacture an exam result.

### Categories, overall readiness and sparse evidence

The six curriculum categories partition the 39 topics; each topic contributes exactly once to overall readiness. Categories average their assigned topic mastery values, including zero for topics without evidence. Overall readiness is the arithmetic mean across all 39 topic values. Status thresholds remain Strong ≥80, Developing ≥65 and Needs Review below 65; no evidence yields Insufficient Data. Both headline percentages are displayed when any relevant topic has assessment evidence; otherwise they show a dash.

The dashboard has two headline scores:

- **Overall Readiness:** the mean across all 39 topics. Topics without assessment evidence contribute zero curriculum coverage, not failed exam marks.
- **Readiness at Your Current Progress:** the mean only across assessed topics in the reached curriculum prefix. The prefix ends at the furthest canonical current, completed or assessed topic. Unassessed topics within that prefix are excluded from this score, and the dashboard explicitly shows assessed/reached counts.

For example, a learner at topic 5 with only two quiz scores of 100% and 80% gets **90% readiness at current progress (2/5 topics assessed)** and **5% overall curriculum readiness (180/39, rounded)**. An unattempted exam has no effect on either assessed topic's mastery.

Coverage is assessed topics / 39. Each topic separately displays completion, mastery, exam percentage, question-equivalent coverage, recent improvement and evidence level. Evidence is Insufficient with no sources, Established with both lesson sources or at least three allocated distinct exam questions/observations, and Limited otherwise. These are coverage labels, not statistical probabilities or assertions of correctness.

Verified Coding remains an informational dimension because coding is already in topic mastery. Mock interview scores remain an informational dimension, excluded from trusted curriculum readiness because those reports are self-reported. Neither diagnostic is added again to the overall score. Aggregate exams never contribute in parallel with detailed evidence.

### Needs Review

One card per topic is recommended when either:

- Exam performance is below 65% with at least two allocated distinct question-equivalents, **or** at least one allocated question-equivalent and three allocated recent observations; or
- The average of actually observed lesson assessments is below 70%.

This avoids classifying missing coding evidence as a demonstrated mistake, and avoids recommending review for one isolated exam error. Repeated failures on the same question can warrant review without increasing that question's scoring weight. Reasons show exam percentage, question-equivalents and observations, or the observed lesson assessment average. Improving results show their latest-versus-oldest retained percentage-point change. Cards prioritize exam-backed weakness, then lower mastery, more observations and canonical ID. Each opens the existing topic route.

### Worked example

Suppose all 39 topics have 100% quizzes and verified unassisted coding. Initial topic and overall scores are 100. Three distinct smart-pointer exam questions then earn 40% each:

- `n = 3`, `E = 40`, `L = 100`.
- `w = 0.8 × 3/5 = 0.48`.
- Smart-pointer mastery becomes `0.52 × 100 + 0.48 × 40 = 71.2`, displayed **71%**.
- Needs Review names **Smart Pointers & Explicit Ownership Semantics**, with **exam performance 40% across 3 question-equivalents** and a direct lesson link.
- The two-topic Memory category becomes **86%** if the other topic remains 100. Overall becomes **99%**: one weak topic among 39 is localized rather than an arbitrary global penalty. Completion remains 39/39.

On a later attempt scoring 90% on those questions, their recent mean becomes `(90 × .6 + 40 × .3)/.9 = 73.33%`. Mastery becomes **87%**, the exam-driven recommendation clears, and the table shows **Improving +50 points**. Earlier failures still affect the score. Retaking the same three questions does not expand `n` beyond 3.

## Persistence and historical compatibility

Backward-compatible optional fields:

- `ExamAttempt.questionScores`: actual `{ questionId, earned, possible }` values from trusted grading, saved in the existing latest attempt and historical attempt records.
- `UserProgress.examMasteryEvidence`: `{ version: 1, questions: { [evidenceId]: [{ attemptId, timestamp, score }] } }`, with up to three observations per known distinct question.

The summary holds at most 312 observations for the current 104 identities. It is updated in the **existing** exam-finalization transaction with the existing progress/history/session writes. No extra transaction, document read, document write or subcollection scan is added. The same session's retry returns its original outcome and does not update the summary.

Before a summary exists, analytics safely derives evidence from reconstructible **latest** `server-v2` attempts already present on progress. Historical shuffled MCQs use the saved server-selected correct position; coding/explanations use actual saved results and the original point rounding. Missing results are skipped; they are never assumed wrong or correct. Older client-era attempts are retained as aggregate history but not trusted detailed evidence. Aggregate-only exam count and average are displayed separately and do not become invented topic outcomes.

On the next successful finalization, reconstructible latest legacy evidence is seeded into the bounded summary before adding the new attempt. No bulk migration or production command is needed. Older history-subcollection attempts remain intact but are **not automatically backfilled**; loading whole archives was deliberately avoided. Partial historic records can contribute only their recoverable questions.

Completed units, quiz scores, coding history, verified passes, gates, IDs and all existing exam history are preserved. Mastery never writes completion or changes unlock decisions. Client-created or local-cache scores are not imported by this feature.

## Integrity and operational cost

The existing authenticated session, ownership, deadline/grace, frozen-answer, partial-result retry, quota and transactional-finalization paths remain. Browser requests may submit answers, not question points or mastery summaries. Negative API tests reject both kinds of forged fields. Firestore rules are unchanged and already prohibit direct client progress writes. Authentication and sandbox code were not modified.

Analytics makes no Gemini requests, Sandbox executions or additional Firestore reads/writes. CPU work is bounded by the question summary plus the four latest exam records and 39 topics, memoized by progress identity in the dashboard. The root progress document becomes modestly larger due to the bounded summary; historical documents gain one short score row per question. Existing complete question/result payloads remain for compatibility.

## Validation

**Follow-up verification: all 278 tests across 25 files passed on Node 24.21.0. TypeScript checking and the production build passed, including mapping and bundle-budget checks.** Added regressions verify neutral missing assessments, exam-only evidence, separate overall/current-progress scores, assessed/reached coverage and retained zeros on finalized unanswered questions. The dashboard and public mapping metadata remain deferred assets. `git diff --check` passed. Tests cover poor exams after perfect lessons, weak exams with full completion, isolated versus repeated mistakes, partial coding/explanation/code-analysis credit, multi-topic splitting, explicit general questions, invalid mappings, suffix/fallback aliases, bounded retakes, later improvement, cross-exam concepts, old aggregates and shuffled detailed history, empty/sparse/malformed evidence, bounds, no aggregate double-counting, completion preservation, forged score/summary submissions, transactional idempotence, dashboard rerendering and canonical-topic navigation. Existing auth, quota, C++ grading, isolation and backend startup regressions remain in the complete suite.

Firestore emulator tests were not run: Java and an installed Firestore emulator were unavailable. No rules changed. HTTP tests use the actual trusted routes with an in-memory transactional adapter; they do not establish live Firestore or deployed-browser behavior. No live AI grading or Sandbox runs were added for analytics validation. The existing Vite main-chunk warning remains; bundle-budget checking still passes.

## Complete changed-file list

- `src/data/examTopics.ts` — explicit public mappings, canonical identities and validation.
- `src/data/assessmentContent.ts` — attach metadata to pools and fallback questions.
- `scripts/generate-curriculum-assets.ts` — validate complete mapping coverage during generation/build.
- `src/types.ts` — optional question-score and bounded-evidence types.
- `src/lib/examGrading.ts` — record exact awarded question points without changing grading.
- `src/lib/examMastery.ts` — trusted historical reconstruction, deduplication and bounded retakes.
- `src/lib/readinessAnalytics.ts` — replace the existing aggregate model with topic-derived readiness.
- `server/security/routes.ts` — pass server-produced question scores to finalization.
- `server/security/progress.ts` — atomically update the bounded summary during existing finalization.
- `src/components/ReadinessDashboard.tsx` — mastery, completion, coverage, reasons and navigation.
- `tests/examMastery.test.ts` — model/mapping/historical regression cases.
- `tests/readinessDashboard.test.tsx` — interactive component navigation and rerender checks.
- `tests/examGrading.test.ts` — exact partial-credit evidence checks.
- `tests/readinessAndWeakness.test.ts` — update legacy expectations for honest coverage accounting.
- `tests/securityHardening.test.ts` — reject forged analytics fields and verify retry-safe summaries.
- `docs/exam-aware-readiness.md` — this report.

The input specification `specs/analytics_and_readiness.md` was not modified. No dependency, billing, production configuration, compiler runner or Firebase rules changes were needed.
