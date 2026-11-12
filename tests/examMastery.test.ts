import { describe, it, expect } from 'vitest';
import { ALL_UNITS } from '../src/data/curriculumSummary';
import { CURRICULUM_EXAMS } from '../src/data/exams';
import { EXAM_QUESTION_POOLS, generateRandomizedExam } from '../src/data/examQuestionPools';
import { EXAM_TOPIC_MAPPINGS, getQuestionTopics, validateQuestionTopics } from '../src/data/examTopics';
import { calculateReadiness } from '../src/lib/readinessAnalytics';
import { addExamEvidence, examEvidenceForProgress, questionScoresForAttempt } from '../src/lib/examMastery';
import type { ExamAttempt, ExamMasteryEvidence, UserProgress } from '../src/types';

const blank = (): UserProgress => ({ completedUnitIds:[],completedUnits:[],quizScores:{},examAttempts:{} } as UserProgress);
const perfect = () => ({ ...blank(), completedUnitIds:ALL_UNITS.map(u=>u.id),
  quizScores:Object.fromEntries(ALL_UNITS.map(u=>[u.quiz.id,{score:100,passed:true}])),
  codingChallengeResults:Object.fromEntries(ALL_UNITS.map(u=>[u.exercises.codingChallenge.id,{score:100,passed:true,verified:true,wasAssisted:false,testsPassed:1,totalTests:1,timestamp:1}])) });
const attempt = (ids: string[], score: number, id='a', timestamp=1, examId='exam-foundations'): ExamAttempt => ({
  id,timestamp,examId,score,passed:score>=50,integritySource:'server-v2',
  questionScores:ids.map(questionId=>({questionId,earned:score/10,possible:10})),
});
const withAttempt = (a: ExamAttempt, p: UserProgress=perfect()) => ({...p,examAttempts:{[a.examId]:a}});
const topic = (p: UserProgress, id='topic-18') => calculateReadiness(p).topics.find(t=>t.unitId===id)!;
const pointerIds=['ef-mcq-1','ef-mcq-5','ef-mcq-7'];

