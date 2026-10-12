import { getCodeRunner, CodeRunner, RunnerResult } from "./codeRunner";
import { getTrustedChallenge } from "./challengeRegistry";
import { CodeEvaluationResult } from "../src/types";

export interface SubmissionPayload {
  challengeId?: string;
  code?: string;
  studentCode?: string;
  challengeTitle?: string;
  expectedBehavior?: string;
  mode?: "practice" | "assessment";
  wasAssisted?: boolean;
  requestAiFeedback?: boolean;
  // Potentially untrusted client-supplied fields:
  testCases?: any[];
  hiddenTestCases?: any[];
  driverCode?: string;
  comparator?: any;
}

/**
 * Authoritatively evaluates a student code submission.
 * - Enforces server-side registry as source of truth for tests, harness, and comparator.
 * - Fails safely if an unknown challenge is submitted in assessment mode.
 * - Completely rejects client-supplied hidden tests.
 * - Strips hidden test inputs and expected outputs from testResults to prevent leaks.
 * - Ensures verified is only true for unassisted, passing, registered assessment submissions.
 */
export async function evaluateSubmission(
  payload: SubmissionPayload,
  customRunner?: CodeRunner
): Promise<{ status: number; result: CodeEvaluationResult }> {
  const {
    challengeId,
    code,
    studentCode,
    challengeTitle = "C++ Coding Challenge",
    expectedBehavior = "Correct implementation",
    mode = "practice",
    wasAssisted = false,
  } = payload;

  const sourceCode = (code || studentCode || "").trim();
  const isAssessment = mode === "assessment";

  // 1. Authoritative Server Registry lookup
  const registryChallenge = challengeId ? getTrustedChallenge(challengeId) : undefined;

  // RULE 4: Unknown assessment challenges MUST fail safely
  if (isAssessment && (!challengeId || !registryChallenge)) {
    return {
      status: 200,
      result: {
        compiled: false,
        passed: false,
        score: 0,
        testsPassed: 0,
        totalTests: 0,
        testResults: [],
        mode: "assessment",
        wasAssisted: Boolean(wasAssisted),
        verified: false,
        configurationError: true,
        error: "This challenge is not configured for verified assessment.",
        compileError: "This challenge is not configured for verified assessment.",
      },
    };
  }

  // 2. Authoritative configuration from server registry
  let trustedDriver: string | undefined;
  let trustedPublicTests: any[] = [];
  let trustedHiddenTests: any[] = [];
  let trustedComparator: any = "trimmed";

  if (registryChallenge) {
    // The server challenge registry is strictly authoritative.
    // Client-supplied testCases, driverCode, comparator, or hiddenTestCases are completely ignored.
    trustedDriver = registryChallenge.driverCode;
    trustedPublicTests = registryChallenge.publicTests || [];
    trustedHiddenTests = registryChallenge.hiddenTests || [];
    trustedComparator = registryChallenge.comparator || "trimmed";
  } else {
    // Unregistered practice mode fallback (e.g. scratchpad practice)
    // Client-supplied hidden tests are NEVER accepted.
    trustedPublicTests = Array.isArray(payload.testCases) ? payload.testCases : [];
    trustedHiddenTests = [];
    trustedDriver = typeof payload.driverCode === "string" ? payload.driverCode : undefined;
    trustedComparator = payload.comparator || "trimmed";
  }

  // Combine tests with hidden flags
  const combinedTests = [
    ...trustedPublicTests.map((t: any) => ({ ...t, isHidden: false })),
    ...trustedHiddenTests.map((t: any) => ({ ...t, isHidden: true })),
  ];

  // RULE 3: Zero tests must NEVER mean pass
  if (combinedTests.length === 0) {
    return {
      status: 200,
      result: {
        compiled: false,
        passed: false,
        score: 0,
        testsPassed: 0,
        totalTests: 0,
        testResults: [],
        mode,
        wasAssisted: Boolean(wasAssisted),
        verified: false,
        configurationError: true,
        error: "This challenge cannot currently be evaluated because its test configuration is incomplete.",
        compileError: "This challenge cannot currently be evaluated because its test configuration is incomplete.",
      },
    };
  }

  if (!sourceCode) {
    return {
      status: 200,
      result: {
        compiled: false,
        passed: false,
        score: 0,
        compileError: "No source code provided. Please write an implementation before running.",
        testsPassed: 0,
        totalTests: combinedTests.length,
        testResults: [],
        mode,
        wasAssisted: Boolean(wasAssisted),
        verified: false,
      },
    };
  }

  // 3. Compile & run with C++ runner
  try {
    const runner = customRunner || getCodeRunner();
    const evalResult = await runner.evaluate({
      code: sourceCode,
      driverCode: trustedDriver,
      testCases: combinedTests,
      mode,
      wasAssisted: Boolean(wasAssisted),
      comparator: trustedComparator,
    });

    // Enforce verified status:
    // Only true if passed, unassisted, assessment mode, and backed by a trusted server registry challenge.
    evalResult.verified = Boolean(
      evalResult.passed && !wasAssisted && mode === "assessment" && registryChallenge
    );

    // Sanitize test results:
    // RULE 5: Hidden test case inputs, expected outputs, and details must NEVER be returned in API responses
    evalResult.testResults = evalResult.testResults.map((t, idx) => {
      if (t.isHidden) {
        return {
          testId: `Hidden test ${idx + 1}`,
          passed: t.passed,
          isHidden: true,
          input: undefined,
          expectedOutput: undefined,
          actualOutput: t.passed ? "Passed" : "Hidden test failed",
          error: t.passed ? undefined : "Hidden test failed",
          executionTimeMs: t.executionTimeMs,
        };
      }
      return t;
    });

    return { status: 200, result: evalResult };
  } catch (error: any) {
    return {
      status: 503,
      result: {
        compiled: false,
        passed: false,
        score: 0,
        testsPassed: 0,
        totalTests: 0,
        testResults: [],
        mode,
        wasAssisted: Boolean(wasAssisted),
        verified: false,
        error: "Code evaluation is temporarily unavailable. Your attempt was not counted.",
        compileError: "The C++ evaluation runner could not execute. Your attempt was not counted.",
      },
    };
  }
}
