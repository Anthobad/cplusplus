import type { CodeEvaluationResult, Exam, ExamQuestionDetail } from '../types';
import { canonicalExplanationId, EXPLANATION_CRITERIA, EXPLANATION_RUBRIC_VERSION,
  explanationPercentage, unansweredExplanation, type ExplanationAssessment } from './explanationRubric';

export interface GradedExam {
  score: number;
  passed: boolean;
  codingResults: Record<string, CodeEvaluationResult>;
  codingPoints: Record<string, number>;
  explanationResults: Record<string, ExplanationAssessment>;
  explanationPoints: Record<string, number>;
}

export async function evaluateExamCode(question: ExamQuestionDetail, answer: string,
  request: typeof fetch = fetch): Promise<CodeEvaluationResult> {
  if (!question.codingChallengeId) throw new Error('This exam coding question is not configured. Your answers have been retained.');
  if (!answer.trim()) return {
    compiled: false, passed: false, score: 0, testsPassed: 0, totalTests: 0, testResults: [],
    mode: 'assessment', wasAssisted: false, verified: false, compileError: 'No code submitted. Zero coding points awarded.',
  };
  let response: Response;
  try {
    response = await request('/api/evaluate-code', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: question.codingChallengeId, studentCode: answer,
        mode: 'assessment', wasAssisted: false, requestAiFeedback: false }),
      signal: AbortSignal.timeout(240_000),
    });
  } catch {
    throw new Error('The code evaluator could not be reached. Your answers have been retained; retry submission.');
  }
  if (!response.ok) throw new Error('Code evaluation is temporarily unavailable. Your exam was not finalized; retry submission.');
  let result: CodeEvaluationResult;
  try { result = await response.json(); }
  catch { throw new Error('The code evaluator returned an invalid response. Your exam was not finalized.'); }
  if (!result || result.configurationError || result.error) {
    throw new Error('This coding answer could not be evaluated. Your answers have been retained; retry submission.');
  }
  // Service failures or malformed counters must not become zero-point finalized attempts.
  if (typeof result.compiled !== 'boolean' || typeof result.passed !== 'boolean' ||
    result.mode !== 'assessment' || result.wasAssisted !== false || (result.passed && result.verified !== true) ||
    !Number.isInteger(result.totalTests) || result.totalTests <= 0 ||
    !Number.isInteger(result.testsPassed) || result.testsPassed < 0 || result.testsPassed > result.totalTests ||
    !Array.isArray(result.testResults) || (result.passed && (!result.compiled || result.testsPassed !== result.totalTests)) ||
    (!result.compiled && result.testsPassed !== 0)) {
    throw new Error('The code evaluator returned an incomplete result. Your exam was not finalized.');
  }
  return result;
}

export async function evaluateExamExplanation(question: ExamQuestionDetail, answer: string,
  request: typeof fetch = fetch): Promise<ExplanationAssessment> {
  if (!answer.trim()) return unansweredExplanation(question.id);
  let response: Response;
  try {
    response = await request('/api/assess-explanation', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: question.id, studentAnswer: answer }), signal: AbortSignal.timeout(75_000) });
  } catch { throw new Error('Explanation evaluation could not be reached. Your answers have been retained; retry submission.'); }
  if (!response.ok) {
    if (response.status === 422) throw new Error('The grader could not assess an explanation confidently. Answers retained; retry or review your explanation.');
    throw new Error('Explanation evaluation is unavailable. Your exam was not finalized; answers have been retained.');
  }
  let result: ExplanationAssessment;
  try { result = await response.json(); }
  catch { throw new Error('The explanation grader returned an invalid response. Your exam was not finalized.'); }
  const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
  if (!result || result.status !== 'graded' || result.questionId !== canonicalExplanationId(question.id) ||
    result.rubricVersion !== EXPLANATION_RUBRIC_VERSION || result.evaluatedBy !== 'ai-rubric' ||
    typeof result.model !== 'string' || !result.model || typeof result.feedback !== 'string' ||
    !result.fundamentalError || typeof result.fundamentalError.present !== 'boolean' ||
    typeof result.fundamentalError.feedback !== 'string' || typeof result.fundamentalError.evidence !== 'string' ||
    (result.fundamentalError.present && (!result.fundamentalError.evidence.trim() || !normalize(answer).includes(normalize(result.fundamentalError.evidence)))) ||
    !Array.isArray(result.criteria) || result.criteria.length !== 3 || EXPLANATION_CRITERIA.some(expected => {
      const matching = result.criteria.filter(criterion => criterion?.id === expected.id);
      const criterion = matching[0];
      return matching.length !== 1 || ![0, 1, 2].includes(criterion.level) ||
        typeof criterion.feedback !== 'string' || typeof criterion.evidence !== 'string' ||
        (criterion.level > 0 && (!criterion.evidence.trim() || !normalize(answer).includes(normalize(criterion.evidence))));
    })) throw new Error('The explanation grader returned an incomplete result. Your exam was not finalized.');
  if (result.score !== explanationPercentage(result.criteria, result.fundamentalError.present)) {
    throw new Error('The explanation score could not be validated. Your exam was not finalized.');
  }
  return result;
}

export async function gradeExam(exam: Exam, answers: Record<string, unknown>,
  evaluateCode: typeof evaluateExamCode = evaluateExamCode,
  evaluateExplanation: typeof evaluateExamExplanation = evaluateExamExplanation): Promise<GradedExam> {
  let earned = 0;
  const possible = exam.questions.reduce((sum, question) => sum + question.points, 0);
  const codingResults: GradedExam['codingResults'] = {};
  const codingPoints: GradedExam['codingPoints'] = {};
  const explanationResults: GradedExam['explanationResults'] = {};
  const explanationPoints: GradedExam['explanationPoints'] = {};
  for (const question of exam.questions) {
    const answer = answers[question.id];
    if (question.type === 'coding-challenge') {
      const result = await evaluateCode(question, typeof answer === 'string' ? answer : '');
      codingResults[question.id] = result;
      const points = result.compiled && result.totalTests > 0
        ? Math.round(question.points * result.testsPassed / result.totalTests) : 0;
      codingPoints[question.id] = points;
      earned += points;
    } else if (question.type === 'mcq' || question.type === 'true-false') {
      if (answer === question.correctAnswer) earned += question.points;
    } else {
      const result = await evaluateExplanation(question, typeof answer === 'string' ? answer : '');
      explanationResults[question.id] = result;
      const points = Math.round(question.points * result.score / 100);
      explanationPoints[question.id] = points;
      earned += points;
    }
  }
  const score = Math.round(earned / (possible || 100) * 100);
  return { score, passed: score >= (exam.passingScore || 50), codingResults, codingPoints, explanationResults, explanationPoints };
}
