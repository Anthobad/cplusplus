import { afterEach, describe, expect, it, vi } from 'vitest';
import { VercelSandboxCodeRunner, SANDBOX_LIMITS, provisionCommand } from '../server/vercelSandboxCodeRunner';
import { getCodeRunner, WandboxCodeRunner, LocalCodeRunner, IsolatedProductionRunner, type RunnerRequest } from '../server/codeRunner';
import { evaluateSubmission } from '../server/evaluateSubmission';
import { compilerVersion } from '../server/sandbox/compilerEnvironment';

const outcome = (stdout = 'Hello, modern C++!\n', overrides = {}) => ({ stdout, stderr: '', exitCode: 0, executionTimeMs: 2, timedOut: false, outputLimited: false, ...overrides });
const request: RunnerRequest = { code: '#include <iostream>\nint main(){std::cout << "Hello, modern C++!";}', mode: 'assessment', wasAssisted: false,
  testCases: [{ input: 'first', expectedOutput: 'Hello, modern C++!' }, { input: 'secret input', expectedOutput: 'Hello, modern C++!', isHidden: true }] };

function fixture(results = [outcome(''), outcome(), outcome()]) {
  const inputs: any[] = [];
  const detached = {
    writeStdin: vi.fn(async (data: string) => { inputs.push(JSON.parse(data)); }),
    closeStdin: vi.fn(async () => {}),
    wait: vi.fn(async () => ({ exitCode: 0, stdout: async () => JSON.stringify({ compilation: results[0], tests: results.slice(1) }) })),
  };
  const client = {
    update: vi.fn(async () => {}), writeFiles: vi.fn(async () => {}), stop: vi.fn(async () => {}), readFileToBuffer: vi.fn(),
    runCommand: vi.fn(async (command: any, _args?: string[]) => command?.stdin ? detached : { exitCode: 0, stdout: async () => '', stderr: async () => '' }),
  };
  const create = vi.fn(async (_options: any) => client);
  return { client, create, inputs, detached, runner: new VercelSandboxCodeRunner(create as any, { snapshot: null, onTiming: () => {} }) };
}

afterEach(() => vi.unstubAllEnvs());

