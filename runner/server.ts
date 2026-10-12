import http from "http";
import fs from "fs";
import path from "path";
import os from "os";
import { spawn, spawnSync } from "child_process";
import crypto from "crypto";

export type Comparator = "exact" | "trimmed" | "tokens" | "numeric";

export interface RunnerTestCase {
  testId?: string;
  input?: string;
  expectedOutput: string;
  comparator?: Comparator;
  isHidden?: boolean;
}

export interface RunnerRequest {
  code: string;
  driverCode?: string;
  testCases: RunnerTestCase[];
  mode?: "practice" | "assessment";
  wasAssisted?: boolean;
  timeoutMs?: number;
  comparator?: Comparator;
}

export interface TestResult {
  testId: string;
  passed: boolean;
  isHidden: boolean;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  executionTimeMs?: number;
  error?: string;
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

// Sandbox environment capabilities probe
let canUsePrlimit = false;
let canUseUnshareNet = false;

try {
  const pCheck = spawnSync("prlimit", ["--help"], { stdio: "ignore" });
  canUsePrlimit = pCheck.status === 0;
} catch (_e) {
  canUsePrlimit = false;
}

try {
  const uCheck = spawnSync("unshare", ["--net", "true"], { stdio: "ignore" });
  canUseUnshareNet = uCheck.status === 0;
} catch (_e) {
  canUseUnshareNet = false;
}

/**
 * Normalizes output based on comparator rules.
 * Strictly prevents substring matching (.includes) fallback.
 */
export function compareOutputs(
  actual: string,
  expected: string,
  comparator: Comparator = "trimmed"
): boolean {
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
        .map((l) => l.trimEnd())
        .join("\n")
        .trim();
      const expTrimmed = normalizeNewlines(expected)
        .split("\n")
        .map((l) => l.trimEnd())
        .join("\n")
        .trim();
      return actTrimmed === expTrimmed;
    }
  }
}

/**
 * Spawns a process with multi-layer sandbox isolation:
 * - Sanitized environment (removes website secrets, API keys, credentials)
 * - Network isolation: unshare --net removes network interfaces from untrusted processes
 * - Resource limits via prlimit: caps virtual memory (256MB), process count (16), file size (10MB)
 * - Process group management: kills process tree with SIGKILL on timeout
 * - Output buffer cap: strict truncation on stdout/stderr to prevent memory flooding
 */
