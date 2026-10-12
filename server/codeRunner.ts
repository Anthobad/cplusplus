import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { gcpMetadata } from "google-auth-library";
import { TestCase, TestResult, AICodeFeedback } from "../src/types";

export type Comparator = "exact" | "trimmed" | "tokens" | "numeric";

export interface RunnerTestCase extends TestCase {
  testId?: string;
  comparator?: Comparator;
  isHidden?: boolean;
}

export interface RunnerRequest {
  code: string;
  driverCode?: string;
  testCases: RunnerTestCase[];
  mode: "practice" | "assessment";
  wasAssisted: boolean;
  timeoutMs?: number;
  comparator?: Comparator;
}

export interface RunnerResult {
  compiled: boolean;
  passed: boolean;
  score: number;
  compileError?: string;
  runtimeError?: string;
  executionTimeMs?: number;
  testsPassed: number;
  totalTests: number;
  testResults: TestResult[];
  mode: "practice" | "assessment";
  wasAssisted: boolean;
  verified: boolean;
  configurationError?: boolean;
  error?: string;
}

export interface CodeRunner {
  evaluate(request: RunnerRequest): Promise<RunnerResult>;
}

/**
 * Normalizes output based on comparator rules.
 * NEVER allows substring matching (.includes) as a fallback.
 */
export function compareOutputs(
  actual: string,
  expected: string,
  comparator: Comparator = "trimmed"
): boolean {
  // If expected is empty or purely whitespace, that is an invalid test expectation.
  if (expected === null || expected === undefined || expected.trim() === "") {
    return false;
  }

  const normalizeNewlines = (s: string) => s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  switch (comparator) {
    case "exact":
      return normalizeNewlines(actual) === normalizeNewlines(expected);

    case "tokens": {
      const actTokens = actual.trim().split(/\s+/).filter(Boolean);
      const expTokens = expected.trim().split(/\s+/).filter(Boolean);
      if (actTokens.length !== expTokens.length) return false;
      return actTokens.every((tok, idx) => tok === expTokens[idx]);
    }

    case "numeric": {
      const actNums = actual.trim().match(/-?\d+(\.\d+)?/g);
      const expNums = expected.trim().match(/-?\d+(\.\d+)?/g);
      if (!actNums || !expNums || actNums.length !== expNums.length) {
        return false;
      }
      return actNums.every((numStr, idx) => {
        const a = parseFloat(numStr);
        const b = parseFloat(expNums[idx]);
        return Math.abs(a - b) <= 1e-5;
      });
    }

    case "trimmed":
    default: {
      const actTrimmed = normalizeNewlines(actual)
        .split("\n")
        .map(l => l.trimEnd())
        .join("\n")
        .trim();
      const expTrimmed = normalizeNewlines(expected)
        .split("\n")
        .map(l => l.trimEnd())
        .join("\n")
        .trim();
      return actTrimmed === expTrimmed;
    }
  }
}

/**
 * Spawns a process with strict resource bounds (CPU timeout, max output bytes).
 */
function spawnWithLimits(
  command: string,
  args: string[],
  stdinInput: string = "",
  timeoutMs: number = 2500,
  maxOutputBytes: number = 64 * 1024
): Promise<{ stdout: string; stderr: string; exitCode: number | null; killed: boolean; signal?: string }> {
  return new Promise((resolve) => {
    let child: any;
    try {
      child = spawn(command, args, {
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (err: any) {
      return resolve({
        stdout: "",
        stderr: err.message,
        exitCode: -1,
        killed: false,
      });
    }

    let stdout = "";
    let stderr = "";
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      try {
        child.kill("SIGKILL");
      } catch (_e) {}
    }, timeoutMs);

    child.stdin?.on("error", (_e: any) => {
      // Ignore EPIPE/write errors if child process terminates before reading stdin
    });

    if (stdinInput) {
      try {
        child.stdin.write(stdinInput);
        child.stdin.end();
      } catch (_e) {}
    } else {
      try {
        child.stdin.end();
      } catch (_e) {}
    }

    child.stdout?.on("data", (chunk: Buffer) => {
      if (stdout.length < maxOutputBytes) {
        const remaining = maxOutputBytes - stdout.length;
        stdout += chunk.subarray(0, remaining).toString("utf8");
      }
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      if (stderr.length < maxOutputBytes) {
        const remaining = maxOutputBytes - stderr.length;
        stderr += chunk.subarray(0, remaining).toString("utf8");
      }
    });

    child.on("close", (exitCode: number | null, signal: string | null) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        exitCode,
        killed,
        signal: signal || undefined,
      });
    });

    child.on("error", (err: Error) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: err.message,
        exitCode: -1,
        killed: false,
      });
    });
  });
}