describe('Vercel sandbox runner', () => {
  it('compiles C++20 once, runs each test independently and compares only in the backend', async () => {
    const f = fixture();
    const result = await f.runner.evaluate(request);
    expect(result).toMatchObject({ compiled: true, passed: true, testsPassed: 2, verified: false, compilationTimeMs: 2, executionTimeMs: 4 });
    expect(f.inputs).toHaveLength(1);
    expect(f.inputs[0].inputs).toEqual(['first', 'secret input']);
    expect(f.inputs[0].source).toBe(request.code);
    expect(f.detached.wait).toHaveBeenCalledOnce();
    expect(f.client.stop).toHaveBeenCalledOnce();
    expect(f.create.mock.calls[0][0]).toMatchObject({ persistent: false, resources: { vcpus: 1 }, timeout: 200000 });
    expect(f.create.mock.calls[0][0]).not.toHaveProperty('name');
    expect(f.client.update).toHaveBeenCalledWith({ networkPolicy: 'deny-all' });
    expect(f.client.update.mock.invocationCallOrder[0]).toBeLessThan(f.client.writeFiles.mock.invocationCallOrder[0]);
    const uploaded = f.client.writeFiles.mock.calls.flatMap(([files]: any) => files).map(x => x.content.toString()).join('');
    expect(uploaded).not.toContain('secret input');
    expect(JSON.stringify(f.inputs)).not.toContain('expectedOutput');
    expect(provisionCommand).toContain('g++-15');
    expect(provisionCommand).toContain('libjansson4');
    expect(uploaded).toContain("'-std=c++20'");
  });
  it('keeps expected outputs out of the sandbox, even for a hidden echo failure', async () => {
    const f = fixture([outcome(''), outcome(), outcome('secret input')]);
    const result = await f.runner.evaluate(request);
    expect(result.passed).toBe(false);
    expect(JSON.stringify(result)).not.toContain('secret input');
    expect(result.testResults[1]).not.toHaveProperty('exitCode', 0);
    expect(result.testResults[1].stderr).toBeUndefined();
  });
  it.each([
    [{ exitCode: 1, stderr: 'syntax error' }, 'syntax error'],
    [{ timedOut: true, exitCode: -9 }, 'Compilation Time Limit Exceeded'],
    [{ outputLimited: true, exitCode: -9 }, 'Compiler Output Limit Exceeded'],
  ])('reports compilation failures and stops before running tests', async (failure, expected) => {
    const f = fixture([outcome('', failure)]);
    const result = await f.runner.evaluate(request);
    expect(result).toMatchObject({ compiled: false, passed: false, verified: false, compileError: expected });
    expect(f.inputs).toHaveLength(1);
    expect(f.client.stop).toHaveBeenCalledOnce();
  });
  it.each([
    [{ exitCode: 1 }, 'Runtime Error'],
    [{ timedOut: true, exitCode: -9 }, 'Time Limit Exceeded'],
    [{ outputLimited: true, exitCode: -9 }, 'Output Limit Exceeded'],
    [{ stdout: 'wrong' }, 'Output mismatch'],
  ])('distinguishes runtime failures, loops, output floods and wrong answers', async (failure, expected) => {
    const f = fixture([outcome(''), outcome('Hello, modern C++!', failure), outcome()]);
    const result = await f.runner.evaluate(request);
    expect(result.compiled).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.testResults[0].error).toBe(expected);
    expect(f.client.stop).toHaveBeenCalledOnce();
  });
  it('enforces source/input/count limits before creating a sandbox', async () => {
    const f = fixture();
    expect((await f.runner.evaluate({ ...request, code: 'x'.repeat(SANDBOX_LIMITS.sourceBytes + 1) })).compiled).toBe(false);
    expect((await f.runner.evaluate({ ...request, testCases: [] })).configurationError).toBe(true);
    expect((await f.runner.evaluate({ ...request, testCases: [{ input: 'x'.repeat(SANDBOX_LIMITS.inputBytes + 1), expectedOutput: 'a' }] })).configurationError).toBe(true);
    expect((await f.runner.evaluate({ ...request, testCases: Array(33).fill(request.testCases[0]) })).configurationError).toBe(true);
    expect(f.create).not.toHaveBeenCalled();
  });
  it.each(['provision', 'policy', 'upload', 'supervisor', 'result', 'cleanup'])('fails closed on %s infrastructure failure', async failure => {
    const f = fixture();
    if (failure === 'provision') f.client.runCommand.mockRejectedValueOnce(new Error('unavailable'));
    if (failure === 'policy') f.client.update.mockRejectedValueOnce(new Error('unavailable'));
    if (failure === 'upload') f.client.writeFiles.mockRejectedValueOnce(new Error('unavailable'));
    if (failure === 'cleanup') f.client.stop.mockRejectedValueOnce(new Error('unavailable'));
    if (failure === 'result') f.detached.wait.mockResolvedValueOnce({exitCode: 0, stdout: async () => 'invalid JSON'});
    if (failure === 'supervisor') {
      const original = f.client.runCommand.getMockImplementation()!;
      f.client.runCommand.mockImplementation(async (command: any, args?: any) => {
        if (command?.stdin) throw new Error('unavailable');
        return original(command, args);
      });
    }
    const response = await evaluateSubmission({ challengeId: 'cc-t1', code: request.code, mode: 'assessment' }, f.runner);
    expect(response.status).toBe(503);
    expect(response.result).toMatchObject({ verified: false, passed: false });
    expect(f.client.stop).toHaveBeenCalledOnce();
  });
  it('handles creation failure without switching providers', async () => {
    const create = vi.fn().mockRejectedValue(new Error('quota'));
    const result = await evaluateSubmission({ challengeId: 'cc-t1', code: request.code, mode: 'assessment' }, new VercelSandboxCodeRunner(create));
    expect(result.status).toBe(503);
    expect(result.result.verified).toBe(false);
    expect(create).toHaveBeenCalledOnce();
  });
  it('keeps concurrent submissions in distinct sandboxes', async () => {
    const a = fixture(), b = fixture();
    const create = vi.fn().mockResolvedValueOnce(a.client).mockResolvedValueOnce(b.client);
    const runner = new VercelSandboxCodeRunner(create);
    const results = await Promise.all([runner.evaluate(request), runner.evaluate(request)]);
    expect(results.every(x => x.passed)).toBe(true);
    expect(create).toHaveBeenCalledTimes(2);
    expect(a.client.stop).toHaveBeenCalledOnce();
    expect(b.client.stop).toHaveBeenCalledOnce();
  });
  it.each([['assessment', false, true], ['practice', false, false], ['assessment', true, false]] as const)('preserves verified progress for %s, assisted=%s', async (mode, wasAssisted, verified) => {
    const f = fixture([outcome(''), ...Array.from({ length: 5 }, () => outcome())]);
    const response = await evaluateSubmission({ challengeId: 'cc-t1', code: request.code, mode, wasAssisted,
      testCases: [{ expectedOutput: 'tampered answer' }], hiddenTestCases: [{ expectedOutput: 'tampered hidden answer' }] }, f.runner);
    expect(response.result.verified).toBe(verified);
    expect(response.result.totalTests).toBe(5);
    expect(JSON.stringify(f.inputs)).not.toContain('tampered');
    expect(response.result.testResults.filter(x => x.isHidden).every(x => x.input === undefined && x.expectedOutput === undefined)).toBe(true);
  });
  it('rejects unknown assessment challenges before execution', async () => {
    const f = fixture();
    const result = await evaluateSubmission({ challengeId: 'fake', code: request.code, mode: 'assessment' }, f.runner);
    expect(result.result.verified).toBe(false);
    expect(f.create).not.toHaveBeenCalled();
  });
});

