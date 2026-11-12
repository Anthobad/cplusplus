# COMPLETE MIGRATION SPECIFICATION
## Remove All AI Dependencies and Convert the C++ Learning Platform to Fully Deterministic Assessment
 
**Project:** C++ Learning and Interview Preparation Platform  
**Primary stack:** React, TypeScript, Express, Firebase Authentication, Firestore, Vercel Sandbox, C++20  
**Deployment:** Vercel Hobby  
**Task type:** Full source-code migration, implementation, testing, and documentation  
**Deployment authorization:** NOT GRANTED

---

# 0. EXECUTIVE DIRECTIVE

Remove all generative AI functionality and runtime dependencies from this project.

The application must no longer require Gemini, Google Generative AI APIs, Groq, OpenAI, Anthropic, or any other language-model provider.

Replace AI-dependent assessment questions with objectively gradable questions while preserving the existing compiler-backed C++ evaluation infrastructure.

The resulting platform must provide:

1. Structured C++ lessons.
2. Topic quizzes.
3. Compiler-backed C++ coding challenges.
4. Deterministically graded exams.
5. Objective code-understanding questions.
6. Predict-the-output questions.
7. Fill-in-the-blank questions.
8. Server-authoritative grading.
9. Firebase progress persistence.
10. Exam history.
11. Topic mastery and readiness analytics.
12. Coding-based interview preparation.

**The entire application must function without any AI API key, model, prompt, or external AI service.**

Do not replace Gemini with another provider.

Do not add local LLM inference.

Do not use AI to grade any student answer at runtime.

Do not introduce paid services.

Do not deploy automatically.

## Implementation authority

This specification establishes the required product behavior and grading rules.

You may adapt internal types, function signatures, and file organization to the existing repository, but you must not independently change the product requirements.

When the current architecture differs from an example in this document:

- Preserve the existing architecture where possible.
- Implement the specified observable behavior.
- Prefer small, backward-compatible changes.
- Document any unavoidable deviation.
- Never silently weaken security or grading correctness.

Do not stop merely to request implementation preferences already resolved by this specification.

If a requirement is technically impossible without violating a security or data-integrity constraint, stop that portion and report the blocker. Do not invent a workaround that changes the intended behavior.

---

# 1. FIRST PHASE: REPOSITORY INVENTORY

Before changing code, inspect the complete repository.

Do not assume that file paths or structures described here are still current.

Identify:

### Frontend

- Main application routing.
- Curriculum views.
- Topic lesson views.
- Practice coding editor.
- Exam interface.
- Readiness dashboard.
- Interview practice.
- AI mentor/chat interfaces.
- Mock interview interface.
- All AI-related controls and loading states.

### Backend

- Express entrypoints.
- API route registration.
- Firebase Admin initialization.
- Authentication middleware.
- Quota middleware.
- Vercel Sandbox runner.
- Compiler snapshot configuration.
- Trusted challenge registries.
- Exam session creation.
- Exam submission.
- Server-side grading.
- Progress persistence.
- AI provider integration.

### Data

- Canonical curriculum topics.
- Topic quizzes.
- Exam question pools.
- Fallback exam questions.
- Coding challenge registries.
- Explanation question registries.
- Code-analysis question registries.
- Readiness evidence models.
- Firestore document schemas.
- Historical exam records.

### Configuration

- package.json.
- package-lock.json.
- Environment variable definitions.
- Vercel configuration.
- Build scripts.
- Backend bundling scripts.
- TypeScript configuration.
- Firestore rules.
- Documentation.
- Automated tests.

Produce an internal dependency map before editing.

The map must distinguish:

1. AI-only code that can be deleted.
2. Shared code that must remain.
3. AI-dependent code that requires replacement.
4. Historical-data compatibility code that must remain.

Do not remove shared utilities simply because they are imported by an AI feature.

---

# 2. FINAL PRODUCT ARCHITECTURE

The final platform must have two principal assessment mechanisms.

## 2.1 Deterministic objective grading

Used for:

- Multiple-choice questions.
- Predict-the-output questions.
- Fill-in-the-blank questions.
- Existing objectively gradable topic quizzes.

