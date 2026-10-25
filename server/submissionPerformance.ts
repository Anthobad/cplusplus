import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { RequestHandler, Response } from 'express';

type Timing = { requestId: string; firstRequestInProcess: boolean; started: number;
  phases: Record<string, number>; runner?: unknown; responseMs?: number;
  deferred: boolean; finished: boolean; logged: boolean; status?: number };
const current = new AsyncLocalStorage<Timing>();
let firstRequest = true;

function log(timing: Timing) {
  if (timing.logged || !timing.finished || timing.deferred) return;
  timing.logged = true;
  console.info(JSON.stringify({ event: 'cpp_submission_timing', requestId: timing.requestId,
    firstRequestInProcess: timing.firstRequestInProcess, status: timing.status,
    responseMs: timing.responseMs, finalizedMs: performance.now() - timing.started,
    phases: timing.phases, runner: timing.runner }));
}
export const submissionPerformance: RequestHandler = (_req, res, next) => {
  const timing: Timing = { requestId: randomUUID(), firstRequestInProcess: firstRequest, started: performance.now(),
    phases: {}, deferred: false, finished: false, logged: false };
  firstRequest = false;
  res.setHeader('X-Submission-Id', timing.requestId);
  const finished = () => {
    if (timing.finished) return;
    timing.finished = true; timing.status = res.statusCode;
    timing.responseMs = performance.now() - timing.started; log(timing);
  };
  res.once('finish', finished); res.once('close', finished);
  current.run(timing, next);
};
export async function measureSubmissionPhase<T>(name: string, operation: () => Promise<T>): Promise<T> {
  const timing = current.getStore();
  if (!timing) return operation();
  const start = performance.now();
  try { return await operation(); }
  finally { timing.phases[name] = (timing.phases[name] || 0) + performance.now() - start; }
}
export function deferSubmissionLog() {
  const timing = current.getStore();
  if (timing) timing.deferred = true;
  return () => { if (timing) { timing.deferred = false; log(timing); } };
}
export function recordRunnerTiming(value: unknown) {
  const timing = current.getStore();
  if (timing) timing.runner = value;
  return timing?.requestId;
}
export function submissionTimingHeaders(res: Response) {
  const timing = current.getStore();
  if (timing && !res.headersSent) res.setHeader('Server-Timing', Object.entries(timing.phases)
    .map(([name, value]) => `${name};dur=${value.toFixed(1)}`).join(', '));
}