function spawnWithIsolation(
  command: string,
  args: string[],
  cwd: string,
  stdinInput: string = "",
  timeoutMs: number = 2500,
  maxOutputBytes: number = 64 * 1024,
  isStudentExecution: boolean = false
): Promise<{ stdout: string; stderr: string; exitCode: number | null; killed: boolean; signal?: string }> {
  return new Promise((resolve) => {
    // Strict isolated environment - DO NOT pass process.env to student code
    const isolatedEnv = {
      PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
      TMPDIR: "/tmp",
      LANG: "C.UTF-8",
      LC_ALL: "C.UTF-8",
    };

    let actualCmd = command;
    let actualArgs = [...args];

    // Wrap student execution with kernel-level resource and network limits if supported
    if (isStudentExecution) {
      const sandboxWrappers: string[] = [];
      if (canUsePrlimit) {
        // 256MB address space, max 16 processes/threads, max 10MB file write, 0 core dump
        sandboxWrappers.push("prlimit", "--as=268435456", "--nproc=16", "--fsize=10485760", "--core=0");
      }
      if (canUseUnshareNet) {
        // Drop network access completely
        sandboxWrappers.push("unshare", "--net");
      }

      if (sandboxWrappers.length > 0) {
        actualCmd = sandboxWrappers[0];
        actualArgs = [...sandboxWrappers.slice(1), command, ...args];
      }
    } else if (command === "g++" && canUsePrlimit) {
      // For compiler: allow up to 1GB address space, 64 processes
      const compileWrappers = ["prlimit", "--as=1073741824", "--nproc=64", "--fsize=20971520", "--core=0"];
      if (canUseUnshareNet) {
        compileWrappers.push("unshare", "--net");
      }
      actualCmd = compileWrappers[0];
      actualArgs = [...compileWrappers.slice(1), command, ...args];
    }

    let child: any;
    try {
      child = spawn(actualCmd, actualArgs, {
        cwd,
        env: isolatedEnv,
        detached: true,
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

    // Strict CPU execution timeout with process group termination
    const timer = setTimeout(() => {
      killed = true;
      try {
        if (child.pid) {
          process.kill(-child.pid, "SIGKILL");
        }
      } catch (_e) {
        try {
          child.kill("SIGKILL");
        } catch (_e2) {}
      }
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
 * Checks whether g++ compiler is available on the system.
 */
export async function checkCompiler(): Promise<{ available: boolean; version?: string; error?: string }> {
  const res = await spawnWithIsolation("g++", ["--version"], os.tmpdir(), "", 3000, 4096, false);
  if (res.exitCode === 0) {
    const firstLine = res.stdout.split("\n")[0]?.trim();
    return { available: true, version: firstLine };
  }
  return { available: false, error: res.stderr || "g++ not found or failed to execute" };
}

/**
 * Evaluates student C++ code against test cases in an isolated workspace.
 */
export async function evaluateCode(request: RunnerRequest): Promise<RunnerResult> {
  const {
    code = "",
    driverCode,
    testCases = [],
    mode = "practice",
    wasAssisted = false,
    timeoutMs = 2500,
    comparator = "trimmed",
  } = request;

  // RULE 3: Zero tests must never mean pass
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

  // Validate student code presence
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

  // Create isolated per-request directory
  const runId = crypto.randomUUID();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `sandbox_cpp_${runId}_`));
  const sourcePath = path.join(tempDir, "solution.cpp");
  const binaryPath = path.join(tempDir, "solution_bin");

  try {
    // Assemble source code
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

    // Compile using g++ with C++20 standard
    const compileStart = Date.now();
    const compileRes = await spawnWithIsolation(
      "g++",
      ["-O2", "-std=c++20", "-Wall", "-Wextra", sourcePath, "-o", binaryPath],
      tempDir,
      "",
      8000,
      256 * 1024,
      false
    );

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
          testId: t.testId || (t.isHidden ? `Hidden test ${idx + 1}` : `Test ${idx + 1}`),
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

    // Execute test cases
    const testResults: TestResult[] = [];
    let testsPassed = 0;
    let totalTime = 0;

    for (let i = 0; i < validTests.length; i++) {
      const t = validTests[i];
      const isHidden = Boolean(t.isHidden);
      const testComparator = t.comparator || comparator;
      const testStart = Date.now();

      // Student binary runs under strict sandbox limits (prlimit, unshare --net, 64KB cap, 2.5s timeout)
      const execRes = await spawnWithIsolation(binaryPath, [], tempDir, t.input || "", timeoutMs, 64 * 1024, true);
      const testTime = Date.now() - testStart;
      totalTime += testTime;

      if (execRes.killed) {
        testResults.push({
          testId: t.testId || (isHidden ? `Hidden test ${i + 1}` : `Test ${i + 1}`),
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
        let errDesc = "Runtime Error";
        if (execRes.signal === "SIGSEGV") {
          errDesc = "Segmentation Fault (core dumped)";
        } else if (execRes.signal === "SIGFPE") {
          errDesc = "Floating Point Exception (core dumped)";
        } else if (execRes.signal === "SIGABRT") {
          errDesc = "Aborted (core dumped)";
        } else if (execRes.signal === "SIGXFSZ") {
          errDesc = "File Size Limit Exceeded";
        }

        const sig = execRes.signal ? ` (${execRes.signal})` : "";
        testResults.push({
          testId: t.testId || (isHidden ? `Hidden test ${i + 1}` : `Test ${i + 1}`),
          passed: false,
          isHidden,
          input: isHidden ? undefined : t.input,
          expectedOutput: isHidden ? undefined : t.expectedOutput,
          actualOutput: isHidden
            ? `Hidden test failed: ${errDesc}${sig}`
            : (execRes.stderr || `Exited with code ${execRes.exitCode}${sig}`),
          executionTimeMs: testTime,
          error: errDesc,
        });
        continue;
      }

      // Output comparison
      const isMatch = compareOutputs(execRes.stdout, t.expectedOutput, testComparator);
      if (isMatch) {
        testsPassed++;
      }

      testResults.push({
        testId: t.testId || (isHidden ? `Hidden test ${i + 1}` : `Test ${i + 1}`),
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
    // ALWAYS clean up temporary workspace files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_e) {}
  }
}

/**
 * Starts the HTTP Runner Server.
 * Enforces optional Bearer authentication and CORS for service-to-service communication.
 */
export function createRunnerServer(): http.Server {
  const server = http.createServer(async (req, res) => {
    // CORS headers for internal container communication
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      const compilerCheck = await checkCompiler();
      res.writeHead(compilerCheck.available ? 200 : 503, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          status: compilerCheck.available ? "ok" : "degraded",
          service: "cpp-isolated-runner",
          compiler: compilerCheck.available ? "g++ (C++20)" : "unavailable",
          version: compilerCheck.version,
          sandboxed: {
            prlimit: canUsePrlimit,
            unshareNet: canUseUnshareNet,
          },
          error: compilerCheck.error,
        })
      );
    }

    // Authenticated API protection
    const authHeader = req.headers["authorization"];
    const expectedToken = process.env.RUNNER_AUTH_TOKEN;
    const requireAuth = process.env.RUNNER_AUTH_REQUIRED === "true" || Boolean(expectedToken);

    if (requireAuth && url.pathname === "/evaluate") {
      let isAuthorized = false;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const providedToken = authHeader.substring(7).trim();
        if (expectedToken) {
          isAuthorized = providedToken === expectedToken;
        } else {
          // If RUNNER_AUTH_REQUIRED is true without specific static token,
          // require a non-empty Bearer token (e.g. Google Cloud OIDC token)
          isAuthorized = Boolean(providedToken && providedToken.length > 20);
        }
      }

      if (!isAuthorized) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            error: "Unauthorized: Valid Bearer token required for isolated runner invocation.",
          })
        );
      }
    }

    if (req.method === "POST" && url.pathname === "/evaluate") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
        if (body.length > 5 * 1024 * 1024) {
          // Reject payloads > 5MB
          res.writeHead(413, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Payload too large" }));
          req.destroy();
        }
      });

      req.on("end", async () => {
        try {
          const parsed = JSON.parse(body || "{}");
          const result = await evaluateCode(parsed);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (err: any) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message || "Invalid JSON payload" }));
        }
      });
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  return server;
}

// If executed directly as script:
const isRunnerDirectScript =
  process.argv[1] &&
  (process.argv[1].endsWith("/runner/server.ts") ||
    process.argv[1].endsWith("/runner/server.js") ||
    process.argv[1].endsWith("dist/server.js") ||
    process.argv[1].endsWith("/runner/dist/server.js"));

if (isRunnerDirectScript) {
  const PORT = parseInt(process.env.RUNNER_PORT || "8088", 10);
  const server = createRunnerServer();
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Isolated C++ Runner] Standalone service running on http://0.0.0.0:${PORT}`);
    console.log(`[Isolated C++ Runner] Sandbox capabilities: prlimit=${canUsePrlimit}, unshareNet=${canUseUnshareNet}`);
  });
}