These questions must be graded against trusted, predefined answers.

No LLM requests.

No unnecessary Vercel Sandbox execution during student grading.

## 2.2 Compiler-backed grading

Used for:

- Practice coding challenges.
- Exam coding challenges.
- Coding-based interview practice.
- Any existing trusted compiler-validated code exercise.

The compiler must remain the source of truth for executable code correctness.

Preserve:

- C++20.
- GCC 15 where currently configured.
- Vercel Sandbox isolation.
- Compiler snapshot restoration.
- Public and hidden tests.
- Partial credit.
- Execution limits.
- Network restrictions.
- Sandbox cleanup.
- Authentication.
- Distributed quotas.

Do not move student code execution to the Express host or Vercel function process.

---

# 3. REMOVE ALL GENERATIVE AI FEATURES

Completely remove the following active functionality.

## 3.1 AI mentor

Remove:

- Mentor chat UI.
- Mentor conversation state.
- Mentor API route.
- Prompt construction.
- Model invocation.
- AI mentor navigation.
- Mentor-specific loading and error states.
- Mentor-only persistence, if safe to remove.

Do not delete unrelated student data.

## 3.2 AI coding feedback

Remove:

- Gemini-based code reviews.
- Qualitative AI feedback requests.
- AI feedback checkboxes.
- AI feedback loading indicators.
- AI feedback response rendering.
- AI review-specific API parameters.
- AI review-specific quotas.
- AI review-specific performance instrumentation.

Preserve compiler feedback, including:

- Compilation errors.
- Runtime errors.
- Timeout results.
- Test pass/fail results.
- Public test details.
- Verified grading status.
- Deterministic score calculations.

The student must still receive meaningful compiler and test feedback.

## 3.3 AI explanation grading

Remove:

- LLM-based explanation scoring.
- AI rubric evaluation.
- Model-generated correctness scores.
- Model-generated reasoning scores.
- Model-generated limitation scores.
- AI explanation grading API routes.
- Provider-specific retries and fallbacks.

Replace active explanation questions with the objective question types specified later.

## 3.4 AI mock interviews

Remove generative conversational mock interviews.

Preserve independent coding interview practice.

If the current mock-interview feature contains reusable objective questions, migrate those questions into an existing deterministic practice feature when their correctness can be verified.

Otherwise remove the AI-only interface cleanly.

Do not leave a navigation item that opens a disabled AI feature.

## 3.5 AI configuration and dependencies

Remove unused:

- Gemini environment variables.
- Model identifiers.
- API-key requirements.
- Generative AI SDK packages.
- Provider-specific clients.
- Prompt templates.
- AI-specific error classes.
- AI-specific documentation.
- AI-specific tests.
- Dead feature flags.

Do not remove Firebase dependencies or Google libraries required for Firebase authentication.

Do not remove packages indirectly required by Vercel Sandbox.

Inspect the actual dependency graph before uninstalling anything.

---

# 4. CANONICAL EXAM QUESTION TYPES

The active exam system must support exactly four logical question types:

1. `mcq`
2. `predict_output`
3. `fill_blank`
4. `coding`

If the existing code uses different identifiers, introduce a compatibility layer rather than breaking historical records.

Historical AI-based question types may remain recognized by archival readers but must not be selectable for new exams.

## 4.1 Shared question properties

Every active exam question must have:

- Stable unique ID.
- Exam eligibility or pool membership.
- Question type.
- Difficulty.
- Student-visible prompt.
- Point value.
- Canonical curriculum topic mapping where applicable.
- Trusted grading configuration.
- Authored explanation shown after grading.
- Schema version or equivalent compatibility mechanism.

Use existing canonical topic IDs.

Do not invent topic identifiers that do not exist.

Keep correct answers and hidden grading metadata server-side.

---

# 5. QUESTION TYPE A: MULTIPLE CHOICE

## 5.1 Purpose

MCQs should evaluate:

- C++ concepts.
- Language rules.
- Debugging.
- Algorithm behavior.
- Complexity.
- Object lifetime.
- Memory ownership.
- STL usage.
- Code interpretation.
- Common programming mistakes.

