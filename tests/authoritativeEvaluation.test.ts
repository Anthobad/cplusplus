import { describe, it, expect } from "vitest";
import { evaluateSubmission } from "../server/evaluateSubmission";
import { CodeRunner, RunnerRequest, RunnerResult } from "../server/codeRunner";
import { getTrustedChallenge } from "../server/challengeRegistry";

class MockRunner implements CodeRunner {
  public lastRequest?: RunnerRequest;
  public shouldThrow = false;
  public simulatePass = false;

  async evaluate(request: RunnerRequest): Promise<RunnerResult> {
    this.lastRequest = request;

    if (this.shouldThrow) {
      throw new Error("Simulated runner crash or g++ missing");
    }

    const totalTests = request.testCases.length;
    const testsPassed = this.simulatePass ? totalTests : 0;
    const passed = this.simulatePass && totalTests > 0;

    return {
      compiled: true,
      passed,
      score: passed ? 100 : 0,
      testsPassed,
      totalTests,
      testResults: request.testCases.map((t, idx) => ({
        testId: t.isHidden ? `Hidden test ${idx + 1}` : `Test ${idx + 1}`,
        passed,
        isHidden: Boolean(t.isHidden),
        input: t.input,
        expectedOutput: t.expectedOutput,
        actualOutput: passed ? (t.expectedOutput || "ok") : "wrong_value",
      })),
      mode: request.mode,
      wasAssisted: request.wasAssisted,
      verified: passed && !request.wasAssisted && request.mode === "assessment",
    };
  }
}