/**
 * LocalCodeRunner: Executes C++ code on host with process timeouts and output caps.
 * ONLY permitted in development environments. Logs a prominent security warning.
 */
export class LocalCodeRunner implements CodeRunner {
  private loggedWarning = false;

  constructor() {
    if (!this.loggedWarning) {
      console.warn(
        "\n========================================================================\n" +
        "[SECURITY WARNING] LocalCodeRunner is active.\n" +
        "Compiling & executing student C++ directly on the host machine.\n" +
        "This mode is ONLY permitted for local development.\n" +
        "Production environments MUST deploy an isolated container sandbox.\n" +
        "========================================================================\n"
      );
      this.loggedWarning = true;
    }
  }

  async evaluate(request: RunnerRequest): Promise<RunnerResult> {
    const {
      code,
      driverCode,
      testCases = [],
      mode = "practice",
      wasAssisted = false,
      timeoutMs = 2500,
      comparator = "trimmed"
    } = request;

    // RULE 3: Zero tests must NEVER mean pass
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
        compileError: "This challenge cannot currently be evaluated because its test configuration is incomplete.",
      };
    }

    // Filter out invalid empty tests
    const validTests = testCases.filter(t => t.expectedOutput && t.expectedOutput.trim() !== "");
    if (validTests.length === 0) {
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
        error: "This challenge is temporarily unavailable because its test configuration is incomplete.",
        compileError: "This challenge is temporarily unavailable because its test configuration is incomplete.",
      };
    }

    // Validate student code
    if (!code || !code.trim()) {
      return {
        compiled: false,
        passed: false,
        score: 0,
        compileError: "No source code provided. Please implement a solution before running.",
        testsPassed: 0,
        totalTests: validTests.length,
        testResults: [],
        mode,
        wasAssisted,
        verified: false,
      };
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cpp_run_"));
    const sourcePath = path.join(tempDir, "solution.cpp");
    const binaryPath = path.join(tempDir, "solution_bin");

    try {
      // Assemble source
      let fullSource = code;
      const hasMain = /\bint\s+main\s*\(/.test(code);

      if (driverCode && !hasMain) {
        fullSource = `${code}\n\n// --- Test Runner Driver Harness ---\n${driverCode}`;
      } else if (!hasMain) {
        fullSource = `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
#include <cmath>
#include <memory>
#include <map>
#include <unordered_map>
#include <set>
#include <unordered_set>
#include <queue>
#include <stack>
#include <deque>
#include <list>
#include <forward_list>
#include <functional>
#include <numeric>
#include <sstream>

${code}

int main() {
    return 0;
}`;
      }

      fs.writeFileSync(sourcePath, fullSource, "utf8");

      // Compile using g++
      const compileStart = Date.now();
      const compileRes = await spawnWithLimits("g++", [
        "-O2",
        "-std=c++20",
        "-Wall",
        "-Wextra",
        sourcePath,
        "-o",
        binaryPath,
      ], "", 8000, 512 * 1024);

      if (compileRes.exitCode !== 0) {
        const isCompilerMissing = compileRes.exitCode === -1 && compileRes.stderr?.includes("ENOENT");
        const compileErr = isCompilerMissing
          ? "Code evaluation is temporarily unavailable. C++ compiler (g++) is not installed on the host environment. Set ISOLATED_RUNNER_ENDPOINT to a containerized sandbox service."
          : (compileRes.stderr || "Compilation failed.");

        return {
          compiled: false,
          passed: false,
          score: 0,
          error: isCompilerMissing
            ? "Code evaluation is temporarily unavailable. Your attempt was not counted."
            : undefined,
          compileError: compileErr,
          executionTimeMs: Date.now() - compileStart,
          testsPassed: 0,
          totalTests: validTests.length,
          testResults: validTests.map((t, idx) => ({
            testId: t.isHidden ? `Hidden test ${idx + 1}` : `Test ${idx + 1}`,
            passed: false,
            isHidden: Boolean(t.isHidden),
            input: t.isHidden ? undefined : t.input,
            expectedOutput: t.isHidden ? undefined : t.expectedOutput,
            error: isCompilerMissing ? "Compiler unavailable" : "Compilation failed",
          })),
          mode,
          wasAssisted,
          verified: false,
        };
      }

      // Execute tests
      const testResults: TestResult[] = [];
      let testsPassed = 0;
      let totalTime = 0;

      for (let i = 0; i < validTests.length; i++) {
        const t = validTests[i];
        const isHidden = Boolean(t.isHidden);
        const testComparator = t.comparator || comparator;
        const testStart = Date.now();

        const execRes = await spawnWithLimits(binaryPath, [], t.input || "", timeoutMs);
        const testTime = Date.now() - testStart;
        totalTime += testTime;

        if (execRes.killed) {
          testResults.push({
            testId: isHidden ? `Hidden test ${i + 1}` : `Test ${i + 1}`,
            passed: false,
            isHidden,
            input: isHidden ? undefined : t.input,
            expectedOutput: isHidden ? undefined : t.expectedOutput,
            actualOutput: isHidden ? "Hidden test failed: Time Limit Exceeded" : "Time Limit Exceeded (2500ms)",
            executionTimeMs: testTime,
            error: "Time Limit Exceeded",
          });
          continue;
        }

        if (execRes.exitCode !== 0) {
          const sig = execRes.signal ? ` (${execRes.signal})` : "";
          testResults.push({
            testId: isHidden ? `Hidden test ${i + 1}` : `Test ${i + 1}`,
            passed: false,
            isHidden,
            input: isHidden ? undefined : t.input,
            expectedOutput: isHidden ? undefined : t.expectedOutput,
            actualOutput: isHidden
              ? `Hidden test failed: Runtime Error${sig}`
              : (execRes.stderr || `Exited with code ${execRes.exitCode}${sig}`),
            executionTimeMs: testTime,
            error: execRes.signal === "SIGSEGV" ? "Segmentation Fault (core dumped)" : "Runtime Error",
          });
          continue;
        }

        // Output comparison (RULE 4: Deterministic, NO partial match fallback)
        const isMatch = compareOutputs(execRes.stdout, t.expectedOutput, testComparator);

        if (isMatch) {
          testsPassed++;
        }

        testResults.push({
          testId: isHidden ? `Hidden test ${i + 1}` : `Test ${i + 1}`,
          passed: isMatch,
          isHidden,
          input: isHidden ? undefined : t.input,
          expectedOutput: isHidden ? undefined : t.expectedOutput,
          actualOutput: isHidden ? (isMatch ? "Passed" : "Failed") : execRes.stdout.trim(),
          executionTimeMs: testTime,
          error: isMatch ? undefined : (isHidden ? `Hidden test ${i + 1} failed` : "Output mismatch"),
        });
      }

      const totalTests = validTests.length;
      const passed = testsPassed === totalTests;
      const score = Math.round((testsPassed / totalTests) * 100);

      return {
        compiled: true,
        passed,
        score,
        executionTimeMs: totalTime,
        testsPassed,
        totalTests,
        testResults,
        mode,
        wasAssisted,
        verified: passed && !wasAssisted && mode === "assessment",
      };
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (_e) {}
    }
  }
}

