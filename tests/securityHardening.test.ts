import { describe, expect, it, vi } from 'vitest';
import express from 'express';
import { createAccess, LEASE_MS } from '../server/security/access';
import { createProgressService } from '../server/security/progress';
import { createTrustedRoutes, validateCode } from '../server/security/routes';
import { HttpError, type TrustedStore, type Principal } from '../server/security/store';
import { ALL_UNITS } from '../src/data/curriculum';
import { canonicalExplanationId, unansweredExplanation } from '../src/lib/explanationRubric';
import { createSecureEvaluator } from '../server/security/evaluator';
import { LocalCodeRunner, IsolatedProductionRunner } from '../server/codeRunner';

class TestStore implements TrustedStore {
  documents: Record<string, any> = {};
  queue = Promise.resolve();
  async read(path: string) { return structuredClone(this.documents[path]); }
  async transact<T>(paths: string[], update: Parameters<TrustedStore['transact']>[1]): Promise<T> {
    const task = this.queue.then(() => {
      const result = update(Object.fromEntries(paths.map(path => [path, structuredClone(this.documents[path])])));
      for (const [path, value] of Object.entries(result.writes || {})) this.documents[path] = structuredClone(value);
      return result.value as T;
    });
    this.queue = task.then(() => {}, () => {});
    return task;
  }
}
const user: Principal = { uid: 'learner-a', anonymous: false };
const other: Principal = { uid: 'learner-b', anonymous: false };
const verify = async (token: string) => {
  if (token === 'valid-a') return user;
  if (token === 'valid-b') return other;
  throw new HttpError(401, 'Invalid or revoked token.');
};

