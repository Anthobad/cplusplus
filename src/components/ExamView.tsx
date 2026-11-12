import { calculateReadiness } from '../lib/readinessAnalytics';
import React, { useEffect, useRef, useState } from 'react';
import type { Exam, ExamAttempt, ExamQuestionDetail, UserProgress } from '../types';
import { trustedRequest } from '../lib/authenticatedFetch';
import { cacheTrustedExam } from '../lib/firebase';
import { useAssessment } from '../lib/AssessmentContext';
import { checkExamPrerequisites, getFirstUnitAfterExam } from '../data/curriculumSummary';

type Props={exam:Exam;userId:string;onExitExam:()=>void;onOpenDocs:()=>void;progress?:UserProgress;
  onSelectUnit?:(id:string)=>void;onExamAttemptSaved?:(progress:UserProgress)=>void};
/** Read-only highlighting: React escapes all source; no HTML interpretation. */
export function ExamCode({code}:{code:string}){
 const tokens=code.split(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/[^\n]*|\b(?:int|auto|const|void|struct|class|return|if|else|for|while|virtual|override|noexcept|public|private|template|typename|delete|new|bool)\b)/g);
 return <pre className="p-4 overflow-x-auto bg-slate-950 rounded-lg text-xs font-mono whitespace-pre"><code>{tokens.map((token,i)=><span key={i} className={/^['"]/.test(token)?'text-emerald-300':token.startsWith('//')?'text-slate-500':/^[a-z]+$/.test(token)?'text-purple-300':'text-slate-200'}>{token}</span>)}</code></pre>;
}
export function ExamQuestionInput({question,answer,onChange,disabled}:{question:ExamQuestionDetail;answer:string;onChange:(value:string)=>void;disabled:boolean}){
 return <fieldset disabled={disabled} className="space-y-3 min-w-0">
   <legend className="font-semibold text-white mb-3">{question.question}</legend>
   {question.codeSnippet&&<ExamCode code={question.codeSnippet}/>}
   {question.type==='mcq'?question.options?.map((text,i)=><label key={question.optionIds![i]} className="flex items-start gap-3 p-3 border border-slate-700 rounded-lg cursor-pointer has-[:checked]:border-blue-400">
     <input type="radio" name={question.id} value={question.optionIds![i]} checked={answer===question.optionIds![i]} onChange={()=>onChange(question.optionIds![i])}/><span>{text}</span>
   </label>):question.type==='fill_blank'?<label className="block">Blank 1
     <input aria-label="Blank 1" maxLength={200} value={answer} onChange={e=>onChange(e.target.value)} autoComplete="off" spellCheck={false} className="block w-full mt-2 p-3 bg-slate-950 border border-slate-700 rounded font-mono"/>
   </label>:<label className="block">{question.type==='coding'?'C++20 source':'Predicted output'}
     {question.codingInstructions&&<p className="text-xs text-slate-400 my-2">{question.codingInstructions}</p>}
     <textarea aria-label={question.type==='coding'?'C++20 source':'Predicted output'} spellCheck={false} maxLength={question.type==='coding'?32000:4000} rows={question.type==='coding'?16:5}
       value={answer} onChange={e=>onChange(e.target.value)} className="block w-full mt-2 p-3 bg-slate-950 border border-slate-700 rounded font-mono whitespace-pre"/>
   </label>}
 </fieldset>;
}
export function ExamResults({attempt}:{attempt:ExamAttempt}){
 const rows=attempt.questionScores||[];
 return <section className="space-y-4">
   <h2 className="text-xl font-bold">{attempt.score}% — {attempt.passed?'Passed':'Needs Review'}</h2>
   {rows.length>0&&<p>{rows.reduce((n,q)=>n+q.earned,0)} / {rows.reduce((n,q)=>n+q.possible,0)} points</p>}
   {(attempt.generatedQuestions||[]).map(q=>{
     const row=rows.find(r=>r.questionId===q.id),coding=attempt.codingResults?.[q.id];
     const answer=q.type==='mcq'?(q.optionIds?q.options?.[q.optionIds.indexOf(q.correctAnswer)]:q.options?.[q.correctAnswer]):q.acceptedAnswers?.join(' or ');
     return <article key={q.id} className="p-4 border border-slate-700 rounded-xl space-y-2">
       <h3 className="font-bold">{q.question}</h3>
       {row&&<p>{row.earned}/{row.possible} points — {row.earned===row.possible?'Correct':row.earned===0?'Incorrect / unanswered':'Partial credit'}</p>}
       <p className="text-xs text-blue-300">Topics: {q.topicIds?.join(', ')||'Historical mapping'}</p>
       {answer!==undefined&&<div>Correct answer:<pre className="whitespace-pre-wrap font-mono">{String(answer)}</pre></div>}
       <p className="text-sm text-slate-300">{q.explanation}</p>
       {coding&&<div className="text-sm"><p>{coding.testsPassed}/{coding.totalTests} tests passed</p>
         {coding.compileError&&<pre className="whitespace-pre-wrap text-red-300">{coding.compileError}</pre>}
         {coding.runtimeError&&<pre className="whitespace-pre-wrap text-red-300">{coding.runtimeError}</pre>}
         <p>{coding.verified?'Verified compiler result':'Compiler-backed assessment result'}</p>
         <ul>{coding.testResults.filter(test=>!test.isHidden).map((test,i)=><li key={test.testId||i} className="my-2">
           Public test {i+1}: {test.passed?'Passed':'Failed'}
           <pre className="whitespace-pre-wrap">{test.error||test.actualOutput||''}</pre>
         </li>)}</ul></div>}
       {attempt.explanationResults?.[q.id]&&<p className="text-sm text-slate-400">Historical feedback: {attempt.explanationResults[q.id].feedback}</p>}
     </article>;
   })}
 </section>;
}
export const ExamView:React.FC<Props>=({exam,userId,onExitExam,onOpenDocs,progress,onSelectUnit,onExamAttemptSaved})=>{
 const [active,setActive]=useState<Exam>();const [sessionId,setSessionId]=useState('');const [answers,setAnswers]=useState<Record<string,string>>({});
 const [selected,setSelected]=useState(0);const [remaining,setRemaining]=useState(0);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const [locked,setLocked]=useState(false);const [result,setResult]=useState<ExamAttempt>();const [warnings,setWarnings]=useState(0);
 const version=useRef(0),end=useRef(0),inFlight=useRef(false),submitRef=useRef<(automatic?:boolean)=>Promise<void>>(async()=>{});
 const autoSubmitted=useRef(false);const {setAssessmentMode,setAssessmentTitle}=useAssessment();
 const unlocked=!progress||checkExamPrerequisites(exam,progress).isUnlocked;
 async function start(shuffle=false){
   const current=++version.current;setBusy(true);setError('');
   try{
     const sent=performance.now();
     const response=await trustedRequest<{sessionId:string;exam:Exam;deadlineAt:number;serverNow:number}>('/api/assessment/exam/start',{examId:exam.id,...(shuffle?{sessionId}:{})});
     if(version.current!==current)return;
     setActive(response.exam);setSessionId(response.sessionId);setAnswers({});setSelected(0);setLocked(false);setResult(undefined);
     autoSubmitted.current=false;end.current=performance.now()+Math.max(0,response.deadlineAt-response.serverNow-(performance.now()-sent));
     setRemaining(Math.max(0,Math.ceil((end.current-performance.now())/1000)));
   }catch(e){if(version.current===current)setError((e as Error).message);}
   finally{if(version.current===current)setBusy(false);}
 }
 useEffect(()=>{setActive(undefined);setSessionId('');setResult(undefined);setAnswers({});setLocked(false);
   if(unlocked)void start();return()=>{version.current++;};},[exam.id,userId,unlocked]);
 useEffect(()=>{setAssessmentMode(result||!active?'none':'exam');setAssessmentTitle(active?.title);return()=>{setAssessmentMode('none');setAssessmentTitle(undefined);};},[active,result]);
 useEffect(()=>{
   if(!active||result)return;
   const tick=()=>{const value=Math.max(0,Math.ceil((end.current-performance.now())/1000));setRemaining(value);
     if(!value&&!autoSubmitted.current){autoSubmitted.current=true;void submitRef.current(true);}};
   const timer=setInterval(tick,1000);const blur=()=>setWarnings(n=>n+1);window.addEventListener('blur',blur);
   return()=>{clearInterval(timer);window.removeEventListener('blur',blur);};
 },[active,result]);
 async function submit(automatic=false){
   if(inFlight.current||!sessionId||result)return;
   if(!automatic&&!locked&&!window.confirm('Finalize these answers? Unanswered questions receive zero points.'))return;
   inFlight.current=true;setBusy(true);setLocked(true);setError('');const current=version.current;
   try{
     const response=await trustedRequest<{attempt:ExamAttempt;progress:UserProgress}>('/api/assessment/exam/submit',{sessionId,answers,tabSwitchWarnings:warnings});
     if(current!==version.current)return;
     setResult(response.attempt);cacheTrustedExam(response.attempt,response.progress,userId);onExamAttemptSaved?.(response.progress);
   }catch(e){if(current===version.current)setError((e as Error).message);}
   finally{inFlight.current=false;if(current===version.current)setBusy(false);}
 }
 submitRef.current=submit;
 async function review(){
   const prior=progress?.examAttempts?.[exam.id];if(!prior)return;const id=prior.id||exam.id;
   const current=++version.current;setBusy(true);setError('');
   try{const attempt=await trustedRequest<ExamAttempt>(`/api/assessment/exam/${id}/review`);if(version.current===current)setResult(attempt);}
   catch(e){if(version.current===current)setError((e as Error).message);}
   finally{if(version.current===current)setBusy(false);}
 }
 const q=active?.questions[selected];
 const reviewTopics = progress && result ? calculateReadiness(progress).weakTopics.filter(topic=>result.generatedQuestions?.some(q=>q.topicIds?.includes(topic.unitId))) : [];
 return <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-5 text-slate-200">
   <h1 className="text-2xl font-bold">{exam.title}</h1>
   <div className="flex flex-wrap gap-3 text-sm">
     <button onClick={onExitExam}>Return to Roadmap</button><button onClick={onOpenDocs}>C++ Reference</button>
     {progress?.examAttempts?.[exam.id]&&<button disabled={busy} onClick={()=>void review()}>Review last finalized exam</button>}
   </div>
   {!unlocked&&<p>Complete the prerequisite topics before starting this exam.</p>}
   {error&&<div role="alert" className="p-4 border border-amber-500 rounded"><p>{error}</p><button disabled={busy} onClick={()=>void start()}>Start a new exam</button></div>}
   {busy&&<p role="status">{locked?'Compiling coding answers and finalizing results…':'Loading exam…'}</p>}
   {result?<><ExamResults attempt={result}/>{onSelectUnit&&reviewTopics.map(topic=><button key={topic.unitId} onClick={()=>onSelectUnit(topic.unitId)}>Review {topic.topicTitle}: {topic.reason}</button>)}<button disabled={busy} onClick={()=>void start()}>Retake with a fresh question set</button>
     {result.passed&&onSelectUnit&&getFirstUnitAfterExam(exam.id)&&<button onClick={()=>onSelectUnit(getFirstUnitAfterExam(exam.id)!.id)}>Continue curriculum</button>}</>:active&&q&&<>
     <div className="flex flex-wrap justify-between gap-3"><span role="timer">Time remaining: {Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</span><span>{Object.values(answers).filter(a=>a.trim()).length}/{active.questions.length} answered</span></div>
     <nav aria-label="Exam questions" className="flex flex-wrap gap-2">{active.questions.map((item,i)=><button key={item.id} aria-current={i===selected?'step':undefined} onClick={()=>setSelected(i)} className="p-2 border border-slate-700 rounded">{i+1}{answers[item.id]?.trim()?' ✓':''}</button>)}</nav>
     <p>{q.points} points · {q.difficulty} · {q.topicIds?.join(', ')}</p>
     <ExamQuestionInput key={q.id} question={q} answer={answers[q.id]||''} onChange={value=>setAnswers(a=>({...a,[q.id]:value}))} disabled={locked||busy||remaining===0}/>
     <div className="flex flex-wrap gap-4"><button disabled={selected===0} onClick={()=>setSelected(i=>i-1)}>Previous</button><button disabled={selected===active.questions.length-1} onClick={()=>setSelected(i=>i+1)}>Next</button>
       <button disabled={busy} onClick={()=>void submit()}>{locked?'Retry original submission':'Submit exam'}</button>
       <button disabled={busy||locked} onClick={()=>void start(true)}>Shuffle questions (same deadline)</button></div>
   </>}
 </div>;
};
