import { describe, expect, it } from 'vitest';
import { ALL_UNITS, ALL_PHASES } from '../src/data/curriculum';
import { CURRICULUM_EXAMS } from '../src/data/exams';
import { EXAM_QUESTION_POOLS, generateRandomizedExam } from '../src/data/examQuestionPools';

describe('Beginner teaching and assessment integrity', () => {
  it('gives every topic a complete example, trace, limits and transfer practice', () => {
    for (const unit of ALL_UNITS) {
      const sections = unit.theory.sections;
      expect(sections.slice(0, 4).map(s => s.title)).toEqual([
        '1. Build the mental model', '2. Work through a complete example',
        '3. Common mistakes, limits and choices', '4. Check your understanding',
      ]);
      const snippet = sections[1].codeSnippets![0];
      expect(snippet.code).toContain('int main()');
      expect(snippet.explanation).toContain('Expected standard output:\n');
      expect(unit.quiz.questions[0].codeSnippet).toBe(snippet.code);
      expect(unit.quiz.questions[0].options[unit.quiz.questions[0].correctAnswerIndex])
        .toBe(snippet.explanation.split('Expected standard output:\n')[1].trim());
      expect(unit.deepDive.breakdown.length).toBeGreaterThanOrEqual(3);
      expect(unit.deepDive.idealAnswer.length).toBeGreaterThan(40);
    }
  });

  it('gives all quizzes unambiguous option keys and keeps identity/threshold contracts', () => {
    const ids: string[] = [];
    for (const unit of ALL_UNITS) {
      expect(unit.quiz.questions.map(q => q.type)).toEqual(['code_output', 'mcq', 'true_false']);
      for (const question of unit.quiz.questions) {
        ids.push(question.id);
        expect(new Set(question.options).size).toBe(question.options.length);
        expect(question.correctAnswerIndex).toBeGreaterThanOrEqual(0);
        expect(question.correctAnswerIndex).toBeLessThan(question.options.length);
        expect(question.explanation.length).toBeGreaterThan(40);
      }
      expect(unit.exercises.mcqs[0].options[unit.exercises.mcqs[0].correctAnswer])
        .toBe(unit.quiz.questions[1].options[unit.quiz.questions[1].correctAnswerIndex]);
    }
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ALL_UNITS.map(u => u.quiz.questions[0].correctAnswerIndex)).size).toBe(4);
  });

  it('keeps the 100-point randomized exam composition and all four gate settings', () => {
    expect(ALL_PHASES.map(p => p.weeks.length)).toEqual([18, 9, 6, 6]);
    expect(CURRICULUM_EXAMS.map(e => [e.id, e.passingScore, e.durationMinutes])).toEqual([
      ['exam-foundations', 50, 45], ['exam-stl', 50, 60],
      ['exam-systems', 50, 60], ['exam-final', 50, 90],
    ]);
    for (const base of CURRICULUM_EXAMS) {
      const pool = EXAM_QUESTION_POOLS[base.id];
      expect(new Set(pool.map(q => q.id)).size).toBe(pool.length);
      for (const q of pool.filter(q => q.type === 'mcq')) {
        expect(typeof q.correctAnswer).toBe('number');
        expect(q.options![q.correctAnswer]).toBeTruthy();
        expect(new Set(q.options).size).toBe(q.options!.length);
      }
      for (let attempt = 0; attempt < 12; ++attempt) {
        const exam = generateRandomizedExam(base);
        expect(exam.questions.reduce((sum, q) => sum + q.points, 0)).toBe(100);
        expect(exam.questions.filter(q => q.type === 'mcq')).toHaveLength(3);
        expect(exam.questions.filter(q => q.type === 'true-false')).toHaveLength(2);
        expect(exam.questions.filter(q => q.type === 'why-this-code-works')).toHaveLength(1);
        expect(exam.questions.filter(q => q.type === 'code-analysis')).toHaveLength(1);
        expect(exam.questions.filter(q => q.type === 'coding-challenge')).toHaveLength(1);
        for (const q of exam.questions.filter(q => q.type === 'mcq')) {
          const original = pool.find(candidate => candidate.id === q.id.replace(/_s\d+$/, ''))!;
          expect(q.options![q.correctAnswer]).toBe(original.options![original.correctAnswer]);
        }
      }
    }
  });

  it('corrects the throwing-move answer and establishes actual capacity before an invalidation question', () => {
    expect(EXAM_QUESTION_POOLS['exam-final'].find(q => q.id === 'efin-tf-3')?.correctAnswer).toBe(false);
    const invalidation = EXAM_QUESTION_POOLS['exam-stl'].find(q => q.id === 'estl-ca-1')!;
    expect(invalidation.codeSnippet).toContain('v.size() < v.capacity()');
    expect(invalidation.codeSnippet).not.toContain('reserve(2)');
  });

});
