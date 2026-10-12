import { describe, it, expect } from "vitest";
import { calculateReadiness } from "../src/lib/readinessAnalytics";
import { UserProgress } from "../src/types";

describe("Interview Readiness & Needs Review Analytics", () => {
  const blankProgress: UserProgress = {
    userId: "guest",
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
    studentName: "New Student",
    studentLevel: "Beginner",
    totalCodingChallengesSolved: 0,
  };

  it("handles blank progress with Insufficient Data and zero fabricated mastery", () => {
    const readiness = calculateReadiness(blankProgress);

    expect(readiness.hasEnoughData).toBe(false);
    expect(readiness.overallStatus).toBe("Insufficient Data");
    expect(readiness.overallScore).toBe(0);

    // All dimensions must report Insufficient Data when no quizzes or exams have been taken
    for (const dim of readiness.dimensions) {
      expect(dim.status).toBe("Insufficient Data");
      expect(dim.score).toBe(0);
      expect(dim.dataPointsCount).toBe(0);
    }

    // No fake weaknesses if no tests were attempted
    expect(readiness.weakTopics.length).toBe(0);
  });

  it("calculates real scores and identifies topics that need review (score < 70%)", () => {
    const studentWithResults: UserProgress = {
      ...blankProgress,
      completedUnitIds: ["topic-1", "topic-2", "topic-4", "topic-18"],
      quizScores: {
        "quiz-t1": { score: 90, passed: true },
        "quiz-t2": { score: 85, passed: true },
        "quiz-t4": { score: 95, passed: true },
        // Failed / Low score in Smart Pointers (Topic 18)
        "quiz-t18": { score: 55, passed: false },
      },
      codingChallengeResults: {
        "cc-t1": { passed: true, score: 100, testsPassed: 3, totalTests: 3, timestamp: 123, verified: true },
        // Failed coding challenge
        "cc-t18": { passed: false, score: 40, testsPassed: 1, totalTests: 3, timestamp: 123, verified: false },
      },
      mockInterviewReports: [
        {
          id: "rep-1",
          timestamp: 12345,
          preset: "30-min",
          overallScore: 78,
          passed: true,
          categories: [],
          strengths: [],
          weaknesses: [],
          missedConcepts: [],
          recommendedModules: [],
        },
      ],
    };

    const readiness = calculateReadiness(studentWithResults);

    expect(readiness.hasEnoughData).toBe(true);

    // Fundamentals dimension (quiz-t1: 90, quiz-t2: 85, quiz-t4: 95) -> avg 90 -> "Strong"
    const fundDim = readiness.dimensions.find((d) => d.name === "C++ Fundamentals");
    expect(fundDim).toBeDefined();
    expect(fundDim!.status).toBe("Strong");
    expect(fundDim!.score).toBe(90);

    // Interview Performance dimension -> 78% -> "Developing"
    const intDim = readiness.dimensions.find((d) => d.name === "Technical Interview Performance");
    expect(intDim).toBeDefined();
    expect(intDim!.status).toBe("Developing");
    expect(intDim!.score).toBe(78);

    // Weak topics section: must detect quiz-t18 (55%) and cc-t18 (40%)
    expect(readiness.weakTopics.length).toBeGreaterThanOrEqual(1);
    const weakUnit18 = readiness.weakTopics.find((w) => w.unitId === "topic-18");
    expect(weakUnit18).toBeDefined();
    expect(weakUnit18!.score).toBeLessThan(70);
  });
});
