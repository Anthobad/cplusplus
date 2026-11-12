# Deterministic assessment migration

Implemented locally on 12 November 2026. **No deployment or production Firebase/billing changes.** The website no longer requires an AI API key or calls a model. Historical grades and feedback remain historical records.

## A. Previous architecture and inventory

Before editing, the repository inventory traced App routing, lesson views/editor, ExamView, readiness, optional interview practice, server routes, authentication/quotas, grading, registries, progress transactions, build configuration and tests.

| Dependency group | Previous role | Disposition |
| --- | --- | --- |
| AI-only | `AiMentorDrawer` and `/api/chat`, fallback mentor engine and prompts | Removed |
| AI-only | `MockInterviewView` and `/api/mock-interview`, generated conversation and scorecards | Removed; saved reports retained |
| AI-only | Optional code-review checkbox, qualitative feedback, model retries and timing phases | Removed |
| Requires replacement | Explanation, why-this-code-works and code-analysis exam grading through `/api/assess-explanation` | Replaced for new sessions |
| Shared | Firebase Admin/auth, Google metadata authentication, quotas, AssessmentContext, code editor, runner, snapshot, grading transactions | Retained; no sandbox-policy change |
| Historical | Old question types, saved explanation result shapes, old question IDs and topic relationships | Retained for archival reading/evidence; never selected in a new session |

The old exam client imported complete answer banks and received private grading fields in start responses. This migration closes both exposure paths, rather than only removing model calls.

The mock-interview UI contained conversation-generation orchestration, not an independent verified objective question bank. It was removed without replacing it with a new interview engine. The five compiler-backed interview lessons (binary search, BFS, DFS, backtracking and dynamic programming) remain available.

## B. Removed functionality and dependencies

Removed mentor/chat, conversational mock interviews, qualitative coding reviews and explanation grading; their prompts, model selection/retries, API handlers, controls, loading/error UI and runtime-only tests were removed. All three removed endpoints now return JSON HTTP 404 instead of falling through to the SPA.

Deleted AI-only implementation files include the mentor and mock-interview components, `server/assessExplanation.ts`, `server/explanationRegistry.ts`, the calibration command, two provider-specific test suites and the obsolete rubric-grading operations document. `src/lib/explanationRubric.ts` now contains archive-only TypeScript shapes, not grading functions or prompts. Historical `aiFeedback`, explanation results and mock interview records remain representable in saved data; they do not enable an active feature.

Removed `@google/genai` (installed version 2.29.1) from package.json/lockfile. No replacement provider or local inference was added. `google-auth-library` is now an explicit `^11.3.0` dependency: the existing Cloud Run metadata-token utility imported it through the AI SDK's previously incidental dependency. It must remain for shared authentication. Firebase Admin 14.5.0 and Sandbox 3.8.0 remain; the existing selective CJS/ESM backend bundling fix is unchanged.

Compatible dependency patches were applied during cleanup, including Vite 6.4.6. Final `npm ci` reports **four moderate transitive advisories** in `glob`, `minimatch`, `rimraf` and Google gax's inherited tooling chain. The earlier high-severity advisory was patched. No forced major-version override was applied to Firebase's dependency graph.

`.env.example`, application capability metadata and current README guidance no longer require AI keys/models. Existing private local/Vercel secret values were not inspected, edited or removed; any unused old AI variables are inert and can be removed administratively later. No production environment settings were changed.

## C. New assessment architecture and contracts

New trusted exams have `schemaVersion: 2`. Active questions have exactly four logical types:

| Type | Input | Grading |
| --- | --- | --- |
| `mcq` | One stable option ID | Exact private key match; full points or zero |
| `predict_output` | Multiline output text | Exact normalized match against finite accepted outputs; full points or zero |
| `fill_blank` | One short blank | Trim edges, then exact case-sensitive accepted-list match; full points or zero |
| `coding` | C++20 source | Existing trusted compilation/public-hidden tests and rounded test-based partial credit |

MCQs always have four distinct options and one private key. Opaque option IDs are derived from question ID and option text, not the original option index, so the identifier does not advertise an answer-position pattern. Display shuffling retains those identities. Existing valid MCQ IDs remain unchanged. Binary questions became four-option MCQs with new `obj-*` IDs; materially different explanation replacements use new `det-*` IDs. Coding IDs/registrations retain their identity and switch to the canonical active `coding` type.