describe('provider configuration', () => {
  it('selects Vercel on Vercel, allows explicit alternatives, and never permits local production', () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('VERCEL', '1'); vi.stubEnv('CODE_RUNNER_MODE', '');
    vi.stubEnv('ISOLATED_RUNNER_ENDPOINT', 'https://google.example');
    expect(getCodeRunner()).toBeInstanceOf(VercelSandboxCodeRunner);
    vi.stubEnv('CODE_RUNNER_MODE', 'local');
    expect(getCodeRunner()).toBeInstanceOf(VercelSandboxCodeRunner);
    vi.stubEnv('CODE_RUNNER_MODE', 'wandbox');
    expect(getCodeRunner()).toBeInstanceOf(WandboxCodeRunner);
    vi.stubEnv('CODE_RUNNER_MODE', 'isolated');
    expect(getCodeRunner()).toBeInstanceOf(IsolatedProductionRunner);
    vi.stubEnv('CODE_RUNNER_MODE', 'typo');
    expect(() => getCodeRunner()).toThrow('Unsupported');
  });
  it('preserves Google production and local development defaults', () => {
    vi.stubEnv('VERCEL', ''); vi.stubEnv('CODE_RUNNER_MODE', ''); vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ISOLATED_RUNNER_ENDPOINT', 'https://google.example');
    expect(getCodeRunner()).toBeInstanceOf(IsolatedProductionRunner);
    vi.stubEnv('ISOLATED_RUNNER_ENDPOINT', '');
    expect(getCodeRunner()).toBeInstanceOf(WandboxCodeRunner);
    vi.stubEnv('NODE_ENV', 'development');
    expect(getCodeRunner()).toBeInstanceOf(LocalCodeRunner);
  });
});

