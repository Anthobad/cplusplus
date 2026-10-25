/** Explicit maintenance command: only trusted dependencies/infrastructure enter this snapshot. */
import { Sandbox, Snapshot } from '@vercel/sandbox';
import { config } from 'dotenv';
import { writeFile } from 'node:fs/promises';
import { confirmHobbyProject } from './sandboxMaintenance.js';
import { compilerVersion, provisionCommand, provisioningPolicy, environmentFiles, setupCommand, snapshotExpirationMs, snapshotMaxAgeMs } from '../server/sandbox/compilerEnvironment.js';
import { compilerSnapshot } from '../server/sandbox/compilerSnapshot.js';

config({ path: '.env.local', quiet: true });
await confirmHobbyProject();
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
  const compilerIdentity = (await provision.stdout()).split('\n').find(line => /^g\+\+ .*\b15\./.test(line));
  if (!compilerIdentity) throw new Error('Expected GCC 15 was not confirmed; no snapshot will be published.');
  await builder.update({ networkPolicy: 'deny-all' });
  await builder.writeFiles(environmentFiles());
  const protectedFiles = await builder.runCommand('sudo', ['sh', '-c', setupCommand]);
  if (protectedFiles.exitCode !== 0) throw new Error('Trusted supervisor installation failed');
  // This builder never receives student source, test inputs/answers, repository contents or secrets.
  const snapshot = await builder.snapshot({ expiration: snapshotExpirationMs, signal: AbortSignal.timeout(30000) });
  const metadata = { snapshotId: snapshot.snapshotId, version: compilerVersion, createdAt: Date.now() };
  await writeFile('server/sandbox/compilerSnapshot.ts', '// Generated trusted compiler snapshot; contains no credentials or submission data.\nexport const compilerSnapshot = ' + JSON.stringify(metadata, null, 2) + ';\n');
  console.log(JSON.stringify({ ...metadata, compilerIdentity, sizeBytes: snapshot.sizeBytes, expiresAt: snapshot.expiresAt, elapsedMs: performance.now() - started, plan: 'hobby', idleSandbox: false }));
} finally {
  // snapshot() stops the builder; stop is still awaited if any prior step fails.
  await builder.stop();
}