The existing answer-object contract is retained as an equivalent typed model: `answers[questionId]` is a string whose interpretation and limit are controlled by the server session question. Missing entries are unanswered, not malformed. Wrong question IDs, non-string values, nested objects, arrays, invalid option IDs, oversized answers and unexpected top-level score/key fields are rejected. Limits are 160 characters for option IDs, 4,000 for outputs, 200 for blanks and 32,000 for coding. Duplicate JSON fields, including escaped duplicate names, are rejected before normal parsing; duplicates cannot silently overwrite a frozen answer.

Output normalization on **both** sides converts CRLF/CR to LF, removes trailing spaces/tabs per line, and removes leading/trailing blank lines. Internal spaces/newlines, case, punctuation and numeric formatting remain significant. Thus `8` equals `8\n`, but `3` does not equal `3.0`. Blank normalization trims only the edges; alternatives must be explicit. Empty answers receive zero.

Final percentage remains `round(earned / possible × 100)` with the existing 50% passing threshold. Coding partial points remain `round(questionPoints × testsPassed / totalTests)` after trusted result validation. Infrastructure errors retain frozen answers and do not finalize a failing attempt. Objective questions never invoke Sandbox, an external grading endpoint or any model.

## D. Content migration statistics

**34 AI-dependent definitions were replaced:** 26 pooled and 8 fallback. Largest-remainder rounding of the requested 40/35/25 split gives **14 MCQs (41.2%), 12 output programs (35.3%), and 8 blanks (23.5%)**. This target applies to the replaced non-coding definitions, not every question in the whole bank.

**27 former binary definitions** (19 pooled, 8 fallback) were converted to four-option MCQs to satisfy the four-type contract. This conversion is separate from the 34 explanation replacements.

| Exam | Pool total | MCQ | Output | Blank | Coding | Duration |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Foundations | 28 | 20 | 4 | 2 | 2 | 45 min |
| STL | 25 | 19 | 2 | 2 | 2 | 60 min |
| Systems | 22 | 18 | 2 | 0 | 2 | 60 min |
| Final | 21 | 16 | 2 | 1 | 2 | 90 min |

The **12 coding definitions** (8 pooled plus 4 fallback) continue to use the same **10 unique trusted challenge registrations**. No driver, reference implementation, hidden test, compiler flag, resource limit, network restriction or snapshot policy was changed.

Every fallback still has seven questions totaling 100 points. Each randomized exam still has **eight questions and 100 points**: three existing MCQs at 10 points, two converted binary MCQs at 10 points, two replacement questions at 15 points, and one coding problem at 20 points. The existing grouped selection/randomization structure is preserved. Missing composition or malformed authored contracts fail validation instead of silently shortening an exam.

Difficulty labels and the original curriculum topic relationships are retained. Pool difficulty counts:

| Exam | Easy | Medium | Hard | Advanced |
| --- | ---: | ---: | ---: | ---: |
| Foundations | 3 | 12 | 13 | 0 |
| STL | 0 | 14 | 11 | 0 |
| Systems | 0 | 6 | 14 | 2 |
| Final | 1 | 7 | 8 | 5 |

All 124 active definitions have validated metadata; together they assess the same 30 canonical curriculum topics as the original exam definitions. The other curriculum topics remain in lessons/quizzes/coding. Historical mappings remain valid. There are now 185 mapped IDs and 165 evidence identities across historical and new content; materially changed questions do not reuse old evidence identities.

## E. Grading correctness and authoring

Private content lives under `server/data`. `legacyExams.ts`, `legacyQuestionPools.ts` and `legacyAssessment.ts` retain authored legacy source privately; `activeExams.ts` composes the current bank using `objectiveReplacements.ts`. These files are not browser imports. Generation validates canonical references/duplicates/mapping completeness; private-bank validation additionally checks schema, positive integer points, unique four-option keys, finite accepted lists, exactly one numbered blank and configured coding identities.

For authoring:

1. Write an unambiguous objective with an explanation and difficulty matching its learning objective.
2. Use a new ID for a changed meaning/answer contract, with explicit public topic metadata in `src/data/examTopics.ts`.
3. For output questions, supply a complete C++20 program with no UB, addresses, unspecified order, random/timing/file/network behavior or platform-dependent output.
4. For blanks, constrain the missing token and enumerate all intended exact alternatives. Use an MCQ or coding exercise if the valid answer space is broad.
5. Run generation, tests and the explicit content validator before deployment.

The final **12 output programs and 8 filled snippets** were actually compiled using **GCC 15.2.0 in the existing Vercel compiler snapshot**, deny-all networking and one ephemeral Hobby VM. Every output matched its authored key. Cleanup confirmed the VM stopped. The validation command was rerun after improving the shared-ownership trace; the retained artifact describes the final content. See [objective-content-validation.json](objective-content-validation.json).

```sh
# Node 24, existing authorized SDK/CLI credentials; maintenance only, not student grading.
node --import tsx scripts/validate-objective-content.ts
```

MCQ keys/distractors were source-reviewed and tested for stable-ID/shuffle correctness. They are not probabilistic grades. Educational difficulty labels are preserved, but no new real-learner pilot or psychometric equivalence study was conducted.

## F. History, sessions and persistence

No destructive migration or historical regrading is performed. Completed lessons, quiz/coding scores, verified passes, progress, historical answers, explanation feedback, mock reports and original exam scores remain intact. Archive types remain readable, including original numeric MCQ positions and free-text feedback.

Finalized retained sessions return their original outcome without running a grader again, even when their active expiry has passed. Once session TTL cleanup deletes that temporary record, the durable owned history remains available through review. Historical non-UUID document IDs and root-only latest attempts without IDs are supported safely by the review endpoint; active session IDs retain the UUID requirement.

Unfinished legacy sessions fail explicitly with HTTP 409 and a message that the format was updated and a new exam is required. The frontend provides a new-exam action. It does not transfer old answers, award zero, alter the old deadline or silently regrade an incompatible format. Already-finalized legacy outcomes are returned before compatibility checks.

The existing `users/{uid}`, historical exam subcollection and temporary session collection remain. Schema changes are optional version/type/option-ID/accepted-answer fields in trusted session data; existing question point summaries and bounded mastery summaries are reused. New objective grading causes **no per-question Firestore writes**. The coding partial-result cache and finalization transaction remain. The removed two explanation-cache writes per normal exam are no longer needed. The new review endpoint performs one owned historical-record read on demand. Root-only legacy/latest records use an owned progress read instead, or a second fallback read when a historical ID has no subcollection record. No history scan is added.

## G. Readiness

The existing exam-aware model, completion distinction, bounded recent question observations and both Overall Readiness / Readiness at Your Current Progress are retained. Exact earned/possible question points feed MCQ/output/blank evidence and proportional coding evidence. A changed `det-*` or `obj-*` identity does not overwrite the historical question's observations. Aggregate scores are not added a second time.

Historical authoritative question evidence remains based on saved results. Unknown historical outcomes are not invented. Unattempted assessments stay neutral; finalized unanswered questions retain actual zero credit. Needs Review remains deterministic and provides topic navigation. The removed conversational mock interview no longer has a live dashboard launch action or diagnostic dimension; its reports were already excluded from trusted overall readiness and remain stored historically.

## H. Security and UI

Preserved Firebase signature verification, revocation/disabled-user checks, project/database pinning, Firestore client-write restrictions, exam prerequisites, ownership, original deadlines/10-second grace, frozen submissions, transactional finalization, distributed quotas and all Sandbox boundaries. No Firestore rules changed.

Private question keys, accepted output/blank lists, explanations and internal grading fields are stripped from start/shuffle responses. `/api/assessment/exam/:id/review` requires authentication and an owned finalized historical/latest record. Submit responses expose authored answers only after finalization. Hidden coding test data remains redacted by the existing evaluator; the UI renders public test details only.

The client uses curriculum exam summaries rather than answer-bank imports. A Vite build guard rejects any private server/legacy bank module in frontend chunks. Development serving also denies server/runner files and secret patterns. No answer-bearing exam JSON is generated into public assets.

