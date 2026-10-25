/** Opt-in real Sandbox benchmark. Does not call/deploy the production API or write learner progress. */
import { config } from 'dotenv';
import { writeFile } from 'node:fs/promises';
import { Sandbox } from '@vercel/sandbox';
import { VercelSandboxCodeRunner, type RunnerTiming } from '../server/vercelSandboxCodeRunner.js';
import { evaluateSubmission } from '../server/evaluateSubmission.js';
import { confirmHobbyProject } from './sandboxMaintenance.js';

config({ path: '.env.local', quiet: true });
const label = process.argv[2];
if (!label || !/^[a-z-]+$/.test(label)) throw new Error('Supply a benchmark label containing lowercase letters and hyphens.');
await confirmHobbyProject();
const records = [];
for (let index = 0; index < 3; index++) {
  let timing: RunnerTiming | undefined;
  const created: string[] = [];
  const runner = new VercelSandboxCodeRunner(async options => {
    const sandbox = await Sandbox.create(options); created.push(sandbox.name); return sandbox;
  }, { onTiming: value => { timing = value; } });
  const start = performance.now();
  const response = await evaluateSubmission({ challengeId: 'cc-t1',
    code: '#include <iostream>\nconsteval int answer(){return 42;}\nint main(){static_assert(answer()==42);std::cout<<"Hello, modern C++!";}',
    mode: 'assessment', wasAssisted: false, requestAiFeedback: false,
  }, runner);
  const record = { label, sample: index + 1, endToEndMs: performance.now() - start, timing,
    status: response.status, verified: response.result.verified, testsPassed: response.result.testsPassed,
    totalTests: response.result.totalTests, cleanup: [] as { status: string }[] };
  for (const name of created) {
    const sandbox = await Sandbox.get({ name }); record.cleanup.push({ status: sandbox.status });
  }
  records.push(record);
  await writeFile(`docs/sandbox-latency-${label}.json`, JSON.stringify({ measuredAt: new Date().toISOString(),
    location: 'local trusted evaluator invoking real Vercel sandboxes; excludes Firebase/API/AI/browser latency', records }, null, 2) + '\n');
  console.log(JSON.stringify(record));
  if (!response.result.verified || response.result.testsPassed !== response.result.totalTests || record.cleanup.some(item => item.status !== 'stopped')) {
    throw new Error('Benchmark correctness/cleanup failed. No further sandboxes will be created.');
  }
}
