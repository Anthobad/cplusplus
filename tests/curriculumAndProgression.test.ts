import { describe, it, expect } from "vitest";
import {
  ALL_PHASES,
  ALL_UNITS,
  getUnitById,
  isUnitUnlocked,
  getUnitLockReason,
  isExamPassed,
  checkExamPrerequisites,
  getNextStepAfterUnit,
} from "../src/data/curriculum";
import { CURRICULUM_EXAMS } from "../src/data/exams";
import { UserProgress } from "../src/types";

describe("Curriculum Order & Pedagogical Integrity", () => {
  it("consists of exactly 4 domains and 39 topics", () => {
    expect(ALL_PHASES.length).toBe(4);
    expect(ALL_UNITS.length).toBe(39);
  });

  it("ensures raw pointers and memory mechanics are taught BEFORE smart pointers", () => {
    const rawPointerUnit = getUnitById("topic-11");
    const classesUnit = getUnitById("topic-15");
    const smartPointersUnit = getUnitById("topic-18");

    expect(rawPointerUnit).toBeDefined();
    expect(classesUnit).toBeDefined();
    expect(smartPointersUnit).toBeDefined();

    // Raw pointers (Topic 11) must be taught before Classes (Topic 15) and Smart Pointers (Topic 18)
    expect(rawPointerUnit!.weekNumber).toBeLessThan(smartPointersUnit!.weekNumber);
    expect(rawPointerUnit!.weekNumber).toBeLessThan(classesUnit!.weekNumber);
    expect(classesUnit!.weekNumber).toBeLessThan(smartPointersUnit!.weekNumber);

    // Verify titles reflect correct learning order
    expect(rawPointerUnit!.title.toLowerCase()).toContain("pointer");
    expect(rawPointerUnit!.title.toLowerCase()).toContain("memory");
    expect(classesUnit!.title.toLowerCase()).toContain("class");
    expect(smartPointersUnit!.title.toLowerCase()).toContain("smart pointer");
  });

  it("orders curriculum: Domain I (Language Basics Topics 1–18) -> Domain II (Data Structures Topics 19–27) -> Domain III (OOP Topics 28–33) -> Domain IV (Algorithms Topics 34–39)", () => {
    const domainTitles = ALL_PHASES.map((p) => p.title.toLowerCase());
    expect(domainTitles[0]).toContain("language basics");
    expect(domainTitles[1]).toContain("data structures");
    expect(domainTitles[2]).toContain("object-oriented");
    expect(domainTitles[3]).toContain("algorithms");

    expect(ALL_PHASES[0].weeks.length).toBe(18);
    expect(ALL_PHASES[1].weeks.length).toBe(9);
    expect(ALL_PHASES[2].weeks.length).toBe(6);
    expect(ALL_PHASES[3].weeks.length).toBe(6);
  });

  it("verifies pedagogical prerequisite ordering across beginner foundations", () => {
    const programStructure = getUnitById("topic-1")!;
    const variables = getUnitById("topic-2")!;
    const operators = getUnitById("topic-4")!;
    const ioStreams = getUnitById("topic-6")!;
    const conditionals = getUnitById("topic-7")!;
    const loops = getUnitById("topic-8")!;
    const functions = getUnitById("topic-9")!;
    const rawPointers = getUnitById("topic-11")!;
    const classes = getUnitById("topic-15")!;
    const smartPointers = getUnitById("topic-18")!;

    // Step-by-step beginner ramp
    expect(programStructure.weekNumber).toBeLessThan(variables.weekNumber);
    expect(variables.weekNumber).toBeLessThan(operators.weekNumber);
    expect(operators.weekNumber).toBeLessThan(ioStreams.weekNumber);
    expect(ioStreams.weekNumber).toBeLessThan(conditionals.weekNumber);
    expect(conditionals.weekNumber).toBeLessThan(loops.weekNumber);
    expect(loops.weekNumber).toBeLessThan(functions.weekNumber);
    expect(functions.weekNumber).toBeLessThan(rawPointers.weekNumber);
    expect(rawPointers.weekNumber).toBeLessThan(classes.weekNumber);
    expect(classes.weekNumber).toBeLessThan(smartPointers.weekNumber);
  });

  it("ensures raw pointers precede node-based data structures (linked lists, trees)", () => {
    const rawPointers = getUnitById("topic-11")!;
    const linkedList = getUnitById("topic-20")!;
    const trees = getUnitById("topic-25")!;

    expect(rawPointers.weekNumber).toBeLessThan(linkedList.weekNumber);
    expect(rawPointers.weekNumber).toBeLessThan(trees.weekNumber);
  });

  it("ensures basic classes precede inheritance and virtual vtables", () => {
    const classes = getUnitById("topic-15")!;
    const inheritance = getUnitById("topic-28")!;
    const polymorphism = getUnitById("topic-29")!;

    expect(classes.weekNumber).toBeLessThan(inheritance.weekNumber);
    expect(inheritance.weekNumber).toBeLessThan(polymorphism.weekNumber);
  });

  it("places advanced templates and concurrency in Domain III", () => {
    const templates = getUnitById("topic-32")!;
    const concurrency = getUnitById("topic-33")!;

    expect(templates.phaseId).toBe("phase-3");
    expect(concurrency.phaseId).toBe("phase-3");
    expect(templates.weekNumber).toBe(32);
    expect(concurrency.weekNumber).toBe(33);
  });
});

