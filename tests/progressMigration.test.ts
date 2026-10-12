import { describe, it, expect } from "vitest";
import { migrateUserProgress, LEGACY_UNIT_MIGRATION, ALL_UNITS } from "../src/data/curriculum";
import { UserProgress } from "../src/types";

describe("Learner Progress Migration (migrateUserProgress)", () => {
  it("translates legacy domain-based IDs and week aliases to canonical topic IDs without progress loss", () => {
    const legacyProgress: UserProgress = {
      userId: "user-123",
      unlockedUnits: ["domain1-week-1", "domain1-week-18", "domain3-week-29"],
      completedUnits: ["domain1-week-1", "domain1-week-18", "domain3-week-29"],
      completedUnitIds: ["domain1-week-1", "domain1-week-18", "domain3-week-29"],
      unitQuizScores: {
        "quiz-t1": { score: 90, passed: true, attempts: 1, timestamp: 123456 },
      },
      quizScores: {
        "quiz-t1": { score: 90, passed: true },
      },
      examAttempts: {
        "exam-foundations": {
          examId: "exam-foundations",
          score: 80,
          passed: true,
        },
      },
      currentUnitId: "domain1-week-18",
      currentWeekNumber: 18,
      streakDays: 5,
      lastActiveDate: "2026-10-04",
      studySessionsCount: 10,
      studentName: "Senior Engineer Candidate",
      studentLevel: "Advanced",
      totalCodingChallengesSolved: 3,
    };

    const migrated = migrateUserProgress(legacyProgress);

    // Verify domain1-week-18 mapped to topic-18
    // Verify domain3-week-29 mapped to topic-29
    expect(migrated.completedUnitIds).toContain("topic-1");
    expect(migrated.completedUnitIds).toContain("topic-18");
    expect(migrated.completedUnitIds).toContain("topic-29");

    // Check that currentUnitId was migrated
    expect(migrated.currentUnitId).toBe("topic-18");
    expect(migrated.currentWeekNumber).toBe(18);

    // Check that exams and scores were preserved
    expect(migrated.quizScores["quiz-t1"]?.score).toBe(90);
    expect(migrated.examAttempts["exam-foundations"]?.score).toBe(80);
    expect(migrated.examAttempts["exam-foundations"]?.passed).toBe(true);
  });

  it("preserves authoritative topic-1 to topic-39 IDs without modification", () => {
    const modernProgress: UserProgress = {
      userId: "user-456",
      unlockedUnits: ["topic-1", "topic-2", "topic-3"],
      completedUnits: ["topic-1", "topic-2"],
      completedUnitIds: ["topic-1", "topic-2"],
      unitQuizScores: {},
      quizScores: {},
      examAttempts: {},
      currentUnitId: "topic-3",
      currentWeekNumber: 3,
      streakDays: 2,
      lastActiveDate: "2026-10-04",
      studySessionsCount: 2,
      studentName: "Modern Student",
      studentLevel: "Beginner",
      totalCodingChallengesSolved: 1,
    };

    const migrated = migrateUserProgress(modernProgress);

    expect(migrated.completedUnitIds).toEqual(["topic-1", "topic-2"]);
    expect(migrated.unlockedUnits).toContain("topic-1");
    expect(migrated.currentUnitId).toBe("topic-3");
  });

  it("filters out unknown invalid IDs and always keeps topic-1 unlocked", () => {
    const corruptedProgress: UserProgress = {
      userId: "user-789",
      unlockedUnits: ["fake-nonexistent-unit-999"],
      completedUnits: ["fake-nonexistent-unit-999"],
      completedUnitIds: ["fake-nonexistent-unit-999"],
      unitQuizScores: {},
      quizScores: {},
      examAttempts: {},
      currentUnitId: "fake-nonexistent-unit-999",
      currentWeekNumber: 999,
      streakDays: 1,
      lastActiveDate: "2026-10-04",
      studySessionsCount: 1,
      studentName: "Student",
      studentLevel: "Beginner",
      totalCodingChallengesSolved: 0,
    };

    const migrated = migrateUserProgress(corruptedProgress);

    expect(migrated.completedUnitIds).toEqual([]);
    expect(migrated.unlockedUnits).toContain("topic-1");
    expect(migrated.currentUnitId).toBe("topic-1");
  });
});
