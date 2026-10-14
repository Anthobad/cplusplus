/** Opt-in integration verification; uses existing local OIDC, never deploys or writes progress. */
import { config } from 'dotenv';
import { writeFile } from 'node:fs/promises';
config({ path: 'sandbox-quickstart/.env.local', quiet: true });
process.env.VERCEL = '1';
process.env.CODE_RUNNER_MODE = 'vercel-sandbox';
const { default: app } = await import('../server');
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Local API unavailable');
const report: any = { location: 'local Express API with real Vercel Sandbox execution', results: [] };
try {
  const response = await fetch(`http://127.0.0.1:${address.port}/api/evaluate-code`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId: 'cc-t1', code: '#include <iostream>\nconsteval int cpp20(){return 42;}\nint main(){static_assert(cpp20()==42); std::cout << "Hello, modern C++!";}', mode: 'assessment', wasAssisted: false, requestAiFeedback: false,
      testCases: [{ input: '', expectedOutput: 'client tampered answer' }] }),
    signal: AbortSignal.timeout(240000),
  });
  const result = await response.json();
  report.results.push({ name: 'complete trusted submission flow', status: response.status, result });
  if (response.status !== 200 || !result.verified || result.testsPassed !== 5 || result.testResults.filter((x: any) => x.isHidden).length !== 2) {
    throw new Error('Trusted submission flow failed');
  }
  const { VercelSandboxCodeRunner } = await import('../server/vercelSandboxCodeRunner');
  for (const [name, code, expectedError] of [
    ['syntax error', 'int main(){ invalid syntax; }', 'Compilation'],
    ['runtime failure', 'int main(){return 1;}', 'Runtime Error'],
    ['infinite loop', 'int main(){for(;;){}}', 'Time Limit Exceeded'],
    ['incorrect output', '#include <iostream>\nint main(){std::cout << 7;}', 'Output mismatch'],
    ['output flood', '#include <cstdio>\nint main(){for(;;) puts("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");}', 'Output Limit Exceeded'],
  ]) {
    const result = await new VercelSandboxCodeRunner().evaluate({ code, mode: 'assessment', wasAssisted: false,
      timeoutMs: 150, testCases: [{ input: '', expectedOutput: '42' }] });
    report.results.push({ name, result });
    if (result.passed || result.verified || (name === 'syntax error' ? result.compiled || !result.compileError : result.testResults[0]?.error !== expectedError)) throw new Error(`${name} verification failed`);
  }
} catch (error) {
  report.error = String(error);
  process.exitCode = 1;
} finally {
  server.close();
  await writeFile('sandbox-quickstart/integration-results.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ location: report.location, error: report.error,
    results: report.results.map(({ name, status, result }: any) => ({ name, status,
      compiled: result.compiled, passed: result.passed, verified: result.verified,
      testsPassed: result.testsPassed, totalTests: result.totalTests,
      compilationTimeMs: result.compilationTimeMs,
      executionTimeMs: result.executionTimeMs,
      compileError: result.compileError,
      errors: result.testResults?.map((test: any) => test.error).filter(Boolean),
    })) }, null, 2));
}