async function withApp(store: TrustedStore, run: (base: string, work: ReturnType<typeof vi.fn>) => Promise<void>,
  explanation: (id: string, answer: string) => Promise<any> = async () => { throw new Error('provider down'); }) {
  const app = express(); app.use(express.json());
  const access = createAccess(store, verify), progress = createProgressService(store);
  const work = vi.fn(async () => ({ status: 200, result: { compiled: true, passed: true, score: 100,
    testsPassed: 2, totalTests: 2, testResults: [], mode: 'assessment', wasAssisted: false, verified: true } as any }));
  app.use('/api', createTrustedRoutes({ access, progress, evaluate: work, explanation }));
  app.post('/api/evaluate-code', access.authenticate, access.limited('execution', async (req, res) => {
    validateCode(req.body);
    const outcome = await work();
    await progress.coding(res.locals.principal, req.body.challengeId, outcome.result);
    res.json(outcome.result);
  }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  try { await run(`http://127.0.0.1:${(server.address() as any).port}`, work); }
  finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}
const post = (base: string, path: string, body: unknown, token = 'valid-a', extra = {}) => fetch(`${base}/api${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra }, body: JSON.stringify(body),
});

describe('Trusted progress and API security', () => {
  it('rejects application-host execution before user code can access server credentials', async () => {
    await expect(createSecureEvaluator(() => new LocalCodeRunner())({})).rejects.toMatchObject({ status: 503 });
    const original = process.env.ISOLATED_RUNNER_ENDPOINT;
    try {
      process.env.ISOLATED_RUNNER_ENDPOINT = 'http://127.0.0.1:8088';
      await expect(createSecureEvaluator(() => new IsolatedProductionRunner())({})).rejects.toMatchObject({ status: 503 });
    } finally {
      if (original === undefined) delete process.env.ISOLATED_RUNNER_ENDPOINT;
      else process.env.ISOLATED_RUNNER_ENDPOINT = original;
    }
  });
  it('rejects absent, forged, expired/revoked credentials before any compiler work', async () => {
    await withApp(new TestStore(), async (base, work) => {
      for (const token of ['', 'forged', 'expired', 'revoked']) {
        expect((await post(base, '/evaluate-code', { challengeId: 'cc-t1', studentCode: 'int main(){}' }, token)).status).toBe(401);
      }
      expect(work).not.toHaveBeenCalled();
    });
  });
  it('rejects forged verified progress, score fields and out-of-order progression', async () => {
    const store = new TestStore();
    await withApp(store, async (base) => {
      expect((await post(base, '/progress/profile', { verifiedCodingPassed: ['cc-t39'], completedUnitIds: ['topic-39'], examAttempts: { 'exam-final': { score: 100, passed: true } } })).status).toBe(400);
      expect((await post(base, '/progress/quiz', { quizId: 'quiz-t1', answers: {}, score: 100, passed: true })).status).toBe(400);
      expect((await post(base, '/progress/complete', { unitId: 'topic-19' })).status).toBe(403);
      const result = await post(base, '/progress/quiz', { quizId: 'quiz-t1', answers: {} });
      expect((await result.json()).score).toBe(0);
      expect(store.documents['users/learner-a'].verifiedCodingPassed).toEqual([]);
      expect(store.documents['users/learner-a'].completedUnitIds).toEqual([]);
    });
  });
  it('writes compiler evidence only to the authenticated owner, not a supplied UID', async () => {
    const store = new TestStore();
    await withApp(store, async (base) => {
      const result = await post(base, '/evaluate-code', { challengeId: 'cc-t1', studentCode: 'valid answer', mode: 'assessment', uid: 'learner-b' });
      expect(result.status).toBe(200);
      expect(store.documents['users/learner-a'].verifiedCodingPassed).toEqual(['cc-t1']);
      expect(store.documents['users/learner-b']).toBeUndefined();
    });
  });
  it('computes quiz points and preserves the existing explicit lesson-completion policy', async () => {
    const store = new TestStore(), service = createProgressService(store);
    const unit = ALL_UNITS[0];
    const answers = Object.fromEntries(unit.quiz.questions.map(question => [question.id, question.correctAnswerIndex]));
    expect((await service.quiz(user, unit.quiz.id, answers)).score).toBe(100);
    expect((await service.complete(user, unit.id)).completedUnitIds).toEqual([unit.id]);
  });
  it('preserves cloud legacy history once, without treating a client cache as migration input', async () => {
    const store = new TestStore(), service = createProgressService(store);
    const legacy = { userId: user.uid, completedUnits: ['week-1'], unlockedUnits: ['week-1'], currentUnitId: 'week-1',
      quizScores: {}, examAttempts: { 'exam-final': { score: 80, passed: true, timestamp: 1 } }, verifiedCodingPassed: ['cc-t1'], integrityVersion: 2 };
    store.documents[`users/${user.uid}`] = structuredClone(legacy);
    const migrated: any = await service.read(user);
    expect(migrated.completedUnitIds).toEqual(['topic-1']);
    expect(migrated.examAttempts).toEqual(legacy.examAttempts);
    expect(migrated.legacyBaseline).toBe(true);
    expect(store.documents[`users/${user.uid}/legacySnapshots/pre-hardening`]).toEqual(legacy);
    await service.read(user);
    expect(store.documents[`users/${user.uid}/legacySnapshots/pre-hardening`]).toEqual(legacy);
    expect((await service.read(other)).completedUnitIds).toEqual([]);
  });
  it('cannot use another user’s exam session or forge an exam grade/question set', async () => {
    const store = new TestStore(), service = createProgressService(store);
    await service.read(user);
    await service.mutate(user, current => ({ ...current, completedUnitIds: ALL_UNITS.slice(0, 18).map(unit => unit.id) }));
    const { sessionId } = await service.startExam(user, 'exam-foundations');
    await expect(service.getSession(other, sessionId)).rejects.toMatchObject({ status: 403 });
    await withApp(store, async base => {
      expect((await post(base, '/assessment/exam/submit', { sessionId, answers: {}, score: 100, generatedQuestions: [] })).status).toBe(400);
      expect(store.documents[`users/${user.uid}`].examAttempts).toEqual({});
    });
  });
  it('fails closed when the distributed quota store is unavailable', async () => {
    const store: TrustedStore = { read: async () => undefined, transact: async () => { throw new Error('offline'); } };
    await withApp(store, async (base, work) => {
      expect((await post(base, '/evaluate-code', { challengeId: 'cc-t1', studentCode: 'valid' })).status).toBe(503);
      expect(work).not.toHaveBeenCalled();
    });
  });
  it('grades the trusted question set and idempotently saves a completed exam with the unchanged 50-point pass policy', async () => {
    const store = new TestStore(), service = createProgressService(store);
    await service.read(user);
    await service.mutate(user, current => ({ ...current, completedUnitIds: ALL_UNITS.slice(0, 18).map(unit => unit.id) }));
    const session = await service.startExam(user, 'exam-foundations');
    const answers = Object.fromEntries(session.exam.questions.filter(question => ['mcq', 'true-false'].includes(question.type))
      .map(question => [question.id, question.correctAnswer]));
    await withApp(store, async (base, work) => {
      const first = await post(base, '/assessment/exam/submit', { sessionId: session.sessionId, answers });
      expect(first.status).toBe(200);
      const outcome = await first.json();
      expect(outcome.grading.score).toBe(50);
      expect(outcome.grading.passed).toBe(true);
      expect(outcome.progress.examAttempts['exam-foundations'].score).toBe(50);
      const replay = await post(base, '/assessment/exam/submit', { sessionId: session.sessionId, answers: {} });
      expect(replay.status).toBe(200);
      expect((await replay.json()).attempt.id).toBe(outcome.attempt.id);
      expect(Object.keys(store.documents).filter(key => key.startsWith('users/learner-a/exams/'))).toHaveLength(1);
      expect(work).not.toHaveBeenCalled(); // Blank coding answers retain the existing zero-point policy.
    });
  });
  it('cannot bypass per-user quotas using changed IP headers, a replica, or fake UID', async () => {
    const store = new TestStore();
    await withApp(store, async (first, work) => {
      await withApp(store, async second => {
        for (let index = 0; index < 6; index++) {
          expect((await post(index % 2 ? first : second, '/evaluate-code', { challengeId: 'cc-t1', studentCode: 'valid', uid: `spoof-${index}` }, 'valid-a', { 'X-Forwarded-For': `1.2.3.${index}` })).status).toBe(200);
        }
        const denied = await post(second, '/evaluate-code', { challengeId: 'cc-t1', studentCode: 'valid' }, 'valid-a', { 'X-Forwarded-For': '9.9.9.9' });
        expect(denied.status).toBe(429);
        expect(denied.headers.get('retry-after')).toBe('60');
        expect(work).toHaveBeenCalledTimes(3);
      });
    });
  });
  it('retains server-validated partial grading on outage, then retries without awarding an incomplete attempt', async () => {
    const store = new TestStore(), service = createProgressService(store);
    await service.read(user);
    await service.mutate(user, current => ({ ...current, completedUnitIds: ALL_UNITS.slice(0, 18).map(unit => unit.id) }));
    const session = await service.startExam(user, 'exam-foundations');
    const answers = Object.fromEntries(session.exam.questions.filter(question => question.type !== 'coding-challenge')
      .map(question => [question.id, ['mcq', 'true-false'].includes(question.type) ? question.correctAnswer : 'Clear explanation supplied.']));
    let calls = 0;
    const judge = async (id: string, answer: string) => {
      if (++calls === 2) throw new Error('temporary provider outage');
      const result = unansweredExplanation(canonicalExplanationId(id));
      return { ...result, evaluatedBy: 'ai-rubric', model: 'test', score: 100,
        criteria: result.criteria.map(criterion => ({ ...criterion, level: 2, evidence: answer, feedback: 'Correct explanation.' })) };
    };
    await withApp(store, async base => {
      const request = { sessionId: session.sessionId, answers };
      expect((await post(base, '/assessment/exam/submit', request)).status).toBe(503);
      expect(store.documents['users/learner-a'].examAttempts).toEqual({});
      expect(Object.keys(store.documents[`_assessmentSessions/${session.sessionId}`].partial)).toHaveLength(1);
      const retry = await post(base, '/assessment/exam/submit', request);
      expect(retry.status).toBe(200);
      expect((await retry.json()).grading.score).toBe(80);
      expect(calls).toBe(3);
    }, judge);
  });
  it('shares global/user concurrency leases across instances and expires abandoned leases safely', async () => {
    let now = 0;
    const store = new TestStore();
    const first = createAccess(store, verify, () => now), second = createAccess(store, verify, () => now);
    const release = await first.reserve(user, 'execution');
    await expect(second.reserve(user, 'execution')).rejects.toMatchObject({ status: 429 });
    const releaseOther = await second.reserve(other, 'execution');
    await expect(first.reserve({ uid: 'third', anonymous: false }, 'execution')).rejects.toMatchObject({ status: 429 });
    await releaseOther(); await release();
    await first.reserve(user, 'execution');
    now += LEASE_MS + 1;
    const afterExpiry = await second.reserve(user, 'execution');
    await afterExpiry();
  });
  it('enforces anonymous daily and global daily budgets across time windows', async () => {
    let now = 0;
    const store = new TestStore(), access = createAccess(store, verify, () => now);
    const guest = { uid: 'anonymous', anonymous: true };
    for (let index = 0; index < 10; index++) { await (await access.reserve(guest, 'execution'))(); now += 60_000; }
    await expect(access.reserve(guest, 'execution')).rejects.toMatchObject({ status: 429 });
    for (let index = 10; index < 200; index++) {
      await (await access.reserve({ uid: `user-${index}`, anonymous: false }, 'execution'))(); now += 60_000;
    }
    await expect(access.reserve({ uid: 'new-identity', anonymous: false }, 'execution')).rejects.toMatchObject({ status: 429 });
  });
});
