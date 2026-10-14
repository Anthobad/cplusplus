import { describe, expect, it, vi } from 'vitest';
import { gradeExam, evaluateExamCode } from '../src/lib/examGrading';
import type { Exam, ExamQuestionDetail, CodeEvaluationResult } from '../src/types';

const coding: ExamQuestionDetail = { id: 'random-id_s0', type: 'coding-challenge', points: 20,
  question: 'Implement the function', explanation: '', codingChallengeId: 'exam-estl-cc-2', rubricKeywords: ['priority_queue', 'top'] };
const result = (overrides: Partial<CodeEvaluationResult> = {}): CodeEvaluationResult => ({
  compiled: true, passed: true, score: 100, testsPassed: 4, totalTests: 4, testResults: [],
  mode: 'assessment', wasAssisted: false, verified: true, ...overrides,
});
const exam: Exam = { id: 'exam-test', title: 'Test', description: '', durationMinutes: 60,
  passingScore: 50, allowCppReference: true, coversPhases: [2], questions: [
    { id: 'mcq', type: 'mcq', points: 30, question: '', explanation: '', options: ['A', 'B'], correctAnswer: 1 },
    { id: 'tf', type: 'true-false', points: 20, question: '', explanation: '', correctAnswer: false },
    { id: 'why', type: 'why-this-code-works', points: 15, question: '', explanation: '', rubricKeywords: ['invariant'] },
    { id: 'analysis', type: 'code-analysis', points: 15, question: '', explanation: '', rubricKeywords: ['reference'] },
    coding,
  ] };
const nonCoding = { mcq: 1, tf: false, why: 'The invariant is preserved.', analysis: 'This reference remains valid.' };

describe('Exam coding grading and failure handling', () => {
  it('uses the canonical coding ID, assessment mode and no AI assistance/feedback', async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify(result())));
    await evaluateExamCode(coding, 'int findKthLargest(...) { return 1; }', request);
    const [url, options] = request.mock.calls[0];
    expect(url).toBe('/api/evaluate-code');
    expect(JSON.parse(options.body)).toEqual({ challengeId: 'exam-estl-cc-2',
      studentCode: 'int findKthLargest(...) { return 1; }', mode: 'assessment', wasAssisted: false, requestAiFeedback: false });
    expect(JSON.parse(options.body).testCases).toBeUndefined();
  });

  it('awards no coding credit for matching words when compilation fails', async () => {
    const evaluate = vi.fn().mockResolvedValue(result({ compiled: false, passed: false, verified: false,
      testsPassed: 0, score: 0, compileError: 'error: invalid syntax' }));
    const graded = await gradeExam(exam, { [coding.id]: 'priority_queue greater top minHeap.pop()' }, evaluate);
    expect(graded.score).toBe(0); expect(graded.passed).toBe(false);
    expect(graded.codingPoints[coding.id]).toBe(0);
  });

  it('scales coding points by actual passed tests and preserves other scoring/pass thresholds', async () => {
    const evaluate = vi.fn().mockResolvedValue(result({ passed: false, verified: false, testsPassed: 2, score: 50 }));
    const graded = await gradeExam(exam, { ...nonCoding, [coding.id]: 'submitted implementation' }, evaluate);
    expect(graded.codingPoints[coding.id]).toBe(10); expect(graded.score).toBe(90); expect(graded.passed).toBe(true);
    expect(graded.codingResults[coding.id].testsPassed).toBe(2);
  });

  it('gives full coding points to an implementation passing all tests without matching keywords', async () => {
    const evaluate = vi.fn().mockResolvedValue(result());
    const graded = await gradeExam(exam, { [coding.id]: 'return anotherCorrectApproach();' }, evaluate);
    expect(graded.codingPoints[coding.id]).toBe(20); expect(graded.score).toBe(20);
  });

  it('unanswered coding earns zero without invoking the API', async () => {
    const request = vi.fn();
    const value = await evaluateExamCode(coding, '', request);
    expect(value.compiled).toBe(false); expect(value.score).toBe(0); expect(request).not.toHaveBeenCalled();
  });

  it.each([503, 429, 500])('does not finalize grading on HTTP %s', async status => {
    const request = vi.fn().mockResolvedValue(new Response('{}', { status }));
    await expect(gradeExam(exam, { ...nonCoding, [coding.id]: 'valid code' },
      (q, code) => evaluateExamCode(q, code, request))).rejects.toThrow('not finalized');
  });

  it('retains the attempt on network, configuration and invalid-response failures', async () => {
    await expect(evaluateExamCode(coding, 'code', vi.fn().mockRejectedValue(new Error('network')))).rejects.toThrow('retained');
    for (const value of [null, { configurationError: true }, { error: 'runner unavailable' },
      result({ totalTests: 0 }), result({ testsPassed: 8 }), result({ verified: false }), result({ mode: 'practice' })]) {
      const request = vi.fn().mockResolvedValue(new Response(JSON.stringify(value)));
      await expect(evaluateExamCode(coding, 'code', request)).rejects.toThrow();
    }
  });

  it('rejects an unregistered coding question rather than keyword-grading it', async () => {
    await expect(evaluateExamCode({ ...coding, codingChallengeId: undefined }, 'priority_queue top')).rejects.toThrow('not configured');
  });
});