describe('exam-aware mastery',()=> {
  it('maps every pooled, fallback and sampled question to valid canonical topics',()=> {
    const questions=[...Object.values(EXAM_QUESTION_POOLS).flat(),...CURRICULUM_EXAMS.flatMap(e=>e.questions)];
    expect(()=>validateQuestionTopics(questions,new Set(ALL_UNITS.map(u=>u.id)))).not.toThrow();
    expect(questions.length).toBe(Object.keys(EXAM_TOPIC_MAPPINGS).length);
    for(const q of questions)expect(q.topicIds).toEqual(getQuestionTopics(q.id)!.topicIds);
    for(const exam of CURRICULUM_EXAMS)for(const q of generateRandomizedExam(exam).questions)expect(getQuestionTopics(q.id)).toBeDefined();
  });
  it('rejects unmapped, duplicate, invalid and duplicated topic references',()=> {
    expect(()=>validateQuestionTopics([{id:'unknown'}],new Set())).toThrow('Unmapped');
    expect(()=>validateQuestionTopics([{id:pointerIds[0]},{id:pointerIds[0]}],new Set(['topic-18']))).toThrow('Duplicate');
    expect(()=>validateQuestionTopics([{id:pointerIds[0]}],new Set())).toThrow('Invalid');
    const mapping=getQuestionTopics(pointerIds[0])!;mapping.topicIds.push('topic-18');
    try {expect(()=>validateQuestionTopics([{id:pointerIds[0]}],new Set(['topic-18']))).toThrow('Invalid');}
    finally {mapping.topicIds.pop();}
  });
  it('lowers perfect lesson scores for poor topic exams and explains specific review',()=> {
    const p=withAttempt(attempt(pointerIds,40));const r=calculateReadiness(p);
    expect(topic(p).score).toBe(71);expect(r.overallScore).toBeLessThan(100);
    expect(r.weakTopics.find(t=>t.unitId==='topic-18')?.reason).toContain('Exam performance 40%');
    expect(p.completedUnitIds).toHaveLength(39);
  });
  it('completion alone does not create mastery and poor exams affect a completed curriculum',()=> {
    const p={...blank(),completedUnitIds:ALL_UNITS.map(u=>u.id)};
    expect(calculateReadiness(p).overallScore).toBe(0);
    const failed=withAttempt(attempt(pointerIds,0),p);
    expect(topic(failed).score).toBe(0);expect(topic(failed).completed).toBe(true);
    expect(calculateReadiness(failed).weakTopics).toHaveLength(1);
  });
  it('repeated independent mistakes increase influence but a single failure does not recommend review',()=> {
    const single=withAttempt(attempt([pointerIds[0]],0));const multiple=withAttempt(attempt(pointerIds,0));
    expect(topic(single).score).toBeGreaterThan(topic(multiple).score);
    expect(calculateReadiness(single).weakTopics).toHaveLength(0);
    expect(calculateReadiness(multiple).weakTopics[0].unitId).toBe('topic-18');
  });
  it('one wrong question among strong evidence is not a review recommendation',()=> {
    const a=attempt(pointerIds,100);a.questionScores![0].earned=0;
    const p=withAttempt(a);expect(topic(p).score).toBe(84);expect(calculateReadiness(p).weakTopics).toHaveLength(0);
  });
  it('uses partial credit rather than binary failure for coding and explanations',()=> {
    const a=attempt(['ef-cc-2','ef-wtw-3'],60);const p=withAttempt(a);
    expect(topic(p).examScore).toBeCloseTo(60);expect(topic(p).examQuestions).toBe(1);
    expect(topic(p).score).toBeGreaterThan(topic(withAttempt(attempt(['ef-cc-2','ef-wtw-3'],0))).score);
  });
  it('splits one multi-topic question into one total contribution',()=> {
    const p=withAttempt(attempt(['ef-tf-6'],0));
    expect(topic(p).examQuestions).toBe(.5);expect(topic(p,'topic-33').examQuestions).toBe(.5);
    expect(topic(p).examQuestions+topic(p,'topic-33').examQuestions).toBe(1);
  });
  it('ignores unknown questions instead of misassigning general problem solving',()=> {
    const p=withAttempt(attempt(['general-unknown'],0));expect(topic(p).examScore).toBeUndefined();
    expect(calculateReadiness(p).weakTopics).toHaveLength(0);
  });
  it('supports explicitly classified general questions without inventing topic evidence',()=> {
    const mappings=EXAM_TOPIC_MAPPINGS as Record<string, {topicIds:string[];evidenceId:string;category?:'general-problem-solving'}>;
    mappings['general-test']={topicIds:[],evidenceId:'general-test',category:'general-problem-solving'};
    try {
      expect(()=>validateQuestionTopics([{id:'general-test'}],new Set(ALL_UNITS.map(u=>u.id)))).not.toThrow();
      const p=withAttempt(attempt(['general-test'],0));
      expect(calculateReadiness(p).topics.every(t=>t.examScore===undefined)).toBe(true);
    } finally {delete mappings['general-test'];}
  });
  it('bounds retakes to three observations and never expands distinct evidence weight',()=> {
    let e:ExamMasteryEvidence={version:1,questions:{}};
    for(let i=0;i<100;i++)e=addExamEvidence(e,attempt(pointerIds,i<99?0:100,`a${i}`,i));
    expect(Object.values(e.questions).every(o=>o.length===3)).toBe(true);
    const p={...perfect(),examMasteryEvidence:e};expect(topic(p).examQuestions).toBe(3);
    expect(topic(p).examScore).toBeCloseTo(60);expect(topic(p).score).toBe(81);
  });
  it('repeated failures on one question warrant review without increasing its weight',()=> {
    let evidence:ExamMasteryEvidence={version:1,questions:{}};
    for(let i=0;i<3;i++)evidence=addExamEvidence(evidence,attempt([pointerIds[0]],0,`a${i}`,i));
    const p={...perfect(),examMasteryEvidence:evidence};
    expect(topic(p).examQuestions).toBe(1);expect(topic(p).observations).toBe(3);
    expect(calculateReadiness(p).weakTopics.find(t=>t.unitId==='topic-18')).toBeDefined();
  });
  it('recognizes improvement without erasing earlier failures',()=> {
    let e=addExamEvidence({version:1,questions:{}},attempt(pointerIds,40,'first',1));
    const before=topic({...perfect(),examMasteryEvidence:e});
    e=addExamEvidence(e,attempt(pointerIds,90,'second',2));
    const after=topic({...perfect(),examMasteryEvidence:e});
    expect(after.examScore).toBeCloseTo(73.3333);expect(after.examScore).toBeLessThan(90);
    expect(after.score).toBeGreaterThan(before.score);expect(after.improvement).toBe(50);
    expect(calculateReadiness({...perfect(),examMasteryEvidence:e}).weakTopics).toHaveLength(0);
  });
  it('recognizes the same topic across exams and deduplicates fallback aliases',()=> {
    const p={...perfect(),examAttempts:{first:attempt(['ef-mcq-1'],0,'a',1),second:attempt(['ex1-q1'],100,'b',2,'exam-final')}};
    expect(topic(p).examQuestions).toBe(1);expect(topic(p).observations).toBe(2);
    expect(topic(p).examScore).toBeCloseTo(66.6667);
  });
  it('preserves aggregate-only history honestly without adding it to detailed evidence',()=> {
    const a={examId:'exam-final',score:10,passed:false};const p={...perfect(),examAttempts:{old:a}};
    const before=structuredClone(p);const r=calculateReadiness(p);
    expect(r.legacyExamCount).toBe(1);expect(r.legacyExamAverage).toBe(10);expect(r.overallScore).toBe(100);expect(p).toEqual(before);
    const detailed=withAttempt(attempt(pointerIds,40));const result=calculateReadiness(detailed);
    detailed.examAttempts['exam-foundations'].score=100;
    expect(calculateReadiness(detailed).overallScore).toBe(result.overallScore);
  });
  it('reconstructs shuffled historical MCQs and actual saved partial grades only',()=> {
    const a:ExamAttempt={id:'old',examId:'exam-foundations',score:50,passed:true,integritySource:'server-v2',
      answers:{'ef-mcq-1_s0':2},generatedQuestions:[
        {id:'ef-mcq-1_s0',type:'mcq',points:10,question:'',explanation:'',correctAnswer:2},
        {id:'ef-wtw-1_s0',type:'why-this-code-works',points:15,question:'',explanation:''},
      ]};
    expect(questionScoresForAttempt(a)).toEqual([{questionId:'ef-mcq-1_s0',earned:10,possible:10}]);
    delete a.integritySource;expect(questionScoresForAttempt(a)).toEqual([]);
  });
  it('does not turn unattempted exams or missing lesson assessments into zero scores',()=> {
    const quizOnly={...blank(),currentUnitId:'topic-1',quizScores:{'quiz-t1':{score:100,passed:true}}};
    const r=calculateReadiness(quizOnly);
    expect(r.topics[0].score).toBe(100);expect(r.topics[0].examScore).toBeUndefined();
    expect(r.topics[0].examWeight).toBe(0);expect(r.reachedScore).toBe(100);expect(r.reachedStatus).toBe('Strong');
    expect(r.overallScore).toBe(3);expect(r.weakTopics).toHaveLength(0);
    const examOnly=withAttempt(attempt(pointerIds,60),blank());
    expect(topic(examOnly).score).toBe(60);expect(topic(examOnly).examWeight).toBe(1);
  });
  it('separates full-curriculum coverage from readiness for assessed reached topics',()=> {
    const p={...blank(),currentUnitId:'topic-5',completedUnitIds:['topic-1','topic-2'],
      quizScores:{'quiz-t1':{score:100,passed:true},'quiz-t2':{score:80,passed:true}}};
    const r=calculateReadiness(p);
    expect(r.reachedTopics).toBe(5);expect(r.reachedAssessedTopics).toBe(2);expect(r.reachedScore).toBe(90);
    expect(r.overallScore).toBe(5);expect(r.coverage).toBe(5);
    expect(r.topics[4].hasEvidence).toBe(false);expect(r.weakTopics).toHaveLength(0);
    expect(calculateReadiness(blank()).reachedStatus).toBe('Insufficient Data');
  });
  it('retains actual zeros on finalized unanswered questions',()=> {
    const a=attempt(pointerIds,0);const p=withAttempt(a);
    expect(topic(p).examScore).toBe(0);expect(topic(p).score).toBe(52);
    expect(calculateReadiness(p).weakTopics.find(t=>t.unitId==='topic-18')).toBeDefined();
  });
  it('is deterministic and idempotent for retries and lazy historical bootstrap',()=> {
    const a=attempt(pointerIds,40);const once=addExamEvidence({version:1,questions:{}},a);
    expect(addExamEvidence(once,a)).toEqual(once);
    const p={...withAttempt(a),examMasteryEvidence:once};expect(examEvidenceForProgress(p)).toEqual(once);
    expect(calculateReadiness(p)).toEqual(calculateReadiness(p));
  });
  it('handles missing history, sparse evidence and malformed scores within bounds',()=> {
    const p=blank();expect(calculateReadiness(p).overallStatus).toBe('Insufficient Data');
    p.quizScores={'quiz-t1':{score:Infinity,passed:true},'quiz-t2':{score:-100,passed:false}};
    const r=calculateReadiness(p);for(const t of r.topics){expect(t.score).toBeGreaterThanOrEqual(0);expect(t.score).toBeLessThanOrEqual(100);}
    const sparse=withAttempt(attempt([pointerIds[0]],100),blank());
    expect(topic(sparse).confidence).toBe('Limited');expect(topic(sparse).score).toBe(100);
    const quizOnly={...blank(),quizScores:{'quiz-t18':{score:100,passed:true}}};
    expect(topic(quizOnly).score).toBe(100);
  });
});
