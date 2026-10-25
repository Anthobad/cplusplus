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

import type { Phase, Unit } from "../types";
import { withGuideCoverage } from "./curriculumGuideContent.js";
import { withBeginnerLessons } from "./beginnerLessons.js";
import { DOMAIN_1_UNITS } from "./domain1_basics.js";
import { DOMAIN_2_UNITS } from "./domain2_datastructures.js";
import { DOMAIN_3_UNITS } from "./domain3_oop.js";
import { DOMAIN_4_UNITS } from "./domain4_algorithms.js";
import { createCurriculum } from "./createCurriculum.js";

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
  weeks: withGuideCoverage(withBeginnerLessons(DOMAIN_1_UNITS)),
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
  weeks: withGuideCoverage(withBeginnerLessons(DOMAIN_2_UNITS)),
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
  weeks: withGuideCoverage(withBeginnerLessons(DOMAIN_3_UNITS)),
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
  weeks: withGuideCoverage(withBeginnerLessons(DOMAIN_4_UNITS)),
};

export const ALL_PHASES: Phase[] = [
  DOMAIN_1_PHASE,
  DOMAIN_2_PHASE,
  DOMAIN_3_PHASE,
  DOMAIN_4_PHASE,
];

export const ALL_UNITS: Unit[] = ALL_PHASES.flatMap((p) => p.weeks);

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