## 5.2 Format

Each question must have:

- One prompt.
- Exactly four answer options.
- Exactly one correct option.
- One trusted answer key.
- One authored explanation.
- Relevant topic metadata.

Use stable option IDs rather than relying on displayed option positions.

## 5.3 Code explanation MCQs

Code-explanation questions are ordinary MCQs containing a C++ snippet.

Example:

```cpp
int x = 5;
int& y = x;
y += 3;
```

Question:

What does this code demonstrate?

A. `y` is a copy of `x`.
B. `y` is a reference to `x`.
C. `x` becomes constant.
D. `y` owns dynamically allocated memory.

Correct answer: B.

Explanation:

`y` refers to the same object as `x`, so modifying `y` modifies `x`.

## 5.4 Grading

Correct answer: 100% of question points.

Incorrect answer: 0%.

Unanswered: 0%.

No partial credit for single-answer MCQs.

Option order may be shuffled, but the server must grade by stable option ID.

---

# 6. QUESTION TYPE B: PREDICT THE OUTPUT

## 6.1 Purpose

Students inspect a C++20 program and predict its exact observable output.

Questions should emphasize reasoning about:

- Loops.
- Recursion.
- References.
- Pointers.
- Constructors and destructors.
- Inheritance.
- Virtual dispatch.
- STL containers.
- Iterators.
- Algorithms.
- Operator behavior.
- Object lifetime.
- Value versus reference semantics.

## 6.2 Presentation

Display a syntax-highlighted, read-only C++ snippet.

Ask:

"What is the output of this program?"

Use a single-line or multiline text input.

Do not execute student-supplied code for this question type.

## 6.3 Example

```cpp
#include <iostream>

int main() {
    int a = 4;
    int& b = a;
    b *= 2;
    std::cout << a << '\n';
}
```

Expected output:

```text
8
```

## 6.4 Correctness requirements

Every output question must:

- Compile as C++20.
- Execute deterministically.
- Have a stable expected output.
- Avoid undefined behavior.
- Avoid unspecified evaluation order.
- Avoid implementation-dependent output.
- Avoid random numbers.
- Avoid locale-dependent formatting.
- Avoid addresses or pointer values.
- Avoid external files, networking, or timing.
- Avoid platform-specific assumptions.

Verify the authored expected output using the existing trusted compiler environment during development or content validation.

Do not execute every question again during normal exam grading.

## 6.5 Output normalization

Apply these rules to both the expected output and student answer:

1. Convert CRLF and CR line endings to LF.
2. Remove trailing spaces and tabs from each line.
3. Remove leading and trailing completely blank lines.
4. Preserve spaces within lines.
5. Preserve internal line breaks.
6. Preserve letter case.
7. Preserve punctuation.
8. Preserve numeric formatting.
9. Do not collapse multiple internal spaces.
10. Do not parse or reinterpret numeric output.

For example:

`8` and `8\n` are equivalent.

`Hello World` and `hello world` are not equivalent.

`1 2` and `12` are not equivalent.

`3.0` and `3` are not equivalent unless explicitly listed as accepted outputs.

## 6.6 Grading

Exact normalized match: full points.

Otherwise: zero points.

Allow a finite trusted list of accepted outputs only when all alternatives are intentionally valid.

Do not use fuzzy matching or AI semantic comparison.

---

# 7. QUESTION TYPE C: FILL IN THE BLANK

## 7.1 Purpose

Test whether students can identify the correct C++ syntax, expression, keyword, or short statement.

Examples include:

- Completing a loop.
- Choosing the correct STL method.
- Completing a template declaration.
- Writing a reference declaration.
- Selecting a standard algorithm.
- Completing a recursive base case.

## 7.2 Presentation

Display a code snippet with exactly one numbered blank.

Example:

```cpp
std::vector<int> values{1, 2, 3};

values.____(4);
```

Prompt:

"Fill in the missing method name."

Accepted answer:

`push_back`

## 7.3 Grading strategy

For this migration, use **short, constrained blanks with trusted accepted-answer lists**.