The existing exam view now renders four-option radio groups, read-only highlighted snippets, multiline output inputs, constrained blank inputs and the existing textarea-based exam coding entry. Inputs are controlled by stable question IDs; switching questions preserves their respective answers. Version guards prevent late start/review/submit responses from replacing a new view. Timer, answer counts, previous/next navigation, same-deadline shuffle, submission confirmation, frozen retry, results, authored explanations, public compiler feedback and relevant review links remain. Native labeled controls provide keyboard interaction and responsive wrapping/overflow classes preserve small-screen layout.

## I. Performance and dependencies

All runtime mentor, mock-interview, coding-review and explanation-model requests are eliminated. There are no new readiness model calls or new infrastructure.

A local Node 24 measurement of **2,000 seven-objective-question batches** averaged **0.0038 ms**, median **0.0012 ms**, p95 **0.0070 ms** after warmup. This measures in-process grading only, excluding auth, Firestore, compiler, API/browser/network and platform startup. See [objective-grading-local.json](objective-grading-local.json). It is not a production latency measurement or end-to-end guarantee.

Compiler execution/snapshot/batched-supervisor/cleanup code is unchanged, apart from removing an unused AI-feedback type import. A final trusted reference for `exam-estl-cc-2` ran through the actual Vercel runner: HTTP-style evaluator status 200, compiled, verified, **5/5 public+hidden tests passed**, snapshot hit, hidden details redacted and sandbox independently confirmed stopped. This direct fixture smoke test did not call the production API or write learner progress; see [deterministic-coding-smoke.json](deterministic-coding-smoke.json). No production coding-latency claim is made. Optional model-review latency is absent by construction.

Original build: initial JS approximately 986.89 kB raw / 261.18 kB gzip, ExamScreen approximately 130.77 / 42.01 kB gzip, plus separately loaded AI screens. Final initial JS is **989.31 kB raw / 263.20 kB gzip** (about 2.02 kB more gzip, not a claimed initial-bundle reduction). The exam chunk is **9.35 / 3.63 kB**, with readiness extracted into a shared **10.16 / 3.80 kB** chunk; AI screen chunks no longer exist. CSS is **59.74 / 9.72 kB**. SDK removal primarily reduces backend dependencies; Firebase remains a large frontend dependency. The existing large-chunk warning is not attributed to AI and is not suppressed.

## J. Verification

Final verification on Node **24.21.0**:

| Check | Actual result |
| --- | --- |
| `npm ci` | Passed; 523 packages installed; four moderate advisories noted above |
| `npm test -- --maxWorkers=1` | **280 passed, 25 files, 0 failures, 0 skipped**, 57.01 seconds; namespace used for existing local C++/loopback tests |
| `npm run lint` | Passed (TypeScript 5.8.3) |
| `npm run build` | Passed through the final Vercel local build, including content/schema validation, private-module guard and bundle budget |
| `vercel build --prod --yes` | Passed locally with CLI 64.0.2; no deployment |
| `npm run test:backend` | Passed on final source: native strict-loader startup and actual Firebase crypto/revocation fixtures |
| `npm run test:api-package` | Passed against final `.vercel/output/functions/api/index.func/api/index.js`: health 200, protected routes 401, removed AI routes 404 |
| Real registered exam coding smoke | Passed `exam-estl-cc-2`, 5/5 public+hidden tests, verified, snapshot restored, hidden data redacted, sandbox stopped |
| Trusted GCC 15 content validation | All 12 output programs and 8 blank programs compiled; output keys matched; sandbox stopped |
| `git diff --check` | Passed |

The suite caught and corrected a leftover loading-icon reference. Account-change session-response guards and root-only legacy history review are covered by regression tests. No failing final test was left unresolved.
 Validation includes clean installation; all existing native compiler, hidden-test, runtime/timeout, cleanup, snapshot, quota, authentication and readiness regressions; new objective normalization and answer-contract tests; no-key start responses; stable shuffled options; retired legacy sessions; durable historical review; frozen infrastructure retry; idempotent/concurrent finalization; four input renderers; question navigation/answer preservation; post-exam results; removed route 404s; private-bundle guards; strict-loader backend startup; and real snapshot-based authored-content validation.

Limits: no deployment/production browser testing; no new live Gemini calls; no live student-assessment submission benchmark. Firestore emulator tests were unavailable because Java/emulator tooling is not installed. HTTP persistence tests use the actual routes with an in-memory transactional adapter; separate native bundle tests exercise real Firebase cryptographic verification using isolated fixtures. Component tests verify native controls and state but are not physical-device/browser keyboard E2E tests. No billing changes, new paid services or production database edits were made.

