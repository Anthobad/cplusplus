import { describe, it, expect } from "vitest";
import { AssessmentMode } from "../src/types";

describe("Assessment assistance restrictions", () => {
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