Do not introduce a new per-answer compiler execution pipeline for fill-in-the-blank questions.

This avoids extra Sandbox latency and unnecessary quota consumption.

## 7.4 Accepted answers

Each question must define one or more accepted answers.

Normalization:

1. Trim leading and trailing whitespace.
2. Preserve case sensitivity.
3. Preserve internal spaces unless explicitly accepted.
4. Do not remove punctuation automatically.
5. Do not infer semantic equivalence.
6. Do not use fuzzy matching.

For example:

`push_back` is accepted.

`Push_Back` is rejected.

If both `std::size_t` and `size_t` are valid in a particular snippet, explicitly include both where appropriate.

## 7.5 Question authoring constraints

Avoid questions where many different valid C++ expressions could complete the blank.

Do not create questions that unfairly reject correct alternative solutions.

If the answer space is too broad, convert the question to an MCQ or a coding challenge.

## 7.6 Grading

Accepted normalized answer: full points.

Otherwise: zero points.

No partial credit for a single short blank.

---

# 8. QUESTION TYPE D: CODING CHALLENGES

Preserve the existing compiler-backed coding-question system.

## 8.1 Required behavior

Students write C++20 code in the existing editor.

The server:

1. Authenticates the student.
2. Validates the exam session.
3. Retrieves the trusted challenge.
4. Compiles code in Vercel Sandbox.
5. Runs public and hidden tests.
6. Calculates the score.
7. Saves authoritative results.
8. Finalizes the exam transactionally.

## 8.2 Partial credit

Preserve the existing test-based partial-credit policy.

Do not replace it with AI evaluation.

Do not trust browser-provided test results.

Do not expose hidden tests.

## 8.3 Failure behavior

Compilation failure: zero points for that question.

Runtime failure: grade according to the existing trusted test policy.

Timeout: grade according to the existing trusted policy.

Infrastructure failure: do not treat it as an incorrect student answer.

Preserve the existing retry/frozen-submission protections.

## 8.4 Security

Preserve:

- Sandboxed execution.
- Restricted filesystem and networking.
- Process limits.
- Memory limits.
- CPU/time limits.
- Nonprivileged student execution.
- Trusted test isolation.
- Snapshot security checks.
- Sandbox cleanup.

Do not modify compiler infrastructure solely to remove Gemini.

---

# 9. EXAM CONTENT MIGRATION

## 9.1 Replace active AI-graded questions

Locate all active explanation and code-analysis questions requiring an LLM.

For every such question:

1. Identify its learning objective.
2. Identify its canonical topic.
3. Identify its difficulty.
4. Create a deterministic replacement.
5. Preserve the intended cognitive difficulty.
6. Write a correct answer.
7. Write a clear authored explanation.
8. Add the question to the appropriate exam pool.
9. Remove the AI-dependent question from active selection.

Do not automatically convert free-text answers into exact-string questions.

## 9.2 Replacement distribution

Use this target distribution for non-coding replacement questions:

- 40% conceptual or code-explanation MCQs.
- 35% predict-the-output.
- 25% fill-in-the-blank.

Round counts to whole questions while preserving topic coverage.

Preserve the existing number of coding questions unless a specific exam configuration requires otherwise.

Do not alter existing exam lengths or time limits merely to satisfy this distribution.

## 9.3 Content quality

Every replacement question must have:

- A clear correct answer.
- No ambiguity.
- Appropriate difficulty.
- A meaningful explanation.
- Correct C++20 behavior.
- Valid topic mapping.

Avoid repeated near-identical questions.

Avoid trivially guessable distractors.

Do not reduce advanced explanation questions to basic terminology memorization.

## 9.4 Existing objective questions

Keep existing valid MCQs and coding questions.

Do not rewrite them unnecessarily.

Audit existing questions for incorrect answer keys or ambiguous behavior.

Preserve stable IDs where the question's meaning and grading remain unchanged.

Use new IDs for materially different replacement questions.

---

# 10. EXAM COMPOSITION

Preserve existing exam identities, curriculum coverage, session deadlines, and overall point budgets.

Use the following selection policy:

1. Retain the existing number of coding questions per exam.
2. Retain the existing total number of questions wherever feasible.
3. Replace AI-dependent questions with the new deterministic types.
4. Maintain approximately the existing difficulty distribution.
5. Preserve required curriculum coverage.
6. Ensure no new exam selects an AI-graded question.
7. Avoid duplicate question IDs in one exam.
8. Preserve stable question IDs throughout a session.
9. Preserve question order/shuffling behavior.
10. Preserve the original exam deadline when shuffling or navigating.

Do not silently shorten exams.

Do not make exams easier simply because AI grading was removed.

---

# 11. SERVER-AUTHORITATIVE ANSWER SECURITY

This is critical.

Do not expose correct answers before exam finalization.

The server must retain:

- MCQ answer keys.
- Accepted output strings.
- Accepted fill-in-the-blank answers.
- Hidden coding tests.
- Internal grading metadata.

The frontend should receive only the student-visible question data required for rendering.

Do not place correct answers in client-side JSON assets that can be downloaded through the browser.

Do not include hidden answers in server responses, error messages, or console logs.

After a finalized exam, the student may receive the correct answer and authored explanation for review.

The post-exam review endpoint must verify session ownership and finalization.

---

# 12. EXAM SUBMISSION CONTRACT

Preserve the existing authenticated server-side exam submission architecture.

Use a discriminated answer model or equivalent validation.

Conceptually:

```ts
type ExamAnswer =
  | {
      questionId: string;
      type: "mcq";
      selectedOptionId: string;
    }
  | {
      questionId: string;
      type: "predict_output";
      output: string;
    }
  | {
      questionId: string;
      type: "fill_blank";
      answer: string;
    }
  | {
      questionId: string;
      type: "coding";
      code: string;
    };
```

Adapt this to the existing API and persistence model.

Validate:

- Question ID.
- Question type.
- Session ownership.
- Allowed answer shape.
- Maximum input length.
- Duplicate answers.
- Missing answers.
- Unexpected fields.
- Session expiration.
- Submission finalization status.

Reject malformed or forged submissions.

Never accept client-provided scores or answer keys.

---

# 13. SCORING RULES

Preserve existing exam point budgets.

For objective questions:

- Correct = full points.
- Incorrect = zero points.
- Unanswered = zero points.

For coding:

- Preserve existing compiler-backed partial credit.

Use:

`earnedPoints / availablePoints * 100`

for final exam percentage.

Use trusted server-side values only.

Avoid floating-point inconsistencies in persisted scores.

Ensure scores remain between 0 and 100.

Do not add arbitrary AI-derived bonuses or penalties.

---

# 14. TOPIC MASTERY AND READINESS INTEGRATION

Inspect the current implementation first.

The repository may already contain recent improvements that associate exam questions with canonical curriculum topics.

If those improvements exist, preserve and integrate with them.

If they do not exist, implement the minimal compatible topic-evidence integration needed for the new question types.

## 14.1 Required behavior

Each new question contributes performance evidence to its mapped curriculum topic.

Examples:

- Incorrect pointer-output question affects Pointers mastery.
- Incorrect recursion MCQ affects Recursion mastery.
- Correct STL fill-in-the-blank contributes positive STL evidence.
- Partial-credit coding questions contribute proportional evidence.

## 14.2 Preserve distinctions

Do not conflate:

- Lesson completion.
- Topic mastery.
- Overall readiness.

Completing a lesson must remain completed even if the student later performs poorly on an exam.

## 14.3 Avoid double-counting

Do not count the same exam result once as an aggregate exam score and again as question-level evidence without an explicit weighting design.

Prefer the existing exam-aware mastery model if present.

## 14.4 Historical evidence

Preserve historical AI-graded results as historical records.

Do not fabricate question-level results that were never saved.

Do not retroactively regrade old answers.

Do not delete existing exam history.

## 14.5 Needs Review

The Needs Review section must continue identifying weak topics based on trusted assessment evidence.

Use deterministic explanations.

No Gemini requests.

---

# 15. HISTORICAL DATA COMPATIBILITY