## K. Complete changed-file list

- `.env.example`
- `README.md`
- `docs/compiler-backed-exam-grading.md`
- `docs/curriculum-teaching-review.md`
- `docs/deferred-curriculum-loading.md`
- `docs/deterministic-assessment-migration.md`
- `docs/deterministic-coding-smoke.json`
- `docs/exam-aware-readiness.md`
- `docs/objective-content-validation.json`
- `docs/objective-grading-local.json`
- `docs/optional-interview-practice.md`
- `docs/production-submission-latency.md`
- `docs/rubric-based-explanation-grading.md`
- `docs/security-assessment-hardening.md`
- `docs/vercel-sandbox-integration.md`
- `metadata.json`
- `package-lock.json`
- `package.json`
- `runner/README.md`
- `scripts/check-explanation-grading.ts`
- `scripts/check-frontend-bundle.mjs`
- `scripts/generate-curriculum-assets.ts`
- `scripts/measureSandboxLatency.ts`
- `scripts/validate-objective-content.ts`
- `server.ts`
- `server/assessExplanation.ts`
- `server/codeRunner.ts`
- `server/data/activeExams.ts`
- `server/data/legacyAssessment.ts`
- `server/data/legacyExams.ts`
- `server/data/legacyQuestionPools.ts`
- `server/data/objectiveReplacements.ts`
- `server/evaluateSubmission.ts`
- `server/explanationRegistry.ts`
- `server/security/json.ts`
- `server/security/progress.ts`
- `server/security/routes.ts`
- `src/App.tsx`
- `src/components/AiMentorDrawer.tsx`
- `src/components/CodeChallengeEditor.tsx`
- `src/components/ExamScreen.tsx`
- `src/components/ExamView.tsx`
- `src/components/MockInterviewView.tsx`
- `src/components/Navbar.tsx`
- `src/components/QuizModal.tsx`
- `src/components/ReadinessDashboard.tsx`
- `src/components/RoadmapView.tsx`
- `src/components/UnitView.tsx`
- `src/data/assessmentContent.ts`
- `src/data/examQuestionPools.ts`
- `src/data/examTopics.ts`
- `src/data/exams.ts`
- `src/lib/AssessmentContext.tsx`
- `src/lib/examGrading.ts`
- `src/lib/explanationRubric.ts`
- `src/lib/readinessAnalytics.ts`
- `src/types.ts`
- `tests/assessmentState.test.ts`
- `tests/curriculumAndProgression.test.ts`
- `tests/curriculumLoading.test.ts`
- `tests/curriculumTeaching.test.ts`
- `tests/deterministicExamView.test.tsx`
- `tests/deterministicExams.test.ts`
- `tests/examCodingIntegration.test.ts`
- `tests/examGrading.test.ts`
- `tests/examMastery.test.ts`
- `tests/explanationAssessment.test.ts`
- `tests/explanationGrading.test.ts`
- `tests/lessonNavigation.test.tsx`
- `tests/liveSandboxIntegration.ts`
- `tests/readinessAndWeakness.test.ts`
- `tests/readinessDashboard.test.tsx`
- `tests/runnerIntegration.test.ts`
- `tests/securityHardening.test.ts`
- `tests/submissionPerformance.test.ts`
- `tests/verifyBuiltBackend.mjs`
- `tests/verifyPackagedApi.mjs`
- `vite.config.ts`

The input `docs/remove-ai-dependency.md` was read without modification. Deleted files and private-bank relocations are included above. Generated frontend/server/package outputs are ignored build artifacts.

## L. Remaining limitations

- No production deployment, live production latency verification or live Firestore migration was performed.
- Optional Firestore emulator verification was unavailable; this is separate from the zero skipped Vitest tests.
- Browser/device end-to-end keyboard/mobile testing and real-learner difficulty validation remain unperformed; component controls/state are tested.
- Four moderate upstream tooling-chain advisories and the existing Vite large-chunk warning remain documented above.
- Existing private AI environment variables, if any, were not changed; no code reads or requires them.
- Temporary session retry outcomes remain available while that session record exists; durable history reviews survive session cleanup. No historical score is recreated or retroactively regraded after TTL deletion.
