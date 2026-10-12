/**
 * ============================================================================
 * PERMANENT ARCHITECTURAL INVARIANT - DO NOT ALTER OR DELETE
 * ============================================================================
 * This is the TRUE, authoritative 4-Domain Systems Engineering Curriculum (Topics 1–39):
 * - Domain I: Language Basics (Topics 1–18)
 *     Milestone Gate: Milestone Exam 1 (Language Basics) [exam-foundations] (score >= 50)
 * - Domain II: Data Structures (Topics 19–27)
 *     Milestone Gate: Milestone Exam 2 (Data Structures & STL Containers) [exam-stl] (score >= 50)
 * - Domain III: Object-Oriented Programming (Topics 28–33)
 *     Milestone Gate: Milestone Exam 3 (Object-Oriented Programming & Pointers) [exam-systems] (score >= 50)
 * - Domain IV: Algorithms (Topics 34–39)
 *     Final Milestone: Comprehensive Job-Ready C++ Certification Exam [exam-final]
 *
 * UNDER NO CIRCUMSTANCES should this structure be replaced, deleted, or reverted
 * to older/generic week plans.
 * ============================================================================
 */

import { Phase, Unit, UserProgress, Exam } from "../types";
import { DOMAIN_1_UNITS } from "./domain1_basics";
import { DOMAIN_2_UNITS } from "./domain2_datastructures";
import { DOMAIN_3_UNITS } from "./domain3_oop";
import { DOMAIN_4_UNITS } from "./domain4_algorithms";
import { CURRICULUM_EXAMS } from "./exams";

/**
 * Authoritative 4-Domain Systems Engineering Curriculum (Topics 1–39).
 * - Domain I: Language Basics (Topics 1–18)
 * - Domain II: Data Structures (Topics 19–27)
 * - Domain III: Object-Oriented Programming (Topics 28–33)
 * - Domain IV: Algorithms (Topics 34–39)
 */
export const DOMAIN_1_PHASE: Phase = {
  id: "phase-1",
  number: 1,
  title: "Domain I: Language Basics",
  weeksRange: "Topics 1–18",
  calendarMonth: "Domain 1",
  description: "C++ Program structure, fundamental types, memory lifecycles, operators, I/O streams, control flow, functions & references, raw pointers & physical memory, compilation, exceptions, classes, and smart pointers.",
  color: "blue",
  iconName: "Code2",
  weeks: DOMAIN_1_UNITS,
};

export const DOMAIN_2_PHASE: Phase = {
  id: "phase-2",
  number: 2,
  title: "Domain II: Data Structures",
  weeksRange: "Topics 19–27",
  calendarMonth: "Domain 2",
  description: "Sequential arrays (vector, array), linked structures (list, forward_list), sets, maps, stack LIFO, queue FIFO & priority queues, binary search trees, graphs, and iterator algorithms.",
  color: "emerald",
  iconName: "Database",
  weeks: DOMAIN_2_UNITS,
};

export const DOMAIN_3_PHASE: Phase = {
  id: "phase-3",
  number: 3,
  title: "Domain III: Object-Oriented Programming",
  weeksRange: "Topics 28–33",
  calendarMonth: "Domain 3",
  description: "Inheritance hierarchies, dynamic polymorphism & vtables, operator overloading, SOLID principles, templates & generic programming, and multi-threading synchronization.",
  color: "purple",
  iconName: "Boxes",
  weeks: DOMAIN_3_UNITS,
};

export const DOMAIN_4_PHASE: Phase = {
  id: "phase-4",
  number: 4,
  title: "Domain IV: Algorithms",
  weeksRange: "Topics 34–39",
  calendarMonth: "Domain 4",
  description: "Asymptotic time complexity (Big-O/Omega/Theta), space complexity, two pointers, sliding window, sorting algorithms (Introsort), searching, and recursion.",
  color: "amber",
  iconName: "Cpu",
  weeks: DOMAIN_4_UNITS,
};

export const ALL_PHASES: Phase[] = [
  DOMAIN_1_PHASE,
  DOMAIN_2_PHASE,
  DOMAIN_3_PHASE,
  DOMAIN_4_PHASE,
];

export const ALL_UNITS: Unit[] = ALL_PHASES.flatMap((p) => p.weeks);

/**
 * Universal lookup supporting "topic-X", "week-X", and legacy aliases.
 */
export function getUnitById(id: string): Unit | undefined {
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

export function getPhaseByUnitId(unitId: string): Phase | undefined {
  const unit = getUnitById(unitId);
  if (!unit) return undefined;
  return ALL_PHASES.find((p) => p.weeks.some((w) => w.id === unit.id || w.weekNumber === unit.weekNumber));
}

export function getNextUnit(currentUnitId: string): Unit | null {
  const currentUnit = getUnitById(currentUnitId);
  if (!currentUnit) return null;
  const index = ALL_UNITS.findIndex((u) => u.weekNumber === currentUnit.weekNumber);
  if (index >= 0 && index < ALL_UNITS.length - 1) {
    return ALL_UNITS[index + 1];
  }
  return null;
}

export function getPreviousUnit(currentUnitId: string): Unit | null {
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
export const LEGACY_UNIT_MIGRATION: Record<string, string> = {
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

export function migrateUserProgress(raw: UserProgress): UserProgress {
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

export function isExamPassed(examId: string, progress: UserProgress): boolean {
  const attempt = progress.examAttempts?.[examId];
  if (!attempt) return false;
  return Boolean(attempt.passed && typeof attempt.score === "number" && attempt.score >= 50);
}

export function getPhaseGatingExam(phaseNumber: number): { id: string; title: string; minScore: number } | null {
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

export function getUnitLockReason(unitId: string, progress: UserProgress): {
  isLocked: boolean;
  reason?: "prev_unit" | "milestone_exam";
  requiredUnit?: Unit;
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

export function isUnitUnlocked(unitId: string, progress: UserProgress): boolean {
  return !getUnitLockReason(unitId, progress).isLocked;
}

export function calculateOverallProgress(progress: UserProgress) {
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

export function getRequiredUnitsForExam(exam: Exam): Unit[] {
  if (!exam.coversPhases || exam.coversPhases.length === 0) return [];
  const maxPhase = Math.max(...exam.coversPhases);
  return ALL_PHASES.filter((p) => p.number <= maxPhase).flatMap((p) => p.weeks);
}

export function checkExamPrerequisites(
  exam: Exam,
  progress: UserProgress
): {
  isUnlocked: boolean;
  totalRequired: number;
  completedCount: number;
  missingUnits: Unit[];
  firstMissingUnit?: Unit;
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

export function getNextStepAfterUnit(
  currentUnitId: string,
  progress: UserProgress
): {
  type: "next_unit" | "milestone_exam" | "curriculum_completed";
  nextUnit?: Unit;
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

export function getFirstUnitAfterExam(examId: string): Unit | undefined {
  if (examId === "exam-foundations") return ALL_UNITS.find((u) => u.weekNumber === 19 || u.id === "topic-19");
  if (examId === "exam-stl") return ALL_UNITS.find((u) => u.weekNumber === 28 || u.id === "topic-28");
  if (examId === "exam-systems") return ALL_UNITS.find((u) => u.weekNumber === 34 || u.id === "topic-34");
  return undefined;
}
