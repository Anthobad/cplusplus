import { Sandbox } from '@vercel/sandbox';
import { Readable } from 'node:stream';
import type { CodeRunner, RunnerRequest, RunnerResult } from './codeRunner.js';
import { compareOutputs } from './codeRunner.js';
import { supervisorSource } from './sandbox/supervisor.js';

export const SANDBOX_LIMITS = {
  sourceBytes: 128 * 1024, inputBytes: 64 * 1024, tests: 32,
  outputBytes: 64 * 1024, compileMs: 8000, executionMs: 2500,
  provisionMs: 90000, lifetimeMs: 200000,
  compileMemoryBytes: 1024 * 1024 * 1024, executionMemoryBytes: 256 * 1024 * 1024,
} as const;

// Only trusted Ubuntu repositories can be contacted during setup. No submission is uploaded yet.
export const provisioningPolicy = { allow: ['archive.ubuntu.com', 'security.ubuntu.com'] };
export const provisionCommand = `set -eu
sed -i 's|http://|https://|g' /etc/apt/sources.list.d/ubuntu.sources
export DEBIAN_FRONTEND=noninteractive
apt-get -o Acquire::Retries=1 -o Acquire::https::Timeout=15 update
apt-get -o Acquire::Retries=1 -o Acquire::https::Timeout=15 install -y --no-install-recommends g++-15 binutils libjansson4 python3 procps
ln -sf /usr/bin/g++-15 /usr/local/bin/g++
g++ --version
ld --version
install -d -m 700 /opt/cpp-runner`;

export interface ProcessOutcome {
  stdout: string; stderr: string; exitCode: number;
  executionTimeMs: number; timedOut: boolean; outputLimited: boolean;
}

// Dependency injection keeps orchestration tests independent of Vercel credentials.
type SandboxClient = Pick<Sandbox, 'runCommand' | 'writeFiles' | 'update' | 'stop' | 'readFileToBuffer'>;
type CreateSandbox = (options: Parameters<typeof Sandbox.create>[0]) => Promise<SandboxClient>;

function validateOutcome(data: unknown): ProcessOutcome {
  const value = data as ProcessOutcome;
  if (!value || typeof value.stdout !== 'string' || typeof value.stderr !== 'string' ||
      !Number.isInteger(value.exitCode) || !Number.isFinite(value.executionTimeMs) || value.executionTimeMs < 0 ||
      typeof value.timedOut !== 'boolean' || typeof value.outputLimited !== 'boolean' ||
      Buffer.byteLength(value.stdout) + Buffer.byteLength(value.stderr) > SANDBOX_LIMITS.outputBytes * 3) {
    throw new Error('Invalid sandbox process result');
  }
  return value;
}

export class VercelSandboxCodeRunner implements CodeRunner {
  constructor(private readonly createSandbox: CreateSandbox = options => Sandbox.create(options)) {}

