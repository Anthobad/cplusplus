import React, { createContext, useContext, useState, ReactNode } from "react";
import { AssessmentMode } from "../types";

export interface AssessmentContextValue {
  assessmentMode: AssessmentMode;
  setAssessmentMode: (mode: AssessmentMode) => void;
  isAssessmentActive: boolean;
  canUseAiMentor: boolean;
  assessmentTitle?: string;
  setAssessmentTitle: (title: string | undefined) => void;
}

const AssessmentContext = createContext<AssessmentContextValue>({
  assessmentMode: "none",
  setAssessmentMode: () => {},
  isAssessmentActive: false,
  canUseAiMentor: true,
  assessmentTitle: undefined,
  setAssessmentTitle: () => {},
});

export const AssessmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>("none");
  const [assessmentTitle, setAssessmentTitle] = useState<string | undefined>(undefined);

  const isAssessmentActive = assessmentMode !== "none";
  // RULE 7: Normal AI Mentor must be disabled whenever assessmentMode !== "none"
  // (Mock interview uses its dedicated AI interviewer, not normal mentor)
  const canUseAiMentor = assessmentMode === "none";

  return (
    <AssessmentContext.Provider
      value={{
        assessmentMode,
        setAssessmentMode,
        isAssessmentActive,
        canUseAiMentor,
        assessmentTitle,
        setAssessmentTitle,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = () => useContext(AssessmentContext);
