import type { UserProgress } from "../types";
import type { UnitSummary, PhaseSummary, ExamSummary } from "./curriculumTypes";

// Shared rules for both the lightweight browser index and full teaching data.
export function createCurriculum<U extends UnitSummary>(ALL_PHASES: PhaseSummary<U>[]) {
  const ALL_UNITS = ALL_PHASES.flatMap(phase => phase.weeks);
  /**
   * Universal lookup supporting "topic-X", "week-X", and legacy aliases.
   */
  function getUnitById(id: string): U | undefined {
    if (!id) return undefined;
    const direct = ALL_UNITS.find((u) => u.id === id);
    if (direct) return direct;

    if (id.startsWith("week-")) {
      const num = parseInt(id.replace("week-", ""), 10);
      return ALL_UNITS.find((u) => u.weekNumber === num || u.id === `topic-${num}`);
    }
    if (id.startsWith("topic-")) {
      const num = parseInt(id.replace("topic-", ""), 10);
      return ALL_UNITS.find((u) => u.weekNumber === num);
    }

    const migrated = LEGACY_UNIT_MIGRATION[id];
    if (migrated) {
      return getUnitById(migrated);
    }
    return undefined;
  }

  function getPhaseByUnitId(unitId: string): PhaseSummary<U> | undefined {
    const unit = getUnitById(unitId);
    if (!unit) return undefined;
    return ALL_PHASES.find((p) => p.weeks.some((w) => w.id === unit.id || w.weekNumber === unit.weekNumber));
  }

  function getNextUnit(currentUnitId: string): U | null {
    const currentUnit = getUnitById(currentUnitId);
    if (!currentUnit) return null;
    const index = ALL_UNITS.findIndex((u) => u.weekNumber === currentUnit.weekNumber);
    if (index >= 0 && index < ALL_UNITS.length - 1) {
      return ALL_UNITS[index + 1];
    }
    return null;
  }

  function getPreviousUnit(currentUnitId: string): U | null {
    const currentUnit = getUnitById(currentUnitId);
    if (!currentUnit) return null;
    const index = ALL_UNITS.findIndex((u) => u.weekNumber === currentUnit.weekNumber);
    if (index > 0) {
      return ALL_UNITS[index - 1];
    }
    return null;
  }

  /**
   * Migration dictionary mapping legacy IDs to canonical topic IDs.
   */
  const LEGACY_UNIT_MIGRATION: Record<string, string> = {
    "domain1-week-1": "topic-1",
    "domain1-week-2": "topic-2",
    "domain1-week-3": "topic-3",
    "domain1-week-4": "topic-4",
    "domain1-week-5": "topic-5",
    "domain1-week-6": "topic-6",
    "domain1-week-7": "topic-7",
    "domain1-week-8": "topic-8",
    "domain1-week-9": "topic-9",
    "domain1-week-10": "topic-10",
    "domain1-week-11": "topic-11",
    "domain1-week-12": "topic-12",
    "domain1-week-13": "topic-13",
    "domain1-week-14": "topic-14",
    "domain1-week-15": "topic-15",
    "domain1-week-16": "topic-16",
    "domain1-week-17": "topic-17",
    "domain1-week-18": "topic-18",
    "domain2-week-19": "topic-19",
    "domain2-week-20": "topic-20",
    "domain2-week-21": "topic-21",
    "domain2-week-22": "topic-22",
    "domain2-week-23": "topic-23",
    "domain2-week-24": "topic-24",
    "domain2-week-25": "topic-25",
    "domain2-week-26": "topic-26",
    "domain2-week-27": "topic-27",
    "domain3-week-28": "topic-28",
    "domain3-week-29": "topic-29",
    "domain3-week-30": "topic-30",
    "domain3-week-31": "topic-31",
    "domain3-week-32": "topic-32",
    "domain3-week-33": "topic-33",
    "domain4-week-34": "topic-34",
    "domain4-week-35": "topic-35",
    "domain4-week-36": "topic-36",
    "domain4-week-37": "topic-37",
    "domain4-week-38": "topic-38",
    "domain4-week-39": "topic-39",
  };

  function migrateUserProgress(raw: UserProgress): UserProgress {
    if (!raw) return raw;

    const migrateId = (id: string): string => {
      if (LEGACY_UNIT_MIGRATION[id]) return LEGACY_UNIT_MIGRATION[id];
      if (id.startsWith("week-")) {
        const num = parseInt(id.replace("week-", ""), 10);
        return `topic-${num}`;
      }
      return id;
    };

    const rawCompleted = raw.completedUnitIds || raw.completedUnits || [];
    const migratedCompleted = Array.from(new Set(rawCompleted.map(migrateId))).filter((id) =>
      ALL_UNITS.some((u) => u.id === id || `topic-${u.weekNumber}` === id)
    );

    const rawUnlocked = raw.unlockedUnits || ["topic-1"];
    const migratedUnlocked = Array.from(new Set(rawUnlocked.map(migrateId))).filter((id) =>
      ALL_UNITS.some((u) => u.id === id || `topic-${u.weekNumber}` === id)
    );
    if (!migratedUnlocked.includes("topic-1")) {
      migratedUnlocked.push("topic-1");
    }

    const currentUnit = getUnitById(raw.currentUnitId) || ALL_UNITS[0];

    return {
      ...raw,
      completedUnitIds: migratedCompleted,
      completedUnits: migratedCompleted,
      unlockedUnits: migratedUnlocked,
      currentUnitId: currentUnit.id,
      currentWeekNumber: currentUnit.weekNumber,
    };
  }

  function isExamPassed(examId: string, progress: UserProgress): boolean {
    const attempt = progress.examAttempts?.[examId];
    if (!attempt) return false;
    return Boolean(attempt.passed && typeof attempt.score === "number" && attempt.score >= 50);
  }

  function getPhaseGatingExam(phaseNumber: number): { id: string; title: string; minScore: number } | null {
    if (phaseNumber === 2) {
      return { id: "exam-foundations", title: "Milestone Exam 1: Language Basics", minScore: 50 };
    }
    if (phaseNumber === 3) {
      return { id: "exam-stl", title: "Milestone Exam 2: Data Structures & STL Containers", minScore: 50 };
    }
    if (phaseNumber === 4) {
      return { id: "exam-systems", title: "Milestone Exam 3: Object-Oriented Programming & Pointers", minScore: 50 };
    }
    return null;
  }

  function getUnitLockReason(unitId: string, progress: UserProgress): {
    isLocked: boolean;
    reason?: "prev_unit" | "milestone_exam";
    requiredUnit?: U;
    requiredExam?: { id: string; title: string; minScore: number };
  } {
    const unit = getUnitById(unitId);
    if (!unit || unit.weekNumber === 1 || unit.id === "topic-1") {
      return { isLocked: false };
    }

    const index = ALL_UNITS.findIndex((u) => u.weekNumber === unit.weekNumber);
    if (index <= 0) return { isLocked: false };

    // 1. Check previous sequential unit
    const prevUnit = ALL_UNITS[index - 1];
    const completedList = progress.completedUnitIds || progress.completedUnits || [];
    const isPrevCompleted =
      completedList.includes(prevUnit.id) ||
      completedList.includes(`topic-${prevUnit.weekNumber}`) ||
      completedList.includes(`week-${prevUnit.weekNumber}`);

    if (!isPrevCompleted) {
      return { isLocked: true, reason: "prev_unit", requiredUnit: prevUnit };
    }

    // 2. Check milestone exam gates
    const phase = getPhaseByUnitId(unit.id);
    if (phase) {
      if (phase.number === 2 && !isExamPassed("exam-foundations", progress)) {
        return {
          isLocked: true,
          reason: "milestone_exam",
          requiredExam: { id: "exam-foundations", title: "Milestone Exam 1: Language Basics", minScore: 50 },
        };
      }
      if (phase.number === 3 && !isExamPassed("exam-stl", progress)) {
        return {
          isLocked: true,
          reason: "milestone_exam",
          requiredExam: { id: "exam-stl", title: "Milestone Exam 2: Data Structures & STL Containers", minScore: 50 },
        };
      }
      if (phase.number === 4 && !isExamPassed("exam-systems", progress)) {
        return {
          isLocked: true,
          reason: "milestone_exam",
          requiredExam: { id: "exam-systems", title: "Milestone Exam 3: Object-Oriented Programming & Pointers", minScore: 50 },
        };
      }
    }

    return { isLocked: false };
  }

  function isUnitUnlocked(unitId: string, progress: UserProgress): boolean {
    return !getUnitLockReason(unitId, progress).isLocked;
  }

  function calculateOverallProgress(progress: UserProgress) {
    const totalUnits = ALL_UNITS.length;
    const completedList = progress.completedUnitIds || progress.completedUnits || [];
    const completedCount = completedList.length;
    const percentage = totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0;

    const quizScores = progress.quizScores || {};
    const examAttempts = progress.examAttempts || {};

    return {
      totalUnits,
      completedCount,
      percentage,
      quizzesPassed: Object.values(quizScores).filter((q: any) => q?.passed).length,
      examsPassed: Object.values(examAttempts).filter(
        (e: any) => Boolean(e?.passed && typeof e?.score === "number" && e.score >= 50)
      ).length,
    };
  }

  function getRequiredUnitsForExam(exam: ExamSummary): U[] {
    if (!exam.coversPhases || exam.coversPhases.length === 0) return [];
    const maxPhase = Math.max(...exam.coversPhases);
    return ALL_PHASES.filter((p) => p.number <= maxPhase).flatMap((p) => p.weeks);
  }

  function checkExamPrerequisites(
    exam: ExamSummary,
    progress: UserProgress
  ): {
    isUnlocked: boolean;
    totalRequired: number;
    completedCount: number;
    missingUnits: U[];
    firstMissingUnit?: U;
  } {
    const requiredUnits = getRequiredUnitsForExam(exam);
    const completedList = progress.completedUnitIds || progress.completedUnits || [];
    const missingUnits = requiredUnits.filter((u) => {
      return !completedList.includes(u.id) &&
        !completedList.includes(`topic-${u.weekNumber}`) &&
        !completedList.includes(`week-${u.weekNumber}`);
    });

    return {
      isUnlocked: missingUnits.length === 0,
      totalRequired: requiredUnits.length,
      completedCount: requiredUnits.length - missingUnits.length,
      missingUnits,
      firstMissingUnit: missingUnits[0],
    };
  }

  function getNextStepAfterUnit(
    currentUnitId: string,
    progress: UserProgress
  ): {
    type: "next_unit" | "milestone_exam" | "curriculum_completed";
    nextUnit?: U;
    requiredExam?: { id: string; title: string; minScore: number };
  } {
    const currentUnit = getUnitById(currentUnitId);
    if (!currentUnit) return { type: "curriculum_completed" };

    const currentIndex = ALL_UNITS.findIndex((u) => u.weekNumber === currentUnit.weekNumber);
    if (currentIndex < 0) return { type: "curriculum_completed" };

    if (currentIndex === ALL_UNITS.length - 1) {
      const isFinalPassed = isExamPassed("exam-final", progress);
      if (!isFinalPassed) {
        return {
          type: "milestone_exam",
          requiredExam: {
            id: "exam-final",
            title: "Comprehensive Job-Ready C++ Certification Exam",
            minScore: 50,
          },
        };
      }
      return { type: "curriculum_completed" };
    }

    const nextUnit = ALL_UNITS[currentIndex + 1];

    // Check if entering nextUnit triggers a milestone exam gate
    const completedList = progress.completedUnitIds || progress.completedUnits || [];
    const simulatedCompleted = [
      ...new Set([
        ...completedList,
        currentUnit.id,
        `topic-${currentUnit.weekNumber}`,
        `week-${currentUnit.weekNumber}`,
      ]),
    ];

    const simulatedProgress: UserProgress = {
      ...progress,
      completedUnitIds: simulatedCompleted,
    };

    const lockReason = getUnitLockReason(nextUnit.id, simulatedProgress);
    if (lockReason.isLocked && lockReason.reason === "milestone_exam" && lockReason.requiredExam) {
      return {
        type: "milestone_exam",
        nextUnit,
        requiredExam: lockReason.requiredExam,
      };
    }

    return {
      type: "next_unit",
      nextUnit,
    };
  }

  function getFirstUnitAfterExam(examId: string): U | undefined {
    if (examId === "exam-foundations") return ALL_UNITS.find((u) => u.weekNumber === 19 || u.id === "topic-19");
    if (examId === "exam-stl") return ALL_UNITS.find((u) => u.weekNumber === 28 || u.id === "topic-28");
    if (examId === "exam-systems") return ALL_UNITS.find((u) => u.weekNumber === 34 || u.id === "topic-34");
    return undefined;
  }

  return { getUnitById, getPhaseByUnitId, getNextUnit, getPreviousUnit, migrateUserProgress, isExamPassed, getPhaseGatingExam, getUnitLockReason, isUnitUnlocked, calculateOverallProgress, getRequiredUnitsForExam, checkExamPrerequisites, getNextStepAfterUnit, getFirstUnitAfterExam, LEGACY_UNIT_MIGRATION };
}