  async evaluate(request: RunnerRequest): Promise<RunnerResult> {
    const base: RunnerResult = {
      compiled: false, passed: false, score: 0, testsPassed: 0,
      totalTests: request.testCases.length, testResults: [], mode: request.mode,
      wasAssisted: request.wasAssisted, verified: false,
    };
    if (!request.testCases.length || request.testCases.some(t => !t.expectedOutput?.trim())) {
      return { ...base, configurationError: true, error: 'This challenge has incomplete test configuration.' };
    }
    const hasMain = /\bint\s+main\s*\(/.test(request.code);
    const source = hasMain ? request.code : request.driverCode
      ? `${request.code}\n\n${request.driverCode}`
      : `#include <bits/stdc++.h>\n${request.code}\nint main() { return 0; }`;
    if (!request.code.trim() || Buffer.byteLength(source) > SANDBOX_LIMITS.sourceBytes) {
      return { ...base, compileError: 'Source code is empty or exceeds the 128 KiB limit.' };
    }
    if (request.testCases.length > SANDBOX_LIMITS.tests || request.testCases.some(t => Buffer.byteLength(t.input || '') > SANDBOX_LIMITS.inputBytes)) {
      return { ...base, configurationError: true, error: 'Test configuration exceeds runner limits.' };
    }
    const timeoutMs = Math.min(SANDBOX_LIMITS.executionMs, Math.max(1, request.timeoutMs || SANDBOX_LIMITS.executionMs));
    const sandbox = await this.createSandbox({
      image: 'vercel/sandbox/ubuntu:latest', persistent: false,
      networkPolicy: provisioningPolicy, resources: { vcpus: 1 },
      timeout: SANDBOX_LIMITS.lifetimeMs,
      signal: AbortSignal.timeout(30000),
      // Deliberately no name, mounts, repository, credentials, or caller environment.
    });
    try {
      const provision = await sandbox.runCommand({
        cmd: 'sudo', args: ['timeout', '--kill-after=2s', `${SANDBOX_LIMITS.provisionMs / 1000}s`, 'sh', '-c', provisionCommand],
        signal: AbortSignal.timeout(SANDBOX_LIMITS.provisionMs + 5000),
      });
      if (provision.exitCode !== 0) throw new Error('Sandbox compiler provisioning failed');
      await sandbox.update({ networkPolicy: 'deny-all' });
      await sandbox.writeFiles([
        { path: '/vercel/supervisor.py', content: Buffer.from(supervisorSource) },
        { path: '/vercel/source.cpp', content: Buffer.from(source) },
      ]);
      const protect = await sandbox.runCommand('sudo', ['sh', '-c', 'mv /vercel/supervisor.py /opt/cpp-runner/supervisor.py && mv /vercel/source.cpp /opt/cpp-runner/source.cpp && chown -R root:root /opt/cpp-runner && chmod -R go-rwx /opt/cpp-runner']);
      if (protect.exitCode !== 0) throw new Error('Sandbox supervisor setup failed');

      const execute = async (phase: 'compile' | 'run', index = 0, input = '') => {
        const compile = phase === 'compile';
        const processResult = await sandbox.runCommand({
          cmd: 'sudo', args: ['python3', '/opt/cpp-runner/supervisor.py'],
          stdin: Readable.from([JSON.stringify({ phase, index, input,
            timeoutMs: compile ? SANDBOX_LIMITS.compileMs : timeoutMs,
            outputBytes: SANDBOX_LIMITS.outputBytes,
            memoryBytes: compile ? SANDBOX_LIMITS.compileMemoryBytes : SANDBOX_LIMITS.executionMemoryBytes,
          })]),
          signal: AbortSignal.timeout((compile ? SANDBOX_LIMITS.compileMs : timeoutMs) + 10000),
        });
        if (processResult.exitCode !== 0) throw new Error('Sandbox supervisor failed');
        const report = await sandbox.runCommand('sudo', ['cat', '/opt/cpp-runner/result.json']);
        if (report.exitCode !== 0) throw new Error('Sandbox result unavailable');
        return validateOutcome(JSON.parse(await report.stdout()));
      };
      const compilation = await execute('compile');
      if (compilation.timedOut || compilation.outputLimited || compilation.exitCode !== 0) {
        return { ...base, compilationTimeMs: compilation.executionTimeMs,
          compileError: compilation.timedOut ? 'Compilation Time Limit Exceeded' : compilation.outputLimited ? 'Compiler Output Limit Exceeded' : compilation.stderr || 'Compilation failed.' };
      }
      const testResults = [];
      let testsPassed = 0;
      let executionTimeMs = 0;
      for (const [index, test] of request.testCases.entries()) {
        const outcome = await execute('run', index, test.input || '');
        executionTimeMs += outcome.executionTimeMs;
        const error = outcome.timedOut ? 'Time Limit Exceeded' : outcome.outputLimited ? 'Output Limit Exceeded' : outcome.exitCode !== 0 ? 'Runtime Error' : undefined;
        const passed = !error && compareOutputs(outcome.stdout, test.expectedOutput, test.comparator || request.comparator);
        if (passed) testsPassed++;
        testResults.push({
          testId: test.isHidden ? `Hidden test ${index + 1}` : test.testId || `Test ${index + 1}`,
          passed, isHidden: Boolean(test.isHidden),
          input: test.isHidden ? undefined : test.input,
          expectedOutput: test.isHidden ? undefined : test.expectedOutput,
          actualOutput: test.isHidden ? passed ? 'Passed' : 'Hidden test failed' : outcome.stdout,
          stderr: test.isHidden ? undefined : outcome.stderr,
          exitCode: test.isHidden ? undefined : outcome.exitCode,
          executionTimeMs: outcome.executionTimeMs,
          error: passed ? undefined : test.isHidden ? 'Hidden test failed' : error || 'Output mismatch',
        });
      }
      const passed = testsPassed === request.testCases.length;
      return { ...base, compiled: true, passed, score: Math.round(testsPassed / request.testCases.length * 100),
        testsPassed, testResults, executionTimeMs, compilationTimeMs: compilation.executionTimeMs,
        verified: false }; // Only evaluateSubmission can grant verified progress.
    } finally {
      await sandbox.stop();
    }
  }
}
