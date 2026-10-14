import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ALL_UNITS, ALL_PHASES } from '../src/data/curriculum';
import { DOMAIN_1_UNITS } from '../src/data/domain1_basics';
import { DOMAIN_2_UNITS } from '../src/data/domain2_datastructures';
import { DOMAIN_3_UNITS } from '../src/data/domain3_oop';
import { DOMAIN_4_UNITS } from '../src/data/domain4_algorithms';

const originals = [...DOMAIN_1_UNITS, ...DOMAIN_2_UNITS, ...DOMAIN_3_UNITS, ...DOMAIN_4_UNITS];
describe('Interview guide content coverage without functional changes', () => {
  it('preserves all 39 identities, order, pass thresholds and graded challenges', () => {
    expect(ALL_PHASES.map(p => p.weeks.length)).toEqual([18, 9, 6, 6]);
    expect(ALL_UNITS.map(u => [u.id, u.weekNumber, u.phaseId])).toEqual(originals.map(u => [u.id, u.weekNumber, u.phaseId]));
    for (const original of originals) {
      const enriched = ALL_UNITS.find(u => u.id === original.id)!;
      expect(enriched.quiz.id).toBe(original.quiz.id);
      expect(enriched.quiz.passingScorePercentage).toBe(original.quiz.passingScorePercentage);
      expect(enriched.exercises.codingChallenge).toBe(original.exercises.codingChallenge);
      expect(enriched.codeExamples.slice(0, original.codeExamples.length).map(e => [e.id, e.code, e.output]))
        .toEqual(original.codeExamples.map(e => [e.id, e.code, e.output]));
    }
  });
  it('includes every learning and exercise URL supplied by the guide', () => {
    const guide = readFileSync('specs/curricullum.md', 'utf8');
    const urls = [...guide.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map(match => match[1]);
    expect(urls).toHaveLength(24); // five learning references plus 19 exercises
    const lessons = ALL_UNITS.flatMap(u => u.theory.sections.map(s => s.content)).join('\n');
    for (const url of urls) expect(lessons).toContain(url);
  });
  it.each([
    [12, ['preprocessing', 'assembly', 'linking', 'translation unit']],
    [15, ['nested class', 'constructor', 'accessor', 'enum class', 'static data member']],
    [21, ['multiset', 'unordered_multiset']],
    [22, ['multimap', 'unordered_multimap']],
    [31, ['association', 'aggregation', 'composition']],
    [33, ['fork', 'join', 'process', 'data race']],
    [36, ['cyclic sort', 'subsets', 'topological sort', 'merge intervals', 'greedy', 'divide-and-conquer']],
    [37, ['selection sort', 'bubble sort', 'insertion sort', 'merge sort', 'quick sort', 'heap sort', 'bucket sort']],
  ] as const)('provides actual lesson text for formerly missing coverage in topic %s', (number, terms) => {
    const unit = ALL_UNITS.find(u => u.weekNumber === number)!;
    const text = unit.theory.sections.map(s => `${s.title} ${s.content}`).join('\n').toLowerCase();
    for (const term of terms) expect(text).toContain(term);
  });
  it('gives supplemental examples unique IDs and concrete expected results', () => {
    const examples = ALL_UNITS.flatMap(u => u.codeExamples);
    expect(new Set(examples.map(e => e.id)).size).toBe(examples.length);
    for (const example of examples.filter(e => e.id.startsWith('guide-'))) {
      expect(example.code).toContain('int main(');
      expect(example.output).toBeDefined();
    }
  });
});
