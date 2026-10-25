# Curriculum teaching review

Subsequent updates: [compiler-backed exam coding](compiler-backed-exam-grading.md) and [rubric-based explanation grading](rubric-based-explanation-grading.md). The preserved-behavior and verification notes below describe the earlier content-only revision; the later grading changes are documented separately.

Priority 3 follow-up: the learner reported insufficient explanation after trying the material. [The first three lessons now have expanded explanations, worked examples and a follow-up feedback procedure](beginner-learning-feedback.md). This revision has not yet been validated by follow-up learner results.

Priority 4 adds [an optional interview-practice track](optional-interview-practice.md) for binary-search patterns, BFS, DFS, backtracking and dynamic programming. It is separate from the 39-topic sequence and does not change existing progress or exam requirements.

Priority 5 adds [domain-based deferred loading](deferred-curriculum-loading.md). The roadmap uses a lightweight generated index, and lessons and supporting views load on demand. Local initial JavaScript gzip size is approximately halved; the original content-only validation notes below remain historical.

The 39-topic curriculum now develops concepts from a beginner mental model through a complete C++20 example, a state-by-state trace, common mistakes and a transfer exercise. The guide's supplemental content and all 24 resource/practice URLs remain available.

## Content changes

- Rewrote the core theory for every topic; retained the four domains and topic sequence.
- Added 39 complete worked programs with documented output. Together with the 23 guide programs, 62 authored examples can be compiled and run by the verification script.
- Rewrote all 39 deep dives, with eight diagrams for aliasing, pointer bounds, ownership, vector storage, trees, dispatch, synchronization and recursion.
- Added focused explanations of all seven sorting algorithms, including invariants, traces, complexity, stability and edge cases.
- Expanded guide examples with worked reasoning and reformatted compressed C++ implementations.
- Replaced lesson quizzes with 117 questions: one output trace, one application decision and one misconception check per topic. Practice questions use the same taught rules.
- Corrected ambiguous or inaccurate assessment statements and added 20 exam-pool questions emphasizing application and explanation. The four pools contain 96 questions in total.

## Preserved behavior

Topic/phase IDs, quiz IDs, compiler-tested practice challenge objects, solution code, driver contracts and public/hidden tests are unchanged. Quiz thresholds, exam IDs, durations, pass thresholds and progression gates remain unchanged. Saved progress is not reset or migrated.

The existing exam sampler still selects three MCQs, two true/false questions, one explanation, one analysis and one coding question for 100 points. Its implementation and the existing grading algorithms are unchanged. In particular, exam free-text/coding responses retain the existing keyword-based grading; this content update does not turn them into compiler-verified assessments. The separate practice submission API and sandbox runner are unchanged.

No components, authentication, persistence, API routes, sandbox configuration or deployment settings were edited. No deployment was performed.

## Accuracy references

Implementation-specific optimizations are now identified as such. The C++20 draft specifies [observable behavior rather than a required machine layout](https://timsong-cpp.github.io/cppwp/n4861/intro.abstract), [fundamental-type ranges and representations](https://timsong-cpp.github.io/cppwp/n4861/basic.fundamental), and [sort's comparison bound without prescribing introsort](https://timsong-cpp.github.io/cppwp/n4861/sort). Corrections also follow the draft's [exception specification rules](https://timsong-cpp.github.io/cppwp/n4861/except.spec) and [conditional vector exception/invalidation guarantees](https://timsong-cpp.github.io/cppwp/n4861/vector.modifiers).

## Verification

- 140 regression and content-integrity tests pass, including challenge identity, assessment option keys, domain/gate settings and randomized exam composition.
- TypeScript checks and the production build pass. Vite still reports its bundle-size warning; the expanded curriculum increases the bundled learning data. No loading/code-splitting behavior was changed.
- All 62 authored C++20 programs compile and produce the documented output. Re-run with `node --import tsx scripts/verify-curriculum-examples.ts` on a system with g++ and Linux/POSIX support for the process example.
- A local production-preview browser check verified desktop/mobile lesson rendering, deep-dive/practice tabs and navigation to the unchanged first coding challenge, with no page errors. External requests were blocked and no signed-in account was used.
- All 39 lessons rendered in the browser, and all 39 quizzes scored 100% when answered with their revised keys, using disposable local guest fixtures.

Content integrity and runnable examples do not measure a learner's mastery. The material now supplies explanations and practice rather than relying on definitions alone; learner feedback can identify where further examples would help.

## Content locations

`src/data/beginnerLessons.ts` supplies core lessons and lesson assessments. `lessonDeepDives.ts`, `guideWalkthroughs.ts`, `sortingLessons.ts` and `exampleTeachingNotes.ts` supply the supporting teaching material. `assessmentContent.ts` supplies corrected exam content and new pool questions. The curriculum composes these content modules while retaining the original graded challenge data.
