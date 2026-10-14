# Vercel Sandbox integration

The existing React/Vite application and Express API remain in place. `api/index.ts` exports the same Express application for Vercel's Node.js function runtime. API paths are routed to this function; the existing SPA stays in `dist`. Google hosting still starts the existing Express listener and serves its static files. The development compiler daemon is imported only when needed for local development.

## Execution and trust

`server/vercelSandboxCodeRunner.ts` implements the existing `CodeRunner` contract. Each submission calls `Sandbox.create` without a persistent name, shared filesystem, repository, environment secrets, or mounts. Sandboxes are ephemeral (`persistent: false`), receive one vCPU (2 GiB VM memory), and auto-terminate after 200 seconds. The runner awaits `stop()` in `finally`; infrastructure or cleanup failures propagate to the existing evaluator's 503 response. Providers are never switched after a failure.

The server challenge registry and `evaluateSubmission` remain authoritative. Registered submissions ignore client tests, hidden tests, drivers and comparators. Expected outputs never go into the sandbox. Only the current test's stdin is sent to its process, and the backend compares stdout against the trusted expected answer. Hidden inputs, output details, stderr and exit codes are withheld from the response. The runner always returns `verified: false`; the existing evaluator grants verification only for passing, unassisted, registered assessments. The existing unregistered practice scratchpad behavior remains unverified.

The root-owned Python supervisor compiles with `g++ -std=c++20 -O2 -Wall -Wextra -pthread` once, then invokes the resulting binary independently for each test. It captures bounded stdout/stderr, exit codes and monotonic durations. Compilation errors, runtime exits, timeouts, excessive output and incorrect answers remain distinct. Results are read from a root-owned file after student processes have been killed; student stdout cannot impersonate supervisor JSON.

Compilation runs as an unprivileged numeric UID. Each test gets another UID and a private directory. Supplementary groups are cleared, privileges cannot be reacquired with setuid executables (`no_new_privs`), and the executable becomes root-owned and read-only. Cleanup kills both the process group and all processes of that test UID, including children that created new sessions. Student processes receive only PATH, HOME and LANG. Other submissions use different VMs.

Limits: 128 KiB assembled source, 64 KiB input per test, 32 tests, 64 KiB combined stdout/stderr per process, 8 seconds compilation, at most 2.5 seconds per execution, 1 GiB compiler address space, 256 MiB execution address space, 32 processes, 64 open files, 8 MiB file writes, CPU limits and no core dumps. Compiler provisioning has a 90-second deadline; API functions have a 240-second maximum duration. SDK infrastructure deadlines fail safely rather than masquerading as student timeouts.

## Compiler provisioning

Every fresh sandbox starts from Vercel's managed Ubuntu 26.04 image. Before any source code or test input is uploaded, the only allowed network destinations are `archive.ubuntu.com` and `security.ubuntu.com`. Apt sources use HTTPS and Ubuntu's signed package verification. Apt installs `g++-15`, `binutils`, `libjansson4`, `python3` and `procps`; the package manager resolves compiler headers, libc development files and linker dependencies. `g++` points to GCC 15. The compiler and linker are checked before continuing.

After provisioning, the runner updates the policy to `deny-all`. Failure to install the toolchain or enforce this policy prevents submission execution. No laptop compiler files, archive uploads, persistent snapshots, new registry resources or paid services are required. This provisioning method is reproducible from the managed image and signed repositories; the image and security patch versions roll forward, so it is not a bit-identical pinned image. Installing the compiler on each submission adds latency and depends on Ubuntu repository availability.

