# Task: Implement Exam-Aware Topic Mastery and Readiness Analytics

## 1. Project Context

The platform includes:

- A structured C++ curriculum with lessons, quizzes, and coding challenges.
- Topic completion and progress tracking.
- Multiple exams containing multiple-choice, coding, explanation, and code-analysis questions.
- Compiler-backed coding evaluation with public and hidden tests.
- AI-assisted explanation grading.
- A readiness dashboard showing skill categories and areas needing review.
- Firebase authentication and Firestore progress persistence.

The goal is to make the readiness system more accurate, meaningful, and diagnostically useful.

**Important: Do not immediately implement my suggested architecture. First inspect the current source code, understand the existing readiness calculation, exam data models, grading system, and persistence structure, then choose the simplest robust implementation that fits the project.**

My proposed solution is to associate each exam question with its relevant curriculum topic(s), then use question-level exam performance as evidence when calculating topic mastery and readiness.

You may improve this design if you identify a better approach.

---

## 2. The Problem

Currently, a student can achieve excellent results on individual topic quizzes and coding challenges but perform poorly on related questions in an exam.

The readiness system may still report high readiness because exam performance is not sufficiently reflected at the individual topic level.

For example:

- Student completes the Pointers lesson.
- Student scores 100% on its quiz.
- Student passes its coding challenge.
- Student later fails several pointer-related questions in an exam.
- The readiness dashboard still considers Pointers mastered and does not recommend reviewing it.

This is misleading.

**The system should recognize that passing a lesson does not necessarily mean the student has mastered that topic.**

At the same time, an isolated mistake should not cause an unreasonable readiness penalty.

---

## 3. Required Initial Investigation

Before modifying code:

1. Locate the current readiness calculation and all functions that consume its results.
2. Inspect the curriculum structure and canonical topic identifiers.
3. Inspect all exam question pools, including fallback questions.
4. Inspect the server-authoritative grading pipeline for MCQs, coding challenges, explanations, and code-analysis questions.
5. Determine what per-question scores and outcomes are already persisted.
6. Inspect Firestore progress and exam-history schemas.
7. Determine how the Needs Review section is generated.
8. Identify any existing topic/question relationships that can be reused.
9. Inspect current tests and relevant compatibility requirements.

Produce a short implementation plan based on these findings.

Avoid introducing a second competing readiness system.

---

## 4. Associate Exam Questions With Curriculum Topics

Every exam question should have a reliable relationship to the topics it evaluates.

Prefer canonical curriculum topic IDs rather than display names.

For example, conceptually:

```ts
{
  id: "exam-question-123",
  topicIds: ["pointers", "dynamic-memory"],
  // Existing question properties...
}
```

This is illustrative only. Use the actual topic IDs and data structures already present in the repository.

Requirements:

- Support one primary topic per question where possible.
- Support multiple topics when a question genuinely evaluates multiple concepts.
- Avoid arbitrary or excessively broad mappings.
- Cover MCQs, coding questions, explanation questions, and code-analysis questions.
- Include all relevant pooled and fallback exam questions.
- Validate topic references against the canonical curriculum.
- Detect unmapped questions, invalid IDs, and accidental duplicate mappings.
- Keep question-topic mappings in trusted source data or server-controlled configuration.

If some questions test general problem-solving rather than a specific lesson, support an explicit category instead of assigning a misleading topic.

Do not send hidden test cases or confidential grading information to the browser.

---

## 5. Introduce Topic-Level Mastery Evidence

I want the platform to distinguish:

**Lesson completion:** Whether the student has completed the learning material.

**Topic mastery:** How well the student demonstrates understanding through quizzes, coding challenges, and exams.

**Readiness:** How prepared the student is for assessments and technical interviews based on demonstrated mastery and relevant performance.

Completion must remain independent of mastery.

A student who has completed every lesson should retain that completion history even if later exam results reveal weaknesses.

### Evidence sources

Consider using:

- Topic quiz performance.
- Topic coding challenge performance.
- Exam MCQ results.
- Exam coding results.
- Exam explanation and code-analysis scores.
- Repeated attempts and evidence of improvement.

Use the existing server-authoritative scores whenever possible.