describe('trusted compiler snapshot and batch execution', () => {
  const snapshot = () => ({ snapshotId: 'snap_trusted', version: compilerVersion, createdAt: Date.now() });
  it('restores a fresh deny-all sandbox and skips all provisioning and infrastructure uploads', async () => {
    const f = fixture(); const metrics: any[] = [];
    const runner = new VercelSandboxCodeRunner(f.create as any, { snapshot: snapshot(), onTiming: t => metrics.push(t) });
    const result = await runner.evaluate(request);
    expect(result.passed).toBe(true);
    expect(f.create).toHaveBeenCalledOnce();
    expect(f.create.mock.calls[0][0]).toMatchObject({ source: { type: 'snapshot', snapshotId: 'snap_trusted' }, networkPolicy: 'deny-all', persistent: false });
    expect(f.create.mock.calls[0][0]).not.toHaveProperty('name');
    expect(f.client.writeFiles).not.toHaveBeenCalled();
    expect(f.client.update).not.toHaveBeenCalled();
    expect(f.client.runCommand).toHaveBeenCalledOnce();
    expect(f.inputs).toHaveLength(1);
    expect(f.inputs[0]).not.toHaveProperty('expectedOutput');
    expect(metrics[0]).toMatchObject({ snapshotHit: true, sdkCalls: 7, compilationMs: 2, executionMs: 4 });
    expect(metrics[0].phases).not.toHaveProperty('aptProvisioning');
    expect(f.client.stop).toHaveBeenCalledOnce();
  });
  it.each(['version', 'age'])('rebuilds an isolated environment when snapshot %s is stale', async reason => {
    const f = fixture(); const metadata = snapshot();
    if (reason === 'version') metadata.version = 'outdated';
    else metadata.createdAt -= 8 * 24 * 60 * 60 * 1000;
    const runner = new VercelSandboxCodeRunner(f.create as any, { snapshot: metadata, onTiming: () => {} });
    expect((await runner.evaluate(request)).passed).toBe(true);
    expect(f.create.mock.calls[0][0]).not.toHaveProperty('source');
    expect(f.client.update).toHaveBeenCalledWith({ networkPolicy: 'deny-all' });
    const uploaded = f.client.writeFiles.mock.calls.flatMap(([files]: any) => files).map(file => file.content.toString()).join('');
    expect(uploaded).not.toContain(request.code);
    expect(uploaded).not.toContain('secret input');
  });
  it('recovers a missing snapshot before uploading student data, using the same provider', async () => {
    const f = fixture(); f.create.mockRejectedValueOnce({ json: { error: { code: 'snapshot_not_found' } } });
    const runner = new VercelSandboxCodeRunner(f.create as any, { snapshot: snapshot(), onTiming: () => {} });
    expect((await runner.evaluate(request)).passed).toBe(true);
    expect(f.create).toHaveBeenCalledTimes(2);
    expect(f.create.mock.calls[1][0]).toHaveProperty('image');
    expect(f.inputs).toHaveLength(1);
  });
  it.each(['forbidden', 'rate_limit', 'network_error'])('does not retry snapshot %s failures', async code => {
    const f = fixture(); f.create.mockRejectedValueOnce({ json: { error: { code } } });
    const runner = new VercelSandboxCodeRunner(f.create as any, { snapshot: snapshot(), onTiming: () => {} });
    await expect(runner.evaluate(request)).rejects.toBeDefined();
    expect(f.create).toHaveBeenCalledOnce();
    expect(f.inputs).toHaveLength(0);
  });
  it('does not rebuild or retry after a supervisor or manifest failure', async () => {
    const f = fixture(); f.detached.wait.mockResolvedValueOnce({ exitCode: 1, stdout: async () => '' });
    const runner = new VercelSandboxCodeRunner(f.create as any, { snapshot: snapshot(), onTiming: () => {} });
    const response = await evaluateSubmission({ challengeId: 'cc-t1', code: request.code, mode: 'assessment' }, runner);
    expect(response.status).toBe(503);
    expect(response.result.verified).toBe(false);
    expect(f.create).toHaveBeenCalledOnce();
    expect(f.client.stop).toHaveBeenCalledOnce();
  });
  it('rejects incomplete or malformed batch outcomes before scoring', async () => {
    const f = fixture([outcome('')]);
    await expect(f.runner.evaluate(request)).rejects.toThrow('Invalid sandbox test count');
    expect(f.client.stop).toHaveBeenCalledOnce();
  });
});
