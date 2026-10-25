import { Router } from 'express';
import { createHash } from 'node:crypto';
import { getTrustedChallenge } from '../challengeRegistry.js';
import { EXPLANATION_RUBRIC_VERSION } from '../../src/lib/explanationRubric.js';
import { gradeExam, evaluateExamCode, evaluateExamExplanation } from '../../src/lib/examGrading.js';
import type { CodeEvaluationResult } from '../../src/types.js';
import type { createAccess } from './access.js';
import type { createProgressService } from './progress.js';
import { HttpError } from './store.js';

export function only(body: any, keys: string[]) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !keys.includes(key))) {
    throw new HttpError(400, 'Unexpected submission fields. Scores and completion flags are server-controlled.');
  }
}
export function validateCode(body: any) {
  const code = body?.studentCode || body?.code;
  if (typeof code !== 'string' || code.length > 32_000 || !code.trim() ||
    typeof body.challengeId !== 'string' || body.challengeId.length > 160 ||
    !['practice', 'assessment'].includes(body.mode || 'practice')) throw new HttpError(400, 'Invalid C++ submission (maximum 32,000 characters).');
}

export function createTrustedRoutes(options: {
  access: ReturnType<typeof createAccess>;
  progress: ReturnType<typeof createProgressService>;
  evaluate: (payload: any) => Promise<{ status: number; result: CodeEvaluationResult }>;
  explanation: (questionId: string, answer: string) => Promise<unknown>;
}) {
  const { access, progress, evaluate, explanation } = options;
  const router = Router();
  router.get('/progress', access.authenticate, access.limited('action', async (_req, res) => { res.json(await progress.read(res.locals.principal)); }));
  router.post('/progress/profile', access.authenticate, access.limited('action', async (req, res) => {
    only(req.body, ['studentName', 'studentLevel']);
    if ((req.body.studentName !== undefined && (typeof req.body.studentName !== 'string' || req.body.studentName.length > 100)) ||
      (req.body.studentLevel !== undefined && !['Beginner', 'Intermediate', 'Advanced', 'Interview Ready'].includes(req.body.studentLevel))) {
      throw new HttpError(400, 'Invalid profile fields.');
    }
    res.json(await progress.mutate(res.locals.principal, current => ({ ...current, ...req.body })));
  }));
  router.post('/progress/complete', access.authenticate, access.limited('action', async (req, res) => {
    only(req.body, ['unitId']); res.json(await progress.complete(res.locals.principal, req.body.unitId));
  }));
  router.post('/progress/quiz', access.authenticate, access.limited('action', async (req, res) => {
    only(req.body, ['quizId', 'answers']); res.json(await progress.quiz(res.locals.principal, req.body.quizId, req.body.answers));
  }));
  router.post('/progress/reset', access.authenticate, access.limited('action', async (req, res) => {
    only(req.body, []); res.json(await progress.reset(res.locals.principal));
  }));
  router.post('/assessment/exam/start', access.authenticate, access.limited('action', async (req, res) => {
    only(req.body, ['examId', 'sessionId']);
    if (req.body.sessionId !== undefined && typeof req.body.sessionId !== 'string') throw new HttpError(400, 'Invalid exam session.');
    res.json(await progress.startExam(res.locals.principal, req.body.examId, req.body.sessionId));
  }));
  router.post('/assessment/exam/submit', access.authenticate, access.limited('execution', async (req, res) => {
    only(req.body, ['sessionId', 'answers', 'tabSwitchWarnings']);
    let session = await progress.getSession(res.locals.principal, req.body.sessionId);
    if (session.outcome) { res.json(session.outcome); return; }
    let answers = req.body.answers;
    if (!answers || typeof answers !== 'object' || Array.isArray(answers) || Object.keys(answers).some(id => !session.exam.questions.some(q => q.id === id)) ||
      Object.values(answers).some(answer => !['string', 'number', 'boolean'].includes(typeof answer) || (typeof answer === 'string' && answer.length > 32_000))) {
      throw new HttpError(400, 'Invalid exam answers.');
    }
    session = await progress.beginSubmission(res.locals.principal, req.body.sessionId, answers,
      Number.isSafeInteger(req.body.tabSwitchWarnings) && req.body.tabSwitchWarnings >= 0 ? Math.min(10000, req.body.tabSwitchWarnings) : 0,
      session.exam);
    if (session.outcome) { res.json(session.outcome); return; }
    answers = session.submission!.answers;
    const reuse = async (question: any, answer: string, run: () => Promise<any>) => {
      const key = createHash('sha256').update(JSON.stringify([question, answer,
        question.codingChallengeId ? getTrustedChallenge(question.codingChallengeId) : EXPLANATION_RUBRIC_VERSION,
        process.env.EXAM_GRADING_MODEL || 'gemini-3.8-flash'])).digest('hex');
      const prior = session.partial?.[question.id];
      if (prior?.key === key) return prior.result;
      const result = await run();
      await progress.remember(res.locals.principal, req.body.sessionId, question.id, key, result);
      return result;
    };
    const grading = await gradeExam(session.exam, answers,
      (question, answer) => reuse(question, answer, () => evaluateExamCode(question, answer, async () => {
        const outcome = await evaluate({ challengeId: question.codingChallengeId, studentCode: answer, mode: 'assessment', wasAssisted: false, requestAiFeedback: false });
        return new Response(JSON.stringify(outcome.result), { status: outcome.status });
      })),
      (question, answer) => reuse(question, answer, () => evaluateExamExplanation(question, answer, async () =>
        new Response(JSON.stringify(await explanation(question.id, answer))))));
    const outcome = await progress.finishExam(res.locals.principal, req.body.sessionId, {
      examId: session.exam.id, examTitle: session.exam.title, score: grading.score, passed: grading.passed,
      answers, generatedQuestions: session.exam.questions, codingResults: grading.codingResults,
      explanationResults: grading.explanationResults,
      tabSwitchWarnings: session.submission!.tabSwitchWarnings,
    }, grading);
    res.json(outcome);
  }, 3));
  return router;
}
