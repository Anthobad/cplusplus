import { CURRICULUM_SERVER_CHALLENGES } from './curriculumChallengeRegistry.js';
import { RunnerTestCase, Comparator } from "./codeRunner.js";
import { EXAM_SERVER_CHALLENGES } from './examChallengeRegistry.js';
import { INTERVIEW_SERVER_CHALLENGES } from './interviewChallengeRegistry.js';

export interface ServerCodingChallenge {
  id: string;
  title: string;
  driverCode?: string;
  comparator?: Comparator;
  publicTests: RunnerTestCase[];
  hiddenTests: RunnerTestCase[];
  sourcePrefix?: string;
  alwaysUseDriver?: boolean;
}

// Historical cc-w aliases share the exact same trusted contract as the corresponding cc-t ID.
const aliases = Object.fromEntries(Object.entries(CURRICULUM_SERVER_CHALLENGES)
  .map(([id, challenge]) => [id.replace(/^cc-t/, 'cc-w'), challenge]));
export const SERVER_CHALLENGE_REGISTRY: Record<string, ServerCodingChallenge> = {
  ...EXAM_SERVER_CHALLENGES,
  ...INTERVIEW_SERVER_CHALLENGES,
  ...CURRICULUM_SERVER_CHALLENGES,
  ...aliases,
};

export function getTrustedChallenge(challengeId: string): ServerCodingChallenge | undefined {
  return SERVER_CHALLENGE_REGISTRY[challengeId];
}
