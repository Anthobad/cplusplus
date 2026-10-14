# Task: Integrate Vercel Sandbox into the Existing C++ Learning Website

You are working inside the existing GitHub repository containing my C++ Interview Prep website, originally developed using Google AI Studio.

The same repository is already deployed on Vercel. The Vercel project is associated with the account `anthobads-projects`.

**Do not rebuild the website, create another Vercel project, or migrate the application.**

## 1. Inspect the existing architecture

Before changing anything:

- Inspect the repository structure.
- Identify the current code execution architecture, especially `server/codeRunner.ts` and the API evaluation endpoints.
- Understand how challenges, public tests, hidden tests, assessment mode, and verified progress work.
- Inspect the existing Vercel deployment configuration.
- Locate the successful Vercel Sandbox proof of concept in `sandbox-quickstart`, if available.

Preserve all existing functionality.

## 2. Implement VercelSandboxCodeRunner

Add a production-ready `VercelSandboxCodeRunner` using `@vercel/sandbox@3`.

Requirements:

- Use the existing Vercel project and supported server-side authentication.
- Never expose credentials to the frontend.
- Create an isolated sandbox for each submission.
- Enforce `networkPolicy: 'deny-all'`.
- Compile submitted C++ code once using C++20.
- Execute the compiled binary independently for each test case.
- Capture stdout, stderr, exit code, and execution duration.
- Apply compilation and execution timeouts, output limits, source-size limits, and resource limits.
- Stop the sandbox in a `finally` block.
- Prevent submissions from accessing other submissions or hidden test answers.

Do not reuse a persistent named sandbox across different students' submissions.

## 3. Compiler setup

The proof of concept successfully compiled C++20, but initially encountered a missing `libjansson.so.4` dependency.

Investigate and implement a reproducible compiler environment.

Do not depend on files stored on my laptop.

If compiler setup requires network access, complete it before enforcing `deny-all`, using a safe and supported provisioning approach.

## 4. Integrate with the existing evaluator

Preserve the existing trusted evaluation architecture.

The backend must continue to:

- Select the correct challenge and test cases.
- Keep expected outputs server-side.
- Compare actual and expected results.
- Distinguish compilation failures, runtime failures, timeouts, and incorrect answers.
- Prevent students from submitting their own expected results.
- Award verified progress only when the existing assessment requirements are satisfied.

The sandbox must only compile and execute code. It must not decide whether a student passed.

## 5. Provider configuration

Introduce a server-side runner configuration.

- Use Vercel Sandbox as the primary provider on the Vercel deployment.
- Retain Wandbox as a configurable alternative.
- Never silently switch providers after an execution failure.
- Preserve the existing development runner where appropriate.
- Avoid breaking the Google-hosted version.

## 6. Vercel deployment

Verify that the existing Vercel deployment supports the required server-side evaluation endpoint.

Configure the necessary runtime, environment variables, and SDK integration using supported Vercel mechanisms.

Do not create another project, request credentials in chat, or enable billing.

If a Vercel configuration step requires my authorization, pause and explain the exact action.

## 7. Testing

Implement automated tests for:

- Successful C++20 compilation.
- Compile-once/run-many execution.
- Compilation errors.
- Nonzero runtime exit codes.
- Infinite loops and timeouts.
- Incorrect outputs.
- Hidden-test handling.
- Sandbox cleanup.
- Concurrent submissions.
- Infrastructure failures.
- Verified progress behavior.

Run the available tests and fix regressions.

Then test one complete code-submission flow through the actual Vercel deployment, if access permits.

## 8. Final report

Provide:

1. Files changed.
2. Architecture changes.
3. Compiler provisioning solution.
4. Tests executed and their results.
5. Actual deployment verification results.
6. Remaining limitations.
7. Any manual action required from me.

**Important constraints:**

- Do not modify unrelated curriculum or UI functionality.
- Do not remove Wandbox yet.
- Do not create paid resources or enable billing.
- Do not claim deployment success unless verified.
- Do not push to GitHub or deploy until I explicitly approve.

Work autonomously on implementation and local testing. Ask me only when authentication, authorization, billing, or an essential architectural decision requires my input.