The migration must be non-destructive.

Existing users may have:

- Completed lessons.
- Saved quiz scores.
- Completed coding challenges.
- Completed AI-graded exams.
- Historical explanation answers.
- Historical AI-generated feedback.
- Readiness history.

Preserve legitimate historical records.

## 15.1 Old exam sessions

Use the following policy:

- Finalized historical exams remain readable.
- Existing scores remain unchanged.
- Old question types may be displayed in historical review.
- New exam sessions never select AI-dependent questions.
- Already-finalized submissions remain idempotent.
- Active legacy sessions containing AI-dependent questions must not be silently regraded using different rules.

For active legacy sessions that cannot be graded without AI, implement a safe explicit retirement flow:

1. Detect the incompatible session version.
2. Prevent submission under the new grading system.
3. Explain that the exam format has been updated.
4. Allow the student to start a new exam.
5. Do not record a failing grade for the retired session.
6. Preserve previously finalized history.
7. Do not silently transfer answers between incompatible exams.

## 15.2 Schema changes

Prefer additive, backward-compatible schema changes.

Do not perform destructive Firestore migrations.

Do not rewrite existing historical scores.

Do not change Firestore security rules unless strictly necessary.

---

# 16. FRONTEND MIGRATION

Update the existing interface without redesigning the entire website.

## 16.1 Remove AI UI

Remove:

- Mentor navigation.
- AI chat.
- AI code feedback panels.
- AI feedback checkboxes.
- AI mock interview chat.
- AI explanation-grading indicators.
- Gemini-specific error messages.
- AI-specific loading animations.

Remove unused components and imports.

## 16.2 New exam interfaces

Implement:

### MCQ

Four selectable options.

Clear selected state.

Keyboard accessibility.

### Predict output

Read-only syntax-highlighted code.

Multiline answer input.

Preserve meaningful whitespace.

### Fill in the blank

Read-only code snippet with a visible blank.

Single short-answer input.

### Coding

Reuse existing code editor.

Preserve test results and submission behavior.

## 16.3 Navigation and state

Preserve:

- Exam question navigation.
- Question progress.
- Timer.
- Answer persistence within the active session.
- Submission confirmation.
- Topic navigation.
- Responsive layout.

Do not reintroduce the previous stale-editor-state bug.

Use stable question and topic IDs for component identity.

Prevent stale asynchronous responses from affecting newly selected questions.

## 16.4 Results interface

After finalization, display:

- Overall score.
- Earned/available points.
- Per-question score.
- Correct/incorrect status.
- Authored explanation.
- Correct objective answer.
- Compiler-backed coding results where permitted.
- Relevant topics needing review.

Do not expose hidden test inputs or expected outputs.

---

# 17. INTERVIEW PREPARATION

Preserve the existing independent Interview Practice feature.

Retain:

- Binary search.
- BFS.
- DFS.
- Backtracking.
- Dynamic programming.
- Other registered coding patterns.

Preserve compiler-backed interview challenges.

Remove conversational AI mock interviewing.

Do not replace it with another chatbot.

If a separate non-AI mock interview can be preserved without substantial new architecture, retain it only if it already uses deterministic grading.

Do not build a new mock-interview engine as part of this migration.

---

# 18. FIREBASE AND SECURITY REQUIREMENTS

Preserve the current security architecture.

Specifically:

- Firebase ID-token verification.
- Revocation checking.
- Disabled-user checking.
- Project/database pinning.
- Firestore write restrictions.
- Server-authoritative progress.
- Exam session ownership.
- Server-controlled question selection.
- Transactional exam finalization.
- Frozen submissions.
- Idempotent retries.
- Distributed quotas.
- Sandbox isolation.
- Hidden-test confidentiality.

Do not create new unauthenticated grading endpoints.

Do not weaken quotas to improve apparent performance.

Do not store secrets in frontend bundles.

Do not enable Firebase billing.

---

# 19. PERFORMANCE REQUIREMENTS

Removing AI should reduce application complexity and eliminate model-related latency.

## 19.1 Objective questions

MCQ, output prediction, and fill-in-the-blank grading should require:

