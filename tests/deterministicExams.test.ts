import { describe,it,expect,vi } from 'vitest';
import express from 'express';
import { once } from 'node:events';
import { ACTIVE_EXAMS,ACTIVE_POOLS,generateActiveExam,publicExam } from '../server/data/activeExams';
import { createTrustedRoutes,validateExamAnswers } from '../server/security/routes';
import { createProgressService } from '../server/security/progress';
import { createAccess } from '../server/security/access';
import { rejectDuplicateJsonKeys } from '../server/security/json';
import { ALL_UNITS } from '../src/data/curriculum';
import type { TrustedStore } from '../server/security/store';
import { calculateReadiness } from '../src/lib/readinessAnalytics';
import { getQuestionTopics } from '../src/data/examTopics';
import { readFileSync } from 'node:fs';
class Store implements TrustedStore {
 docs:Record<string,any>={};queue=Promise.resolve();
 async read(path:string){return structuredClone(this.docs[path]);}
 async transact<T>(paths:string[],update:Parameters<TrustedStore['transact']>[1]):Promise<T>{
   const task=this.queue.then(()=>{const result=update(Object.fromEntries(paths.map(p=>[p,structuredClone(this.docs[p])])));Object.assign(this.docs,structuredClone(result.writes||{}));return result.value as T;});
   this.queue=task.then(()=>{},()=>{});return task;
 }
}
const user={uid:'learner',anonymous:false};
const answersFor=(exam:typeof ACTIVE_EXAMS[number])=>Object.fromEntries(exam.questions.map(q=>[q.id,q.type==='mcq'?q.correctAnswer:q.type==='coding'?'code':q.acceptedAnswers![0]]));
async function fixture(run:(f:any)=>Promise<void>,evaluation?:()=>Promise<any>){
 let clock=Date.now(); const now=()=>clock;
 const store=new Store(),progress=createProgressService(store,now);await progress.read(user);
 await progress.mutate(user,p=>({...p,completedUnitIds:ALL_UNITS.map(u=>u.id)}));
 const evaluate=vi.fn(evaluation||(async()=>({status:200,result:{compiled:true,passed:true,verified:true,mode:'assessment',wasAssisted:false,testsPassed:4,totalTests:4,testResults:[],score:100}})));
 const app=express();app.use(express.json({verify:(_q,_s,b)=>rejectDuplicateJsonKeys(b.toString())}));
 app.use((e:any,_q:any,res:any,next:any)=>{if(e)return res.status(400).json({error:'Invalid JSON'});next();});
 app.use('/api',createTrustedRoutes({access:createAccess(store,async token=>({uid:token,anonymous:false}),now),progress,evaluate}));
 const server=app.listen(0,'127.0.0.1');await once(server,'listening');
 const base=`http://127.0.0.1:${(server.address() as any).port}`;
 const post=(path:string,body:any,uid='learner')=>fetch(base+path,{method:'POST',headers:{Authorization:`Bearer ${uid}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const get=(path:string,uid='learner')=>fetch(base+path,{headers:{Authorization:`Bearer ${uid}`}});
 try{await run({store,progress,evaluate,post,get,base,advanceMinute:()=>{clock+=60000;}});}finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
}
describe('deterministic exam migration and integrity',()=>{
 it('has all four active types, stable IDs, topic coverage and fixed composition',()=>{
   const types=new Set<string>();let retired=0;const replacementTypes:Record<string,number>={};
   for(const exam of ACTIVE_EXAMS){
     expect(exam.questions.reduce((n,q)=>n+q.points,0)).toBe(100);
     const pool=ACTIVE_POOLS[exam.id];
     for(const q of [...exam.questions,...pool]){
       types.add(q.type);expect(q.schemaVersion).toBe(2);expect(q.difficulty).toBeTruthy();expect(getQuestionTopics(q.id)).toBeDefined();
       if(q.id.startsWith('det-')){retired++;replacementTypes[q.type]=(replacementTypes[q.type]||0)+1;}
       if(q.type==='mcq'){expect(q.options).toHaveLength(4);expect(new Set(q.options).size).toBe(4);expect(q.optionIds).toContain(q.correctAnswer);}
       if(q.type==='fill_blank')expect(q.codeSnippet!.match(/blank 1/g)).toHaveLength(1);
     }
     for(let i=0;i<20;i++){
       const selected=generateActiveExam(exam);expect(selected.questions).toHaveLength(8);
       expect(selected.questions.filter(q=>q.type==='coding')).toHaveLength(1);expect(selected.questions.reduce((n,q)=>n+q.points,0)).toBe(100);
       expect(new Set(selected.questions.map(q=>q.id)).size).toBe(8);
       for(const q of selected.questions.filter(q=>q.type==='mcq')){
         const original=pool.find(p=>p.id===q.id)!;expect(q.options![q.optionIds!.indexOf(q.correctAnswer)]).toBe(original.options![original.optionIds!.indexOf(q.correctAnswer)]);
       }
     }
   }
   expect([...types].sort()).toEqual(['coding','fill_blank','mcq','predict_output']);expect(retired).toBe(34);
   expect(replacementTypes).toEqual({mcq:14,predict_output:12,fill_blank:8});
 });
 it('never returns keys or rubrics in public start data',async()=>fixture(async({post,store})=>{
   const response=await post('/api/assessment/exam/start',{examId:'exam-foundations'});expect(response.status).toBe(200);
   const data=await response.json();for(const q of data.exam.questions){expect(q).not.toHaveProperty('correctAnswer');expect(q).not.toHaveProperty('acceptedAnswers');expect(q.explanation).toBe('');expect(q).not.toHaveProperty('testCases');expect(q).not.toHaveProperty('rubricKeywords');}
   expect(store.docs[`_assessmentSessions/${data.sessionId}`].exam.questions.some((q:any)=>q.correctAnswer!==undefined)).toBe(true);
 }));
 it('enforces typed answer shapes, stable option IDs, bounds and no unexpected IDs',()=>{
   const exam=generateActiveExam(ACTIVE_EXAMS[0]);const q=exam.questions[0];
   for(const bad of [[],{unknown:'answer'},{[q.id]:0},{[q.id]:{score:100}},{[q.id]:'forged-option'}])expect(()=>validateExamAnswers(exam,bad)).toThrow();
   expect(()=>validateExamAnswers(exam,{})).not.toThrow();
   for(const type of ['fill_blank','predict_output','coding'] as const){const question={...q,type};const limit=type==='fill_blank'?200:type==='predict_output'?4000:32000;
     expect(()=>validateExamAnswers({...exam,questions:[question]},{[q.id]:'a'.repeat(limit+1)})).toThrow();}
   expect(()=>rejectDuplicateJsonKeys('{"answers":{"q":"a","q":"b"}}')).toThrow();
   expect(()=>rejectDuplicateJsonKeys('{"answers":{"q":"a","\\u0071":"b"}}')).toThrow();
 });
 it('finalizes using private keys, returns review after finalization and makes retries idempotent',async()=>fixture(async({post,get,store,evaluate,advanceMinute})=>{
   const {sessionId}=await(await post('/api/assessment/exam/start',{examId:'exam-foundations'})).json();
   expect((await get(`/api/assessment/exam/${sessionId}/review`)).status).toBe(403);
   const trusted=store.docs[`_assessmentSessions/${sessionId}`].exam;
   const response=await post('/api/assessment/exam/submit',{sessionId,answers:answersFor(trusted)});expect(response.status).toBe(200);
   const outcome=await response.json();expect(outcome.grading.score).toBe(100);expect(outcome.attempt.questionScores).toHaveLength(8);
   expect((await get(`/api/assessment/exam/${sessionId}/review`,'another-user')).status).toBe(403);
   expect((await get(`/api/assessment/exam/${sessionId}/review`)).status).toBe(200);
   advanceMinute();const retry=await(await post('/api/assessment/exam/submit',{sessionId,answers:{}})).json();expect(retry).toEqual(outcome);expect(evaluate).toHaveBeenCalledOnce();
   expect(calculateReadiness(outcome.progress).topics.some(t=>t.examScore===100)).toBe(true);
 }));
 it('keeps compiler infrastructure failures retriable with frozen answers',async()=>{
   let fail=true;
   await fixture(async({post,store,advanceMinute})=>{
     const {sessionId}=await(await post('/api/assessment/exam/start',{examId:'exam-stl'})).json();const exam=store.docs[`_assessmentSessions/${sessionId}`].exam;const answers=answersFor(exam);
     expect((await post('/api/assessment/exam/submit',{sessionId,answers})).status).toBe(503);
     expect(store.docs['users/learner'].examAttempts).toEqual({});
     expect((await post('/api/assessment/exam/submit',{sessionId,answers:{}})).status).toBe(409);
     advanceMinute();fail=false;expect((await post('/api/assessment/exam/submit',{sessionId,answers})).status).toBe(200);
   },async()=>fail?{status:503,result:{error:'infrastructure unavailable'}}:{status:200,result:{compiled:true,passed:false,verified:false,score:50,testsPassed:2,totalTests:4,testResults:[],mode:'assessment',wasAssisted:false}});
 });
 it('preserves the original deadline and identity when shuffling',async()=>fixture(async({post})=>{
   const first=await(await post('/api/assessment/exam/start',{examId:'exam-foundations'})).json();
   const next=await(await post('/api/assessment/exam/start',{examId:'exam-foundations',sessionId:first.sessionId})).json();
   expect(next.sessionId).toBe(first.sessionId);expect(next.deadlineAt).toBe(first.deadlineAt);
 }));
 it('retires unfinished legacy sessions without recording a failure and preserves finalized history',async()=>fixture(async({progress,store,post,get,advanceMinute})=>{
   const current=await progress.startExam(user,'exam-foundations');const session=store.docs[`_assessmentSessions/${current.sessionId}`];
   delete session.exam.schemaVersion;session.exam.questions[0].type='code-analysis';
   const response=await post('/api/assessment/exam/submit',{sessionId:current.sessionId,answers:{}});expect(response.status).toBe(409);expect((await response.json()).error).toContain('format has been updated');
   expect(store.docs['users/learner'].examAttempts).toEqual({});
   const historical={id:current.sessionId,examId:'exam-foundations',score:63,passed:true,generatedQuestions:session.exam.questions};
   store.docs[`users/learner/exams/${current.sessionId}`]=historical;session.outcome={attempt:historical,grading:{score:63}};
   expect((await(await post('/api/assessment/exam/submit',{sessionId:current.sessionId,answers:{}})).json()).attempt.score).toBe(63);
   expect((await(await get(`/api/assessment/exam/${current.sessionId}/review`)).json()).score).toBe(63);
   store.docs['users/learner/exams/legacy-auto-id']=historical;expect((await get('/api/assessment/exam/legacy-auto-id/review')).status).toBe(200);
   store.docs['users/learner'].examAttempts['exam-final']={examId:'exam-final',score:41,passed:false};
   const rootOnly=await get('/api/assessment/exam/exam-final/review');expect(rootOnly.status).toBe(200);expect((await rootOnly.json()).score).toBe(41);
   session.expiresAt=0;advanceMinute();expect((await post('/api/assessment/exam/submit',{sessionId:current.sessionId,answers:{}})).status).toBe(200);
 }));
 it('concurrent finalization records only one authoritative attempt',async()=>fixture(async({post,store,evaluate,advanceMinute})=>{
   const {sessionId}=await(await post('/api/assessment/exam/start',{examId:'exam-stl'})).json();const answers=answersFor(store.docs[`_assessmentSessions/${sessionId}`].exam);
   const responses=await Promise.all([post('/api/assessment/exam/submit',{sessionId,answers}),post('/api/assessment/exam/submit',{sessionId,answers})]);
   expect(responses.some(r=>r.status===200)).toBe(true);expect(responses.every(r=>[200,429].includes(r.status))).toBe(true);
   const outcome=await responses.find(r=>r.status===200)!.json();
   advanceMinute();const retry=await(await post('/api/assessment/exam/submit',{sessionId,answers})).json();expect(retry).toEqual(outcome);
   const outcomes=[outcome];
   expect(Object.keys(store.docs).filter(k=>k.startsWith('users/learner/exams/'))).toHaveLength(1);
   expect(Object.values(outcomes[0].progress.examMasteryEvidence.questions).every((rows:any)=>rows.length===1)).toBe(true);
 }));
 it('contains no runtime provider SDK or API-key dependency',()=>{
   const pkg=JSON.parse(readFileSync('package.json','utf8'));expect(pkg.dependencies).not.toHaveProperty('@google/genai');
   expect(readFileSync('src/components/CodeChallengeEditor.tsx','utf8')).not.toMatch(/AI feedback|AI Mentor|requestAiFeedback/);
   const source=readFileSync('server.ts','utf8');expect(source).not.toMatch(/generateContent|GEMINI_API_KEY|\/api\/(chat|mock-interview|assess-explanation)/);
 });
});
