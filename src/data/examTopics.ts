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
// New deterministic question IDs keep their own evidence identity; historical IDs remain valid.
const deterministicSources: Record<string,string> = {
  'det-ef-wtw-2': 'ef-wtw-2',
  'det-ef-wtw-4': 'ef-wtw-4',
  'det-estl-wtw-1': 'estl-wtw-1',
  'det-estl-wtw-2': 'estl-wtw-2',
  'det-estl-wtw-3': 'estl-wtw-3',
  'det-esys-wtw-2': 'esys-wtw-2',
  'det-esys-ca-1': 'esys-ca-1',
  'det-esys-ca-2': 'esys-ca-2',
  'det-esys-ca-3': 'esys-ca-3',
  'det-efin-wtw-2': 'efin-wtw-2',
  'det-efin-ca-1': 'efin-ca-1',
  'det-ex3-q4': 'ex3-q4',
  'det-ex4-q1': 'ex4-q1',
  'det-ex4-q4': 'ex4-q4',
  'det-ef-wtw-1': 'ef-wtw-1',
  'det-ef-ca-2': 'ef-ca-2',
  'det-ef-ca-3': 'ef-ca-3',
  'det-exam-foundations-understanding-transfer': 'exam-foundations-understanding-transfer',
  'det-estl-ca-2': 'estl-ca-2',
  'det-exam-stl-understanding-transfer': 'exam-stl-understanding-transfer',
  'det-esys-wtw-1': 'esys-wtw-1',
  'det-exam-systems-understanding-transfer': 'exam-systems-understanding-transfer',
  'det-efin-ca-2': 'efin-ca-2',
  'det-ex1-q3': 'ex1-q3',
  'det-ex3-q1': 'ex3-q1',
  'det-exam-final-understanding-transfer': 'exam-final-understanding-transfer',
  'det-ef-wtw-3': 'ef-wtw-3',
  'det-ef-ca-1': 'ef-ca-1',
  'det-estl-ca-1': 'estl-ca-1',
  'det-estl-ca-3': 'estl-ca-3',
  'det-efin-wtw-1': 'efin-wtw-1',
  'det-ex1-q4': 'ex1-q4',
  'det-ex2-q1': 'ex2-q1',
  'det-ex2-q4': 'ex2-q4',
  'obj-ef-tf-1': 'ef-tf-1',
  'obj-ef-tf-2': 'ef-tf-2',
  'obj-ef-tf-3': 'ef-tf-3',
  'obj-ef-tf-4': 'ef-tf-4',
  'obj-ef-tf-5': 'ef-tf-5',
  'obj-ef-tf-6': 'ef-tf-6',
  'obj-estl-tf-1': 'estl-tf-1',
  'obj-estl-tf-2': 'estl-tf-2',
  'obj-estl-tf-3': 'estl-tf-3',
  'obj-estl-tf-4': 'estl-tf-4',
  'obj-estl-tf-5': 'estl-tf-5',
  'obj-esys-tf-1': 'esys-tf-1',
  'obj-esys-tf-2': 'esys-tf-2',
  'obj-esys-tf-3': 'esys-tf-3',
  'obj-esys-tf-4': 'esys-tf-4',
  'obj-efin-tf-1': 'efin-tf-1',
  'obj-efin-tf-2': 'efin-tf-2',
  'obj-efin-tf-3': 'efin-tf-3',
  'obj-efin-tf-4': 'efin-tf-4',
  'obj-ex1-q6': 'ex1-q6',
  'obj-ex3-q6': 'ex3-q6',
  'obj-ex4-q6': 'ex4-q6',
  'obj-ex1-q2': 'ex1-q2',
  'obj-ex2-q3': 'ex2-q3',
  'obj-ex2-q6': 'ex2-q6',
  'obj-ex3-q3': 'ex3-q3',
  'obj-ex4-q3': 'ex4-q3',
};
for (const [id,source] of Object.entries(deterministicSources)) {
  mappings[id] = { ...mappings[source], evidenceId: id };
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