- No AI requests.
- No Sandbox execution.
- No external grading API.

Grade them locally within the trusted backend process.

## 19.2 Coding questions

Preserve existing Vercel Sandbox performance optimizations.

Do not remove:

- Compiler snapshots.
- Batched execution.
- Trusted supervisor.
- Sandbox cleanup.
- Timing instrumentation.

## 19.3 Firestore

Avoid extra writes per objective question.

Prefer final transactional exam submission and existing progress persistence patterns.

Do not create unnecessary collections.

## 19.4 Build

Remove unused AI dependencies from production bundles.

Preserve the ESM compatibility fix previously implemented for Firebase Admin and Vercel Sandbox.

Do not revert backend bundling changes.

---

# 20. TESTING PLAN

Implement comprehensive automated tests.

## 20.1 AI removal

Verify:

1. No runtime AI provider SDK is imported.
2. No active AI endpoint remains.
3. No AI API key is required.
4. No model request occurs during grading.
5. No AI navigation dead ends remain.
6. No AI-specific UI remains.

## 20.2 Objective grading

Verify:

7. Correct MCQ receives full credit.
8. Incorrect MCQ receives zero.
9. Shuffled options preserve correctness.
10. Correct output prediction receives full credit.
11. Output line-ending normalization.
12. Internal whitespace preservation.
13. Case sensitivity.
14. Incorrect output receives zero.
15. Correct fill-in-the-blank receives full credit.
16. Accepted aliases work.
17. Incorrect capitalization fails when significant.
18. Unexpected punctuation fails.
19. Empty answers receive zero.
20. Oversized answers are rejected.

## 20.3 Coding grading

Verify:

21. Correct C++ solution passes.
22. Compilation errors are handled.
23. Runtime errors are handled.
24. Timeouts are handled.
25. Hidden tests remain private.
26. Partial credit is correct.
27. Infrastructure failure is not treated as a student mistake.
28. Sandbox cleanup occurs.

## 20.4 Exam integrity

Verify:

29. Server-side answer keys cannot be retrieved before finalization.
30. Forged scores are rejected.
31. Forged question IDs are rejected.
32. Incorrect answer types are rejected.
33. Duplicate answers are rejected.
34. Exam deadlines remain enforced.
35. Frozen submissions cannot be modified.
36. Retried finalization is idempotent.
37. Question shuffling preserves session identity.
38. Concurrent submissions do not duplicate grades.

## 20.5 Historical compatibility

Verify:

39. Historical AI-graded exams remain readable.
40. Historical scores remain unchanged.
41. Legacy incompatible active sessions are retired safely.
42. New exams contain no AI-dependent questions.
43. Existing lesson completion is preserved.
44. Existing coding progress is preserved.

## 20.6 Readiness

Verify:

45. MCQ evidence contributes correctly.
46. Output-question evidence contributes correctly.
47. Fill-in-the-blank evidence contributes correctly.
48. Coding partial credit contributes proportionally.
49. Exam evidence is not double-counted.
50. Weak topics appear in Needs Review.
51. Historical evidence remains compatible.
52. Readiness scores remain bounded between 0 and 100.

## 20.7 Frontend

Verify:

53. All four question types render correctly.
54. Navigation preserves current answers.
55. Switching questions does not leak previous state.
56. Exam submission works.
57. Results and explanations render correctly.
58. Mobile layouts remain usable.
59. Keyboard navigation works.
60. Removed AI routes are not referenced.

---

# 21. VALIDATION COMMANDS

Run the repository's actual scripts.

At minimum:

```bash
npm ci
npm test
npm run lint
npm run build
```

Also run existing:

- Backend startup tests.
- Vercel API packaging tests.
- Compiler grading tests.
- Snapshot contract tests.
- Firestore emulator tests where available.
- Exam persistence tests.
- Readiness regression tests.
- Frontend component tests.

Do not claim a test passed unless it actually ran.

If credentials or cloud access are unavailable, clearly distinguish local verification from live production verification.

Do not trigger expensive cloud benchmarks unnecessarily.

---

# 22. IMPLEMENTATION ORDER

