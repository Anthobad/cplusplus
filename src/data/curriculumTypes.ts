import type { Exam, Phase, Unit } from '../types';

export type UnitSummary = Pick<Unit, 'id' | 'weekNumber' | 'phaseId' | 'title' | 'subtitle' | 'goals' | 'topics' | 'estimatedHours'> & {
  quiz: Pick<Unit['quiz'], 'id' | 'passingScorePercentage'>;
  exercises: { codingChallenge: Pick<Unit['exercises']['codingChallenge'], 'id'> };
};
export type PhaseSummary<U extends UnitSummary = UnitSummary> = Omit<Phase, 'weeks'> & { weeks: U[] };
export type ExamSummary = Omit<Exam, 'questions'>;
