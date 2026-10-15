# Rubric-based exam explanations

Priority 2 replaces keyword matching for all 34 registered explanation and code-analysis questions. Coding answers continue to use the existing compiler-backed evaluator. Exam IDs, sampling, weights, durations, pass thresholds, progression and saved history are preserved.

Each question has trusted server-side expectations for technical correctness (50%), reasoning/application (35%), and relevant assumptions, limitations or corrections (15%). The interface displays these criteria before submission. Each receives 0 (absent/incorrect), 1 (partial) or 2 (sufficient). The server computes the weighted percentage and scales it to the question's existing points. Partial central correctness caps the percentage at 75%; absent central correctness or an explicit fundamental contradiction caps it at 25%. There is no automatic minimum credit. Empty answers earn zero without an AI call.

The model judges meaning rather than counting terms. Correct paraphrases are accepted; keyword lists and requests to override grading are not evidence of understanding. Positive ratings and fundamental contradictions require excerpts actually present in the submitted answer. Results include criterion ratings, quoted evidence and improvement feedback. Model ID and rubric version are stored with new attempts; old attempts require no migration.

This is AI-assisted assessment, not proof of understanding. Checking that a quote occurs in an answer does not prove the model interpreted it correctly. Instructor calibration and learner feedback remain necessary, especially before consequential use. No human-review workflow is implied by the service's uncertain-result response.

## Service and configuration

`POST /api/assess-explanation` accepts only the registered `questionId` and `studentAnswer` as grading inputs. Questions, reference answers and question-specific expectations come from the server registry. The model returns structured criterion judgments; application code validates the response and calculates points. Client-supplied rubrics, references and point totals cannot control this endpoint.

Configure the existing server-only `GEMINI_API_KEY`. Optional `EXAM_GRADING_MODEL` selects the model; the default is `gemini-3.8-flash`. Do not expose these credentials through Vite variables. The server's existing environment-loading behavior is unchanged. This uses Google's [structured-output API](https://ai.google.dev/gemini-api/docs/structured-output) and the [Gemini 3.8 Flash model](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash). Other site AI features retain their existing model settings.

Provider timeouts, invalid responses, unavailable configuration and uncertain judgments prevent finalization; they do not fabricate a zero or save a completed attempt. Answers remain in the current view for retry. Answers are not newly persisted as drafts and can still be lost on reload. Existing timer-expiry locking and compiler-error scoring remain unchanged.

Successful assessments are cached in memory for 15 minutes (at most 200 entries), keyed by answer hash, question, model and rubric version. Identical in-flight requests share work. Each instance allows four concurrent unique evaluations and 30 new requests per client address per ten minutes. These are best-effort instance-local limits, not distributed quotas or authentication. No raw provider errors or credentials are returned to the browser.

## Verification

The 186-test suite passes, along with TypeScript checking and the production build. Deterministic tests cover all registered questions, rubric weighting/caps, evidence validation, invalid model output, unknown IDs, client metadata manipulation, provider failures, uncertainty, rate bounds, caching, retry and frontend grading contracts. Existing real-compiler regression tests remain passing. The existing frontend bundle warning remains.

Live semantic calibration has not passed: provider requests returned availability errors. Run `node --import tsx scripts/check-explanation-grading.ts` to retry synthetic paraphrase, partial-credit, contradiction, irrelevant-answer, keyword-list and instruction-injection checks. This opt-in script uses the configured service and may incur API usage; it stops on the first service/validation error and never logs credentials or provider error bodies. Mocked tests verify integration behavior, not the model's grading accuracy. No deployment or production verification was performed.

Implementation: `server/explanationRegistry.ts`, `server/assessExplanation.ts`, `src/lib/explanationRubric.ts`, `src/lib/examGrading.ts`, and `src/components/ExamView.tsx`.
