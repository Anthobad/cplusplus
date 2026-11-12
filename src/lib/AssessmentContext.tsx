import React, { createContext, useContext, useState, ReactNode } from "react";
import { AssessmentMode } from "../types";

export interface AssessmentContextValue {
  assessmentMode: AssessmentMode;
  setAssessmentMode: (mode: AssessmentMode) => void;
  isAssessmentActive: boolean;
  assessmentTitle?: string;
  setAssessmentTitle: (title: string | undefined) => void;
}

const AssessmentContext = createContext<AssessmentContextValue>({
  assessmentMode: "none",
  setAssessmentMode: () => {},
  isAssessmentActive: false,
  assessmentTitle: undefined,
  setAssessmentTitle: () => {},
});

export const AssessmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>("none");
  const [assessmentTitle, setAssessmentTitle] = useState<string | undefined>(undefined);

  const isAssessmentActive = assessmentMode !== "none";

  return (
    <AssessmentContext.Provider
      value={{
        assessmentMode,
        setAssessmentMode,
        isAssessmentActive,
        assessmentTitle,
        setAssessmentTitle,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = () => useContext(AssessmentContext);
