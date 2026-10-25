// Native Node only: test the production bundle with require(ESM) disabled.
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import nock from 'nock';

assert.equal(process.features.require_module, false, 'Run with --no-experimental-require-module');
const config = JSON.parse(readFileSync('firebase-applet-config.json', 'utf8'));
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
// Ephemeral fixture credentials only. No developer or production secret is read.
process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({ project_id: config.projectId,
  client_email: 'bundle-fixture@example.invalid', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) });
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
delete process.env.FIRESTORE_EMULATOR_HOST;
process.env.VERCEL = '1';
nock.disableNetConnect();
nock.enableNetConnect(host => host.startsWith('127.0.0.1:'));
const now = Math.floor(Date.now() / 1000);
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
function token(overrides = {}, key = privateKey) {
  const body = `${encode({ alg: 'RS256', typ: 'JWT', kid: 'fixture' })}.${encode({
    iss: `https://securetoken.google.com/${config.projectId}`, aud: config.projectId, sub: 'bundle-fixture',
    user_id: 'bundle-fixture', iat: now, exp: now + 3600, auth_time: now,
    firebase: { sign_in_provider: 'password', identities: {} }, ...overrides,
  })}`;
  return `${body}.${sign('RSA-SHA256', Buffer.from(body), key).toString('base64url')}`;
}
const certs = nock('https://www.googleapis.com').get('/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')
  .reply(200, { fixture: publicKey.export({ type: 'spki', format: 'pem' }) }, { 'cache-control': 'public, max-age=3600' });
const oauth = nock('https://oauth2.googleapis.com').post('/token').reply(200, {
  access_token: 'fixture-access-token', expires_in: 3600, token_type: 'Bearer',
});
const { default: app } = await import(pathToFileURL(path.resolve(process.argv[2] || 'server-build/server.cjs')).href);
assert.equal(typeof app, 'function', 'Production entry must export an Express handler');
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, 'ok');
  async function request(route, bearer) {
    const response = await fetch(`${base}${route}`, { ...(route.endsWith('evaluate-code') ? {
      method: 'POST', body: JSON.stringify({ challengeId: 'cc-t1', studentCode: 'int main(){}', mode: 'assessment' }),
    } : {}), headers: { 'Content-Type': 'application/json', ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) } });
    const data = await response.json();
    assert.equal(typeof data.error, 'string');
    return response.status;
  }
  for (const route of ['/api/progress', '/api/evaluate-code']) {
    assert.equal(await request(route), 401);
    assert.equal(await request(route, 'forged'), 401);
    assert.equal(await request(route, token({ aud: 'wrong-project' })), 401);
    assert.equal(await request(route, token({ iss: 'https://attacker.invalid' })), 401);
    assert.equal(await request(route, token({ exp: now - 3600 })), 401);
    const wrongKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
    assert.equal(await request(route, token({}, wrongKey)), 401);
  }
  // A correctly signed JWT must reach the SDK's authenticated revocation lookup,
  // then fail closed for disabled/revoked users before any Firestore/compiler work.
  for (const record of [
    { localId: 'bundle-fixture', disabled: true, validSince: '0' },
    { localId: 'bundle-fixture', disabled: false, validSince: String(now + 60) },
  ]) {
    const lookup = nock('https://identitytoolkit.googleapis.com')
      .post(`/v1/projects/${config.projectId}/accounts:lookup`, { localId: ['bundle-fixture'] })
      .matchHeader('authorization', 'Bearer fixture-access-token').reply(200, { users: [record] });
    assert.equal(await request('/api/progress', token()), 401);
    assert.equal(lookup.isDone(), true, 'Real Admin SDK must check revocation/disabled status');
  }
  assert.equal(certs.isDone(), true, 'Real Admin SDK must fetch and verify the signing key');
  assert.equal(oauth.isDone(), true, 'Real Admin SDK must authenticate its user lookup');
  console.log('Built backend passed: native strict-loader startup; health 200; progress/evaluation 401; real Firebase signature, issuer, audience, expiry, disabled and revocation checks.');
} finally {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  nock.cleanAll(); nock.enableNetConnect();
}
