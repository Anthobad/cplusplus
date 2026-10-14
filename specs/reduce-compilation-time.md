Optimize the C++ code submission latency in my existing Vercel-hosted website.

Production submissions currently take approximately 22 seconds, despite C++ compilation taking around 0.5 seconds.

Inspect the current Vercel Sandbox runner and implement the best safe performance optimization.

Priorities:

1. Measure the individual durations of sandbox creation, apt provisioning, source upload, compilation, test execution, SDK calls, and cleanup.
2. Investigate official Vercel Sandbox snapshots or pre-provisioned images to avoid installing g++ for every submission.
3. If supported on my free Hobby plan, implement a reusable compiler image or snapshot while keeping each student submission in a fresh isolated sandbox.
4. Reduce unnecessary SDK round trips, preferably by compiling once and running all tests through one supervisor invocation.
5. Preserve per-test process isolation, network restrictions, hidden-test security, timeouts, and verified assessment behavior.
6. Compare before-and-after end-to-end latency using real sandbox submissions.
7. Verify that the optimized solution works on the actual Vercel deployment.
8. Do not create paid resources, enable billing, or deploy changes without my approval.
9. Any reusable snapshot must contain only trusted compiler dependencies and execution infrastructure. Never include student code, credentials, hidden tests, or previous submissions. Implement safe snapshot versioning and recovery.
10. Measure frontend submission latency, including the time from clicking Submit until the result appears. Report cold-start and warm-start performance separately where applicable.
11. Avoid permanently running sandboxes or background infrastructure that consumes Hobby resources while idle.
12. Run the existing automated test suite and verify that assessment grading, Firebase progress, and the Google-hosted deployment remain unaffected.
13. If production verification requires deployment, stop and request my approval first. Do not claim production verification based only on local tests.

Aim for under 5 seconds per normal submission if realistically achievable. Do not sacrifice security or correctness to meet that target.

Report actual measurements and any Hobby-plan limitations.