Do not reduce every question to a binary pass/fail if partial-credit information is available.

For a question worth 10 points where the student earns 6, that should generally provide 60% performance evidence rather than a complete failure.

### Multiple-topic questions

If a question maps to multiple topics, distribute its contribution fairly.

A question associated with three topics should not automatically count as three independent full-weight questions.

Prefer a simple, explainable allocation unless the existing scoring model provides a better solution.

---

## 6. Design a Fair Readiness Calculation

This is the most important part of the task.

I do not want arbitrary penalties such as subtracting 10% readiness for every incorrect answer.

Instead, design a transparent, evidence-based calculation.

Desired behavior:

1. Exam mistakes should meaningfully affect readiness in the corresponding topics.
2. Strong lesson scores should not completely hide repeated exam failures.
3. A single incorrect exam answer should not disproportionately damage readiness.
4. Repeated poor performance should increase confidence that a topic needs review.
5. Later successful attempts should demonstrate improvement.
6. Retaking the same exam repeatedly should not allow unlimited artificial inflation of readiness.
7. Topics with little evidence should not automatically be treated as fully mastered.
8. Different exam types and question counts should not create unfair weighting.
9. Readiness scores should remain between 0 and 100.
10. The system should be explainable to a student.

Investigate whether a weighted mastery model, evidence aggregation, or another straightforward approach is most appropriate.

Avoid unnecessary statistical complexity, machine learning, or opaque scoring.

### Important: Prevent double-counting

If exam performance already contributes to readiness at the category level, do not simply add question-level evidence on top of the existing exam score.

That would count the same performance twice.

Refactor the existing calculation so that question-level evidence replaces or appropriately integrates with the old aggregate exam contribution.

### Sparse evidence

Distinguish a genuinely low score from insufficient evidence.

For example, a student who has answered only one relevant question should not receive the same confidence assessment as someone who has answered twenty.

If useful, expose evidence coverage or confidence separately from the mastery percentage.

---

## 7. Improve the Needs Review Section

The dashboard should identify specific curriculum topics where the student struggles.

Examples:

- Pointers — weak performance on exam questions.
- Recursion — repeated coding mistakes.
- STL Iterators — low quiz and exam performance.
- Dynamic Memory — strong lesson quiz but weak exam explanations.

For each recommended topic, provide:

- The topic name.
- Its current mastery/readiness score.
- A concise reason for the recommendation.
- Relevant evidence, such as low exam performance.
- A direct way to revisit the topic.

Prioritize recommendations based on weakness severity, evidence reliability, and relevance.

Avoid overwhelming the user with recommendations based on one minor mistake.

Use deterministic, understandable explanations. Do not require Gemini calls to calculate or explain readiness.

---

## 8. Preserve Historical Progress

This change must not reset existing users.

Requirements:

- Preserve completed lessons.
- Preserve quiz scores.
- Preserve coding challenge history.
- Preserve exam history.
- Preserve verified grading results.
- Preserve existing authentication and security behavior.

Inspect whether historical exam attempts already contain enough per-question information to reconstruct topic-level performance.

If yes, implement a safe migration or derived calculation.

If not, preserve historical aggregate exam results while clearly distinguishing them from new question-level evidence.

**Never invent per-question outcomes for old exams.**

Avoid double-counting historical aggregate scores alongside newly available detailed evidence.

If Firestore schema changes are necessary, make them backward-compatible and server-controlled.

---

## 9. Handle Retakes and Improvement

Students should be encouraged to learn from mistakes.

Consider this scenario:

1. Student scores 100% on the Pointers lesson quiz.
2. Student scores 40% on pointer-related exam questions.
3. Pointers appears in Needs Review.
4. Student studies Pointers again.
5. Student later scores 90% on related exam questions.

The readiness system should recognize improvement.

However:

- Repeatedly answering the same easy questions should not guarantee perfect mastery.
- One successful retake should not necessarily erase substantial earlier evidence.
- Old failures should not permanently prevent improvement.
- Repeated attempts should be handled consistently.

Use a clear, documented policy for attempt weighting, recency, and repeated questions.

Keep the model simple enough to test and maintain.

---

## 10. Maintain Server-Authoritative Integrity

Do not weaken the security improvements already implemented.