describe("Unit Unlocking & Step-by-Step Gating", () => {
  const baseProgress: UserProgress = {
    userId: "test-user",
    unlockedUnits: ["topic-1"],
    completedUnits: [],
    completedUnitIds: [],
    unitQuizScores: {},
    quizScores: {},
    examAttempts: {},
    currentUnitId: "topic-1",
    currentWeekNumber: 1,
    streakDays: 1,
    lastActiveDate: "2026-10-04",
    studySessionsCount: 1,
    studentName: "Test Student",
    studentLevel: "Beginner",
    totalCodingChallengesSolved: 0,
  };

  it("Topic 1 is always unlocked by default", () => {
    expect(isUnitUnlocked("topic-1", baseProgress)).toBe(true);
  });

  it("Topic 2 is locked when Topic 1 is incomplete", () => {
    const lock = getUnitLockReason("topic-2", baseProgress);
    expect(lock.isLocked).toBe(true);
    expect(lock.reason).toBe("prev_unit");
    expect(lock.requiredUnit?.id).toBe("topic-1");
  });

  it("Topic 2 unlocks once Topic 1 is completed", () => {
    const updated: UserProgress = {
      ...baseProgress,
      completedUnitIds: ["topic-1"],
    };
    expect(isUnitUnlocked("topic-2", updated)).toBe(true);
  });

  it("Domain II (Topic 19) is locked by Milestone Exam 1 until Exam 1 is passed", () => {
    // Student completed all prerequisite units (Topics 1 to 18) but hasn't passed Exam 1
    const completedTopics1to18 = Array.from({ length: 18 }, (_, i) => `topic-${i + 1}`);
    const progressTopics1to18: UserProgress = {
      ...baseProgress,
      completedUnitIds: completedTopics1to18,
    };

    const lock = getUnitLockReason("topic-19", progressTopics1to18);
    expect(lock.isLocked).toBe(true);
    expect(lock.reason).toBe("milestone_exam");
    expect(lock.requiredExam?.id).toBe("exam-foundations");
  });

  it("A score below 50 on a Milestone Exam does NOT unlock progression (minScore 50)", () => {
    const completedTopics1to18 = Array.from({ length: 18 }, (_, i) => `topic-${i + 1}`);
    const failedExamProgress: UserProgress = {
      ...baseProgress,
      completedUnitIds: completedTopics1to18,
      examAttempts: {
        "exam-foundations": {
          examId: "exam-foundations",
          score: 48,
          passed: false,
        },
      },
    };

    expect(isExamPassed("exam-foundations", failedExamProgress)).toBe(false);
    expect(isUnitUnlocked("topic-19", failedExamProgress)).toBe(false);
  });

  it("Scoring >= 50 on Milestone Exam 1 successfully unlocks Domain II (Topic 19)", () => {
    const completedTopics1to18 = Array.from({ length: 18 }, (_, i) => `topic-${i + 1}`);
    const passedExamProgress: UserProgress = {
      ...baseProgress,
      completedUnitIds: completedTopics1to18,
      examAttempts: {
        "exam-foundations": {
          examId: "exam-foundations",
          score: 85,
          passed: true,
        },
      },
    };

    expect(isExamPassed("exam-foundations", passedExamProgress)).toBe(true);
    expect(isUnitUnlocked("topic-19", passedExamProgress)).toBe(true);
  });

  it("getNextStepAfterUnit directs student to Milestone Exam 1 upon completing Topic 18", () => {
    const completedTopics1to18 = Array.from({ length: 18 }, (_, i) => `topic-${i + 1}`);
    const progressAtTopic18: UserProgress = {
      ...baseProgress,
      completedUnitIds: completedTopics1to18,
    };

    const nextStep = getNextStepAfterUnit("topic-18", progressAtTopic18);
    expect(nextStep.type).toBe("milestone_exam");
    expect(nextStep.requiredExam?.id).toBe("exam-foundations");
  });

  it("getNextStepAfterUnit directs student to Milestone Exam 2 upon completing Topic 27", () => {
    const completedTopics1to27 = Array.from({ length: 27 }, (_, i) => `topic-${i + 1}`);
    const progressAtTopic27: UserProgress = {
      ...baseProgress,
      completedUnitIds: completedTopics1to27,
      examAttempts: {
        "exam-foundations": { examId: "exam-foundations", score: 80, passed: true },
      },
    };

    const nextStep = getNextStepAfterUnit("topic-27", progressAtTopic27);
    expect(nextStep.type).toBe("milestone_exam");
    expect(nextStep.requiredExam?.id).toBe("exam-stl");
  });

  it("getNextStepAfterUnit directs student to Milestone Exam 3 upon completing Topic 33", () => {
    const completedTopics1to33 = Array.from({ length: 33 }, (_, i) => `topic-${i + 1}`);
    const progressAtTopic33: UserProgress = {
      ...baseProgress,
      completedUnitIds: completedTopics1to33,
      examAttempts: {
        "exam-foundations": { examId: "exam-foundations", score: 80, passed: true },
        "exam-stl": { examId: "exam-stl", score: 80, passed: true },
      },
    };

    const nextStep = getNextStepAfterUnit("topic-33", progressAtTopic33);
    expect(nextStep.type).toBe("milestone_exam");
    expect(nextStep.requiredExam?.id).toBe("exam-systems");
  });

  it("getNextStepAfterUnit directs student to Final Milestone Exam upon completing Topic 39", () => {
    const completedTopics1to39 = Array.from({ length: 39 }, (_, i) => `topic-${i + 1}`);
    const progressAtTopic39: UserProgress = {
      ...baseProgress,
      completedUnitIds: completedTopics1to39,
      examAttempts: {
        "exam-foundations": { examId: "exam-foundations", score: 80, passed: true },
        "exam-stl": { examId: "exam-stl", score: 80, passed: true },
        "exam-systems": { examId: "exam-systems", score: 80, passed: true },
      },
    };

    const nextStep = getNextStepAfterUnit("topic-39", progressAtTopic39);
    expect(nextStep.type).toBe("milestone_exam");
    expect(nextStep.requiredExam?.id).toBe("exam-final");
  });
});
