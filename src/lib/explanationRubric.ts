/** Archive-only shape for previously finalized explanation grades. No runtime grading. */
export type ExplanationCriterionId = 'correctness' | 'reasoning' | 'qualification';
export interface ExplanationCriterionResult {
  id: ExplanationCriterionId;
  level: 0 | 1 | 2;
  evidence: string;
  feedback: string;
}
export interface ExplanationAssessment {
  status: 'graded';
  questionId: string;
  rubricVersion: 'cpp-explanation-v1';
  evaluatedBy: 'ai-rubric' | 'unanswered';
  model: string;
  score: number; // percentage; the exam scales this to the question's existing points
  criteria: ExplanationCriterionResult[];
  fundamentalError: { present: boolean; evidence: string; feedback: string };
  feedback: string;
}
