# Optional interview practice

Open **Optional Interview Practice** from the roadmap's interview tools. The track is available independently of the 39 curriculum topics; prerequisites are suggestions, not new gates.

| Lesson | Pattern | Coding exercise |
| --- | --- | --- |
| Binary search | Maintain a half-open range and find the first true position | First index whose value is at least a target, including duplicates and absent targets |
| BFS | Discover vertices in layers with a FIFO queue | Shortest distances in an unweighted graph, including disconnected vertices |
| DFS | Explore a region, then resume the outer vertex scan | Count undirected connected components, including isolated vertices |
| Backtracking | Choose, explore, undo shared state | Enumerate all subsets, including the empty subset |
| Dynamic programming | Define a state, base case and transition, then reuse smaller answers | Minimum reusable coin count, including unreachable targets and greedy counterexamples |

Each lesson explains when the pattern applies, its invariant or recurrence, a trace, pitfalls, complexity and transfer questions. Submission contracts state input bounds and example encoding. Hints and reference implementations use the existing code editor; its practice/assessment modes and assistance behavior remain intact. Assessment mode disables the ordinary AI mentor through the existing assessment context and releases that restriction on exit or lesson change.

Five new `ip-*` registrations use the existing `/api/evaluate-code` service and runner. The server supplies headers, drivers, public tests and hidden tests. A student-defined main cannot select a different driver. Subset results allow arbitrary outer order; incorrect internal order or duplicate/missing subsets still fails. Tests check example behavior, not a proof of asymptotic complexity or use of a particular algorithm. Another correct algorithm can pass; learners should still justify the lesson's complexity target.

No progress-save callbacks are attached to these exercises. They do not mark units complete, save coding results, alter readiness, count solved curriculum challenges, modify exam weights, or change historical records. Code/results live only in the mounted view and are cleared on exit/reload or lesson change; switching lessons asks before discarding them. Existing curriculum, authentication, persistence and sandbox execution settings are unchanged. The additional view/content is loaded on demand.

Implementation: `src/data/interviewPractice.ts`, `src/components/InterviewPracticeView.tsx`, `server/interviewChallengeRegistry.ts`, plus roadmap entry and app view wiring. Hidden tests stay in the server module. No deployment was performed.

Validation includes real C++20 compilation of all five references against public/hidden tests, incorrect implementations, hidden failures after public passes, arbitrary outer subset ordering, rejected incorrect inner ordering, and a separate-main bypass attempt. The component's initial view is checked by server rendering; this is not an interactive browser or deployed-production verification.

All 201 tests pass, including 15 new track checks. TypeScript checking and the production build pass. The new view is emitted as a separate approximately 23.5 kB JavaScript chunk (8.8 kB gzip); the existing main-bundle size warning remains.
