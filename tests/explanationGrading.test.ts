import { describe, it, expect, vi } from 'vitest';
import { evaluateExamExplanation, gradeExam } from '../src/lib/examGrading';
import { EXPLANATION_CRITERIA, EXPLANATION_RUBRIC_VERSION, explanationPercentage,
  type ExplanationAssessment } from '../src/lib/explanationRubric';
import type { Exam, ExamQuestionDetail } from '../src/types';

const question: ExamQuestionDetail = { id: 'ef-wtw-1_s0', type: 'why-this-code-works',
  question: 'Why does bookkeeping survive?', points: 15, explanation: '', rubricKeywords: ['weak', 'object'] };
const answer = 'Weak observers retain bookkeeping after the last owner destroys the object.';
function result(levels = [2, 2, 2]): ExplanationAssessment {
  const criteria = EXPLANATION_CRITERIA.map((c, i) => ({ id: c.id, level: levels[i] as 0 | 1 | 2,
    evidence: levels[i] ? answer : '', feedback: levels[i] ? 'The meaning is supported.' : 'This criterion is missing.' }));
  return { status: 'graded', questionId: 'ef-wtw-1', rubricVersion: EXPLANATION_RUBRIC_VERSION,
    evaluatedBy: 'ai-rubric', model: 'test', criteria, fundamentalError: { present: false, evidence: '', feedback: '' },
    score: explanationPercentage(criteria, false), feedback: 'A criterion-based assessment.' };
}
const exam: Exam = { id: 'exam-test', title: '', description: '', durationMinutes: 1, passingScore: 50,
  allowCppReference: true, coversPhases: [1], questions: [question,
    { id: 'objective', type: 'mcq', points: 15, question: '', explanation: '', correctAnswer: 0, options: ['A', 'B'] }] };

describe('Explanation API integration in exam scoring', () => {
  it('sends only question ID and answer, then validates the criterion-derived percentage', async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify(result())));
    expect((await evaluateExamExplanation(question, answer, request)).score).toBe(100);
    expect(request.mock.calls[0][0]).toBe('/api/assess-explanation');
    expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({ questionId: question.id, studentAnswer: answer });
  });

  it('scales semantic credit into unchanged question points and total threshold', async () => {
    const assess = vi.fn().mockResolvedValue(result([2, 0, 0]));
    const graded = await gradeExam(exam, { [question.id]: answer, objective: 0 }, undefined, assess);
    expect(graded.explanationPoints[question.id]).toBe(8); // round(15 * 50%)
    expect(graded.score).toBe(77); expect(graded.passed).toBe(true);
    expect(graded.explanationResults[question.id].score).toBe(50);
  });

  it('does not restore keyword credit or a length floor when the semantic grade is zero', async () => {
    const keywords = 'weak object control block allocation expiration';
    const assess = vi.fn().mockResolvedValue(result([0, 0, 0]));
    const graded = await gradeExam(exam, { [question.id]: keywords }, undefined, assess);
    expect(graded.score).toBe(0); expect(graded.explanationPoints[question.id]).toBe(0);
  });

  it('treats blank answers as unanswered zero without a provider request', async () => {
    const request = vi.fn(); const value = await evaluateExamExplanation(question, ' ', request);
    expect(value.score).toBe(0); expect(value.evaluatedBy).toBe('unanswered'); expect(request).not.toHaveBeenCalled();
  });

  it.each([422, 429, 503])('does not return a finalized score on HTTP %s', async status => {
    const request = vi.fn().mockResolvedValue(new Response('{}', { status }));
    await expect(gradeExam(exam, { [question.id]: answer }, undefined,
      (q, text) => evaluateExamExplanation(q, text, request))).rejects.toThrow(/retained/);
  });

  it('rejects wrong identity/version, unsupported evidence, missing criteria and altered totals', async () => {
    for (const value of [null, { ...result(), questionId: 'another-question' }, { ...result(), rubricVersion: 'unknown-version' },
      { ...result(), score: 55 }, { ...result(), criteria: [] },
      { ...result(), criteria: result().criteria.map(c => ({ ...c, evidence: 'invented evidence' })) },
      { ...result(), fundamentalError: { present: true, evidence: 'invented contradiction', feedback: 'Wrong' } }]) {
      await expect(evaluateExamExplanation(question, answer, vi.fn().mockResolvedValue(new Response(JSON.stringify(value))))).rejects.toThrow();
    }
    await expect(evaluateExamExplanation(question, answer, vi.fn().mockRejectedValue(new Error('network')))).rejects.toThrow('retained');
    await expect(evaluateExamExplanation(question, answer, vi.fn().mockResolvedValue(new Response('not JSON')))).rejects.toThrow('not finalized');
  });
});