/**
 * IsolatedProductionRunner: Enforces containerized execution in production.
 * If external container endpoint is not configured, fails safely without executing code.
 */
/**
 * Obtains a Google-signed OIDC ID Token for authenticated Cloud Run service-to-service communication.
 * Leverages Google Cloud instance metadata server without storing any static credentials or secrets.
 */
export async function getGoogleIdToken(targetAudience: string): Promise<string | undefined> {
  // 1. Explicit token if configured in environment
  if (process.env.RUNNER_AUTH_TOKEN) {
    return process.env.RUNNER_AUTH_TOKEN;
  }

  // 2. Google Cloud native identity token from instance metadata
  try {
    const isAvail = await gcpMetadata.isAvailable();
    if (isAvail) {
      const token = await gcpMetadata.instance(
        `service-accounts/default/identity?audience=${encodeURIComponent(targetAudience)}`
      );
      if (typeof token === "string" && token.trim()) {
        return token.trim();
      }
    }
  } catch (_err) {
    // Graceful fallback when outside Google Cloud environment
  }

  return undefined;
}

/**
 * IsolatedProductionRunner: Enforces containerized execution in production.
 * In production, strictly requires a separate external isolated runner service.
 * Localhost execution is strictly forbidden in production.
 */
export class IsolatedProductionRunner implements CodeRunner {
  private endpoint: string | undefined;

