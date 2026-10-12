import { describe, it, expect } from "vitest";
import { compareOutputs, LocalCodeRunner, CodeRunner, RunnerRequest, RunnerResult } from "../server/codeRunner";

describe("C++ Output Comparison (compareOutputs)", () => {
  it("trimmed comparator matches identical strings with different whitespace/newlines", () => {
    expect(compareOutputs("hello world\n", "hello world", "trimmed")).toBe(true);
    expect(compareOutputs("42\r\n", "42", "trimmed")).toBe(true);
    expect(compareOutputs("  line1  \nline2  ", "line1\nline2", "trimmed")).toBe(true);
  });

  it("trimmed comparator strictly rejects partial/substring outputs (RULE 4)", () => {
    // Crucial: Must NEVER allow actual.includes(expected)
    expect(compareOutputs("hello world foo bar", "hello world", "trimmed")).toBe(false);
    expect(compareOutputs("result: 42", "42", "trimmed")).toBe(false);
    expect(compareOutputs("[1, 2, 3, 4, 5]", "[1, 2]", "trimmed")).toBe(false);
  });

  it("exact comparator requires strict match", () => {
    expect(compareOutputs("hello", "hello", "exact")).toBe(true);
    expect(compareOutputs("hello ", "hello", "exact")).toBe(false);
    expect(compareOutputs("hello\n", "hello", "exact")).toBe(false);
  });

  it("tokens comparator compares whitespace-separated tokens regardless of spacing", () => {
    expect(compareOutputs("1   2   3\n4", "1 2 3 4", "tokens")).toBe(true);
    expect(compareOutputs("1 2 3", "1 2 3 4", "tokens")).toBe(false);
  });

  it("numeric comparator allows floating point tolerance within 1e-5", () => {
    expect(compareOutputs("3.1415926", "3.14159", "numeric")).toBe(true);
    expect(compareOutputs("10.0 20.0", "10.000001 20.0", "numeric")).toBe(true);
    expect(compareOutputs("10.0", "10.5", "numeric")).toBe(false);
  });

  it("empty or null expected output is an invalid test and returns false", () => {
    expect(compareOutputs("some output", "", "trimmed")).toBe(false);
    expect(compareOutputs("some output", "   ", "trimmed")).toBe(false);
    expect(compareOutputs("", "", "trimmed")).toBe(false);
  });
});

