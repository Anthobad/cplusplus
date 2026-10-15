import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { INTERVIEW_PRACTICE } from '../src/data/interviewPractice';
import InterviewPracticeView from '../src/components/InterviewPracticeView';
import { AssessmentProvider } from '../src/lib/AssessmentContext';
import { INTERVIEW_SERVER_CHALLENGES } from '../server/interviewChallengeRegistry';
import { getTrustedChallenge } from '../server/challengeRegistry';
import { evaluateSubmission } from '../server/evaluateSubmission';
import { LocalCodeRunner } from '../server/codeRunner';

const runner = new LocalCodeRunner();
const submit = (challengeId: string, studentCode: string, extra = {}) => evaluateSubmission({
  challengeId, studentCode, mode: 'assessment', wasAssisted: false, ...extra,
}, runner);

describe('Optional interview practice', () => {
  it('registers five distinct optional challenges with matching public examples and trusted hidden tests', () => {
    expect(INTERVIEW_PRACTICE).toHaveLength(5);
    expect(new Set(INTERVIEW_PRACTICE.map(item => item.id)).size).toBe(5);
    for (const lesson of INTERVIEW_PRACTICE) {
      const trusted = getTrustedChallenge(lesson.challenge.id)!;
      expect(trusted).toBe(INTERVIEW_SERVER_CHALLENGES[lesson.challenge.id]);
      expect(trusted.alwaysUseDriver).toBe(true);
      expect(trusted.publicTests).toEqual(lesson.challenge.testCases);
      expect(trusted.hiddenTests.length).toBeGreaterThanOrEqual(3);
      expect(trusted.hiddenTests.every(test => test.isHidden)).toBe(true);
    }
  });

  it('renders an accessible optional entry view with the contract and existing editor', () => {
    const html = renderToStaticMarkup(<AssessmentProvider><InterviewPracticeView onBack={() => {}} /></AssessmentProvider>);
    expect(html).toContain('Optional learning track');
    expect(html).toContain('aria-label="Interview practice lessons"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('First element at least target');
    expect(html).toContain('Submission contract');
    expect(html).toContain('firstAtLeast');
    expect(html).toContain('does not change your 39-topic progress');
  });

  it.each(INTERVIEW_PRACTICE)('$id compiles and passes every public and hidden test', async lesson => {
    const { status, result } = await submit(lesson.challenge.id, lesson.challenge.solutionCode);
    expect(status).toBe(200);
    expect(result.compileError).toBeUndefined();
    expect(result.compiled).toBe(true);
    expect(result.passed).toBe(true);
    expect(result.verified).toBe(true);
    expect(result.score).toBe(100);
    expect(result.testsPassed).toBe(result.totalTests);
    for (const test of result.testResults.filter(item => item.isHidden)) {
      expect(test.input).toBeUndefined();
      expect(test.expectedOutput).toBeUndefined();
      expect(test.actualOutput).toBe('Passed');
    }
  }, 15_000);

  it.each([
    ['ip-binary-bound', 'int firstAtLeast(const std::vector<int>& v, int){ return static_cast<int>(v.size()); }'],
    ['ip-bfs-distances', 'std::vector<int> shortestDistances(const std::vector<std::vector<int>>& g, int){ return std::vector<int>(g.size(), 0); }'],
    ['ip-dfs-components', 'int countComponents(const std::vector<std::vector<int>>&){ return 1; }'],
    ['ip-backtracking-subsets', 'std::vector<std::vector<int>> allSubsets(const std::vector<int>&){ return {{}}; }'],
    ['ip-dp-min-coins', `int minCoins(const std::vector<int>& coins, int amount) {
      auto sorted = coins; std::sort(sorted.rbegin(), sorted.rend());
      int count = 0;
      for (int coin : sorted) { count += amount / coin; amount %= coin; }
      return amount ? -1 : count;
    }`],
  ])('%s rejects an incorrect implementation', async (id, code) => {
    const { result } = await submit(id, code);
    expect(result.compiled).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.verified).toBe(false);
  }, 15_000);

  it('accepts any outer subset order without silently fixing incorrect inner order', async () => {
    const lesson = INTERVIEW_PRACTICE.find(item => item.id === 'interview-backtracking')!;
    const reverseOuter = lesson.challenge.solutionCode.replace('return result;', 'std::reverse(result.begin(), result.end()); return result;');
    expect((await submit(lesson.challenge.id, reverseOuter)).result.passed).toBe(true);
    const reverseInner = lesson.challenge.solutionCode.replace('result.push_back(path);', 'auto wrong = path; std::reverse(wrong.begin(), wrong.end()); result.push_back(wrong);');
    expect((await submit(lesson.challenge.id, reverseInner)).result.passed).toBe(false);
  }, 15_000);

  it('uses hidden tests even if a hardcoded answer passes both public examples', async () => {
    const { result } = await submit('ip-binary-bound', 'int firstAtLeast(const std::vector<int>&, int target){return target == 2 ? 1 : 4;}', {
      testCases: [{ input: '', expectedOutput: 'anything' }], driverCode: 'int main(){}', hiddenTestCases: [],
    });
    expect(result.testResults.filter(test => !test.isHidden).every(test => test.passed)).toBe(true);
    expect(result.testResults.some(test => test.isHidden && !test.passed)).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.verified).toBe(false);
  }, 15_000);

  it('does not let a separate main bypass the registered driver', async () => {
    const { result } = await submit('ip-dp-min-coins', 'int main(){std::cout << 2;}');
    expect(result.compiled).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.verified).toBe(false);
  }, 15_000);
});
