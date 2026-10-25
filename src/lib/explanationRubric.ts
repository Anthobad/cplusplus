export const EXPLANATION_RUBRIC_VERSION = 'cpp-explanation-v1';
export const EXPLANATION_CRITERIA = [
  { id: 'correctness', label: 'Technical correctness', weight: 50,
    description: 'State the applicable rule, outcome or defect accurately.' },
  { id: 'reasoning', label: 'Reasoning and application', weight: 35,
    description: 'Explain why it happens and apply the rule to the question or code.' },
  { id: 'qualification', label: 'Assumptions, limits or correction', weight: 15,
    description: 'Give a relevant assumption, limitation, correction or counterexample.' },
] as const;

export type ExplanationCriterionId = typeof EXPLANATION_CRITERIA[number]['id'];
export interface ExplanationCriterionResult {
  id: ExplanationCriterionId;
  level: 0 | 1 | 2;
  evidence: string;
  feedback: string;
}
export interface ExplanationAssessment {
  status: 'graded';
  questionId: string;
  rubricVersion: typeof EXPLANATION_RUBRIC_VERSION;
  evaluatedBy: 'ai-rubric' | 'unanswered';
  model: string;
  score: number; // percentage; the exam scales this to the question's existing points
  criteria: ExplanationCriterionResult[];
  fundamentalError: { present: boolean; evidence: string; feedback: string };
  feedback: string;
}

export function canonicalExplanationId(id: string): string {
  return id.replace(/_s\d+$/, '');
}

export function explanationPercentage(criteria: ExplanationCriterionResult[], fundamentalError: boolean): number {
  const correctness = criteria.find(criterion => criterion.id === 'correctness')!.level;
  const raw = EXPLANATION_CRITERIA.reduce((sum, criterion) =>
    sum + criterion.weight * criteria.find(result => result.id === criterion.id)!.level / 2, 0);
  const cap = fundamentalError || correctness === 0 ? 25 : correctness === 1 ? 75 : 100;
  return Math.min(cap, Math.round(raw));
}

export function unansweredExplanation(questionId: string): ExplanationAssessment {
  return { status: 'graded', questionId: canonicalExplanationId(questionId), rubricVersion: EXPLANATION_RUBRIC_VERSION,
    evaluatedBy: 'unanswered', model: '', score: 0,
    criteria: EXPLANATION_CRITERIA.map(criterion => ({ id: criterion.id, level: 0, evidence: '', feedback: 'No explanation submitted.' })),
    fundamentalError: { present: false, evidence: '', feedback: '' }, feedback: 'No explanation submitted. Zero explanation points awarded.' };
}
