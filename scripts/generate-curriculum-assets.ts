/** Build browser assets from the authoritative composed curriculum; never learner state. */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ALL_PHASES } from '../src/data/curriculum';
import { CURRICULUM_EXAMS } from '../src/data/exams';
import type { Unit } from '../src/types';
import type { UnitSummary } from '../src/data/curriculumTypes';

const directory = fileURLToPath(new URL('../src/generated/curriculum/', import.meta.url));
mkdirSync(directory, { recursive: true });
function emit(name: string, value: unknown) {
  const file = `${directory}${name}`;
  const data = JSON.stringify(value);
  if (existsSync(file) && readFileSync(file, 'utf8') === data) return;
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, data);
  renameSync(temporary, file);
}
const summarize = (unit: Unit): UnitSummary => ({
  id: unit.id, weekNumber: unit.weekNumber, phaseId: unit.phaseId, title: unit.title,
  subtitle: unit.subtitle, goals: unit.goals, topics: unit.topics, estimatedHours: unit.estimatedHours,
  quiz: { id: unit.quiz.id, passingScorePercentage: unit.quiz.passingScorePercentage },
  exercises: { codingChallenge: { id: unit.exercises.codingChallenge.id } },
});
for (const phase of ALL_PHASES) {
  emit(`domain-${phase.number}.json`, phase.weeks);
}
emit('index.json', {
  phases: ALL_PHASES.map(phase => ({ ...phase, weeks: phase.weeks.map(summarize) })),
  exams: CURRICULUM_EXAMS.map(({ questions: _questions, ...exam }) => exam),
});
console.log('Generated curriculum index and four domain assets.');
