import { config } from 'dotenv';
import { Sandbox } from '@vercel/sandbox';
import { writeFile } from 'node:fs/promises';
import { VercelSandboxCodeRunner } from '../server/vercelSandboxCodeRunner.js';
import { compilerSnapshot } from '../server/sandbox/compilerSnapshot.js';
config({ path: '.env.local', quiet: true });
const report: any = { results: [], timings: [], created: [] };
const create = async (options: Parameters<typeof Sandbox.create>[0]) => {
  const sandbox = await Sandbox.create(options); report.created.push(sandbox.name); return sandbox;
};
const runner = new VercelSandboxCodeRunner(create, { onTiming: timing => report.timings.push(timing) });
const cases = [
  ['compile failure', 'int main(){ invalid syntax; }', 'compile'],
  ['runtime failure', 'int main(){return 1;}', 'Runtime Error'],
  ['timeout', 'int main(){for(;;){}}', 'Time Limit Exceeded'],
  ['output flood', '#include <cstdio>\nint main(){for(;;)puts("xxxxxxxxxxxxxxxx");}', 'Output Limit Exceeded'],
  ['incorrect output', '#include <iostream>\nint main(){std::cout<<7;}', 'Output mismatch'],
];
for (const [name, code, expected] of cases) {
  const result = await runner.evaluate({ code, mode: 'assessment', wasAssisted: false, timeoutMs: 150, testCases: [{ input: '', expectedOutput: '42' }] });
  const passed = !result.passed && !result.verified && (expected === 'compile' ? !result.compiled && !!result.compileError : result.compiled && result.testResults[0]?.error === expected);
  report.results.push({ name, passed, result }); if (!passed) throw new Error(name + ' failed');
}
const privacyCode = '#include <iostream>\n#include <fstream>\n#include <unistd.h>\nint main(){std::ifstream manifest("/opt/cpp-runner/version");std::ifstream parent("/proc/"+std::to_string(getppid())+"/mem");std::ofstream output("/proc/"+std::to_string(getppid())+"/fd/1");std::cout<<(manifest.is_open()||parent.is_open()||output.is_open()?"LEAK":"SECURE");}';
const privacy = await runner.evaluate({ code: privacyCode, mode: 'assessment', wasAssisted: false, testCases: [{ input: 'private-first-input', expectedOutput: 'SECURE' }, { input: 'private-hidden-input', expectedOutput: 'SECURE', isHidden: true }] });
if (!privacy.passed || JSON.stringify(privacy).includes('private-hidden-input')) throw new Error('Batch privacy failed');
report.results.push({ name: 'batch privacy', passed: true, result: privacy });
const sumCode = '#include <iostream>\nint main(){int a,b;std::cin>>a>>b;std::cout<<a+b;}';
const concurrent = await Promise.all([['2 3', '5'], ['10 20', '30']].map(([input,expectedOutput]) => runner.evaluate({ code: sumCode, mode: 'practice', wasAssisted: false, testCases: [{ input, expectedOutput }] })));
if (!concurrent.every(r => r.passed)) throw new Error('Concurrent submissions failed');
report.results.push({ name: 'real concurrent fresh submissions', passed: true, results: concurrent });
const inspection = await Sandbox.create({ source: { type: 'snapshot', snapshotId: compilerSnapshot!.snapshotId }, persistent: false, networkPolicy: 'deny-all', resources: { vcpus: 1 } });
try {
  const inspect = await inspection.runCommand('sudo', ['sh', '-c', 'test ! -e /opt/cpp-binary && test ! -e /opt/cpp-runner/source.cpp && test -z "$(find /tmp -maxdepth 1 -type d -name cpp-\*)" && test -f /opt/cpp-runner/version && test -f /opt/cpp-runner/supervisor.py']);
  report.snapshotPristine = inspect.exitCode === 0; if (!report.snapshotPristine) throw new Error('Snapshot contained submission artifacts');
} finally { await inspection.stop(); }
const inventory = await Sandbox.list({ limit: 50, sortBy: 'createdAt', sortOrder: 'desc' });
report.cleanup = report.created.map(name => ({name, status: inventory.sandboxes.find(s => s.name === name)?.status}));
if (!report.cleanup.every(s => s.status === 'stopped')) throw new Error('Cleanup failed');
await writeFile('sandbox-quickstart/optimized-security-results.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ results: report.results.map(({name,passed}: any) => ({name,passed})), snapshotPristine: report.snapshotPristine, cleanup: report.cleanup }));
