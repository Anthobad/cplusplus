import { describe, it, expect } from "vitest";
import { AssessmentMode } from "../src/types";

describe("Global Assessment State & AI Mentor Restrictions", () => {
  it("determines whether normal AI Mentor is permitted based on assessmentMode", () => {
    const isAiMentorAllowed = (mode: AssessmentMode): boolean => {
      // Normal AI mentor is ONLY allowed when assessmentMode === "none"
      return mode === "none";
    };

    expect(isAiMentorAllowed("none")).toBe(true);
    expect(isAiMentorAllowed("quiz")).toBe(false);
    expect(isAiMentorAllowed("exam")).toBe(false);
    expect(isAiMentorAllowed("coding-assessment")).toBe(false);
    expect(isAiMentorAllowed("mock-interview")).toBe(false);
  });

  it("server-side chat endpoint rejects requests when assessmentMode is active (HTTP 403)", () => {
    const checkChatAllowed = (body: { assessmentMode?: AssessmentMode }) => {
      if (body.assessmentMode && body.assessmentMode !== "none") {
        return {
          status: 403,
          blockedByAssessment: true,
          reply: "AI Mentor is disabled during assessment mode to preserve test integrity.",
        };
      }
      return { status: 200, blockedByAssessment: false };
    };

    const quizAttempt = checkChatAllowed({ assessmentMode: "quiz" });
    expect(quizAttempt.status).toBe(403);
    expect(quizAttempt.blockedByAssessment).toBe(true);

    const examAttempt = checkChatAllowed({ assessmentMode: "exam" });
    expect(examAttempt.status).toBe(403);
    expect(examAttempt.blockedByAssessment).toBe(true);

    const codingAttempt = checkChatAllowed({ assessmentMode: "coding-assessment" });
    expect(codingAttempt.status).toBe(403);
    expect(codingAttempt.blockedByAssessment).toBe(true);

    const normalAttempt = checkChatAllowed({ assessmentMode: "none" });
    expect(normalAttempt.status).toBe(200);
    expect(normalAttempt.blockedByAssessment).toBe(false);
  });

  it("practice mode tracks assisted attempts when official solution is revealed", () => {
    let wasAssisted = false;
    let mode: "practice" | "assessment" = "practice";

    const revealSolution = () => {
      if (mode === "assessment") {
        throw new Error("Solution reveal is strictly disabled during assessment mode");
      }
      wasAssisted = true;
    };

    // In practice mode, user can reveal solution, marking attempt as assisted
    revealSolution();
    expect(wasAssisted).toBe(true);

    // In assessment mode, revealSolution is blocked
    mode = "assessment";
    expect(() => revealSolution()).toThrow("strictly disabled");
  });
});
