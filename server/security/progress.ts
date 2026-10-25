import { createHash, randomUUID } from 'node:crypto';
import type { Exam, ExamAttempt, UserProgress, CodeEvaluationResult } from '../../src/types.js';
import { ALL_UNITS, getUnitLockReason, migrateUserProgress, checkExamPrerequisites } from '../../src/data/curriculum.js';
import { CURRICULUM_EXAMS } from '../../src/data/exams.js';
import { generateRandomizedExam } from '../../src/data/examQuestionPools.js';
import { HttpError, type Principal, type TrustedStore } from './store.js';

export const EXAM_DELIVERY_GRACE_MS = 10_000;
export const EXAM_SESSION_RETENTION_MS = 24 * 60 * 60_000;
const answerKey = (answers: Record<string, unknown>) => createHash('sha256')
  .update(JSON.stringify(Object.keys(answers).sort().map(key => [key, answers[key]]))).digest('hex');
function deadline(session: any): number {
  // Compatibility: derive a real exam deadline for sessions created before this change.
  const value = session.deadlineAt ?? session.createdAt + session.exam.durationMinutes * 60_000;
  if (!Number.isSafeInteger(value)) throw new HttpError(410, 'Invalid exam deadline. Start a new exam.');
  return value;
}
function checkSession(session: any, principal: Principal, time: number) {
  if (!session || session.uid !== principal.uid) throw new HttpError(403, 'Exam session does not belong to this user.');
  if (!Number.isSafeInteger(session.expiresAt) || session.expiresAt <= time) throw new HttpError(410, 'Exam session has expired.');
}
function checkFirstSubmission(session: any, time: number) {
  if (!session.submission && !session.outcome && time > deadline(session) + EXAM_DELIVERY_GRACE_MS) {
    throw new HttpError(410, 'The exam deadline has passed. Start a new attempt.');
  }
}

