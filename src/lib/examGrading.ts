import type { CodeEvaluationResult, Exam, ExamQuestionDetail } from '../types';

export interface GradedExam {
  score: number;
  passed: boolean;
  codingResults: Record<string, CodeEvaluationResult>;
  codingPoints: Record<string, number>;
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

export async function gradeExam(exam: Exam, answers: Record<string, unknown>,
  evaluateCode: typeof evaluateExamCode = evaluateExamCode): Promise<GradedExam> {
  let earned = 0;
  const possible = exam.questions.reduce((sum, question) => sum + question.points, 0);
  const codingResults: GradedExam['codingResults'] = {};
  const codingPoints: GradedExam['codingPoints'] = {};
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
    } else if (typeof answer === 'string' && answer.trim().length > 10) {
      // Explanation grading is intentionally unchanged: that is the separate priority-2 work.
      if (question.rubricKeywords) {
        const matches = question.rubricKeywords.filter(word => answer.toLowerCase().includes(word.toLowerCase()));
        earned += Math.round(question.points * Math.max(0.4, Math.min(1, matches.length / question.rubricKeywords.length)));
      } else earned += Math.round(question.points * 0.7);
    }
  }
  const score = Math.round(earned / (possible || 100) * 100);
  return { score, passed: score >= (exam.passingScore || 50), codingResults, codingPoints };
}