Supported mechanisms: [Vercel managed images](https://vercel.com/docs/sandbox/concepts/images), [firewall provisioning then lockdown](https://vercel.com/docs/sandbox/concepts/firewall), and [Sandbox SDK](https://vercel.com/docs/sandbox/sdk-reference).

## Configuration

`CODE_RUNNER_MODE` is a server-side setting:

- `vercel-sandbox`: Vercel Sandbox.
- `wandbox`: retained Wandbox alternative.
- `isolated`: existing external runner.
- `local`: development only; it cannot force local execution in production.
- Unset or `production`: Sandbox on Vercel (`VERCEL=1`); existing external-runner/Wandbox selection on Google production; existing development runner locally.

Unknown values fail closed. Keep all authentication settings out of `VITE_*`. Vercel supplies runtime OIDC authentication; no token should be copied into production environment settings. Existing local project linking and `vercel env pull` supply a development token, which expires after 12 hours. See [Sandbox authentication](https://vercel.com/docs/sandbox/concepts/authentication).

The existing `anthobads-projects/cplusplus` project uses Node.js 24.x. `vercel.json` retains the Vite build, configures a Node API function and preserves SPA routes. `.vercel` and local environment files are ignored. No account, project, billing or remote environment configuration was changed.

## Validation and deployment status

Automated tests in `tests/vercelSandboxRunner.test.ts` cover compile-once/run-many behavior, compilation failures, runtime exits, timeouts, output limits, incorrect answers, hidden-test handling, source/input bounds, cleanup, concurrent submissions, infrastructure failures, provider selection and verified progress. The existing curriculum, assessment, progression, migration, authoritative evaluator, Wandbox and isolated runner tests are also retained.

Run `npm test`, `npm run lint` and `npm run build` with Node.js 24 (Vitest 5 requires a supported newer Node runtime). In this host, the original isolated-runner tests hit the shared host UID's process limit. Running the suite in a separate user namespace (`unshare -Ur ...`) avoids that host limitation without changing the runner or weakening its resource limits. All 116 tests passed across nine test files. Type checking and the production build passed. A local `vercel build --prod --yes` also built the Node.js 24 API function successfully; final build validation is described in the task report.

`tests/liveSandboxIntegration.ts` is an opt-in real integration script: `npx tsx tests/liveSandboxIntegration.ts`. It uses the existing ignored local OIDC file, sends a complete submission through the local Express API backed by real Vercel sandboxes, and checks syntax errors, runtime exits, loops, incorrect outputs and output flooding. It records results in `sandbox-quickstart/integration-results.json`; it does not deploy, write Firestore progress, or enable billing.

The existing production deployment is Ready, but actual requests to both `https://cplusplus.vercel.app/api/health` and `/api/evaluate-code` returned `404 NOT_FOUND`. The new integration has not been deployed, so production submission success is not claimed.

Deployment requires the user's explicit approval, as specified in `specs/sandbox-integration.md`. After approval, deploy to the existing project and verify `/api/health` and a complete registered assessment submission on the deployed URL. No credential sharing or billing action is required by this implementation. Existing Sandbox and function quotas still apply; quota or authorization failures return an unavailable evaluation and do not award progress. Assistance tracking remains the existing client-reported personal-learning mechanism, rather than tamper-proof certification.

## Files changed

- `server/vercelSandboxCodeRunner.ts`: fresh-sandbox provisioning, bounded execution, backend output comparison and cleanup.
- `server/sandbox/supervisor.ts`: embedded root-owned process supervisor and resource restrictions.
- `server/codeRunner.ts`: provider selection and compilation timing in the existing result contract.
- `server.ts`, `api/index.ts`, `vercel.json`: importable Express API, Vercel routing, and function duration; existing standalone hosting preserved.
- `src/types.ts`: optional stderr, exit code and compilation duration fields; no UI changes.
- `package.json`, `package-lock.json`: Sandbox SDK v3 and reproducible npm dependency installation.
- `.env.example`, `.gitignore`, `README.md`, this document: server-only configuration and operational documentation.
- `tests/vercelSandboxRunner.test.ts`, `tests/liveSandboxIntegration.ts`: automated orchestration/regression tests and opt-in real API/sandbox checks.
- `sandbox-quickstart/integration-results.json`: captured actual integration results.

## Actual results

The real local-API submission received HTTP 200 and `verified: true`, passing three public and two hidden tests. The final recorded run compiled in 397.500 ms and executed its five independent test processes in 27.873 ms total. Separate real submissions correctly produced a compilation error, exit-code-1 runtime failure, infinite-loop timeout, incorrect-answer mismatch and output-limit failure. The output flood was stopped in 4.472 ms. All sandbox stop calls completed without an error.

Final local Vercel build: successful; the generated routing configuration points API paths to the existing Express function, packaged as `nodejs24.x` with a 240-second duration. No local environment files were included in the function artifact. Production URL verification remains blocked by the existing deployed API's 404 responses until an explicitly approved deployment.

A separate real C++20-only `consteval`/`static_assert` submission also passed: compilation 684.227 ms, execution 6.774 ms, stdout `42`, exit code 0. It ran in practice mode and correctly remained unverified. Its result is recorded alongside the integration cases.
