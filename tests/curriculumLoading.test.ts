import { describe, expect, it, vi } from 'vitest';
import * as full from '../src/data/curriculum';
import * as summary from '../src/data/curriculumSummary';
import { CURRICULUM_EXAMS } from '../src/data/exams';
import { createDomainLoader, loadCurriculumDomain, loadUnit } from '../src/data/loadCurriculum';
import type { UserProgress } from '../src/types';

// Compare navigation decisions without conflating full lessons and summary records.
function decision(value: any): any {
  if (Array.isArray(value)) return value.map(decision);
  if (value && typeof value === 'object') {
    if (value.id && value.weekNumber) return { id: value.id, weekNumber: value.weekNumber };
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, decision(entry)]));
  }
  return value;
}
const progress = (completed: string[], passed: string[]): UserProgress => ({
  completedUnitIds: completed, completedUnits: completed, quizScores: {},
  examAttempts: Object.fromEntries(passed.map(id => [id, { passed: true, score: 50 }])),
  currentUnitId: 'topic-1', unlockedUnits: ['topic-1'],
} as unknown as UserProgress);

describe('Deferred curriculum content', () => {
  it('keeps generated metadata aligned with the authored curriculum and exams', () => {
    expect(summary.ALL_PHASES.map(phase => ({ ...phase, weeks: phase.weeks.map(unit => unit.id) })))
      .toEqual(full.ALL_PHASES.map(phase => ({ ...phase, weeks: phase.weeks.map(unit => unit.id) })));
    expect(summary.CURRICULUM_EXAMS).toEqual(CURRICULUM_EXAMS.map(({ questions: _questions, ...exam }) => exam));
    for (const unit of summary.ALL_UNITS) {
      const original = full.getUnitById(unit.id)!;
      for (const key of ['id', 'weekNumber', 'phaseId', 'title', 'subtitle', 'goals', 'topics', 'estimatedHours'] as const) {
        expect(unit[key]).toEqual(original[key]);
      }
      expect(unit.quiz).toEqual({ id: original.quiz.id, passingScorePercentage: original.quiz.passingScorePercentage });
      expect(unit.exercises.codingChallenge.id).toBe(original.exercises.codingChallenge.id);
      expect(unit).not.toHaveProperty('theory');
      expect(unit).not.toHaveProperty('deepDive');
    }
  });

  it.each(full.ALL_PHASES)('loads exactly the complete authored content for $id', async phase => {
    expect(await loadCurriculumDomain(phase.id)).toEqual(JSON.parse(JSON.stringify(phase.weeks)));
  });

  it('resolves canonical, week and historical IDs without changing content', async () => {
    for (const id of ['topic-20', 'week-20', 'domain2-week-20']) {
      expect(await loadUnit(id)).toEqual(JSON.parse(JSON.stringify(full.getUnitById(id))));
    }
    await expect(loadUnit('missing-topic')).rejects.toThrow('Unknown');
  });

  it('shares pending and successful domain loads but allows retry after rejection', async () => {
    let resolve!: (units: typeof full.ALL_UNITS) => void;
    const fetch = vi.fn(() => new Promise<typeof full.ALL_UNITS>(done => { resolve = done; }));
    const load = createDomainLoader({ first: fetch });
    const first = load('first');
    expect(load('first')).toBe(first);
    await Promise.resolve();
    resolve(full.ALL_PHASES[0].weeks);
    expect(await first).toBe(full.ALL_PHASES[0].weeks);
    expect(load('first')).toBe(first);
    expect(fetch).toHaveBeenCalledTimes(1);
    const failThenWork = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(full.ALL_PHASES[1].weeks);
    const retry = createDomainLoader({ second: failThenWork });
    await expect(retry('second')).rejects.toThrow('offline');
    expect(await retry('second')).toBe(full.ALL_PHASES[1].weeks);
    expect(failThenWork).toHaveBeenCalledTimes(2);
    await expect(retry('unknown')).rejects.toThrow('Unknown');
  });

  it('preserves every topic gate and milestone decision across completion prefixes and exam states', () => {
    for (let count = 0; count <= full.ALL_UNITS.length; count++) {
      for (let mask = 0; mask < 16; mask++) {
        const state = progress(full.ALL_UNITS.slice(0, count).map(unit => unit.id),
          CURRICULUM_EXAMS.filter((_, index) => mask & (1 << index)).map(exam => exam.id));
        expect(summary.calculateOverallProgress(state)).toEqual(full.calculateOverallProgress(state));
        for (const unit of full.ALL_UNITS) {
          expect(decision(summary.getUnitLockReason(unit.id, state))).toEqual(decision(full.getUnitLockReason(unit.id, state)));
          expect(decision(summary.getNextStepAfterUnit(unit.id, state))).toEqual(decision(full.getNextStepAfterUnit(unit.id, state)));
        }
        for (const exam of CURRICULUM_EXAMS) {
          expect(decision(summary.checkExamPrerequisites(exam, state))).toEqual(decision(full.checkExamPrerequisites(exam, state)));
        }
      }
    }
  });

  it('preserves legacy migration, previous/next lookup and post-exam navigation', () => {
    expect(summary.LEGACY_UNIT_MIGRATION).toEqual(full.LEGACY_UNIT_MIGRATION);
    const state = { ...progress(['week-1', 'domain1-week-2'], []), currentUnitId: 'domain1-week-2' };
    expect(summary.migrateUserProgress(state)).toEqual(full.migrateUserProgress(state));
    for (const unit of full.ALL_UNITS) {
      expect(summary.getNextUnit(unit.id)?.id).toBe(full.getNextUnit(unit.id)?.id);
      expect(summary.getPreviousUnit(unit.id)?.id).toBe(full.getPreviousUnit(unit.id)?.id);
    }
    for (const exam of CURRICULUM_EXAMS) {
      expect(summary.getFirstUnitAfterExam(exam.id)?.id).toBe(full.getFirstUnitAfterExam(exam.id)?.id);
    }
  });
});
