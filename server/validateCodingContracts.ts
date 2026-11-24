import type { CodingChallenge, ExamQuestionDetail, Unit } from '../src/types';
import { getTrustedChallenge } from './challengeRegistry.js';

/** Build-time alignment checks. All inputs are authored source, never browser submissions. */
export function validateCodingContracts(units: Unit[], examQuestions: ExamQuestionDetail[], interviewChallenges: CodingChallenge[]) {
  const seen = new Set<string>();
  for (const unit of units) {
    const challenge = unit.exercises.codingChallenge;
    if (seen.has(challenge.id)) throw new Error(`Duplicate curriculum coding ID: ${challenge.id}`);
    seen.add(challenge.id);
    const trusted = getTrustedChallenge(challenge.id);
    if (!trusted || trusted.id !== challenge.id || trusted.title !== challenge.title || trusted.driverCode !== challenge.driverCode ||
      JSON.stringify(trusted.publicTests) !== JSON.stringify(challenge.testCases)) {
      throw new Error(`Coding contract mismatch for ${unit.id} / ${challenge.id}. Sync the trusted driver/tests with the authored exercise; do not renumber IDs by lesson position.`);
    }
    if (getTrustedChallenge(challenge.id.replace(/^cc-t/, 'cc-w')) !== trusted) throw new Error(`Broken coding alias: ${challenge.id}`);
  }
  for (const challenge of interviewChallenges) {
    const trusted = getTrustedChallenge(challenge.id);
    if (!trusted || trusted.id !== challenge.id || !trusted.alwaysUseDriver || !trusted.driverCode || !trusted.sourcePrefix ||
      JSON.stringify(trusted.publicTests) !== JSON.stringify(challenge.testCases)) throw new Error(`Interview coding contract mismatch: ${challenge.id}`);
  }
  for (const question of examQuestions.filter(q => q.type === 'coding')) {
    const trusted = getTrustedChallenge(question.codingChallengeId!);
    if (!trusted || !trusted.alwaysUseDriver || !trusted.driverCode || !trusted.sourcePrefix || !question.initialCode?.trim()) {
      throw new Error(`Exam coding contract missing: ${question.id}`);
    }
  }
}
