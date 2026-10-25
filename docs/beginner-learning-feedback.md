# Beginner learning feedback and first revision

The learner reported: “i tried them mysefl and its not enough information and explanation”. This establishes a reported problem with explanation depth. It does not identify a particular misunderstood concept, measure independent performance, or establish that the revision below resolves the problem.

The first revision concentrates on Topics 1–3, the initial learning sequence targeted by priority 3. It changes teaching content only. The remaining 36 lessons have not received this additional pass.

| Lesson | Additional support |
| --- | --- |
| 1: C++ Program Structure & Standards | Explains the parts of a program and output syntax individually, walks through build/run commands, separates output from exit status, distinguishes build errors from wrong output, and adds a complete label/calculation example. |
| 2: Fundamental Types & Variables | Defines declaration, initialization and assignment, traces values in a state table, explains independent copies and stored boolean results, and adds a two-stage copy/update example. |
| 3: Variables, Memory Lifecycles & Casting | Traces operand types before arithmetic, compares conversion before/after division, explains negative truncation, separates const from required constant evaluation, introduces the small amount of function syntax used by the constexpr example, and defines scope/lifetime/storage vocabulary. |

Each now has prediction questions followed by a separate section explaining the answers and a readiness check. The existing interface still displays both sections; this is not a new answer-hiding feature. Four additional complete C++20 examples make intermediate steps concrete. Quiz questions, answer keys, IDs and pass thresholds are unchanged. No navigation, authentication, persistence, grader, runner, deployment or progression behavior changes are part of this revision.

## Follow-up with the learner

Read one revised lesson at a time. Before running the examples or reading the practice explanations, write a prediction and the reason for it. If you get stuck, record the exact sentence or symbol that first stopped making sense. Record compiler/tool setup problems separately from C++ understanding. Do not bypass existing progression gates or treat a repeated quiz score as independent evidence of understanding.

Use these fresh tasks after studying, without copying the lesson answers:

1. Topic 1: Predict `std::cout << "Result: ";` followed by `std::cout << 4 + 2 << '\n';`. Explain whether changing `return 0;` to `return 7;` adds a displayed 7. Explain what happens if a semicolon is missing before building.
2. Topic 2: Trace `int stock{8}; int saved{stock}; stock = stock - 3;`. Give both values. Then trace `saved = stock;`. Explain what each assignment changes and whether either object automatically tracks the other.
3. Topic 3: Compare `double first = 11 / 4;` with `double second = static_cast<double>(11) / 4;`. Show the operation before the destination conversion. Explain whether a const value must always be known during compilation and whether a constexpr function may accept runtime values in an ordinary call.

Facilitator check: Task 1 prints one line, `Result: 6`; return changes the exit status, and a missing required semicolon blocks a new successful build. Task 2 first gives stock 5/saved 8, then 5/5; these are independent values. Task 3 stores 2.0 and 2.75; const need not be compile-time initialized and constexpr functions allow ordinary runtime-valued calls. Accept equivalent explanations rather than requiring these words.

For each task, record one of: correct independently; correct after rereading (name the section); correct after a hint (record the hint); or still unclear. Keep the original answer before making a correction. A correct result without an explanation does not establish the intended reasoning. These are feedback categories, not new website grades or pass requirements.

Copy this short feedback form for each lesson:

```text
Lesson and date:
Previous programming experience:
Exact sentence, term or symbol that was unclear:
What I thought it meant:
My prediction and explanation before running/checking:
Observed result:
Did I need rereading or a hint? Which one?
What explanation/example helped, or is still missing?
Any separate website/tool setup issue:
```

Repeated misunderstandings should guide the next content edit: missing definitions need earlier definitions; wrong intermediate steps need another trace; correct copied answers but failed fresh tasks need transfer practice. A brief next-day recheck can help distinguish immediate recall from retained understanding. No learner responses or follow-up results have been collected for this revision yet, and there is no claim that all beginners can now fully understand the lessons.

## Local verification

All 66 authored C++20 examples compiled and produced their documented outputs, including the four additions. Re-run with `node --import tsx scripts/verify-curriculum-examples.ts`. The 32 curriculum teaching, guide coverage and progression checks passed, along with TypeScript checking and the production build. The existing bundle-size warning remains. These checks cover IDs, quiz keys, thresholds, challenge identity and technical consistency; follow-up learner feedback is still needed to assess clarity.
