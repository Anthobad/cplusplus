# Production verification — 14 October 2026

Verified the user's deployment at https://cplusplus.vercel.app, deployment `dpl_4PU3x2y2KfG4jH6AF7qjFUAQjzTN` (`cplusplus-mttq2tiek-anthobads-projects.vercel.app`). No deployment, GitHub push, billing change, or application-code change was performed during this verification.

## Results

1. `GET /api/health`: HTTP 200, JSON `status: "ok"`.
2. `POST /api/evaluate-code`: correctly routed to the evaluator. An unknown assessment challenge returned the expected JSON configuration error without creating a sandbox. All four actual submission cases returned HTTP 200 with meaningful evaluation results.
3. Real C++20 submission: `consteval`, `static_assert(__cplusplus >= 202002L)`, and console output were compiled and executed through the production API.
4. Registered challenge `cc-t1`: all three public and two hidden tests passed, score 100, `compiled: true`, `passed: true`, `verified: true`. Hidden inputs and expected answers were absent from hidden-test responses.
5. Intentional failures were correctly classified: invalid syntax produced a compilation error; `return 1` produced runtime failures with public exit code 1; an infinite loop produced Time Limit Exceeded for the public tests and sanitized hidden-test failures. No failure received verified status.
6. End-to-end latency was measured from immediately before the HTTP request until the complete JSON response was received, including sandbox creation, compiler provisioning, compilation, test execution, awaited cleanup, and network overhead.
7. The Sandbox control plane independently confirmed all four API-test sandboxes were stopped and nonpersistent. The frontend submission's fifth sandbox was independently confirmed stopped and nonpersistent too. No unexpected evaluation or cleanup errors occurred. The current deployment's error-level runtime-log query returned zero records in its 30-minute observation window.
8. A fresh guest Chromium session opened the roadmap, navigated to the coding challenge, selected Assessment, entered C++20 code, and clicked Submit Assessment. The real frontend request returned HTTP 200 and a verified 5/5 pass. The rendered page displayed “Verified Assessment Passed!” and “5 / 5 Tests Passed (100%)”. No browser page errors were recorded. The isolated guest session did not use the user's signed-in account.

## Timings

| Case | End-to-end | Compilation | All test execution |
| --- | ---: | ---: | ---: |
| Successful C++20 API submission | 21.58 s | 528.83 ms | 31.31 ms |
| Compilation error | 15.40 s | 16.17 ms | Not executed |
| Runtime failure | 19.90 s | 47.73 ms | 33.04 ms |
| Infinite loop | 31.61 s | 64.35 ms | 12,553.95 ms |
| Actual frontend submission | 22.22 s | 529.17 ms | 33.67 ms |

The timeout case runs five independent test processes, each with a 2.5-second limit. Successful API submission overhead outside compilation and test execution was approximately 21.02 seconds. This includes provisioning, creation, SDK operations, cleanup, and network transit; those components were not individually instrumented. These are single-run measurements, not a load-test or percentile benchmark.

## Evidence

- [Production API results and sandbox inventory](../sandbox-quickstart/deployment-verification.json)
- [Browser request, response, rendered text and cleanup result](../sandbox-quickstart/frontend-verification.json)

Temporary verification-tool issues were corrected: Sandbox list requests require a limit of at most 50, and Chromium needed three libraries downloaded into its temporary test directory. These did not represent application failures. No manual action is required for the checks listed above.
