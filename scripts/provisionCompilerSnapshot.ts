/** Explicit maintenance command: only trusted dependencies/infrastructure enter this snapshot. */
import { Sandbox, Snapshot } from '@vercel/sandbox';
import { config } from 'dotenv';
import { readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { compilerVersion, provisionCommand, provisioningPolicy, environmentFiles, setupCommand, snapshotExpirationMs, snapshotMaxAgeMs } from '../server/sandbox/compilerEnvironment.js';
import { compilerSnapshot } from '../server/sandbox/compilerSnapshot.js';

config({ path: '.env.local', quiet: true });
const project = JSON.parse(await readFile('.vercel/project.json', 'utf8'));
if (project.projectName !== 'cplusplus') throw new Error('Expected the existing cplusplus project. Run vercel link for anthobads-projects/cplusplus.');
const { stdout } = await promisify(execFile)('npx', ['vercel@latest', 'api', `/v2/teams/${project.orgId}`, '--scope', 'anthobads-projects'], { maxBuffer: 1024 * 1024 });
const response = JSON.parse(stdout);
const team = response.team || response;
if (team.billing?.plan !== 'hobby') throw new Error('Snapshot creation is restricted to the confirmed free Hobby account. No paid resources were created.');
if (compilerSnapshot?.version === compilerVersion && Date.now() - compilerSnapshot.createdAt < snapshotMaxAgeMs) {
  try {
    const existing = await Snapshot.get({ snapshotId: compilerSnapshot.snapshotId });
    if (existing.status === 'created') {
      console.log(JSON.stringify({ reused: true, ...compilerSnapshot }));
      process.exit(0);
    }
  } catch (error) {
    const code = (error as { json?: { error?: { code?: string } } }).json?.error?.code;
    if (!['snapshot_not_found', 'not_found'].includes(code || '')) throw error;
  }
}
const existing = await (await Snapshot.list()).toArray();
const usedBytes = existing.filter(s => s.status === 'created').reduce((n, s) => n + s.sizeBytes, 0);
if (usedBytes > 14 * 1000 ** 3) throw new Error('Insufficient headroom in the Hobby 15 GB snapshot quota. No snapshot was created.');
const started = performance.now();
const builder = await Sandbox.create({ image: 'vercel/sandbox/ubuntu:latest', persistent: false,
  networkPolicy: provisioningPolicy, resources: { vcpus: 1 }, timeout: 120000,
  tags: { purpose: 'trusted-cpp-compiler', version: compilerVersion.slice(0, 32) },
  signal: AbortSignal.timeout(30000),
});
try {
  const provision = await builder.runCommand({ cmd: 'sudo', args: ['timeout', '--kill-after=2s', '90s', 'sh', '-c', provisionCommand], signal: AbortSignal.timeout(95000) });
  if (provision.exitCode !== 0) throw new Error('Trusted compiler provisioning failed');
  await builder.update({ networkPolicy: 'deny-all' });
  await builder.writeFiles(environmentFiles());
  const protectedFiles = await builder.runCommand('sudo', ['sh', '-c', setupCommand]);
  if (protectedFiles.exitCode !== 0) throw new Error('Trusted supervisor installation failed');
  // This builder never receives student source, test inputs/answers, repository contents or secrets.
  const snapshot = await builder.snapshot({ expiration: snapshotExpirationMs, signal: AbortSignal.timeout(30000) });
  const metadata = { snapshotId: snapshot.snapshotId, version: compilerVersion, createdAt: Date.now() };
  await writeFile('server/sandbox/compilerSnapshot.ts', '// Generated trusted compiler snapshot; contains no credentials or submission data.\nexport const compilerSnapshot = ' + JSON.stringify(metadata, null, 2) + ';\n');
  console.log(JSON.stringify({ ...metadata, sizeBytes: snapshot.sizeBytes, expiresAt: snapshot.expiresAt, elapsedMs: performance.now() - started, plan: 'hobby', idleSandbox: false }));
} finally {
  // snapshot() stops the builder; stop is still awaited if any prior step fails.
  await builder.stop();
}
