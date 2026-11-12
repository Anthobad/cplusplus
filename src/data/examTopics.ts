/** Public concept metadata only: no answers, grading rubrics or hidden tests. */
export type QuestionTopics = { topicIds: string[]; evidenceId: string; category?: 'general-problem-solving' };
const groups: Record<string, number[][]> = {
  'ef-mcq': [[18],[15],[11],[11,3],[18],[11],[18],[15]],
  'ef-tf': [[11,3],[18],[15],[11],[15],[18,33]],
  'ef-wtw': [[18],[18],[18,14],[18]],
  'ef-ca': [[15],[10,3],[18]], 'ef-cc': [[15],[15,18]],
  'estl-mcq': [[27,37],[10],[24],[24],[22],[19,27],[19]],
  'estl-tf': [[27],[22],[22],[19],[38]],
  'estl-wtw': [[22],[37],[19,34]], 'estl-ca': [[19,27],[10],[27]], 'estl-cc': [[22],[24]],
  'esys-mcq': [[3,15],[33],[33],[29],[33],[29]],
  'esys-tf': [[29],[33],[29],[33]], 'esys-wtw': [[29],[33]],
  'esys-ca': [[33],[33],[33]], 'esys-cc': [[33],[33]],
  'efin-mcq': [[14],[19,20],[34],[32],[36],[38]],
  'efin-tf': [[29],[32],[15,14],[11]], 'efin-wtw': [[18,14],[15,14]],
  'efin-ca': [[33],[29]], 'efin-cc': [[36,35],[32,18]],
  'exam-foundations-understanding': [[2],[3,5],[6],[10,3]],
  'exam-stl-understanding': [[19],[22],[24],[25]],
  'exam-systems-understanding': [[28,31],[31,3],[32],[33]],
  'exam-final-understanding': [[36],[26,38],[37],[39,35]],
};
const mappings: Record<string, QuestionTopics> = {};
for (const [prefix, topics] of Object.entries(groups)) topics.forEach((numbers, i) => {
  const id = `${prefix}-${i + 1}`;
  mappings[id] = { topicIds: numbers.map(n => `topic-${n}`), evidenceId: id };
});
const transfers: Record<string, number[]> = { foundations: [9], stl: [27], systems: [29], final: [37] };
for (const [exam, numbers] of Object.entries(transfers)) {
  const id = `exam-${exam}-understanding-transfer`;
  mappings[id] = { topicIds: numbers.map(n => `topic-${n}`), evidenceId: id };
}
const aliases: Record<string, string> = {
  'ex1-q1': 'ef-mcq-1', 'ex1-q2': 'ef-tf-1', 'ex1-q3': 'ef-wtw-1', 'ex1-q5': 'ef-mcq-2',
  'ex2-q1': 'estl-wtw-1', 'ex2-q2': 'estl-mcq-1', 'ex2-q3': 'estl-tf-1',
  'ex2-q4': 'estl-ca-1', 'ex2-q6': 'estl-tf-2', 'ex2-q7': 'estl-cc-1',
  'ex3-q1': 'esys-wtw-1', 'ex3-q2': 'efin-tf-1', 'ex3-q3': 'esys-tf-1',
  'ex3-q4': 'ef-ca-1',
  'ex4-q1': 'efin-wtw-1', 'ex4-q2': 'efin-mcq-1', 'ex4-q3': 'efin-tf-1',
  'ex4-q4': 'efin-ca-1', 'ex4-q5': 'efin-mcq-2', 'ex4-q7': 'efin-cc-1',
};
for (const [id, target] of Object.entries(aliases)) mappings[id] = mappings[target];
for (const [id, numbers] of Object.entries({ 'ex1-q4': [9], 'ex1-q6': [30,4], 'ex1-q7': [11],
  'ex2-q5': [10], 'ex3-q7': [15], 'ex3-q5': [28], 'ex3-q6': [28], 'ex4-q6': [20,36] })) {
  mappings[id] = { topicIds: numbers.map(n => `topic-${n}`), evidenceId: id };
}
export const EXAM_TOPIC_MAPPINGS: Readonly<Record<string, QuestionTopics>> = mappings;
export const baseQuestionId = (id: string) => id.replace(/_s\d+$/, '');
export const getQuestionTopics = (id: string): QuestionTopics | undefined => mappings[baseQuestionId(id)];
export function withQuestionTopics<T extends { id: string }>(question: T): T & { topicIds: string[] } {
  const mapping = getQuestionTopics(question.id);
  if (!mapping) throw new Error(`Unmapped exam question: ${question.id}`);
  return { ...question, topicIds: [...mapping.topicIds] };
}
export function validateQuestionTopics(questions: { id: string }[], canonicalIds: Set<string>) {
  const seen = new Set<string>();
  for (const question of questions) {
    if (seen.has(question.id)) throw new Error(`Duplicate exam question: ${question.id}`);
    seen.add(question.id);
    const mapping = getQuestionTopics(question.id);
    if (!mapping || (!mapping.topicIds.length && mapping.category !== 'general-problem-solving')) throw new Error(`Unmapped exam question: ${question.id}`);
    if (new Set(mapping.topicIds).size !== mapping.topicIds.length || mapping.topicIds.some(id => !canonicalIds.has(id))) throw new Error(`Invalid topic mapping: ${question.id}`);
  }
}
