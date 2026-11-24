import { validateCodingContracts } from '../server/validateCodingContracts';
import { describe,it,expect } from 'vitest';
import { ALL_UNITS } from '../src/data/curriculum';
import { ACTIVE_EXAMS,ACTIVE_POOLS } from '../server/data/activeExams';
import { INTERVIEW_PRACTICE } from '../src/data/interviewPractice';
import { EXAM_SOLUTIONS } from './fixtures/examSolutions';
import { getTrustedChallenge } from '../server/challengeRegistry';
import { evaluateSubmission } from '../server/evaluateSubmission';
import { LocalCodeRunner } from '../server/codeRunner';

const runner=new LocalCodeRunner();
const curriculum=ALL_UNITS.map(unit=>({label:unit.id,id:unit.exercises.codingChallenge.id,
  initialCode:unit.exercises.codingChallenge.initialCode,solutionCode:unit.exercises.codingChallenge.solutionCode}));
const examQuestions=[...Object.values(ACTIVE_POOLS).flat(),...ACTIVE_EXAMS.flatMap(e=>e.questions)].filter(q=>q.type==='coding');
const exam=[...new Map(examQuestions.map(q=>[q.codingChallengeId+'\0'+q.initialCode,{label:q.id,id:q.codingChallengeId!,initialCode:q.initialCode!,solutionCode:EXAM_SOLUTIONS[q.codingChallengeId!]}])).values()];
const interview=INTERVIEW_PRACTICE.map(lesson=>({label:lesson.id,id:lesson.challenge.id,initialCode:lesson.challenge.initialCode,solutionCode:lesson.challenge.solutionCode}));
const starters=[...curriculum,...exam,...interview];

describe('complete coding contract regression',()=>{
 it('binds every curriculum ID and historical alias to the authored driver and public tests',()=>{
   for(const unit of ALL_UNITS){const c=unit.exercises.codingChallenge;const trusted=getTrustedChallenge(c.id)!;
     expect(trusted.id).toBe(c.id);expect(trusted.title).toBe(c.title);expect(trusted.driverCode).toBe(c.driverCode);
     expect(trusted.publicTests).toEqual(c.testCases);expect(getTrustedChallenge(c.id.replace(/^cc-t/,'cc-w'))).toBe(trusted);
   }
   expect(new Set(curriculum.map(c=>c.id)).size).toBe(39);
 });
 it('rejects future driver drift and duplicate exercise IDs during content generation',()=>{
   const validate=(units:typeof ALL_UNITS)=>validateCodingContracts(units,examQuestions,INTERVIEW_PRACTICE.map(l=>l.challenge));
   expect(()=>validate(ALL_UNITS)).not.toThrow();
   const wrong=structuredClone(ALL_UNITS);
   wrong[2].exercises.codingChallenge.driverCode=ALL_UNITS[3].exercises.codingChallenge.driverCode;
   expect(()=>validate(wrong)).toThrow('Coding contract mismatch');
   const duplicate=structuredClone(ALL_UNITS);duplicate[1].exercises.codingChallenge=duplicate[0].exercises.codingChallenge;
   expect(()=>validate(duplicate)).toThrow('Duplicate');
 });
 it.each(starters)('$label starter $id compiles with its actual trusted harness',async exercise=>{
   expect(exercise.initialCode).toBeTruthy();expect(getTrustedChallenge(exercise.id)).toBeDefined();
   const response=await evaluateSubmission({challengeId:exercise.id,studentCode:exercise.initialCode,mode:'assessment',wasAssisted:false},
     {evaluate:request=>runner.evaluate({...request,testCases:request.testCases.slice(0,1),timeoutMs:100})});
   expect(response.result.compileError,exercise.id).toBeUndefined();expect(response.result.compiled,exercise.id).toBe(true);
 },15000);
 it.each(curriculum)('$label reference $id passes every public and hidden test',async exercise=>{
   const response=await evaluateSubmission({challengeId:exercise.id,studentCode:exercise.solutionCode,mode:'assessment',wasAssisted:false},runner);
   expect(response.result.compileError,exercise.id).toBeUndefined();
   expect(response.result.testResults.filter(t=>!t.passed),exercise.id).toEqual([]);
   expect(response.result.verified,exercise.id).toBe(true);
   expect(response.result.testsPassed).toBe(response.result.totalTests);
 },15000);
});
