import { config } from 'dotenv';
import { Sandbox } from '@vercel/sandbox';
import { readFile, writeFile } from 'node:fs/promises';

config({ path: new URL('.env.local', import.meta.url), quiet: true });
if (!process.env.VERCEL_OIDC_TOKEN) throw new Error('VERCEL_OIDC_TOKEN is missing. Refresh vercel link and vercel env pull.');
const sandbox = await Sandbox.getOrCreate({ name: 'my-sandbox-864524', persistent: true, networkPolicy: 'deny-all' });
try {
  await sandbox.update({ networkPolicy: 'deny-all' });
  const compiler = await sandbox.runCommand('sh', ['-c', 'command -v g++']);
  if (compiler.exitCode !== 0) {
    await sandbox.writeFiles([{ path: '/vercel/toolchain.tar.gz', content: await readFile(new URL('compiler/toolchain.tar.gz', import.meta.url)) }]);
    const install = await sandbox.runCommand('sudo', ['tar', '-xzf', '/vercel/toolchain.tar.gz', '-C', '/']);
    if (install.exitCode !== 0) throw new Error(`Offline compiler installation failed: ${await install.stderr()}`);
  }
  const linker = await sandbox.runCommand('ld', ['--version']);
  if (linker.exitCode !== 0) {
    await sandbox.writeFiles([{ path: '/vercel/libjansson.so.4', content: await readFile(new URL('compiler/libjansson.so.4', import.meta.url)) }]);
    const repair = await sandbox.runCommand('sudo', ['cp', '/vercel/libjansson.so.4', '/usr/lib/x86_64-linux-gnu/libjansson.so.4']);
    if (repair.exitCode !== 0) throw new Error(`Linker dependency installation failed: ${await repair.stderr()}`);
  }
  await sandbox.writeFiles([{ path: '/vercel/check-cpp.mjs', content: await readFile(new URL('check-cpp.mjs', import.meta.url)) }]);
  const result = await sandbox.runCommand('node', ['/vercel/check-cpp.mjs']);
  const stdout = await result.stdout();
  const stderr = await result.stderr();
  if (stdout) {
    process.stdout.write(stdout);
    await writeFile(new URL('results.json', import.meta.url), stdout);
  }
  if (stderr) process.stderr.write(stderr);
  if (result.exitCode !== 0) throw new Error(`C++ verification failed with exit code ${result.exitCode}`);
} finally {
  await sandbox.stop();
}
