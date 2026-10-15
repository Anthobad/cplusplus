import { describe, expect, it } from 'vitest';
import { evaluateSubmission } from '../server/evaluateSubmission';
import { LocalCodeRunner, type CodeRunner } from '../server/codeRunner';
import { EXAM_SERVER_CHALLENGES } from '../server/examChallengeRegistry';
import { EXAM_SOLUTIONS } from './fixtures/examSolutions';
import { EXAM_QUESTION_POOLS, generateRandomizedExam } from '../src/data/examQuestionPools';
import { CURRICULUM_EXAMS } from '../src/data/exams';

const runner = new LocalCodeRunner();
const shortRunner: CodeRunner = { evaluate: request => runner.evaluate({ ...request, timeoutMs: 100 }) };
const submit = (challengeId: string, studentCode: string, selected: CodeRunner = runner) =>
  evaluateSubmission({ challengeId, studentCode, mode: 'assessment', wasAssisted: false }, selected);

describe('Compiler-backed exam challenge contracts', () => {
  it('registers every pooled, randomized and fallback exam coding question', () => {
    for (const exam of CURRICULUM_EXAMS) {
      for (const question of [...exam.questions, ...EXAM_QUESTION_POOLS[exam.id], ...generateRandomizedExam(exam).questions]
        .filter(q => q.type === 'coding-challenge')) {
        expect(question.codingChallengeId).toBeTruthy();
        const trusted = EXAM_SERVER_CHALLENGES[question.codingChallengeId!];
        expect(trusted).toBeDefined();
        expect(trusted.publicTests.length).toBeGreaterThan(0);
        expect(trusted.hiddenTests.length).toBeGreaterThan(0);
        expect(trusted.alwaysUseDriver).toBe(true);
      }
    }
  });

  it.each(Object.keys(EXAM_SOLUTIONS))('%s compiles and passes every public/hidden test', async id => {
    const { status, result } = await submit(id, EXAM_SOLUTIONS[id]);
    expect(status).toBe(200);
    expect(result.compileError).toBeUndefined();
    expect(result.runtimeError).toBeUndefined();
    expect(result.compiled).toBe(true);
    expect(result.passed).toBe(true);
    expect(result.verified).toBe(true);
    expect(result.score).toBe(100);
    expect(result.testsPassed).toBe(result.totalTests);
    const hidden = result.testResults.filter(test => test.isHidden);
    expect(hidden.length).toBe(EXAM_SERVER_CHALLENGES[id].hiddenTests.length);
    for (const test of hidden) {
      expect(test.input).toBeUndefined();
      expect(test.expectedOutput).toBeUndefined();
      expect(test.actualOutput).toBe('Passed');
    }
  }, 15_000);

  it('rejects keyword prose and a student main that tries to bypass the driver', async () => {
    for (const code of ['priority_queue greater minHeap.pop() top()', 'int main(){ std::cout << "OK"; }']) {
      const { result } = await submit('exam-estl-cc-2', code);
      expect(result.compiled).toBe(false);
      expect(result.score).toBe(0);
      expect(result.verified).toBe(false);
    }
  }, 15_000);

  it('accepts a valid self-move that releases storage and leaves the object empty', async () => {
    const code = EXAM_SOLUTIONS['exam-ef-cc-1'].replace(
      'return *this;', 'if (this == &other) { delete[] ptr; ptr = nullptr; sz = 0; } return *this;');
    const { result } = await submit('exam-ef-cc-1', code);
    expect(result.passed).toBe(true);
  }, 15_000);

  it('rejects leaking ownership implementations and a no-op lock', async () => {
    const cases = [
      ['exam-ef-cc-2', EXAM_SOLUTIONS['exam-ef-cc-2'].replace('~ScopedInt() { delete val; }', '~ScopedInt() {}')],
      ['exam-ef-cc-1', EXAM_SOLUTIONS['exam-ef-cc-1'].replace('delete[] ptr; ptr = other.ptr;', 'ptr = other.ptr;')],
      ['exam-esys-cc-2', 'class SpinLock { public: void lock() {} void unlock() {} };'],
    ];
    for (const [id, code] of cases) {
      const { result } = await submit(id, code);
      expect(result.compiled).toBe(true);
      expect(result.passed).toBe(false);
    }
  }, 15_000);

  it('reports public success but hidden failure without leaking hidden values', async () => {
    const code = 'int findKthLargest(const std::vector<int>& v, int k) { if (v.size()==1) return v[0]; return 5; }';
    const { result } = await submit('exam-estl-cc-2', code);
    expect(result.compiled).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.testsPassed).toBe(2);
    expect(result.totalTests).toBe(5);
    expect(result.verified).toBe(false);
    for (const test of result.testResults.filter(test => test.isHidden)) {
      expect(test.input).toBeUndefined(); expect(test.expectedOutput).toBeUndefined();
      expect(test.actualOutput).toBe('Hidden test failed');
    }
  }, 15_000);

  it('reports runtime failure and timeout as failed compiled code', async () => {
    for (const code of [
      'void removeSpaces(std::string&) { std::abort(); }',
      'void removeSpaces(std::string&) { for (;;) {} }',
    ]) {
      const { result } = await submit('exam-efin-cc-1', code, shortRunner);
      expect(result.compiled).toBe(true); expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.testResults.some(test => !test.isHidden && /Runtime Error|Time Limit Exceeded/.test(test.error || ''))).toBe(true);
    }
  }, 15_000);

  it('does not accept a queue implementation that omits notification', async () => {
    const code = 'void ThreadSafeQueue::push(int v) { std::lock_guard<std::mutex> lock(mtx); q.push(v); }';
    const { result } = await submit('exam-esys-cc-1', code);
    expect(result.compiled).toBe(true); expect(result.passed).toBe(false);
  }, 15_000);

  it('ignores client-supplied tests and driver for an exam challenge', async () => {
    let actual: any;
    const capture: CodeRunner = { evaluate: async request => {
      actual = request;
      return { compiled: false, passed: false, score: 0, testsPassed: 0,
        totalTests: request.testCases.length, testResults: [], mode: 'assessment', wasAssisted: false, verified: false };
    } };
    await evaluateSubmission({ challengeId: 'exam-estl-cc-2', studentCode: EXAM_SOLUTIONS['exam-estl-cc-2'],
      mode: 'assessment', testCases: [{ input: 'tampered', expectedOutput: 'anything' }],
      driverCode: 'int main(){return 0;}' }, capture);
    expect(actual.code).toContain('sorted[k - 1]');
    expect(actual.code).not.toContain('tampered');
    expect(actual.driverCode).toBeUndefined();
    expect(actual.testCases).toHaveLength(5);
  });
});
