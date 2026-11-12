import { describe, expect, it, vi } from 'vitest';
import { gradeExam, evaluateExamCode, normalizeOutput } from '../src/lib/examGrading';
import type { Exam, ExamQuestionDetail, CodeEvaluationResult } from '../src/types';
const coding:ExamQuestionDetail={id:'coding',type:'coding',points:20,question:'Implement',explanation:'',codingChallengeId:'exam-estl-cc-2'};
const result=(overrides:Partial<CodeEvaluationResult>={}):CodeEvaluationResult=>({compiled:true,passed:true,score:100,testsPassed:4,totalTests:4,testResults:[],mode:'assessment',wasAssisted:false,verified:true,...overrides});
const exam:Exam={id:'test',title:'Test',description:'',durationMinutes:60,passingScore:50,allowCppReference:true,coversPhases:[1],questions:[
 {id:'mcq',type:'mcq',points:30,question:'',explanation:'',options:['A','B','C','D'],optionIds:['a','b','c','d'],correctAnswer:'b'},
 {id:'output',type:'predict_output',points:30,question:'',explanation:'',acceptedAnswers:['Hello World\n1  2\n3.0']},
 {id:'blank',type:'fill_blank',points:20,question:'',explanation:'',acceptedAnswers:['std::size_t','size_t']},coding]};
const answers={mcq:'b',output:'Hello World\n1  2\n3.0',blank:'size_t'};
describe('Deterministic exam grading',()=>{
 it('grades all objective types without executing code for them',async()=>{
   const run=vi.fn(async()=>result());const graded=await gradeExam(exam,{...answers,coding:'implementation'},run);
   expect(graded.score).toBe(100);expect(run).toHaveBeenCalledOnce();expect(graded.questionScores).toHaveLength(4);
 });
 it('normalizes only specified output whitespace',()=>{
   expect(normalizeOutput('\r\n Hello  World \t\r3.0\r\n\r\n')).toBe(' Hello  World\n3.0');
   expect(normalizeOutput('1  2')).not.toBe(normalizeOutput('1 2'));expect(normalizeOutput('3.0')).not.toBe('3');
 });
 it.each(['hello World\n1  2\n3.0','Hello World\n1 2\n3.0','Hello World\n1  2\n3',''])('rejects incorrect exact output %j',async output=>{
   expect((await gradeExam({...exam,questions:[exam.questions[1]]},{output})).score).toBe(0);
 });
 it('accepts line endings and trailing blank lines',async()=>{expect((await gradeExam({...exam,questions:[exam.questions[1]]},{output:'\r\nHello World \t\r\n1  2\r3.0\r\n'})).score).toBe(100);});
 it.each(['std::size_t',' size_t '])('accepts explicit blank alias %s',async blank=>{expect((await gradeExam({...exam,questions:[exam.questions[2]]},{blank})).score).toBe(100);});
 it.each(['Size_t','size_t;','std :: size_t',''])('rejects blank %s',async blank=>{expect((await gradeExam({...exam,questions:[exam.questions[2]]},{blank})).score).toBe(0);});
 it('does not confuse displayed option positions with stable IDs',async()=>{
   const q={...exam.questions[0],options:['D','C','B','A'],optionIds:['d','c','b','a']};
   expect((await gradeExam({...exam,questions:[q]},{mcq:'b'})).score).toBe(100);
   expect((await gradeExam({...exam,questions:[q]},{mcq:2})).score).toBe(0);
 });
 it('uses only compiler test fractions for partial coding credit',async()=>{
   const graded=await gradeExam(exam,{...answers,coding:'code'},async()=>result({passed:false,verified:false,testsPassed:2}));
   expect(graded.score).toBe(90);expect(graded.codingPoints.coding).toBe(10);
 });
 it('preserves compile-failure zero and unanswered no-work policy',async()=>{
   const request=vi.fn();expect((await evaluateExamCode(coding,'',request)).score).toBe(0);expect(request).not.toHaveBeenCalled();
   expect((await gradeExam({...exam,questions:[coding]},{coding:'invalid'},async()=>result({compiled:false,passed:false,verified:false,testsPassed:0}))).score).toBe(0);
 });
 it.each([429,500,503])('does not finalize an infrastructure failure %s',async status=>{
   await expect(gradeExam(exam,{coding:'code'},(q,a)=>evaluateExamCode(q,a,vi.fn(async()=>new Response('{}',{status}))))).rejects.toThrow('not finalized');
 });
 it('validates compiler result integrity and canonical request contract',async()=>{
   const request=vi.fn<typeof fetch>(async()=>new Response(JSON.stringify(result())));await evaluateExamCode(coding,'valid',request);
   expect(JSON.parse(request.mock.calls[0][1]!.body as string)).toEqual({challengeId:'exam-estl-cc-2',studentCode:'valid',mode:'assessment',wasAssisted:false});
   for(const r of [result({totalTests:0}),result({testsPassed:9}),result({verified:false}),result({mode:'practice'}),{error:'unavailable'}]){
     await expect(evaluateExamCode(coding,'valid',vi.fn(async()=>new Response(JSON.stringify(r))))).rejects.toThrow();
   }
 });
 it('retires old free-text formats rather than regrading them',async()=>{await expect(gradeExam({...exam,questions:[{...coding,type:'code-analysis'}]},{})).rejects.toThrow('format has been updated');});
});
