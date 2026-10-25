// Execute with native Node ESM: tsx/Vitest resolution would hide invalid emitted imports.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
process.env.VERCEL = '1';
const entrypoint = process.argv[2] || '.vercel/output/functions/api/index.func/api/index.js';
const { default: app } = await import(pathToFileURL(path.resolve(entrypoint)).href);
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, 'ok');
  const submission = await fetch(`${base}/api/evaluate-code`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({challengeId:'unknown-packaging-test',code:'int main(){}',mode:'assessment',requestAiFeedback:false}),
  });
  assert.equal(submission.status, 401);
  const result = await submission.json();
  assert.equal(typeof result.error, 'string');
  for (const route of ['/api/progress', '/api/assessment/exam/start', '/api/assessment/exam/submit']) {
    const response = await fetch(`${base}${route}`, route === '/api/progress' ? {} : {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
    });
    assert.equal(response.status, 401, `${route} must require authentication`);
    assert.equal(typeof (await response.json()).error, 'string');
  }
  console.log('Packaged Node ESM API: startup, health and evaluation routing passed.');
} finally {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
