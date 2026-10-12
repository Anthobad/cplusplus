import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import { createRunnerServer } from "../runner/server";
import { IsolatedProductionRunner, LocalCodeRunner, getCodeRunner } from "../server/codeRunner";
import { evaluateSubmission } from "../server/evaluateSubmission";
import { getTrustedChallenge } from "../server/challengeRegistry";

const TEST_RUNNER_PORT = 8099;
let testRunnerServer: http.Server;
let isolatedRunner: IsolatedProductionRunner;

beforeAll(async () => {
  // Start test isolated runner server
  testRunnerServer = createRunnerServer();
  await new Promise<void>((resolve) => {
    testRunnerServer.listen(TEST_RUNNER_PORT, "127.0.0.1", () => {
      resolve();
    });
  });
  isolatedRunner = new IsolatedProductionRunner(`http://127.0.0.1:${TEST_RUNNER_PORT}`);
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    testRunnerServer.close(() => resolve());
  });
});

describe("Isolated C++ Runner Service & Integration", () => {
  // 1. Valid C++ compiles and passes
  it("valid C++ compiles with C++20 and passes tests", async () => {
    const result = await isolatedRunner.evaluate({
      code: `#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::vector<int> v = {1, 2, 3, 4, 5};
    int sum = std::accumulate(v.begin(), v.end(), 0);
    std::cout << sum << "\\n";
    return 0;
}`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "15" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(true);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.testsPassed).toBe(1);
    expect(result.testResults[0].passed).toBe(true);
  });

  // 2. Compile error returned correctly
  it("compile error returned correctly with structured output", async () => {
    const result = await isolatedRunner.evaluate({
      code: `#include <iostream>
int main() {
    this_is_an_invalid_token_syntax_error;
    return 0;
}`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "0" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.compileError).toBeDefined();
    expect(result.compileError).toContain("error:");
  });

  // 3. Incorrect output fails
  it("incorrect output fails and reports mismatch", async () => {
    const result = await isolatedRunner.evaluate({
      code: `#include <iostream>
int main() {
    std::cout << "41\\n";
    return 0;
}`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "42" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.testResults[0].passed).toBe(false);
    expect(result.testResults[0].error).toBe("Output mismatch");
    expect(result.testResults[0].actualOutput).toBe("41");
  });

  // 4. Infinite loop times out
  it("infinite loop times out safely with Time Limit Exceeded", async () => {
    const result = await isolatedRunner.evaluate({
      code: `#include <iostream>
int main() {
    while (true) {}
    return 0;
}`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "done" }],
      mode: "assessment",
      wasAssisted: false,
      timeoutMs: 1200, // Short timeout for test
    });

    expect(result.compiled).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.testResults[0].error).toBe("Time Limit Exceeded");
    expect(result.testResults[0].actualOutput).toContain("Time Limit Exceeded");
  });

  // 5. Runtime failure handled (Segmentation fault)
  it("runtime failure (null pointer dereference) is handled safely", async () => {
    const result = await isolatedRunner.evaluate({
      code: `#include <iostream>
int main() {
    volatile int* ptr = nullptr;
    *ptr = 999;
    return 0;
}`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "ok" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.testResults[0].passed).toBe(false);
    expect(result.testResults[0].error).toContain("Fault");
  });

  // 6. Excessive output is truncated/handled safely
  it("excessive output is capped safely without crashing the runner", async () => {
    const result = await isolatedRunner.evaluate({
      code: `#include <iostream>
int main() {
    for (int i = 0; i < 50000; i++) {
        std::cout << "flood-data-flood-data-flood-data ";
    }
    std::cout << "\\n";
    return 0;
}`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "normal" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.testResults[0].passed).toBe(false);
    // Buffer is capped at 64KB, process finishes cleanly
    expect(result.testResults[0].actualOutput?.length).toBeLessThanOrEqual(64 * 1024 + 100);
  });

  // 7. Runner unavailable does not pass (fails safely with infrastructure error)
  it("runner unavailable fails safely with infrastructure error and does not pass", async () => {
    const deadRunner = new IsolatedProductionRunner("http://127.0.0.1:54321"); // Unbound port
    const result = await deadRunner.evaluate({
      code: `#include <iostream>\nint main() { std::cout << "42\\n"; return 0; }`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "42" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.verified).toBe(false);
    expect(result.error).toContain("Code evaluation is temporarily unavailable");
  });

  // 8. Unknown assessment challenge does not execute
  it("unknown assessment challenge does not execute on runner", async () => {
    const { status, result } = await evaluateSubmission(
      {
        challengeId: "malicious-unknown-id",
        studentCode: `#include <iostream>\nint main() { return 0; }`,
        mode: "assessment",
        wasAssisted: false,
      },
      isolatedRunner
    );

    expect(status).toBe(200);
    expect(result.passed).toBe(false);
    expect(result.verified).toBe(false);
    expect(result.configurationError).toBe(true);
    expect(result.error).toContain("not configured for verified assessment");
  });

  // 9. Client cannot override trusted assessment tests
  it("client cannot override trusted assessment tests or comparator", async () => {
    const trusted = getTrustedChallenge("cc-t1")!;
    const { status, result } = await evaluateSubmission(
      {
        challengeId: "cc-t1",
        // Client sends code that only outputs a fake expected value
        studentCode: `#include <iostream>\nint main() { std::cout << "fake_hacked_output\\n"; return 0; }`,
        mode: "assessment",
        wasAssisted: false,
        testCases: [{ input: "", expectedOutput: "fake_hacked_output" }],
        comparator: "exact",
      },
      isolatedRunner
    );

    expect(status).toBe(200);
    // Must fail because trusted challenge cc-t1 expects clampValue behavior, not fake_hacked_output
    expect(result.passed).toBe(false);
    expect(result.verified).toBe(false);
    // Evaluator must have executed the trusted test cases count
    expect(result.totalTests).toBe(trusted.publicTests.length + trusted.hiddenTests.length);
  });

  // 10. Hidden test details remain hidden in API response
  it("hidden test details remain strictly hidden in API response", async () => {
    const { status, result } = await evaluateSubmission(
      {
        challengeId: "cc-t1",
        studentCode: `#include <iostream>\nint main() { std::cout << "wrong\\n"; return 0; }`,
        mode: "assessment",
        wasAssisted: false,
      },
      isolatedRunner
    );

    expect(status).toBe(200);
    const hiddenResults = result.testResults.filter((t) => t.isHidden);
    expect(hiddenResults.length).toBeGreaterThan(0);

    for (const h of hiddenResults) {
      expect(h.input).toBeUndefined();
      expect(h.expectedOutput).toBeUndefined();
      expect(h.actualOutput).toBe("Hidden test failed");
      expect(h.error).toBe("Hidden test failed");
    }
  });

  // 11. Security: Student C++ cannot access parent process application secrets
  it("security: student C++ cannot access host or server environment secrets", async () => {
    process.env.GEMINI_API_KEY = "SUPER_SECRET_TEST_KEY_NEVER_LEAK";

    const result = await isolatedRunner.evaluate({
      code: `#include <iostream>
#include <cstdlib>

int main() {
    const char* key = std::getenv("GEMINI_API_KEY");
    if (key != nullptr) {
        std::cout << "LEAK:" << key << "\\n";
    } else {
        std::cout << "SECURE_CLEAN_ENV\\n";
    }
    return 0;
}`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "SECURE_CLEAN_ENV" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(true);
    expect(result.passed).toBe(true);
    expect(result.testResults[0].actualOutput).toBe("SECURE_CLEAN_ENV");
  });

  // 12. Production cannot fall back to localhost C++ execution
  it("production cannot fall back to localhost C++ execution", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const prodLocalRunner = new IsolatedProductionRunner("http://127.0.0.1:8088");
      const result = await prodLocalRunner.evaluate({
        code: `#include <iostream>\nint main() { return 0; }`,
        testCases: [{ testId: "Test 1", input: "", expectedOutput: "0" }],
        mode: "assessment",
        wasAssisted: false,
      });

      expect(result.compiled).toBe(false);
      expect(result.passed).toBe(false);
      expect(result.verified).toBe(false);
      expect(result.error).toContain("forbids in-container or localhost code execution");
      expect(result.compileError).toContain("Production security violation");
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  // 13. Missing external production runner fails safely
  it("missing external production runner fails safely", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const prodMissingRunner = new IsolatedProductionRunner(undefined);
      const result = await prodMissingRunner.evaluate({
        code: `#include <iostream>\nint main() { return 0; }`,
        testCases: [{ testId: "Test 1", input: "", expectedOutput: "0" }],
        mode: "assessment",
        wasAssisted: false,
      });

      expect(result.compiled).toBe(false);
      expect(result.passed).toBe(false);
      expect(result.verified).toBe(false);
      expect(result.error).toContain("requires an isolated containerized sandbox");
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  // 14. Runner authentication failure fails safely
  it("runner authentication failure fails safely with HTTP 401/403 notice", async () => {
    const authServer = http.createServer((_req, res) => {
      // Simulate Cloud Run IAM rejecting unauthenticated requests with 401
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
    });

    const AUTH_TEST_PORT = 8097;
    await new Promise<void>((resolve) => authServer.listen(AUTH_TEST_PORT, "127.0.0.1", () => resolve()));

    try {
      const authedRunner = new IsolatedProductionRunner(`http://127.0.0.1:${AUTH_TEST_PORT}`);
      const result = await authedRunner.evaluate({
        code: `#include <iostream>\nint main() { return 0; }`,
        testCases: [{ testId: "Test 1", input: "", expectedOutput: "0" }],
        mode: "assessment",
        wasAssisted: false,
      });

      expect(result.compiled).toBe(false);
      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.verified).toBe(false);
      expect(result.error).toContain("Runner authentication failed (HTTP 401/403)");
      expect(result.compileError).toContain("not authorized to invoke the isolated runner service");
    } finally {
      await new Promise<void>((resolve) => authServer.close(() => resolve()));
    }
  });

  // 15. getCodeRunner() never allows LocalCodeRunner in production
  it("getCodeRunner() never allows LocalCodeRunner in production", () => {
    const originalEnv = process.env.NODE_ENV;
    const originalMode = process.env.CODE_RUNNER_MODE;
    const originalEndpoint = process.env.ISOLATED_RUNNER_ENDPOINT;

    process.env.NODE_ENV = "production";
    process.env.CODE_RUNNER_MODE = "local"; // Attempt to force local mode

    try {
      // With external Cloud Run endpoint configured:
      process.env.ISOLATED_RUNNER_ENDPOINT = "https://cpp-isolated-runner-test.run.app";
      const runnerWithEndpoint = getCodeRunner();
      expect(runnerWithEndpoint).toBeInstanceOf(IsolatedProductionRunner);

      // Without external Cloud Run endpoint configured: defaults to WandboxCodeRunner
      delete process.env.ISOLATED_RUNNER_ENDPOINT;
      const runnerWithoutEndpoint = getCodeRunner();
      expect(runnerWithoutEndpoint).not.toBeInstanceOf(LocalCodeRunner);
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.CODE_RUNNER_MODE = originalMode;
      process.env.ISOLATED_RUNNER_ENDPOINT = originalEndpoint;
    }
  });
});