Execute the migration in this order:

### Phase 1 — Audit

Inspect the repository and document dependencies.

### Phase 2 — Data models

Introduce deterministic question types and trusted answer schemas.

### Phase 3 — Grading

Implement and test server-side objective grading.

### Phase 4 — Content

Replace AI-dependent questions and validate question quality.

### Phase 5 — Exam integration

Update selection, sessions, submissions, results, and history compatibility.

### Phase 6 — Readiness

Integrate the new question types into existing topic mastery calculations.

### Phase 7 — Frontend

Implement new question interfaces and remove AI-dependent screens.

### Phase 8 — Dependency cleanup

Remove AI SDKs, prompts, routes, environment variables, and dead code.

### Phase 9 — Regression testing

Run the full test suite and fix regressions.

### Phase 10 — Documentation

Update README, deployment instructions, question-authoring documentation, and architecture notes.

Do not deploy.

---

# 23. NON-NEGOTIABLE CONSTRAINTS

Do not:

- Introduce another AI provider.
- Require an LLM API key.
- Use LLM grading.
- Expose answer keys.
- Trust browser-submitted grades.
- Remove Vercel Sandbox.
- Move C++ execution to the server host.
- Remove hidden tests.
- Weaken authentication.
- Weaken Firestore rules.
- Reset student progress.
- Delete historical exams.
- Fabricate historical grading evidence.
- Change Firebase projects or databases.
- Enable paid services.
- Enable billing.
- Change compiler snapshot security policy.
- Remove backend ESM compatibility fixes.
- Deploy automatically.

---

# 24. FINAL ACCEPTANCE CRITERIA

The migration is complete only when:

- The website runs without any AI API credentials.
- No active feature calls a generative AI model.
- All new exams use deterministic grading.
- All four supported question types work.
- Coding questions still compile in Vercel Sandbox.
- Existing curriculum and coding practice remain functional.
- Historical exam records are preserved.
- Existing Firebase progress remains intact.
- Topic readiness works with the new question types.
- Correct answers remain protected until finalization.
- No AI-related broken navigation remains.
- TypeScript checks pass.
- Automated tests pass.
- Production build passes.
- Backend startup checks pass.
- Documentation reflects the new architecture.

---

# 25. REQUIRED FINAL REPORT

When finished, provide a structured report containing:

## A. Previous architecture

Explain every AI integration that existed and why it was used.

## B. Removed features

List all deleted AI components, routes, SDKs, prompts, and configuration.

## C. New assessment architecture

Explain each question type and its deterministic grading behavior.

## D. Question migration statistics

Report:

- Number of AI questions removed.
- Number of MCQs added.
- Number of output questions added.
- Number of fill-in-the-blank questions added.
- Number of coding questions preserved.
- Number of questions per exam.
- Topic coverage.
- Difficulty distribution.

## E. Grading correctness

Explain how answer keys and expected outputs were validated.

## F. Historical compatibility

Explain how old exams and active legacy sessions are handled.

## G. Readiness integration

Explain how new question results contribute to topic mastery.

## H. Security verification

Confirm that authentication, hidden tests, Firestore protections, and server-authoritative grading remain intact.

## I. Performance

Report:

- Removed AI network requests.
- Objective grading latency from local tests.
- Whether coding latency changed.
- Any new Firestore operations.
- Production bundle size changes.

## J. Tests

Report exact test counts, failures, skipped tests, and build results.

## K. Changed files

Provide the complete changed-file list.

## L. Remaining limitations

Clearly identify anything not fully verified.

---

# 26. FINAL INSTRUCTION

Complete this as a production-quality migration, not a superficial removal of Gemini references.

The final website should be a **fully deterministic C++ education and interview-preparation platform** built around trusted compilation, objective assessment, structured learning, and meaningful readiness analytics.

Prioritize:

1. Correctness.
2. Security.
3. Historical data integrity.
4. Educational quality.
5. Reliability.
6. Maintainability.
7. Performance.
8. Visual consistency.

Do not deploy until I explicitly approve the changes.

Proceed with repository inspection, implementation, testing, and the final report.