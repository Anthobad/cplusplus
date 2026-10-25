import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';

const run = promisify(execFile);
it('initializes and protects the actual server bundle when synchronous require(ESM) is disabled', async () => {
  await run(process.execPath, ['scripts/build-server.mjs']);
  const { stdout } = await run(process.execPath, ['--no-experimental-require-module', 'tests/verifyBuiltBackend.mjs'], { timeout: 30_000 });
  expect(stdout).toContain('Built backend passed:');
}, 40_000);
