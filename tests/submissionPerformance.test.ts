import express from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAccess } from '../server/security/access.js';
import { HttpError, type TrustedStore } from '../server/security/store.js';
import { submissionPerformance, measureSubmissionPhase, recordRunnerTiming, submissionTimingHeaders } from '../server/submissionPerformance.js';

afterEach(() => vi.restoreAllMocks());
async function fixture(run: (base: string, logs: ReturnType<typeof vi.spyOn>, work: ReturnType<typeof vi.fn>) => Promise<void>, rejectQuota = false) {
  const logs = vi.spyOn(console, 'info').mockImplementation(() => {});
  const documents: Record<string, any> = {};
  let queue = Promise.resolve();
  const store: TrustedStore = { read: async path => documents[path], transact: (paths, update) => {
    const pending = queue.then(() => {
      if (rejectQuota) throw new HttpError(429, 'Quota reached.');
      const result = update(Object.fromEntries(paths.map(path => [path, structuredClone(documents[path])])));
      Object.assign(documents, result.writes); return result.value;
    });
    queue = pending.then(() => {}, () => {}); return pending;
  } };
  const access = createAccess(store, async token => {
    if (!['secret-a', 'secret-b'].includes(token)) throw new HttpError(401, 'Invalid token');
    return { uid: token, anonymous: false };
  });
  const work = vi.fn();
  const app = express(); app.use(express.json()); app.use('/api/evaluate-code', submissionPerformance);
  app.post('/api/evaluate-code', access.authenticate, access.limited('execution', async (req, res) => {
    work();
    await measureSubmissionPhase('evaluation', async () => {
      await Promise.resolve();
      recordRunnerTiming({ snapshotHit: true, compilationMs: req.body.sample, executionMs: 1, phases: { cleanup: 2 } });
    });
    await measureSubmissionPhase('progressPersistence', async () => {});
    await measureSubmissionPhase('aiFeedback', async () => {});
    submissionTimingHeaders(res); res.json({ passed: true });
  }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  try { await run(`http://127.0.0.1:${(server.address() as any).port}`, logs, work); }
  finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}
const request = (base: string, token = 'secret-a', sample = 10) => fetch(`${base}/api/evaluate-code`, {
  method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ sample, code: 'PRIVATE_SOURCE', hiddenInput: 'PRIVATE_INPUT' }),
});
const events = (logs: any) => logs.mock.calls.map(([message]: [string]) => JSON.parse(message)).filter((event: any) => event.event === 'cpp_submission_timing');
const settled = () => new Promise(resolve => setImmediate(resolve));

describe('Submission performance instrumentation', () => {
  it('measures auth, quota, evaluation, persistence, AI and release without logging learner data', async () => {
    await fixture(async (base, logs) => {
      const response = await request(base); expect(response.status).toBe(200); await response.json(); await settled();
      const [event] = events(logs);
      expect(event.requestId).toBe(response.headers.get('x-submission-id'));
      expect(event.status).toBe(200);
      expect(event.finalizedMs).toBeGreaterThanOrEqual(event.responseMs);
      for (const phase of ['authentication', 'quotaReservation', 'evaluation', 'progressPersistence', 'aiFeedback', 'quotaRelease']) {
        expect(event.phases[phase]).toBeGreaterThanOrEqual(0);
      }
      expect(response.headers.get('server-timing')).toContain('authentication;dur=');
      expect(event.runner).toMatchObject({ snapshotHit: true, compilationMs: 10 });
      const serialized = JSON.stringify(events(logs));
      for (const secret of ['secret-a', 'PRIVATE_SOURCE', 'PRIVATE_INPUT', 'Bearer']) expect(serialized).not.toContain(secret);
      expect(events(logs)).toHaveLength(1);
    });
  });
  it('keeps authentication failures closed and never reserves compiler work', async () => {
    await fixture(async (base, logs, work) => {
      expect((await request(base, 'forged')).status).toBe(401); await settled();
      expect(work).not.toHaveBeenCalled();
      expect(events(logs)[0].phases).toHaveProperty('authentication');
      expect(events(logs)[0].phases).not.toHaveProperty('quotaReservation');
    });
  });
  it('keeps quota failures closed, records the failed reservation and preserves Retry-After', async () => {
    await fixture(async (base, logs, work) => {
      const response = await request(base); expect(response.status).toBe(429); await settled();
      expect(response.headers.get('retry-after')).toBe('60');
      expect(work).not.toHaveBeenCalled();
      expect(events(logs)[0].phases).toHaveProperty('quotaReservation');
      expect(events(logs)).toHaveLength(1);
    }, true);
  });
  it('keeps concurrent request timing contexts isolated', async () => {
    await fixture(async (base, logs) => {
      const responses = await Promise.all([request(base, 'secret-a', 10), request(base, 'secret-b', 20)]);
      await Promise.all(responses.map(response => response.json())); await settled();
      for (const [index, response] of responses.entries()) {
        const event = events(logs).find((value: any) => value.requestId === response.headers.get('x-submission-id'));
        expect(event.runner.compilationMs).toBe((index + 1) * 10);
      }
      expect(new Set(events(logs).map((event: any) => event.requestId)).size).toBe(2);
    });
  });
});
