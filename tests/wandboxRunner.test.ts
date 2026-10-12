import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import { WandboxCodeRunner, getCodeRunner, LocalCodeRunner, classifyWandboxExecution } from "../server/codeRunner";
import { evaluateSubmission } from "../server/evaluateSubmission";

describe("WandboxCodeRunner & Zero-Cost Production Provider", () => {
  let mockServer: http.Server;
  let mockPort: number;
  let mockResponses: ((body: any) => { status: number; payload: any })[] = [];

  beforeAll(async () => {
    mockServer = http.createServer((req, res) => {
      let bodyStr = "";
      req.on("data", (chunk) => (bodyStr += chunk));
      req.on("end", () => {
        let body: any = {};
        try {
          body = JSON.parse(bodyStr);
        } catch (_e) {}

        const handler = mockResponses.shift();
        if (handler) {
          const { status, payload } = handler(body);
          res.writeHead(status, { "Content-Type": "application/json" });
          res.end(typeof payload === "string" ? payload : JSON.stringify(payload));
        } else {
          // Default mock success response
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "0",
              signal: "",
              compiler_output: "",
              compiler_error: "",
              compiler_message: "",
              program_output: "default\n",
              program_error: "",
            })
          );
        }
      });
    });

    await new Promise<void>((resolve) => {
      mockServer.listen(0, "127.0.0.1", () => {
        const addr = mockServer.address() as any;
        mockPort = addr.port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => mockServer.close(() => resolve()));
  });

  // 1. Valid C++20 program compiles and passes
  it("valid C++20 program compiles and passes test cases", async () => {
    mockResponses = [
      () => ({
        status: 200,
        payload: {
          status: "0",
          signal: "",
          compiler_error: "",
          program_output: "15\n",
        },
      }),
    ];

    const runner = new WandboxCodeRunner({
      endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
    });

    const result = await runner.evaluate({
      code: `#include <iostream>\n#include <concepts>\nint main() { std::cout << 15 << "\\n"; return 0; }`,
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

  // 2. Compiler error returned correctly and short-circuits
  it("compiler error returned correctly with structured output and short-circuits", async () => {
    let callCount = 0;
    mockResponses = [
      () => {
        callCount++;
        return {
          status: 200,
          payload: {
            status: "1",
            signal: "",
            compiler_error: "prog.cc:2:14: error: syntax error in code",
            compiler_message: "prog.cc:2:14: error: syntax error in code",
            program_output: "",
          },
        };
      },
      () => {
        callCount++;
        return { status: 200, payload: { status: "0", program_output: "should not run" } };
      },
    ];

    const runner = new WandboxCodeRunner({
      endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
    });

    const result = await runner.evaluate({
      code: `#include <iostream>\nint main() { invalid_token; return 0; }`,
      testCases: [
        { testId: "Test 1", input: "", expectedOutput: "1" },
        { testId: "Test 2", input: "", expectedOutput: "2" },
      ],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.compileError).toContain("syntax error");
    expect(result.testResults.length).toBe(2);
    // Verified short-circuit: Wandbox was called only once for test 0
    expect(callCount).toBe(1);
  });

  // 3. Incorrect output fails
  it("incorrect output fails and reports mismatch", async () => {
    mockResponses = [
      () => ({
        status: 200,
        payload: {
          status: "0",
          signal: "",
          program_output: "41\n",
        },
      }),
    ];

    const runner = new WandboxCodeRunner({
      endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
    });

    const result = await runner.evaluate({
      code: `#include <iostream>\nint main() { std::cout << 41 << "\\n"; return 0; }`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "42" }],
      mode: "practice",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.testResults[0].passed).toBe(false);
    expect(result.testResults[0].error).toBe("Output mismatch");
    expect(result.testResults[0].actualOutput).toBe("41");
  });

  // 4. Runtime failure (SIGSEGV / crash)
  it("runtime failure (Segmentation fault) handled cleanly", async () => {
    mockResponses = [
      () => ({
        status: 200,
        payload: {
          status: "139",
          signal: "SIGSEGV",
          program_error: "Segmentation fault (core dumped)",
        },
      }),
    ];

    const runner = new WandboxCodeRunner({
      endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
    });

    const result = await runner.evaluate({
      code: `#include <iostream>\nint main() { int* p = nullptr; *p = 1; return 0; }`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "ok" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.testResults[0].error).toContain("Segmentation Fault");
  });

  // 5. Timeout / service watchdog (status 137 / SIGKILL)
  it("timeout status 137 reports Time Limit Exceeded", async () => {
    mockResponses = [
      () => ({
        status: 200,
        payload: {
          status: "137",
          signal: "SIGKILL",
          program_output: "",
        },
      }),
    ];

    const runner = new WandboxCodeRunner({
      endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
    });

    const result = await runner.evaluate({
      code: `#include <iostream>\nint main() { while(true){} return 0; }`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "done" }],
      mode: "practice",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.testResults[0].error).toBe("Time Limit Exceeded");
    expect(result.testResults[0].actualOutput).toContain("Time Limit Exceeded");
  });

  // 6. Network failure / unreachable fails safely
  it("network failure fails safely with infrastructure error and never passes", async () => {
    const deadRunner = new WandboxCodeRunner({
      endpoint: "http://127.0.0.1:54321/compile.json", // Unbound port
      timeoutMs: 1500,
    });

    const result = await deadRunner.evaluate({
      code: `#include <iostream>\nint main() { return 0; }`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "0" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.verified).toBe(false);
    expect(result.error).toContain("Code evaluation is temporarily unavailable");
  });

  // 7. Malformed response fails safely
  it("malformed response (HTML or non-JSON) fails safely without crash", async () => {
    mockResponses = [
      () => ({
        status: 502,
        payload: "<html>502 Bad Gateway</html>",
      }),
    ];

    const runner = new WandboxCodeRunner({
      endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
    });

    const result = await runner.evaluate({
      code: `#include <iostream>\nint main() { return 0; }`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "0" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.verified).toBe(false);
    expect(result.error).toContain("Code evaluation is temporarily unavailable");
  });

  // 8. HTTP 429 Rate limit response handled gracefully
  it("HTTP 429 rate limit handled gracefully with busy notice", async () => {
    mockResponses = [
      () => ({
        status: 429,
        payload: { error: "Rate limit exceeded" },
      }),
    ];

    const runner = new WandboxCodeRunner({
      endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
    });

    const result = await runner.evaluate({
      code: `#include <iostream>\nint main() { return 0; }`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "0" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.verified).toBe(false);
    expect(result.error).toContain("busy");
  });

  // 9. Infrastructure failure never awards a pass
  it("infrastructure failure never awards a pass", async () => {
    mockResponses = [
      () => ({
        status: 500,
        payload: { error: "Internal Server Error" },
      }),
    ];

    const runner = new WandboxCodeRunner({
      endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
    });

    const result = await runner.evaluate({
      code: `#include <iostream>\nint main() { std::cout << "correct"; return 0; }`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "correct" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.verified).toBe(false);
  });

  // 10. Assessment verified status depends on trusted evaluator
  it("assessment verified status is granted only on complete passing run", async () => {
    // 5 responses for challenge cc-t1 (3 public + 2 hidden tests)
    mockResponses = [
      () => ({ status: 200, payload: { status: "0", program_output: "Hello, modern C++!\n" } }),
      () => ({ status: 200, payload: { status: "0", program_output: "Hello, modern C++!\n" } }),
      () => ({ status: 200, payload: { status: "0", program_output: "Hello, modern C++!\n" } }),
      () => ({ status: 200, payload: { status: "0", program_output: "Hello, modern C++!\n" } }),
      () => ({ status: 200, payload: { status: "0", program_output: "Hello, modern C++!\n" } }),
    ];

    const runner = new WandboxCodeRunner({
      endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
    });

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
    expect(result.compiled).toBe(true);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.verified).toBe(true);
  });

  // 11. Hidden test information remains sanitized
  it("hidden test details remain strictly hidden in evaluator responses", async () => {
    mockResponses = [
      () => ({ status: 200, payload: { status: "0", program_output: "wrong\n" } }),
      () => ({ status: 200, payload: { status: "0", program_output: "wrong\n" } }),
      () => ({ status: 200, payload: { status: "0", program_output: "wrong\n" } }),
      () => ({ status: 200, payload: { status: "0", program_output: "wrong\n" } }),
      () => ({ status: 200, payload: { status: "0", program_output: "wrong\n" } }),
    ];

    const runner = new WandboxCodeRunner({
      endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
    });

    const { status, result } = await evaluateSubmission(
      {
        challengeId: "cc-t1",
        studentCode: `#include <iostream>\nint main() { std::cout << "wrong\\n"; return 0; }`,
        mode: "assessment",
        wasAssisted: false,
      },
      runner
    );

    expect(status).toBe(200);
    expect(result.passed).toBe(false);
    expect(result.verified).toBe(false);

    const hiddenResults = result.testResults.filter((t) => t.isHidden);
    expect(hiddenResults.length).toBeGreaterThan(0);
    for (const h of hiddenResults) {
      expect(h.input).toBeUndefined();
      expect(h.expectedOutput).toBeUndefined();
      expect(h.actualOutput).toBe("Hidden test failed");
      expect(h.error).toBe("Hidden test failed");
    }
  });

  // 12. Production with no ISOLATED_RUNNER_ENDPOINT selects WandboxCodeRunner
  it("production with no ISOLATED_RUNNER_ENDPOINT selects WandboxCodeRunner", () => {
    const originalEnv = process.env.NODE_ENV;
    const originalEndpoint = process.env.ISOLATED_RUNNER_ENDPOINT;
    const originalMode = process.env.CODE_RUNNER_MODE;

    process.env.NODE_ENV = "production";
    delete process.env.ISOLATED_RUNNER_ENDPOINT;
    delete process.env.CODE_RUNNER_MODE;

    try {
      const runner = getCodeRunner();
      expect(runner).toBeInstanceOf(WandboxCodeRunner);
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.ISOLATED_RUNNER_ENDPOINT = originalEndpoint;
      process.env.CODE_RUNNER_MODE = originalMode;
    }
  });

  // 13. Production never selects LocalCodeRunner
  it("production never selects LocalCodeRunner under any circumstance", () => {
    const originalEnv = process.env.NODE_ENV;
    const originalMode = process.env.CODE_RUNNER_MODE;
    const originalEndpoint = process.env.ISOLATED_RUNNER_ENDPOINT;

    process.env.NODE_ENV = "production";
    process.env.CODE_RUNNER_MODE = "local"; // Maliciously attempt to force local mode
    delete process.env.ISOLATED_RUNNER_ENDPOINT;

    try {
      const runner = getCodeRunner();
      expect(runner).not.toBeInstanceOf(LocalCodeRunner);
      expect(runner).toBeInstanceOf(WandboxCodeRunner);
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.CODE_RUNNER_MODE = originalMode;
      process.env.ISOLATED_RUNNER_ENDPOINT = originalEndpoint;
    }
  });

  // 14. Compiler error detection does NOT depend on literal "error:" text
  it("compiler error without literal 'error:' text is correctly identified and fails safely", async () => {
    let callCount = 0;
    mockResponses = [
      () => {
        callCount++;
        return {
          status: 200,
          payload: {
            status: "1",
            signal: "",
            compiler_error: "/usr/bin/ld: undefined reference to `calculateTotal(int, double, double)'",
            compiler_message: "/usr/bin/ld: undefined reference to `calculateTotal(int, double, double)'",
            program_output: "",
            program_error: "",
          },
        };
      },
      () => {
        callCount++;
        return { status: 200, payload: { status: "0", program_output: "should not run" } };
      },
    ];

    const runner = new WandboxCodeRunner({
      endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
    });

    const result = await runner.evaluate({
      code: `#include <iostream>\nint main() { return 0; }`,
      testCases: [
        { testId: "Test 1", input: "", expectedOutput: "1" },
        { testId: "Test 2", input: "", expectedOutput: "2" },
      ],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.compileError).toContain("undefined reference");
    expect(result.testResults.length).toBe(2);
    // Short-circuits immediately without second request
    expect(callCount).toBe(1);
  });

  // 15. Compiler warnings during successful execution do not trigger compilation error
  it("compiler warnings do not trigger compilation error when program runs successfully", async () => {
    mockResponses = [
      () => ({
        status: 200,
        payload: {
          status: "0",
          signal: "",
          compiler_error: "prog.cc:2:10: warning: unused variable 'x' [-Wunused-variable]",
          compiler_message: "prog.cc:2:10: warning: unused variable 'x' [-Wunused-variable]",
          program_output: "100\n",
          program_error: "",
        },
      }),
    ];

    const runner = new WandboxCodeRunner({
      endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
    });

    const result = await runner.evaluate({
      code: `#include <iostream>\nint main() { int x = 0; std::cout << 100 << "\\n"; return 0; }`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "100" }],
      mode: "practice",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(true);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.testResults[0].passed).toBe(true);
  });

  // 16. Compiler warnings accompanied by runtime crash are classified as runtime error
  it("compiler warnings with runtime crash are classified as runtime error, not compile error", async () => {
    mockResponses = [
      () => ({
        status: 200,
        payload: {
          status: "139",
          signal: "SIGSEGV",
          compiler_error: "prog.cc:2:10: warning: unused variable 'x' [-Wunused-variable]",
          compiler_message: "prog.cc:2:10: warning: unused variable 'x' [-Wunused-variable]",
          program_output: "",
          program_error: "Segmentation fault (core dumped)",
        },
      }),
    ];

    const runner = new WandboxCodeRunner({
      endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
    });

    const result = await runner.evaluate({
      code: `#include <iostream>\nint main() { int* p = nullptr; *p = 1; return 0; }`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "ok" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.testResults[0].error).toContain("Segmentation Fault");
  });

  // 17. Malformed Wandbox response missing status field is rejected as infrastructure failure
  it("malformed response missing status field is safely rejected as infrastructure error", async () => {
    mockResponses = [
      () => ({
        status: 200,
        payload: {
          program_output: "42\n",
          // status is missing
        },
      }),
    ];

    const runner = new WandboxCodeRunner({
      endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
    });

    const result = await runner.evaluate({
      code: `#include <iostream>\nint main() { return 0; }`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "42" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.verified).toBe(false);
    expect(result.error).toBe("Code evaluation is temporarily unavailable. Please try again.");
  });

  // 18. Malformed Wandbox response with non-string/non-number status is rejected safely
  it("malformed response with invalid status type is safely rejected", async () => {
    mockResponses = [
      () => ({
        status: 200,
        payload: {
          status: { nested: true },
          program_output: "42\n",
        },
      }),
    ];

    const runner = new WandboxCodeRunner({
      endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
    });

    const result = await runner.evaluate({
      code: `#include <iostream>\nint main() { return 0; }`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "42" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.verified).toBe(false);
    expect(result.error).toBe("Code evaluation is temporarily unavailable. Please try again.");
  });

  // 19. Malformed Wandbox response with invalid field type is rejected safely
  it("malformed response with invalid field types is safely rejected", async () => {
    mockResponses = [
      () => ({
        status: 200,
        payload: {
          status: "0",
          program_output: 12345, // invalid type: number instead of string
        },
      }),
    ];

    const runner = new WandboxCodeRunner({
      endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
    });

    const result = await runner.evaluate({
      code: `#include <iostream>\nint main() { return 0; }`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "12345" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.verified).toBe(false);
    expect(result.error).toBe("Code evaluation is temporarily unavailable. Please try again.");
  });

  // 20. Explicit Wandbox error payload is safely rejected as infrastructure error
  it("explicit Wandbox error payload is rejected as infrastructure error", async () => {
    mockResponses = [
      () => ({
        status: 200,
        payload: {
          error: "Worker process pool exhausted",
        },
      }),
    ];

    const runner = new WandboxCodeRunner({
      endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
    });

    const result = await runner.evaluate({
      code: `#include <iostream>\nint main() { return 0; }`,
      testCases: [{ testId: "Test 1", input: "", expectedOutput: "42" }],
      mode: "assessment",
      wasAssisted: false,
    });

    expect(result.compiled).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.verified).toBe(false);
    expect(result.error).toBe("Code evaluation is temporarily unavailable. Please try again.");
  });

  describe("Regression Suite: Error Classification & Lifecycle Verification", () => {
    // Regression Case 1: Valid program returning 0
    it("Case 1: valid program returning 0 compiles and passes", async () => {
      mockResponses = [
        () => ({
          status: 200,
          payload: {
            status: "0",
            signal: "",
            compiler_output: "",
            compiler_error: "",
            compiler_message: "",
            program_output: "Hello World\n",
            program_error: "",
            program_message: "Hello World\n",
          },
        }),
      ];

      const runner = new WandboxCodeRunner({
        endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
      });

      const result = await runner.evaluate({
        code: `#include <iostream>\nint main() { std::cout << "Hello World\\n"; return 0; }`,
        testCases: [{ testId: "Test 1", input: "", expectedOutput: "Hello World" }],
        mode: "assessment",
        wasAssisted: false,
      });

      expect(result.compiled).toBe(true);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
      expect(result.compileError).toBeUndefined();
      expect(result.testResults[0].passed).toBe(true);
    });

    // Regression Case 2: Program returning 1 without printing anything (SILENT NONZERO EXIT)
    it("Case 2: silent return 1 without printing anything is classified as runtime failure, NOT compilation failure", async () => {
      mockResponses = [
        () => ({
          status: 200,
          payload: {
            status: "1",
            signal: "",
            compiler_output: "",
            compiler_error: "",
            compiler_message: "",
            program_output: "",
            program_error: "",
            program_message: "",
          },
        }),
      ];

      const runner = new WandboxCodeRunner({
        endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
      });

      const result = await runner.evaluate({
        code: `int main() { return 1; }`,
        testCases: [{ testId: "Test 1", input: "", expectedOutput: "expected" }],
        mode: "assessment",
        wasAssisted: false,
      });

      // Crucial requirement: MUST be classified as runtime failure, NOT compilation failure
      expect(result.compiled).toBe(true);
      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.compileError).toBeUndefined();
      expect(result.testResults.length).toBe(1);
      expect(result.testResults[0].passed).toBe(false);
      expect(result.testResults[0].error).toBe("Runtime Error");
      expect(result.testResults[0].actualOutput).toContain("Exited with status 1");
    });

    // Regression Case 3: Program returning 1 after printing output
    it("Case 3: program returning 1 after printing output is classified as runtime failure", async () => {
      mockResponses = [
        () => ({
          status: 200,
          payload: {
            status: "1",
            signal: "",
            compiler_output: "",
            compiler_error: "",
            compiler_message: "",
            program_output: "Partial computation\n",
            program_error: "",
            program_message: "Partial computation\n",
          },
        }),
      ];

      const runner = new WandboxCodeRunner({
        endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
      });

      const result = await runner.evaluate({
        code: `#include <iostream>\nint main() { std::cout << "Partial computation\\n"; return 1; }`,
        testCases: [{ testId: "Test 1", input: "", expectedOutput: "Partial computation" }],
        mode: "practice",
        wasAssisted: false,
      });

      expect(result.compiled).toBe(true);
      expect(result.passed).toBe(false);
      expect(result.compileError).toBeUndefined();
      expect(result.testResults[0].passed).toBe(false);
      expect(result.testResults[0].error).toBe("Runtime Error");
      expect(result.testResults[0].actualOutput).toContain("Partial computation");
    });

    // Regression Case 4: C++ syntax error
    it("Case 4: C++ syntax error is classified as compilation failure and short-circuits", async () => {
      let callCount = 0;
      mockResponses = [
        () => {
          callCount++;
          return {
            status: 200,
            payload: {
              status: "1",
              signal: "",
              compiler_output: "",
              compiler_error: "prog.cc:1:14: error: 'syntax' was not declared in this scope\n    1 | int main() { syntax error; }\n      |              ^~~~~~\n",
              compiler_message: "prog.cc:1:14: error: 'syntax' was not declared in this scope\n",
              program_output: "",
              program_error: "",
              program_message: "",
            },
          };
        },
        () => {
          callCount++;
          return { status: 200, payload: { status: "0", program_output: "should not run" } };
        },
      ];

      const runner = new WandboxCodeRunner({
        endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
      });

      const result = await runner.evaluate({
        code: `int main() { syntax error; }`,
        testCases: [
          { testId: "Test 1", input: "", expectedOutput: "1" },
          { testId: "Test 2", input: "", expectedOutput: "2" },
        ],
        mode: "assessment",
        wasAssisted: false,
      });

      expect(result.compiled).toBe(false);
      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.compileError).toContain("'syntax' was not declared in this scope");
      expect(result.testResults[0].error).toBe("Compilation failed");
      expect(callCount).toBe(1); // Short-circuits remaining tests
    });

    // Regression Case 5: Linker error
    it("Case 5: linker error is classified as compilation failure", async () => {
      mockResponses = [
        () => ({
          status: 200,
          payload: {
            status: "1",
            signal: "",
            compiler_output: "",
            compiler_error: "/usr/bin/ld: /tmp/ccNIvjSN.o: in function `main':\nprog.cc:(.text+0x5): undefined reference to `undef()'\ncollect2: error: ld returned 1 exit status\n",
            compiler_message: "/usr/bin/ld: /tmp/ccNIvjSN.o: in function `main':\nprog.cc:(.text+0x5): undefined reference to `undef()'\ncollect2: error: ld returned 1 exit status\n",
            program_output: "",
            program_error: "",
            program_message: "",
          },
        }),
      ];

      const runner = new WandboxCodeRunner({
        endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
      });

      const result = await runner.evaluate({
        code: `void undef(); int main() { undef(); }`,
        testCases: [{ testId: "Test 1", input: "", expectedOutput: "ok" }],
        mode: "assessment",
        wasAssisted: false,
      });

      expect(result.compiled).toBe(false);
      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.compileError).toContain("undefined reference to `undef()'");
      expect(result.compileError).toContain("collect2: error: ld returned 1 exit status");
    });

    // Regression Case 6: Runtime crash (SIGSEGV)
    it("Case 6: runtime crash (SIGSEGV) is classified as runtime failure", async () => {
      mockResponses = [
        () => ({
          status: 200,
          payload: {
            status: "139",
            signal: "SIGSEGV",
            compiler_output: "",
            compiler_error: "",
            compiler_message: "",
            program_output: "",
            program_error: "Segmentation fault (core dumped)\n",
            program_message: "Segmentation fault (core dumped)\n",
          },
        }),
      ];

      const runner = new WandboxCodeRunner({
        endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
      });

      const result = await runner.evaluate({
        code: `int main() { int* p = nullptr; *p = 42; return 0; }`,
        testCases: [{ testId: "Test 1", input: "", expectedOutput: "ok" }],
        mode: "assessment",
        wasAssisted: false,
      });

      expect(result.compiled).toBe(true);
      expect(result.passed).toBe(false);
      expect(result.compileError).toBeUndefined();
      expect(result.testResults[0].error).toContain("Segmentation Fault");
    });

    // Regression Case 7: Malformed Wandbox response
    it("Case 7: malformed Wandbox response fails safely without awarding progress", async () => {
      mockResponses = [
        () => ({
          status: 200,
          payload: "this is not json at all {{{",
        }),
      ];

      const runner = new WandboxCodeRunner({
        endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
      });

      const result = await runner.evaluate({
        code: `int main() { return 0; }`,
        testCases: [{ testId: "Test 1", input: "", expectedOutput: "0" }],
        mode: "assessment",
        wasAssisted: false,
      });

      expect(result.compiled).toBe(false);
      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.verified).toBe(false);
      expect(result.error).toBe("Code evaluation is temporarily unavailable. Please try again.");
    });

    // Regression Case 8: Network/service failure
    it("Case 8: network failure fails safely without awarding progress", async () => {
      const deadRunner = new WandboxCodeRunner({
        endpoint: "http://127.0.0.1:59999/compile.json", // Dead port
        timeoutMs: 1000,
      });

      const result = await deadRunner.evaluate({
        code: `int main() { return 0; }`,
        testCases: [{ testId: "Test 1", input: "", expectedOutput: "0" }],
        mode: "assessment",
        wasAssisted: false,
      });

      expect(result.compiled).toBe(false);
      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.verified).toBe(false);
      expect(result.error).toBe("Code evaluation is temporarily unavailable. Please try again.");
    });

    // Ambiguous response: Handled explicitly rather than guessing
    it("ambiguous Wandbox response is handled explicitly as infrastructure failure", async () => {
      mockResponses = [
        () => ({
          status: 200,
          payload: {
            status: "1",
            signal: "",
            compiler_output: "",
            compiler_error: "unrecognized internal log line without error or warning",
            compiler_message: "unrecognized internal log line without error or warning",
            program_output: "",
            program_error: "",
            program_message: "",
          },
        }),
      ];

      const runner = new WandboxCodeRunner({
        endpoint: `http://127.0.0.1:${mockPort}/compile.json`,
      });

      const result = await runner.evaluate({
        code: `int main() { return 0; }`,
        testCases: [{ testId: "Test 1", input: "", expectedOutput: "0" }],
        mode: "assessment",
        wasAssisted: false,
      });

      expect(result.compiled).toBe(false);
      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.verified).toBe(false);
      expect(result.error).toBe("Code evaluation is temporarily unavailable. Please try again.");
    });

    // Direct classifyWandboxExecution unit tests
    it("classifyWandboxExecution accurately classifies all scenarios", () => {
      // Clean return 0
      expect(
        classifyWandboxExecution({
          status: "0",
          signal: "",
          compiler_output: "",
          compiler_error: "",
          compiler_message: "",
          program_output: "ok",
          program_error: "",
          program_message: "",
        })
      ).toEqual({ isCompilationError: false, compileDiagnostic: "" });

      // Silent return 1
      expect(
        classifyWandboxExecution({
          status: "1",
          signal: "",
          compiler_output: "",
          compiler_error: "",
          compiler_message: "",
          program_output: "",
          program_error: "",
          program_message: "",
        })
      ).toEqual({ isCompilationError: false, compileDiagnostic: "" });

      // Return 1 with warnings only
      expect(
        classifyWandboxExecution({
          status: "1",
          signal: "",
          compiler_output: "",
          compiler_error: "prog.cc:1:5: warning: unused variable",
          compiler_message: "prog.cc:1:5: warning: unused variable",
          program_output: "",
          program_error: "",
          program_message: "",
        })
      ).toEqual({ isCompilationError: false, compileDiagnostic: "" });

      // Syntax error
      expect(
        classifyWandboxExecution({
          status: "1",
          signal: "",
          compiler_output: "",
          compiler_error: "prog.cc:1:5: error: expected ';'",
          compiler_message: "prog.cc:1:5: error: expected ';'",
          program_output: "",
          program_error: "",
          program_message: "",
        })
      ).toEqual({
        isCompilationError: true,
        compileDiagnostic: "prog.cc:1:5: error: expected ';'",
      });

      // Linker error
      expect(
        classifyWandboxExecution({
          status: "1",
          signal: "",
          compiler_output: "",
          compiler_error: "undefined reference to `foo`",
          compiler_message: "undefined reference to `foo`",
          program_output: "",
          program_error: "",
          program_message: "",
        })
      ).toEqual({
        isCompilationError: true,
        compileDiagnostic: "undefined reference to `foo`",
      });

      // Ambiguous unrecognized text
      expect(
        classifyWandboxExecution({
          status: "1",
          signal: "",
          compiler_output: "",
          compiler_error: "some mystery string with no error or warning keywords",
          compiler_message: "",
          program_output: "",
          program_error: "",
          program_message: "",
        })
      ).toEqual({
        isCompilationError: false,
        compileDiagnostic: "some mystery string with no error or warning keywords",
        isAmbiguous: true,
      });
    });
  });
});