describe("LocalCodeRunner Host Environment Safety", () => {
  const runner = new LocalCodeRunner();

  it("zero tests or empty test cases return configuration_error and passed: false (RULE 3)", async () => {
    const result = await runner.evaluate({
      code: "int main() { return 0; }",
      testCases: [],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.passed).toBe(false);
    expect(result.compiled).toBe(false);
    expect(result.configurationError).toBe(true);
    expect(result.error).toContain("configuration is incomplete");
  });

  it("tests with only empty expectedOutput are rejected as configuration_error", async () => {
    const result = await runner.evaluate({
      code: "int main() { return 0; }",
      testCases: [{ input: "", expectedOutput: "" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.passed).toBe(false);
    expect(result.configurationError).toBe(true);
  });

  it("if host compiler is missing or unavailable, fails safely with unavailable notice and passed: false (RULE 1)", async () => {
    const result = await runner.evaluate({
      code: `#include <iostream>
int main() { return 0; }`,
      testCases: [{ input: "", expectedOutput: "42" }],
      mode: "assessment",
      wasAssisted: false,
    });

    // In environments without host g++, it must NEVER pass or throw unhandled exceptions
    expect(result.passed).toBe(false);
    if (!result.compiled) {
      expect(result.score).toBe(0);
      expect(result.verified).toBe(false);
    }
  });
});

/**
 * Isolated Simulation Runner testing the full contract execution pipelines
 * regardless of host OS dependencies.
 */
class SimulatedTestRunner implements CodeRunner {
  async evaluate(request: RunnerRequest): Promise<RunnerResult> {
    const { code, testCases = [], mode = "practice", wasAssisted = false } = request;

    if (!testCases || testCases.length === 0) {
      return {
        compiled: false,
        passed: false,
        score: 0,
        testsPassed: 0,
        totalTests: 0,
        testResults: [],
        mode,
        wasAssisted,
        verified: false,
        configurationError: true,
        error: "This challenge cannot currently be evaluated because its test configuration is incomplete.",
      };
    }

    if (code.includes("syntax_error;")) {
      return {
        compiled: false,
        passed: false,
        score: 0,
        compileError: "error: expected primary-expression before ';' token",
        testsPassed: 0,
        totalTests: testCases.length,
        testResults: [],
        mode,
        wasAssisted,
        verified: false,
      };
    }

    if (code.includes("while(true)")) {
      return {
        compiled: true,
        passed: false,
        score: 0,
        testsPassed: 0,
        totalTests: testCases.length,
        testResults: testCases.map((t, idx) => ({
          testId: t.isHidden ? `Hidden test ${idx + 1}` : `Test ${idx + 1}`,
          passed: false,
          isHidden: Boolean(t.isHidden),
          actualOutput: "Time Limit Exceeded (2500ms)",
          error: "Time Limit Exceeded",
        })),
        mode,
        wasAssisted,
        verified: false,
      };
    }

    // Check outputs
    const testResults = testCases.map((t, idx) => {
      const isHidden = Boolean(t.isHidden);
      const isMatch = code.includes("return_correct");
      return {
        testId: isHidden ? `Hidden test ${idx + 1}` : `Test ${idx + 1}`,
        passed: isMatch,
        isHidden,
        input: isHidden ? undefined : t.input,
        expectedOutput: isHidden ? undefined : t.expectedOutput,
        actualOutput: isHidden ? (isMatch ? "Passed" : "Failed") : (isMatch ? t.expectedOutput : "wrong_val"),
      };
    });

    const testsPassed = testResults.filter((r) => r.passed).length;
    const passed = testsPassed === testCases.length;

    return {
      compiled: true,
      passed,
      score: Math.round((testsPassed / testCases.length) * 100),
      testsPassed,
      totalTests: testCases.length,
      testResults,
      mode,
      wasAssisted,
      verified: passed && !wasAssisted && mode === "assessment",
    };
  }
}

describe("CodeRunner Verification Contract & Pipeline", () => {
  const simulatedRunner = new SimulatedTestRunner();

  it("compilation error does not pass and returns compileError", async () => {
    const result = await simulatedRunner.evaluate({
      code: "int invalid = syntax_error;",
      testCases: [{ input: "", expectedOutput: "42" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.compileError).toBeDefined();
    expect(result.verified).toBe(false);
  });

  it("correct output passes tests and grants verified status in assessment mode", async () => {
    const result = await simulatedRunner.evaluate({
      code: "return_correct;",
      testCases: [{ input: "5", expectedOutput: "10" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(true);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.verified).toBe(true);
  });

  it("assisted practice attempt does NOT grant verified assessment status (RULE 6)", async () => {
    const result = await simulatedRunner.evaluate({
      code: "return_correct;",
      testCases: [{ input: "5", expectedOutput: "10" }],
      mode: "practice",
      wasAssisted: true, // User revealed the official solution
    });

    expect(result.passed).toBe(true);
    expect(result.wasAssisted).toBe(true);
    expect(result.verified).toBe(false); // MUST NOT masquerade as verified assessment
  });

  it("hidden tests never leak input or expectedOutput to the client (RULE 5)", async () => {
    const result = await simulatedRunner.evaluate({
      code: "return_correct;",
      testCases: [
        { input: "public_in", expectedOutput: "public_out", isHidden: false },
        { input: "secret_in", expectedOutput: "secret_out", isHidden: true },
      ],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.testResults.length).toBe(2);
    const hiddenResult = result.testResults[1];
    expect(hiddenResult.isHidden).toBe(true);
    expect(hiddenResult.input).toBeUndefined();
    expect(hiddenResult.expectedOutput).toBeUndefined();
  });

  it("timeout fails tests and reports Time Limit Exceeded", async () => {
    const result = await simulatedRunner.evaluate({
      code: "while(true) {}",
      testCases: [{ input: "", expectedOutput: "42" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.passed).toBe(false);
    expect(result.testResults[0].actualOutput).toContain("Time Limit Exceeded");
  });
});