Specifically:

- Do not trust browser-submitted scores.
- Do not allow clients to forge topic mastery.
- Do not expose hidden coding tests.
- Do not expose private explanation rubrics unnecessarily.
- Do not allow arbitrary Firestore writes to authoritative progress.
- Preserve authenticated exam sessions and ownership checks.
- Preserve transactional exam finalization and retry behavior.
- Preserve existing quotas and sandbox isolation.

Where possible, calculate mastery from trusted persisted results rather than storing redundant values that can become inconsistent.

Do not introduce new paid services or require billing.

---

## 11. Update the Readiness Dashboard

Integrate the improved calculations into the existing interface.

Prefer modifying existing components instead of creating an entirely new dashboard.

Suggested improvements:

- Display topic mastery separately from completion.
- Make category readiness reflect relevant exam performance.
- Show why a topic needs review.
- Provide direct navigation to weak topics.
- Show improvement after later assessments.
- Clearly distinguish insufficient evidence from demonstrated weakness.

Keep the interface consistent with the existing design.

Avoid excessive charts, unnecessary animations, or visual clutter.

---

## 12. Testing Requirements

Add meaningful automated regression tests.

At minimum, test:

1. Perfect topic quiz but poor exam performance.
2. Perfect lesson completion with weak overall exam performance.
3. Poor performance on multiple questions mapped to one topic.
4. A single incorrect answer among otherwise strong evidence.
5. Partial-credit coding and explanation questions.
6. Questions mapped to multiple topics.
7. Unmapped or general-purpose questions.
8. Repeated exam attempts.
9. Improvement on later attempts.
10. Multiple exams assessing the same topic.
11. Historical exams without question-level results.
12. Existing users with no exam history.
13. Empty or missing evidence.
14. No score outside 0–100.
15. No double-counting of exam evidence.
16. Correct Needs Review recommendations.
17. Stable completion history after readiness changes.
18. Invalid or forged client-submitted scores.
19. Idempotent exam submission and retry handling.
20. Existing dashboard rendering and navigation.

Run the full test suite, TypeScript checks, and production build.

If relevant, run Firestore emulator tests.

---

## 13. Performance and Cost Constraints

This website is currently intended for me and a small group of friends.

Keep the implementation lightweight.

Requirements:

- No additional Gemini requests for readiness calculations.
- No additional Vercel Sandbox executions for analytics.
- No unnecessary Firestore writes.
- Avoid expensive repeated reads of complete exam histories.
- Avoid introducing new infrastructure.
- Maintain compatibility with the current free-tier setup.

Use efficient derived calculations, caching, or bounded evidence summaries where appropriate.

Do not optimize prematurely at the expense of correctness.

---

## 14. Acceptance Criteria

The implementation is complete when:

- Every applicable exam question has validated topic metadata.
- Exam performance meaningfully affects the corresponding topic's mastery.
- Topic mastery influences readiness without double-counting.
- Students can identify what they need to review and why.
- Retakes can demonstrate improvement.
- Lesson completion remains unchanged.
- Existing users retain their progress.
- Historical exams are handled honestly.
- Scores are deterministic and explainable.
- No new security vulnerabilities are introduced.
- Existing grading and sandbox functionality remain intact.
- Automated tests and production build pass.

---

## 15. Final Report

After implementing the changes, provide:

1. **Architecture findings:** How readiness worked before.
2. **Chosen design:** Why you selected this model over alternatives.
3. **Scoring formula:** Exact weights, aggregation rules, and examples.
4. **Question mapping:** How many questions were mapped and any exceptions.
5. **Persistence:** Any Firestore schema changes or migrations.
6. **Security:** How trusted grading evidence is protected.
7. **UI changes:** What students now see.
8. **Testing:** Actual test results and limitations.
9. **Performance:** Any additional database reads or writes.
10. **Changed files:** Complete list.
11. **Known limitations:** Anything not fully implemented.

Include a worked example showing how a student with perfect lesson scores but poor exam performance receives a lower readiness score and a topic-specific review recommendation.

Do not deploy or modify production Firebase configuration without my approval.

**Primary objective: Make readiness reflect demonstrated C++ understanding, not merely lesson completion or high topic-quiz scores.**