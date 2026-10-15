import index from "../generated/curriculum/index.json";
import { createCurriculum } from "./createCurriculum";
import type { PhaseSummary, ExamSummary } from "./curriculumTypes";

export const ALL_PHASES: PhaseSummary[] = index.phases;
export const ALL_UNITS = ALL_PHASES.flatMap(phase => phase.weeks);
export const CURRICULUM_EXAMS: ExamSummary[] = index.exams;
export const {
  getUnitById,
  getPhaseByUnitId,
  getNextUnit,
  getPreviousUnit,
  migrateUserProgress,
  isExamPassed,
  getPhaseGatingExam,
  getUnitLockReason,
  isUnitUnlocked,
  calculateOverallProgress,
  getRequiredUnitsForExam,
  checkExamPrerequisites,
  getNextStepAfterUnit,
  getFirstUnitAfterExam,
  LEGACY_UNIT_MIGRATION
} = createCurriculum(ALL_PHASES);