describe("Authoritative Server Evaluation & Verification Integrity", () => {
  // Test 1: Unknown assessment challengeId cannot pass
  it("1. Unknown assessment challengeId cannot pass and returns configuration error", async () => {
    const runner = new MockRunner();
    runner.simulatePass = true; // Even if runner would pass

    const { status, result } = await evaluateSubmission(
      {
        challengeId: "nonexistent-challenge-id",
        studentCode: "int main() { return 0; }",
        mode: "assessment",
        wasAssisted: false,
      },
      runner
    );

    expect(status).toBe(200);
    expect(result.passed).toBe(false);
    expect(result.verified).toBe(false);
    expect(result.configurationError).toBe(true);
    expect(result.error).toContain("This challenge is not configured for verified assessment.");
    expect(runner.lastRequest).toBeUndefined(); // Runner must not even be invoked
  });

  // Test 2: Client-supplied tests cannot replace server assessment tests
  it("2. Client-supplied tests cannot replace server assessment tests", async () => {
    const runner = new MockRunner();
    runner.simulatePass = true;

    // Client tries to send fake easy tests to cheat assessment
    await evaluateSubmission(
      {
        challengeId: "cc-t1",
        studentCode: `#include <iostream>\nint main() { std::cout << "Hello, modern C++!\\n"; return 0; }`,
        mode: "assessment",
        wasAssisted: false,
        testCases: [{ input: "fake", expectedOutput: "0" }],
      },
      runner
    );

    expect(runner.lastRequest).toBeDefined();
    // Must use the trusted server registry tests, not the client's single fake test
    const trusted = getTrustedChallenge("cc-t1")!;
    const expectedTotal = trusted.publicTests.length + trusted.hiddenTests.length;
    expect(runner.lastRequest?.testCases.length).toBe(expectedTotal);
    expect(runner.lastRequest?.testCases[0].input).toBe(trusted.publicTests[0].input);
  });

  // Test 3: Client-supplied comparator cannot change assessment correctness
  it("3. Client-supplied comparator cannot change assessment correctness", async () => {
    const runner = new MockRunner();
    runner.simulatePass = true;

    // Client tries to supply loose numeric comparator to cheat
    await evaluateSubmission(
      {
        challengeId: "cc-t1",
        studentCode: `#include <iostream>\nint main() { std::cout << "Hello, modern C++!\\n"; return 0; }`,
        mode: "assessment",
        wasAssisted: false,
        comparator: "numeric",
      },
      runner
    );

    const trusted = getTrustedChallenge("cc-t1")!;
    expect(runner.lastRequest?.comparator).toBe(trusted.comparator || "trimmed");
  });

  // Test 4: Client-supplied driver code cannot change assessment correctness
  it("4. Client-supplied driver code cannot change assessment correctness", async () => {
    const runner = new MockRunner();
    runner.simulatePass = true;

    // Client tries to supply a hijacked driver that prints expected output directly
    await evaluateSubmission(
      {
        challengeId: "cc-t1",
        studentCode: `#include <iostream>\nint main() { std::cout << "Hello, modern C++!\\n"; return 0; }`,
        mode: "assessment",
        wasAssisted: false,
        driverCode: `int main() { std::cout << "10\\n"; return 0; }`,
      },
      runner
    );

    const trusted = getTrustedChallenge("cc-t1")!;
    expect(runner.lastRequest?.driverCode).toBe(trusted.driverCode);
  });

  // Test 5: Hidden tests never appear in API responses
  it("5. Hidden tests never appear in API responses (inputs and expected outputs sanitized)", async () => {
    const runner = new MockRunner();
    runner.simulatePass = false; // Simulate failure to check error reporting

    const { result } = await evaluateSubmission(
      {
        challengeId: "cc-t1",
        studentCode: `#include <iostream>\nint main() { std::cout << "Wrong\\n"; return 0; }`,
        mode: "assessment",
        wasAssisted: false,
      },
      runner
    );

    const hiddenResults = result.testResults.filter((t) => t.isHidden);
    expect(hiddenResults.length).toBeGreaterThan(0);

    for (const h of hiddenResults) {
      expect(h.input).toBeUndefined();
      expect(h.expectedOutput).toBeUndefined();
      expect(h.actualOutput).toBe("Hidden test failed");
      expect(h.error).toBe("Hidden test failed");
    }
  });

  // Test 6: Evaluation infrastructure failure cannot award progress
  it("6. Evaluation infrastructure failure cannot award progress (passed: false, verified: false)", async () => {
    const runner = new MockRunner();
    runner.shouldThrow = true; // Simulate crash / infrastructure failure

    const { status, result } = await evaluateSubmission(
      {
        challengeId: "cc-t1",
        studentCode: `#include <iostream>\nint main() { std::cout << "Hello, modern C++!\\n"; return 0; }`,
        mode: "assessment",
        wasAssisted: false,
      },
      runner
    );

    expect(status).toBe(503);
    expect(result.passed).toBe(false);
    expect(result.verified).toBe(false);
    expect(result.score).toBe(0);
    expect(result.error).toContain("Code evaluation is temporarily unavailable");
  });

  // Test 7: Correct registered challenge can pass
  it("7. Correct registered challenge can pass and grant verified status in assessment", async () => {
    const runner = new MockRunner();
    runner.simulatePass = true;

    const { status, result } = await evaluateSubmission(
      {
        challengeId: "cc-t1",
        studentCode: `#include <iostream>\nint main() { std::cout << "Hello, modern C++!\\n"; return 0; }`,
        mode: "assessment",
        wasAssisted: false,
      },
      runner
    );

    expect(status).toBe(200);
    expect(result.passed).toBe(true);
    expect(result.verified).toBe(true);
    expect(result.score).toBe(100);
  });

  // Test 8: Incorrect registered challenge fails
  it("8. Incorrect registered challenge fails and does not grant verified status", async () => {
    const runner = new MockRunner();
    runner.simulatePass = false;

    const { status, result } = await evaluateSubmission(
      {
        challengeId: "cc-t1",
        studentCode: `#include <iostream>\nint main() { std::cout << "Wrong\\n"; return 0; }`,
        mode: "assessment",
        wasAssisted: false,
      },
      runner
    );

    expect(status).toBe(200);
    expect(result.passed).toBe(false);
    expect(result.verified).toBe(false);
    expect(result.score).toBe(0);
  });
});