export function initialProgress(principal: Principal): UserProgress {
  return { userId: principal.uid, unlockedUnits: ['topic-1'], completedUnits: [], completedUnitIds: [],
    unitQuizScores: {}, quizScores: {}, examAttempts: {}, verifiedCodingPassed: [],
    currentUnitId: 'topic-1', currentWeekNumber: 1, streakDays: 1,
    lastActiveDate: new Date().toISOString().slice(0, 10), studySessionsCount: 1,
    studentName: principal.name || 'C++ Explorer', studentLevel: 'Beginner', totalCodingChallengesSolved: 0 };
}
export function createProgressService(store: TrustedStore, now = Date.now) {
  const path = (principal: Principal) => `users/${principal.uid}`;
  async function read(principal: Principal): Promise<UserProgress> {
    const root = path(principal), archive = `${root}/legacySnapshots/pre-hardening`;
    const marker = `_integrity/${createHash('sha256').update(principal.uid).digest('hex')}`;
    return store.transact([root, archive, marker], docs => {
      const existing = docs[root];
      if (docs[marker]?.version === 2 && existing) return { value: existing };
      // Only existing server-stored history is grandfathered. Never import a browser cache.
      const value = { ...initialProgress(principal), ...(existing ? migrateUserProgress(existing) : {}),
        userId: principal.uid, integrityVersion: 2, legacyBaseline: Boolean(existing), hardenedAt: now() };
      return { value, writes: { [root]: value, [marker]: { version: 2, migratedAt: now(), legacyBaseline: Boolean(existing) },
        ...(existing && !docs[archive] ? { [archive]: existing } : {}) } };
    });
  }
  async function mutate(principal: Principal, update: (progress: UserProgress) => UserProgress) {
    await read(principal);
    const root = path(principal);
    return store.transact([root], docs => {
      const value = { ...update(docs[root]), userId: principal.uid, integrityVersion: 2, lastActiveTimestamp: now() };
      return { value, writes: { [root]: value } };
    });
  }
  async function complete(principal: Principal, unitId: string) {
    if (!ALL_UNITS.some(unit => unit.id === unitId)) throw new HttpError(400, 'Unknown topic.');
    return mutate(principal, current => {
      if (getUnitLockReason(unitId, current).isLocked) throw new HttpError(403, 'Topic prerequisites are not met.');
      const completed = [...new Set([...current.completedUnitIds, unitId])];
      const index = ALL_UNITS.findIndex(unit => unit.id === unitId);
      return { ...current, completedUnitIds: completed, completedUnits: completed,
        currentWeekNumber: ALL_UNITS[Math.min(index + 1, ALL_UNITS.length - 1)].weekNumber };
    });
  }
  async function quiz(principal: Principal, quizId: string, answers: Record<string, unknown>) {
    const unit = ALL_UNITS.find(unit => unit.quiz.id === quizId);
    if (!unit || !answers || typeof answers !== 'object' || Array.isArray(answers)) throw new HttpError(400, 'Invalid quiz submission.');
    const questions = unit.quiz.questions;
    if (Object.keys(answers).some(id => !questions.some(question => question.id === id))) throw new HttpError(400, 'Unknown quiz question.');
    const score = Math.round(100 * questions.filter(question => answers[question.id] === question.correctAnswerIndex).length / questions.length);
    const passed = score >= unit.quiz.passingScorePercentage;
    const progress = await mutate(principal, current => {
      if (getUnitLockReason(unit.id, current).isLocked) throw new HttpError(403, 'Topic prerequisites are not met.');
      if (!passed) return current; // Existing policy only persists a successful quiz.
      const entry = { score, passed, attempts: (current.quizScores?.[quizId]?.attempts || 0) + 1, timestamp: now() };
      return { ...current, quizScores: { ...current.quizScores, [quizId]: entry }, unitQuizScores: { ...current.unitQuizScores, [quizId]: entry } };
    });
    return { score, passed, progress };
  }
  async function coding(principal: Principal, challengeId: string, result: CodeEvaluationResult) {
    const unit = ALL_UNITS.find(unit => unit.exercises.codingChallenge.id === challengeId);
    if (!unit || !result.compiled || !result.passed || result.configurationError || result.error) return;
    return mutate(principal, current => {
      if (getUnitLockReason(unit.id, current).isLocked) return current;
      const results = { ...current.codingChallengeResults, [challengeId]: {
        passed: result.passed, score: result.score, testsPassed: result.testsPassed, totalTests: result.totalTests,
        verified: result.verified, wasAssisted: result.wasAssisted, timestamp: now(),
      } };
      return { ...current, codingChallengeResults: results,
        verifiedCodingPassed: result.verified && result.mode === 'assessment' && !result.wasAssisted
          ? [...new Set([...(current.verifiedCodingPassed || []), challengeId])] : current.verifiedCodingPassed || [],
        totalCodingChallengesSolved: Object.values(results).filter(result => result.passed).length };
    });
  }
  async function startExam(principal: Principal, examId: string, reshuffleSessionId?: string) {
    const exam = CURRICULUM_EXAMS.find(exam => exam.id === examId);
    if (!exam) throw new HttpError(400, 'Unknown exam.');
    const current = await read(principal);
    if (!checkExamPrerequisites(exam, current).isUnlocked) throw new HttpError(403, 'Exam prerequisites are not met.');
    const sessionId = reshuffleSessionId ?? randomUUID(), sessionPath = `_assessmentSessions/${sessionId}`;
    if (!/^[a-f0-9-]{36}$/.test(sessionId)) throw new HttpError(400, 'Invalid exam session.');
    const generated = generateRandomizedExam(exam);
    const session = await store.transact([sessionPath], docs => {
      const time = now();
      let value;
      if (reshuffleSessionId) {
        const prior = docs[sessionPath];
        checkSession(prior, principal, time);
        if (prior.exam.id !== examId || prior.submission || prior.outcome) throw new HttpError(409, 'This exam session cannot be shuffled.');
        if (time >= deadline(prior)) throw new HttpError(410, 'The exam deadline has passed.');
        value = { ...prior, exam: generated, partial: {}, deadlineAt: deadline(prior) };
      } else {
        value = { uid: principal.uid, exam: generated, createdAt: time,
          deadlineAt: time + generated.durationMinutes * 60_000,
          expiresAt: time + EXAM_SESSION_RETENTION_MS,
          deleteAfter: new Date(time + EXAM_SESSION_RETENTION_MS) };
      }
      return { value, writes: { [sessionPath]: value } };
    });
    return { sessionId, exam: generated, deadlineAt: session.deadlineAt, serverNow: now() };
  }
  async function getSession(principal: Principal, sessionId: string) {
    if (typeof sessionId !== 'string' || !/^[a-f0-9-]{36}$/.test(sessionId)) throw new HttpError(400, 'Invalid exam session.');
    const session = await store.read(`_assessmentSessions/${sessionId}`);
    checkSession(session, principal, now());
    checkFirstSubmission(session, now());
    return session as { uid: string; exam: Exam; createdAt: number; deadlineAt?: number; expiresAt: number; outcome?: any;
      submission?: { answers: Record<string, unknown>; key: string; receivedAt: number; tabSwitchWarnings: number };
      partial?: Record<string, { key: string; result: any }> };
  }
  async function beginSubmission(principal: Principal, sessionId: string, answers: Record<string, unknown>, tabSwitchWarnings: number,
    expectedExam: Exam) {
    const sessionPath = `_assessmentSessions/${sessionId}`;
    const key = answerKey(answers);
    return store.transact([sessionPath], docs => {
      const session = docs[sessionPath], time = now();
      checkSession(session, principal, time);
      if (session.outcome) return { value: session };
      // A concurrent shuffle must not silently change the question set being submitted.
      if (JSON.stringify(session.exam) !== JSON.stringify(expectedExam)) throw new HttpError(409, 'The question set changed. Reload the exam.');
      checkFirstSubmission(session, time);
      if (session.submission) {
        if (session.submission.key !== key) throw new HttpError(409, 'Answers are locked after submission. Retry the original answers.');
        return { value: session };
      }
      const value = { ...session, deadlineAt: deadline(session),
        submission: { answers, key, tabSwitchWarnings, receivedAt: time } };
      return { value, writes: { [sessionPath]: value } };
    });
  }
  async function remember(principal: Principal, sessionId: string, questionId: string, key: string, result: unknown) {
    const sessionPath = `_assessmentSessions/${sessionId}`;
    await store.transact([sessionPath], docs => {
      const session = docs[sessionPath];
      checkSession(session, principal, now());
      if (!session.submission) throw new HttpError(409, 'Submit answers before grading.');
      return { value: undefined, writes: { [sessionPath]: { ...session,
        partial: { ...session.partial, [questionId]: { key, result } } } } };
    });
  }
  async function finishExam(principal: Principal, sessionId: string, attempt: ExamAttempt, grading: unknown) {
    const root = path(principal), sessionPath = `_assessmentSessions/${sessionId}`, history = `${root}/exams/${sessionId}`;
    return store.transact([root, sessionPath, history], docs => {
      const session = docs[sessionPath];
      checkSession(session, principal, now());
      if (session.outcome) return { value: session.outcome };
      if (!session.submission || session.submission.receivedAt > deadline(session) + EXAM_DELIVERY_GRACE_MS ||
        session.submission.key !== answerKey(attempt.answers || {})) throw new HttpError(409, 'No matching timely exam submission.');
      const current = docs[root];
      if (!checkExamPrerequisites(session.exam, current).isUnlocked) throw new HttpError(403, 'Exam prerequisites are not met.');
      const stored = { ...attempt, id: sessionId, timestamp: now(), completedAt: new Date(now()).toISOString(), integritySource: "server-v2" };
      const progress = { ...current, examAttempts: { ...current.examAttempts, [stored.examId]: stored }, lastActiveTimestamp: now() };
      const outcome = { grading, attempt: stored, progress };
      return { value: outcome, writes: { [root]: progress, [history]: stored, [sessionPath]: { ...session, outcome } } };
    });
  }
  return { read, mutate, complete, quiz, coding, startExam, getSession, beginSubmission, remember, finishExam,
    reset: (principal: Principal) => mutate(principal, () => initialProgress(principal)) };
}