  constructor(endpoint?: string) {
    this.endpoint = endpoint || process.env.ISOLATED_RUNNER_ENDPOINT;
  }

  async evaluate(request: RunnerRequest): Promise<RunnerResult> {
    const isProd = process.env.NODE_ENV === "production";
    const isLocalhostEndpoint = Boolean(
      this.endpoint &&
        (this.endpoint.includes("127.0.0.1") ||
          this.endpoint.includes("localhost") ||
          this.endpoint.includes("0.0.0.0"))
    );

    // Rule 1 & 2: In production, in-container or localhost execution is strictly forbidden.
    // A genuinely separate authenticated isolated runner service is required.
    if (!this.endpoint || (isProd && isLocalhostEndpoint)) {
      return {
        compiled: false,
        passed: false,
        score: 0,
        testsPassed: 0,
        totalTests: request.testCases.length,
        testResults: [],
        mode: request.mode,
        wasAssisted: request.wasAssisted,
        verified: false,
        error: isProd && isLocalhostEndpoint
          ? "Production environment strictly forbids in-container or localhost code execution. Configure ISOLATED_RUNNER_ENDPOINT to an authenticated external Cloud Run runner service."
          : "Code evaluation in production requires an isolated containerized sandbox. Arbitrary code execution is safely disabled on the primary application server.",
        compileError: isProd && isLocalhostEndpoint
          ? "Production security violation: localhost runner execution is disabled. Set ISOLATED_RUNNER_ENDPOINT to an authorized external container service."
          : "Code evaluation in production requires an isolated containerized sandbox. Set ISOLATED_RUNNER_ENDPOINT to a containerized sandbox service (e.g. Google Cloud Run runner).",
      };
    }

    try {
      const controller = new AbortController();
      const perTestTimeout = request.timeoutMs || 2500;
      const totalTimeoutMs = (request.testCases?.length || 1) * perTestTimeout + 12000;
      const timer = setTimeout(() => controller.abort(), totalTimeoutMs);

      // Build authenticated headers
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (this.endpoint.startsWith("https://")) {
        try {
          const idToken = await getGoogleIdToken(this.endpoint);
          if (idToken) {
            headers["Authorization"] = `Bearer ${idToken}`;
          }
        } catch (_tokenErr) {
          // Token retrieval failed, Cloud Run will handle authentication rejection
        }
      } else if (process.env.RUNNER_AUTH_TOKEN) {
        headers["Authorization"] = `Bearer ${process.env.RUNNER_AUTH_TOKEN}`;
      }

      const response = await fetch(`${this.endpoint}/evaluate`, {
        method: "POST",
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      clearTimeout(timer);

      // Explicitly distinguish authentication failures
      if (response.status === 401 || response.status === 403) {
        return {
          compiled: false,
          passed: false,
          score: 0,
          testsPassed: 0,
          totalTests: request.testCases.length,
          testResults: [],
          mode: request.mode,
          wasAssisted: request.wasAssisted,
          verified: false,
          error: "Code evaluation is temporarily unavailable. Runner authentication failed (HTTP 401/403).",
          compileError: "The website is not authorized to invoke the isolated runner service. Check Cloud Run Invoker IAM permissions.",
        };
      }

      if (!response.ok) {
        throw new Error(`Isolated runner returned status ${response.status}`);
      }

      return (await response.json()) as RunnerResult;
    } catch (err: any) {
      return {
        compiled: false,
        passed: false,
        score: 0,
        testsPassed: 0,
        totalTests: request.testCases.length,
        testResults: [],
        mode: request.mode,
        wasAssisted: request.wasAssisted,
        verified: false,
        error: "Code evaluation is temporarily unavailable. Isolated runner failed to respond.",
        compileError: "The isolated C++ evaluation runner could not execute. Your attempt was not counted.",
      };
    }
  }
}

export interface ValidatedWandboxResponse {
  status: string;
  signal: string;
  compiler_output: string;
  compiler_error: string;
  compiler_message: string;
  program_output: string;
  program_error: string;
  program_message: string;
  isCompilationError: boolean;
  compileDiagnostic: string;
}

/**
 * Known compiler and linker error diagnostic patterns across GCC, Clang, and GNU ld / LLVM lld.
 */
export const COMPILER_ERROR_PATTERNS: RegExp[] = [
  /\b(?:error|fatal error):/i,
  /\bcollect2: error:/i,
  /\bld: error:/i,
  /\bundefined reference to\b/i,
  /\bmultiple definition of\b/i,
  /\bld returned \d+ exit status\b/i,
  /\binternal compiler error:/i,
  /\bunrecognized (?:command-line )?option\b/i,
  /\bno such file or directory\b/i,
  /\bcannot find -l/i,
  /\bfile not recognized\b/i,
  /\b(?:syntax|parse) error\b/i,
];

/**
 * Known compiler warning and note patterns (diagnostics that do not halt compilation).
 */
export const COMPILER_WARNING_PATTERNS: RegExp[] = [
  /\bwarning:/i,
  /\bnote:/i,
];

export interface WandboxClassification {
  isCompilationError: boolean;
  compileDiagnostic: string;
  isAmbiguous?: boolean;
}

/**
 * Classifies Wandbox execution results using compiler diagnostics rather than presence of stdout.
 * Reliably differentiates compilation failures, successful executions, and silent nonzero exits.
 */
export function classifyWandboxExecution(params: {
  status: string;
  signal: string;
  compiler_output: string;
  compiler_error: string;
  compiler_message: string;
  program_output: string;
  program_error: string;
  program_message: string;
}): WandboxClassification {
  const {
    status,
    signal,
    compiler_output,
    compiler_error,
    compiler_message,
    program_output,
    program_error,
    program_message,
  } = params;

  const compilerDiag = (compiler_error || compiler_message || compiler_output).trim();

  // 1. Status 0 means both compilation and program execution succeeded
  if (status === "0") {
    return {
      isCompilationError: false,
      compileDiagnostic: "",
    };
  }

  // 2. If a signal is present (e.g. SIGSEGV, SIGKILL, SIGABRT), the program reached execution
  if (signal.length > 0) {
    return {
      isCompilationError: false,
      compileDiagnostic: "",
    };
  }

  // 3. If there are NO compiler diagnostics at all, compilation succeeded cleanly.
  // The nonzero exit status came purely from program execution (e.g. silent `return 1;`).
  if (compilerDiag.length === 0) {
    return {
      isCompilationError: false,
      compileDiagnostic: "",
    };
  }

  // 4. Compiler diagnostics are present alongside nonzero status.
  // Check for definitive compiler/linker error markers.
  const hasCompilerError = COMPILER_ERROR_PATTERNS.some((pattern) => pattern.test(compilerDiag));
  if (hasCompilerError) {
    return {
      isCompilationError: true,
      compileDiagnostic: compilerDiag,
    };
  }

  // 5. If compiler diagnostics contain ONLY warnings/notes and no errors,
  // compilation succeeded and the nonzero status is a runtime exit.
  const hasOnlyWarnings = COMPILER_WARNING_PATTERNS.some((pattern) => pattern.test(compilerDiag));
  if (hasOnlyWarnings) {
    return {
      isCompilationError: false,
      compileDiagnostic: "",
    };
  }

  // 6. If program produced output/stderr, the program undeniably executed at runtime
  if (program_output.length > 0 || program_error.length > 0 || program_message.length > 0) {
    return {
      isCompilationError: false,
      compileDiagnostic: "",
    };
  }

  // 7. Ambiguous state: Nonzero status with non-empty compiler output that matches neither
  // standard compiler errors nor pure warnings, and produced no execution output.
  // Rather than guessing whether it was compile or runtime, flag as ambiguous.
  return {
    isCompilationError: false,
    compileDiagnostic: compilerDiag,
    isAmbiguous: true,
  };
}

/**
 * WandboxCodeRunner: Delegates C++ compilation and execution to the public Wandbox API.
 * Used as the primary zero-cost production runner when no private Cloud Run runner is configured.
 * Preserves backend authority: Wandbox compiles and runs code, but our backend evaluates pass/fail
 * and enforces hidden test security.
 */
export class WandboxCodeRunner implements CodeRunner {
  private compiler: string;
  private endpoint: string;
  private timeoutMs: number;
  private minIntervalMs: number;
  private lastRequestTime: number = 0;

  constructor(options?: {
    compiler?: string;
    endpoint?: string;
    timeoutMs?: number;
    minIntervalMs?: number;
  }) {
    this.compiler = options?.compiler || process.env.WANDBOX_COMPILER || "gcc-13.2.0";
    this.endpoint = options?.endpoint || process.env.WANDBOX_ENDPOINT || "https://wandbox.org/api/compile.json";
    this.timeoutMs = options?.timeoutMs || 15000;
    this.minIntervalMs =
      options?.minIntervalMs !== undefined
        ? options.minIntervalMs
        : process.env.NODE_ENV === "test"
        ? 0
        : 300;
  }

  private async invokeWandbox(
    code: string,
    stdin: string
  ): Promise<{ ok: boolean; data?: ValidatedWandboxResponse; errorType?: string; errorMsg?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      // Respectful delay between successive API calls to protect community service
      const now = Date.now();
      const elapsed = now - this.lastRequestTime;
      if (this.minIntervalMs > 0 && elapsed < this.minIntervalMs) {
        await new Promise((r) => setTimeout(r, this.minIntervalMs - elapsed));
      }
      this.lastRequestTime = Date.now();

      // Only send execution-necessary payload. Zero user or secret data.
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          compiler: this.compiler,
          code,
          "compiler-option-raw": "-std=c++20",
          options: "warning,c++2a",
          stdin,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.status === 429) {
        return {
          ok: false,
          errorType: "rate_limit",
          errorMsg: "Code evaluation service is currently busy. Please wait a moment and try again.",
        };
      }

      if (!response.ok) {
        return {
          ok: false,
          errorType: "http_error",
          errorMsg: "Code evaluation is temporarily unavailable. Please try again.",
        };
      }

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (_parseErr) {
        return {
          ok: false,
          errorType: "malformed_response",
          errorMsg: "Code evaluation is temporarily unavailable. Please try again.",
        };
      }

      // Strong response validation:
      // 1. Must be a non-null plain object (not an array or primitive)
      if (typeof data !== "object" || data === null || Array.isArray(data)) {
        return {
          ok: false,
          errorType: "malformed_response",
          errorMsg: "Code evaluation is temporarily unavailable. Please try again.",
        };
      }

      // 2. Reject explicit Wandbox error payloads
      if (
        (typeof data.error === "string" && data.error.trim()) ||
        (typeof data.errors === "string" && data.errors.trim()) ||
        (Array.isArray(data.errors) && data.errors.length > 0)
      ) {
        return {
          ok: false,
          errorType: "infrastructure_error",
          errorMsg: "Code evaluation is temporarily unavailable. Please try again.",
        };
      }

      // 3. Verify status field existence and type
      if (data.status === undefined || data.status === null) {
        return {
          ok: false,
          errorType: "malformed_response",
          errorMsg: "Code evaluation is temporarily unavailable. Please try again.",
        };
      }

      if (typeof data.status !== "string" && typeof data.status !== "number") {
        return {
          ok: false,
          errorType: "malformed_response",
          errorMsg: "Code evaluation is temporarily unavailable. Please try again.",
        };
      }

      // 4. Verify types of optional output fields when present
      const stringFields = [
        "signal",
        "compiler_output",
        "compiler_error",
        "compiler_message",
        "program_output",
        "program_error",
        "program_message",
      ];
      for (const field of stringFields) {
        if (data[field] !== undefined && typeof data[field] !== "string") {
          return {
            ok: false,
            errorType: "malformed_response",
            errorMsg: "Code evaluation is temporarily unavailable. Please try again.",
          };
        }
      }

      const status = String(data.status).trim();
      const signal = (typeof data.signal === "string" ? data.signal : "").trim();
      const compiler_output = typeof data.compiler_output === "string" ? data.compiler_output : "";
      const compiler_error = typeof data.compiler_error === "string" ? data.compiler_error : "";
      const compiler_message = typeof data.compiler_message === "string" ? data.compiler_message : "";
      const program_output = typeof data.program_output === "string" ? data.program_output : "";
      const program_error = typeof data.program_error === "string" ? data.program_error : "";
      const program_message = typeof data.program_message === "string" ? data.program_message : "";

      // 5. Robust compiler-error distinction:
      // Uses reliable compiler-specific diagnostic markers rather than presence/absence of stdout.
      // Correctly identifies compilation failure, silent nonzero runtime exit, and ambiguous responses.
      const classification = classifyWandboxExecution({
        status,
        signal,
        compiler_output,
        compiler_error,
        compiler_message,
        program_output,
        program_error,
        program_message,
      });

      if (classification.isAmbiguous) {
        return {
          ok: false,
          errorType: "ambiguous_response",
          errorMsg: "Code evaluation is temporarily unavailable. Please try again.",
        };
      }

      const validated: ValidatedWandboxResponse = {
        status,
        signal,
        compiler_output,
        compiler_error,
        compiler_message,
        program_output,
        program_error,
        program_message,
        isCompilationError: classification.isCompilationError,
        compileDiagnostic: classification.compileDiagnostic,
      };

      return { ok: true, data: validated };
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        return {
          ok: false,
          errorType: "timeout",
          errorMsg: "Code evaluation is temporarily unavailable. Please try again.",
        };
      }
      return {
        ok: false,
        errorType: "network_error",
        errorMsg: "Code evaluation is temporarily unavailable. Please try again.",
      };
    }
  }

  async evaluate(request: RunnerRequest): Promise<RunnerResult> {
    const {
      code = "",
      driverCode,
      testCases = [],
      mode = "practice",
      wasAssisted = false,
      comparator = "trimmed",
    } = request;

    // Rule 3: Zero tests must never mean pass
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
        compileError: "This challenge cannot currently be evaluated because its test configuration is incomplete.",
      };
    }

    const validTests = testCases.filter((t) => t.expectedOutput && t.expectedOutput.trim() !== "");
    if (validTests.length === 0) {
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
        error: "This challenge is temporarily unavailable because its test configuration is incomplete.",
        compileError: "This challenge is temporarily unavailable because its test configuration is incomplete.",
      };
    }

    if (!code || !code.trim()) {
      return {
        compiled: false,
        passed: false,
        score: 0,
        compileError: "No source code provided. Please implement a solution before running.",
        testsPassed: 0,
        totalTests: validTests.length,
        testResults: [],
        mode,
        wasAssisted,
        verified: false,
      };
    }

    // Assemble source code with driver harness
    let fullSource = code;
    const hasMain = /\bint\s+main\s*\(/.test(code);

    if (driverCode && !hasMain) {
      fullSource = `${code}\n\n// --- Test Runner Driver Harness ---\n${driverCode}`;
    } else if (!hasMain) {
      fullSource = `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
#include <cmath>
#include <memory>
#include <map>
#include <unordered_map>
#include <set>
#include <unordered_set>
#include <queue>
#include <stack>
#include <deque>
#include <list>
#include <forward_list>
#include <functional>
#include <numeric>
#include <sstream>

${code}

int main() {
    return 0;
}`;
    }

    const startTime = Date.now();
    const testResults: TestResult[] = [];
    let testsPassed = 0;

    // Run test cases against Wandbox
    for (let i = 0; i < validTests.length; i++) {
      const t = validTests[i];
      const isHidden = Boolean(t.isHidden);
      const testComparator = t.comparator || comparator;
      const testStart = Date.now();

      const res = await this.invokeWandbox(fullSource, t.input || "");
      const testTime = Date.now() - testStart;

      // Handle infrastructure failure
      if (!res.ok) {
        return {
          compiled: false,
          passed: false,
          score: 0,
          testsPassed: 0,
          totalTests: validTests.length,
          testResults: [],
          mode,
          wasAssisted,
          verified: false,
          error:
            res.errorType === "rate_limit"
              ? "Code evaluation service is currently busy. Please wait a moment and try again."
              : "Code evaluation is temporarily unavailable. Please try again.",
          compileError:
            res.errorType === "rate_limit"
              ? "Code evaluation service is currently busy. Please wait a moment and try again."
              : "Code evaluation is temporarily unavailable. Please try again.",
        };
      }

      const data = res.data!;

      // Short-circuit immediately on compilation failure.
      // Never award a pass when compilation fails and avoid redundant requests for remaining tests.
      if (data.isCompilationError) {
        const compileErr = data.compileDiagnostic || "Compilation failed.";
        return {
          compiled: false,
          passed: false,
          score: 0,
          compileError: compileErr,
          executionTimeMs: Date.now() - startTime,
          testsPassed: 0,
          totalTests: validTests.length,
          testResults: validTests.map((testCase, idx) => ({
            testId: testCase.testId || (testCase.isHidden ? `Hidden test ${idx + 1}` : `Test ${idx + 1}`),
            passed: false,
            isHidden: Boolean(testCase.isHidden),
            input: testCase.isHidden ? undefined : testCase.input,
            expectedOutput: testCase.isHidden ? undefined : testCase.expectedOutput,
            error: "Compilation failed",
          })),
          mode,
          wasAssisted,
          verified: false,
        };
      }

      // Check timeout (Wandbox watchdog status 137 or signal KILL)
      if (data.status === "137" || data.signal === "KILL" || data.signal === "SIGKILL") {
        testResults.push({
          testId: t.testId || (isHidden ? `Hidden test ${i + 1}` : `Test ${i + 1}`),
          passed: false,
          isHidden,
          input: isHidden ? undefined : t.input,
          expectedOutput: isHidden ? undefined : t.expectedOutput,
          actualOutput: isHidden ? "Hidden test failed: Time Limit Exceeded" : "Time Limit Exceeded",
          executionTimeMs: testTime,
          error: "Time Limit Exceeded",
        });
        continue;
      }

      // Check runtime errors (segfaults, floating point, abrt, non-zero program status)
      if (data.status !== "0" || Boolean(data.signal)) {
        let errDesc = "Runtime Error";
        if (
          data.signal === "SIGSEGV" ||
          data.program_error.includes("Segmentation fault")
        ) {
          errDesc = "Segmentation Fault (core dumped)";
        } else if (data.signal === "SIGFPE") {
          errDesc = "Floating Point Exception (core dumped)";
        } else if (
          data.signal === "SIGABRT" ||
          data.program_error.includes("terminate called") ||
          data.program_error.includes("Aborted")
        ) {
          errDesc = "Aborted (core dumped)";
        }

        const sig = data.signal ? ` (${data.signal})` : "";
        testResults.push({
          testId: t.testId || (isHidden ? `Hidden test ${i + 1}` : `Test ${i + 1}`),
          passed: false,
          isHidden,
          input: isHidden ? undefined : t.input,
          expectedOutput: isHidden ? undefined : t.expectedOutput,
          actualOutput: isHidden
            ? `Hidden test failed: ${errDesc}${sig}`
            : (data.program_error || data.program_output || `Exited with status ${data.status}${sig}`),
          executionTimeMs: testTime,
          error: errDesc,
        });
        continue;
      }

      // Output comparison with our authoritative comparator
      const actualOutput = data.program_output || "";
      const isMatch = compareOutputs(actualOutput, t.expectedOutput, testComparator);
      if (isMatch) {
        testsPassed++;
      }

      testResults.push({
        testId: t.testId || (isHidden ? `Hidden test ${i + 1}` : `Test ${i + 1}`),
        passed: isMatch,
        isHidden,
        input: isHidden ? undefined : t.input,
        expectedOutput: isHidden ? undefined : t.expectedOutput,
        actualOutput: isHidden ? (isMatch ? "Passed" : "Failed") : actualOutput.trim(),
        executionTimeMs: testTime,
        error: isMatch ? undefined : isHidden ? `Hidden test ${i + 1} failed` : "Output mismatch",
      });
    }

    const totalTests = validTests.length;
    const passed = testsPassed === totalTests;
    const score = Math.round((testsPassed / totalTests) * 100);

    return {
      compiled: true,
      passed,
      score,
      executionTimeMs: Date.now() - startTime,
      testsPassed,
      totalTests,
      testResults,
      mode,
      wasAssisted,
      verified: passed && !wasAssisted && mode === "assessment",
    };
  }
}

