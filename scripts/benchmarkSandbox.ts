import { config } from 'dotenv';
import { writeFile } from 'node:fs/promises';
import { VercelSandboxCodeRunner, type RunnerTiming } from '../server/vercelSandboxCodeRunner.js';
import { evaluateSubmission } from '../server/evaluateSubmission.js';
config({ path: '.env.local', quiet: true });
const records: any[] = [];
for (const label of ['first-snapshot-restore', 'warm-snapshot-restore']) {
  let timing: RunnerTiming;
  const runner = new VercelSandboxCodeRunner(undefined, { onTiming: t => timing = t });
  const started = performance.now();
  const response = await evaluateSubmission({ challengeId: 'cc-t1', code: '#include <iostream>\nconsteval int cpp20(){return 42;}\nint main(){static_assert(cpp20()==42);std::cout<<"Hello, modern C++!";}', mode: 'assessment', wasAssisted: false }, runner);
  const record = { label, endToEndMs: performance.now() - started, timing: timing!, response };
  records.push(record);
  console.log(JSON.stringify({ label, ...record.timing, verified: response.result.verified, status: response.status }));
  if (!response.result.verified) throw new Error('Real sandbox benchmark failed');
}
await writeFile('sandbox-quickstart/latency-optimized.json', JSON.stringify({ location: 'local trusted evaluator with real Vercel Sandbox, not deployed API', records }, null, 2) + '\n');
