import type { ExamAttempt, ExamMasteryEvidence, ExamQuestionScore, UserProgress } from '../types';
import { getQuestionTopics } from '../data/examTopics';

const valid = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
/** Historical server-v2 records contain the actual shuffled questions and authoritative results.
 * Older client-era attempts are retained, but never treated as trusted question evidence. */
export function questionScoresForAttempt(attempt: ExamAttempt): ExamQuestionScore[] {
  if (attempt.integritySource !== 'server-v2') return [];
  if (attempt.questionScores) return attempt.questionScores.filter(q => valid(q.possible) && q.possible > 0 && valid(q.earned) && q.earned >= 0 && q.earned <= q.possible);
  const scores: ExamQuestionScore[] = [];
  for (const q of attempt.generatedQuestions || []) {
    if (!getQuestionTopics(q.id) || !valid(q.points) || q.points <= 0) continue;
    let earned: number | undefined;
    if ((q.type === 'mcq' || q.type === 'true-false') && attempt.answers && q.correctAnswer !== undefined) {
      earned = attempt.answers[q.id] === q.correctAnswer ? q.points : 0;
    } else if (q.type === 'coding-challenge') {
      const r = attempt.codingResults?.[q.id];
      if (r && !r.error && !r.configurationError && r.mode === 'assessment' && !r.wasAssisted &&
        valid(r.totalTests) && valid(r.testsPassed) && r.testsPassed >= 0 && r.testsPassed <= r.totalTests &&
        (!r.passed || r.verified)) {
        if (!r.compiled && r.testsPassed === 0) earned = 0;
        else if (r.totalTests > 0) earned = Math.round(q.points * r.testsPassed / r.totalTests);
      }
    } else {
      const r = attempt.explanationResults?.[q.id];
      if (r?.status === 'graded' && valid(r.score) && r.score >= 0 && r.score <= 100) earned = Math.round(q.points * r.score / 100);
    }
    if (earned !== undefined) scores.push({ questionId: q.id, earned, possible: q.points });
  }
  return scores;
}

export function addExamEvidence(evidence: ExamMasteryEvidence, attempt: ExamAttempt): ExamMasteryEvidence {
  if (attempt.integritySource !== 'server-v2') return evidence;
  const questions = { ...evidence.questions };
  const attemptId = attempt.id || `${attempt.examId}:${attempt.timestamp ?? attempt.completedAt ?? 'legacy-latest'}`;
  const timestamp = valid(attempt.timestamp) ? attempt.timestamp : Date.parse(attempt.completedAt || '') || 0;
  const seen = new Set<string>();
  for (const q of questionScoresForAttempt(attempt)) {
    const mapping = getQuestionTopics(q.questionId);
    if (!mapping || seen.has(mapping.evidenceId)) continue;
    seen.add(mapping.evidenceId);
    const prior = questions[mapping.evidenceId] || [];
    questions[mapping.evidenceId] = [...prior.filter(p => p.attemptId !== attemptId),
      { attemptId, timestamp, score: 100 * q.earned / q.possible }]
      .sort((a,b) => b.timestamp - a.timestamp || b.attemptId.localeCompare(a.attemptId)).slice(0,3);
  }
  return { version: 1, questions };
}
/** At most three observations per known question. No history-subcollection reads. */
export function examEvidenceForProgress(progress: Pick<UserProgress, 'examAttempts' | 'examMasteryEvidence'>): ExamMasteryEvidence {
  let evidence: ExamMasteryEvidence = { version: 1, questions: {} };
  if (progress.examMasteryEvidence?.version === 1) {
    for (const [id, observations] of Object.entries(progress.examMasteryEvidence.questions)) {
      if (!getQuestionTopics(id)) continue;
      evidence.questions[id] = observations.filter(o => valid(o.score) && o.score >= 0 && o.score <= 100 && valid(o.timestamp) && typeof o.attemptId === 'string')
        .sort((a,b) => b.timestamp-a.timestamp || b.attemptId.localeCompare(a.attemptId)).slice(0,3);
    }
  }
  // Bootstrap reconstructible latest attempts; de-duplication makes this safe on every read/retry.
  for (const attempt of Object.values(progress.examAttempts || {})) evidence = addExamEvidence(evidence, attempt);
  return evidence;
}
