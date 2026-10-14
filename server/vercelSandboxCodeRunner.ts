import { Sandbox } from '@vercel/sandbox';
import type { CodeRunner, RunnerRequest, RunnerResult } from './codeRunner.js';
import { compareOutputs } from './codeRunner.js';
import { compilerVersion, environmentFiles, provisionCommand, provisioningPolicy, setupCommand, snapshotMaxAgeMs } from './sandbox/compilerEnvironment.js';
import { compilerSnapshot } from './sandbox/compilerSnapshot.js';
export { provisionCommand } from './sandbox/compilerEnvironment.js';

export const SANDBOX_LIMITS = {
  sourceBytes: 128 * 1024, inputBytes: 64 * 1024, totalInputBytes: 256 * 1024, tests: 32,
  outputBytes: 64 * 1024, totalOutputBytes: 256 * 1024, compileMs: 8000, executionMs: 2500,
  provisionMs: 90000, lifetimeMs: 200000,
  compileMemoryBytes: 1024 * 1024 * 1024, executionMemoryBytes: 256 * 1024 * 1024,
} as const;

export interface ProcessOutcome {
  stdout: string; stderr: string; exitCode: number;
  executionTimeMs: number; timedOut: boolean; outputLimited: boolean;
}

export interface RunnerTiming {
  phases: Record<string, number>; sdkCalls: number; snapshotHit: boolean;
  recovery?: string; totalMs: number; compilationMs?: number; executionMs?: number;
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
  constructor(
    private readonly createSandbox: CreateSandbox = options => Sandbox.create(options),
    private readonly options: { snapshot?: typeof compilerSnapshot; onTiming?: (timing: RunnerTiming) => void } = {},
  ) {}

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
    if (request.testCases.length > SANDBOX_LIMITS.tests || request.testCases.some(t => Buffer.byteLength(t.input || '') > SANDBOX_LIMITS.inputBytes) || request.testCases.reduce((bytes, t) => bytes + Buffer.byteLength(t.input || ''), 0) > SANDBOX_LIMITS.totalInputBytes) {
      return { ...base, configurationError: true, error: 'Test configuration exceeds runner limits.' };
    }
    const timeoutMs = Math.min(SANDBOX_LIMITS.executionMs, Math.max(1, request.timeoutMs || SANDBOX_LIMITS.executionMs));
    const started = performance.now();
    const timing: RunnerTiming = { phases: {}, sdkCalls: 0, snapshotHit: false, recovery: undefined, totalMs: 0 };
    const timed = async <T>(phase: string, operation: () => Promise<T>): Promise<T> => {
      const t = performance.now();
      timing.sdkCalls++;
      try { return await operation(); }
      finally { timing.phases[phase] = (timing.phases[phase] || 0) + performance.now() - t; }
    };
    const configured = this.options.snapshot === undefined ? compilerSnapshot : this.options.snapshot;
    const candidate = configured && configured.version === compilerVersion && Date.now() - configured.createdAt < snapshotMaxAgeMs ? configured : null;
    const common = { persistent: false, resources: { vcpus: 1 }, timeout: SANDBOX_LIMITS.lifetimeMs, signal: AbortSignal.timeout(30000) };
    let sandbox: SandboxClient | undefined;
    try {
      if (candidate) {
        try {
          sandbox = await timed('sandboxCreation', () => this.createSandbox({ ...common, source: { type: 'snapshot', snapshotId: candidate.snapshotId }, networkPolicy: 'deny-all' }));
          timing.snapshotHit = true;
        } catch (error) {
          // Only a missing/expired snapshot permits rebuilding this SAME provider's environment.
          // Auth, quota, network and execution failures never trigger retries or failover.
          const code = (error as { json?: { error?: { code?: string } } }).json?.error?.code;
          if (!['snapshot_not_found', 'snapshot_expired'].includes(code || '')) throw error;
          timing.recovery = code;
        }
      } else timing.recovery = configured ? 'snapshot_version_or_age_mismatch' : 'snapshot_not_configured';
      if (!sandbox) {
        sandbox = await timed('sandboxCreation', () => this.createSandbox({ ...common, image: 'vercel/sandbox/ubuntu:latest', networkPolicy: provisioningPolicy }));
        const provision = await timed('aptProvisioning', () => sandbox!.runCommand({
          cmd: 'sudo', args: ['timeout', '--kill-after=2s', `${SANDBOX_LIMITS.provisionMs / 1000}s`, 'sh', '-c', provisionCommand],
          signal: AbortSignal.timeout(SANDBOX_LIMITS.provisionMs + 5000),
        }));
        if (provision.exitCode !== 0) throw new Error('Sandbox compiler provisioning failed');
        await timed('networkLockdown', () => sandbox!.update({ networkPolicy: 'deny-all' }));
        await timed('infrastructureUpload', () => sandbox!.writeFiles(environmentFiles()));
        const protect = await timed('supervisorSetup', () => sandbox!.runCommand('sudo', ['sh', '-c', setupCommand]));
        if (protect.exitCode !== 0) throw new Error('Sandbox supervisor setup failed');
      }
      const batch = JSON.stringify({ version: compilerVersion, source, inputs: request.testCases.map(t => t.input || ''),
        limits: { ...SANDBOX_LIMITS, executionMs: timeoutMs } });
      const command = await timed('commandStart', () => sandbox!.runCommand({
        cmd: 'sudo', args: ['python3', '/opt/cpp-runner/supervisor.py'], stdin: true, detached: true,
        signal: AbortSignal.timeout(10000),
      }));
      await timed('sourceUpload', () => command.writeStdin(batch, { abortSignal: AbortSignal.timeout(10000) }));
      await timed('sourceUpload', () => command.closeStdin({ abortSignal: AbortSignal.timeout(10000) }));
      const processResult = await timed('supervisorWait', () => command.wait({ signal: AbortSignal.timeout(SANDBOX_LIMITS.compileMs + timeoutMs * request.testCases.length + 10000) }));
      if (processResult.exitCode !== 0) throw new Error('Sandbox supervisor failed');
      const raw = await timed('resultFetch', () => processResult.stdout());
      const decoded = JSON.parse(raw);
      const compilation = validateOutcome(decoded.compilation);
      timing.compilationMs = compilation.executionTimeMs;
      if (compilation.timedOut || compilation.outputLimited || compilation.exitCode !== 0) {
        return { ...base, compilationTimeMs: compilation.executionTimeMs,
          compileError: compilation.timedOut ? 'Compilation Time Limit Exceeded' : compilation.outputLimited ? 'Compiler Output Limit Exceeded' : compilation.stderr || 'Compilation failed.' };
      }
      if (!Array.isArray(decoded.tests) || decoded.tests.length !== request.testCases.length) throw new Error('Invalid sandbox test count');
      const outcomes = decoded.tests.map(validateOutcome);
      const testResults = [];
      let testsPassed = 0;
      let executionTimeMs = 0;
      for (const [index, test] of request.testCases.entries()) {
        const outcome = outcomes[index];
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
      timing.executionMs = executionTimeMs;
      const passed = testsPassed === request.testCases.length;
      return { ...base, compiled: true, passed, score: Math.round(testsPassed / request.testCases.length * 100),
        testsPassed, testResults, executionTimeMs, compilationTimeMs: compilation.executionTimeMs,
        verified: false }; // Only evaluateSubmission can grant verified progress.
    } finally {
      try { if (sandbox) await timed('cleanup', () => sandbox!.stop()); }
      finally {
        timing.totalMs = performance.now() - started;
        // Operational metrics contain no code, stdin, answers, user identifiers or credentials.
        if (this.options.onTiming) this.options.onTiming(timing);
        else console.info(JSON.stringify({ event: 'cpp_runner_timing', ...timing }));
      }
    }
  }
}
