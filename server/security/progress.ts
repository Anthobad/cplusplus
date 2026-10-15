import { createHash, randomUUID } from 'node:crypto';
import type { Exam, ExamAttempt, UserProgress, CodeEvaluationResult } from '../../src/types.js';
import { ALL_UNITS, getUnitLockReason, migrateUserProgress, checkExamPrerequisites } from '../../src/data/curriculum.js';
import { CURRICULUM_EXAMS } from '../../src/data/exams.js';
import { generateRandomizedExam } from '../../src/data/examQuestionPools.js';
import { HttpError, type Principal, type TrustedStore } from './store.js';

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
  async function startExam(principal: Principal, examId: string) {
    const exam = CURRICULUM_EXAMS.find(exam => exam.id === examId);
    if (!exam) throw new HttpError(400, 'Unknown exam.');
    const current = await read(principal);
    if (!checkExamPrerequisites(exam, current).isUnlocked) throw new HttpError(403, 'Exam prerequisites are not met.');
    const sessionId = randomUUID(), sessionPath = `_assessmentSessions/${sessionId}`;
    const generated = generateRandomizedExam(exam);
    await store.transact([sessionPath], () => ({ value: undefined, writes: { [sessionPath]: {
      uid: principal.uid, exam: generated, createdAt: now(), expiresAt: now() + 24 * 60 * 60_000,
    } } }));
    return { sessionId, exam: generated };
  }
  async function getSession(principal: Principal, sessionId: string) {
    if (typeof sessionId !== 'string' || !/^[a-f0-9-]{36}$/.test(sessionId)) throw new HttpError(400, 'Invalid exam session.');
    const session = await store.read(`_assessmentSessions/${sessionId}`);
    if (!session || session.uid !== principal.uid) throw new HttpError(403, 'Exam session does not belong to this user.');
    if (session.expiresAt < now()) throw new HttpError(410, 'Exam session has expired.');
    return session as { uid: string; exam: Exam; expiresAt: number; outcome?: any; partial?: Record<string, { key: string; result: any }> };
  }
  async function remember(principal: Principal, sessionId: string, questionId: string, key: string, result: unknown) {
    const sessionPath = `_assessmentSessions/${sessionId}`;
    await store.transact([sessionPath], docs => {
      const session = docs[sessionPath];
      if (!session || session.uid !== principal.uid || session.expiresAt < now()) throw new HttpError(403, 'Invalid exam session.');
      return { value: undefined, writes: { [sessionPath]: { ...session,
        partial: { ...session.partial, [questionId]: { key, result } } } } };
    });
  }
  async function finishExam(principal: Principal, sessionId: string, attempt: ExamAttempt, grading: unknown) {
    const root = path(principal), sessionPath = `_assessmentSessions/${sessionId}`, history = `${root}/exams/${sessionId}`;
    return store.transact([root, sessionPath, history], docs => {
      const session = docs[sessionPath];
      if (!session || session.uid !== principal.uid || session.expiresAt < now()) throw new HttpError(403, 'Invalid exam session.');
      if (session.outcome) return { value: session.outcome };
      const current = docs[root];
      if (!checkExamPrerequisites(session.exam, current).isUnlocked) throw new HttpError(403, 'Exam prerequisites are not met.');
      const stored = { ...attempt, id: sessionId, timestamp: now(), completedAt: new Date(now()).toISOString(), integritySource: "server-v2" };
      const progress = { ...current, examAttempts: { ...current.examAttempts, [stored.examId]: stored }, lastActiveTimestamp: now() };
      const outcome = { grading, attempt: stored, progress };
      return { value: outcome, writes: { [root]: progress, [history]: stored, [sessionPath]: { ...session, outcome } } };
    });
  }
  return { read, mutate, complete, quiz, coding, startExam, getSession, remember, finishExam,
    reset: (principal: Principal) => mutate(principal, () => initialProgress(principal)) };
}
