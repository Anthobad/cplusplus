import { createHash, randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { HttpError, type Principal, type TrustedStore } from './store.js';
import { deferSubmissionLog, measureSubmissionPhase } from '../submissionPerformance.js';

export const QUOTA = {
  execution: { minute: 6, daily: 50, anonymousMinute: 3, anonymousDaily: 10, globalMinute: 20, globalDaily: 200, globalConcurrent: 2, userConcurrent: 1 },
  action: { minute: 60, daily: 500, anonymousMinute: 30, anonymousDaily: 200, globalMinute: 300, globalDaily: 5000, globalConcurrent: 20, userConcurrent: 4 },
} as const;
export const LEASE_MS = 10 * 60_000;

export function createAccess(store: TrustedStore, verify: (token: string) => Promise<Principal>, now = Date.now) {
  const authenticate: RequestHandler = async (req, res, next) => {
    const header = req.headers.authorization;
    if (typeof header !== 'string' || !/^Bearer [^\s]{1,8192}$/.test(header)) {
      res.status(401).json({ error: 'A Firebase ID token is required.' }); return;
    }
    try { res.locals.principal = await measureSubmissionPhase('authentication', () => verify(header.slice(7))); next(); }
    catch (error) { res.status(error instanceof HttpError ? error.status : 503).json({ error: 'Authentication failed or is unavailable.' }); }
  };

  async function reserve(principal: Principal, kind: keyof typeof QUOTA, cost = 1) {
    const policy = QUOTA[kind];
    const key = createHash('sha256').update(principal.uid).digest('hex');
    const globalPath = `_security/global-${kind}`, userPath = `_securityUsers/${kind}-${key}`;
    const leaseId = randomUUID();
    await store.transact([globalPath, userPath], documents => {
      const timestamp = now(), minute = Math.floor(timestamp / 60_000), day = Math.floor(timestamp / 86_400_000);
      const global = documents[globalPath] || {}, user = documents[userPath] || {};
      const leases = Object.fromEntries(Object.entries(global.leases || {}).filter(([, entry]: [string, any]) => entry.expires > timestamp));
      const globalMinute = global.minute === minute ? global.minuteCount : 0;
      const userMinute = user.minute === minute ? user.minuteCount : 0;
      const globalDay = global.day === day ? global.dayCount : 0;
      const userDay = user.day === day ? user.dayCount : 0;
      if (globalMinute + cost > policy.globalMinute || globalDay + cost > policy.globalDaily ||
        userMinute + cost > (principal.anonymous ? policy.anonymousMinute : policy.minute) ||
        userDay + cost > (principal.anonymous ? policy.anonymousDaily : policy.daily) ||
        Object.keys(leases).length >= policy.globalConcurrent ||
        Object.values(leases).filter((entry: any) => entry.uid === principal.uid).length >= policy.userConcurrent) {
        throw new HttpError(429, 'Submission quota or concurrency limit reached. Retry later.');
      }
      leases[leaseId] = { uid: principal.uid, expires: timestamp + LEASE_MS };
      return { value: undefined, writes: {
        [globalPath]: { minute, minuteCount: globalMinute + cost, day, dayCount: globalDay + cost, leases },
        [userPath]: { minute, minuteCount: userMinute + cost, day, dayCount: userDay + cost },
      } };
    });
    return async () => {
      await store.transact([globalPath], documents => {
        const global = documents[globalPath];
        if (!global?.leases?.[leaseId]) return { value: undefined };
        delete global.leases[leaseId];
        return { value: undefined, writes: { [globalPath]: global } };
      });
    };
  }

  const limited = (kind: keyof typeof QUOTA, handler: RequestHandler, cost = 1): RequestHandler => async (req, res, next) => {
    let release: (() => Promise<void>) | undefined;
    const finalizeTiming = deferSubmissionLog();
    try {
      release = await measureSubmissionPhase('quotaReservation', () => reserve(res.locals.principal, kind, cost));
      await handler(req, res, next);
    } catch (error) {
      if (!res.headersSent) {
        const status = error instanceof HttpError ? error.status : 503;
        if (status === 429) res.setHeader('Retry-After', '60');
        res.status(status).json({ error: error instanceof HttpError ? error.message : 'Trusted assessment storage is unavailable. No completion was awarded.' });
      }
    } finally {
      if (release) try { await measureSubmissionPhase('quotaRelease', release); } catch { /* Safe: lease stays occupied until expiry. */ }
      finalizeTiming();
    }
  };
  return { authenticate, reserve, limited };
}