/**
 * Factory for obtaining the active CodeRunner based on environment configuration.
 * - In production with external Cloud Run endpoint: uses IsolatedProductionRunner.
 * - In production without external runner: delegates to WandboxCodeRunner (zero-cost, no billing).
 * - Production NEVER falls back to localhost execution.
 */
export function getCodeRunner(): CodeRunner {
  const isProd = process.env.NODE_ENV === "production";
  const mode = process.env.CODE_RUNNER_MODE;
  const isolatedEndpoint = process.env.ISOLATED_RUNNER_ENDPOINT;
  const hasIsolatedEndpoint = Boolean(
    isolatedEndpoint &&
      !isolatedEndpoint.includes("127.0.0.1") &&
      !isolatedEndpoint.includes("localhost") &&
      !isolatedEndpoint.includes("0.0.0.0")
  );

  // 1. Valid external Cloud Run runner endpoint explicitly configured
  if (hasIsolatedEndpoint && (!mode || mode !== "local" || isProd)) {
    return new IsolatedProductionRunner();
  }

  // 2. Production with no external Cloud Run endpoint: use Wandbox
  if (isProd) {
    return new WandboxCodeRunner();
  }

  // 3. Explicit dev opt-ins:
  if (mode === "wandbox") {
    return new WandboxCodeRunner();
  }

  if (mode === "isolated") {
    return new IsolatedProductionRunner();
  }

  // 4. Local development runner
  return new LocalCodeRunner();
}
