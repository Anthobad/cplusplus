import React from 'react';
import { act,create } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe,it,expect,vi,afterEach } from 'vitest';
import { ExamView,ExamQuestionInput,ExamResults } from '../src/components/ExamView';
import { AssessmentProvider } from '../src/lib/AssessmentContext';
import { trustedRequest } from '../src/lib/authenticatedFetch';
import { ACTIVE_EXAMS,ACTIVE_POOLS,publicExam } from '../server/data/activeExams';
vi.mock('../src/lib/authenticatedFetch',()=>({trustedRequest:vi.fn()}));
vi.mock('../src/lib/firebase',()=>({cacheTrustedExam:vi.fn()}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('deterministic exam presentation',()=>{
 it('renders all four input types with read-only highlighted code and accessible native controls',()=>{
   const questions=Object.values(ACTIVE_POOLS).flat();
   for(const type of ['mcq','predict_output','fill_blank','coding']){
     const q=questions.find(q=>q.type===type)!;
     const html=renderToStaticMarkup(<ExamQuestionInput question={publicExam({...ACTIVE_EXAMS[0],questions:[q]}).questions[0]} answer="" onChange={()=>{}} disabled={false}/>);
     if(type==='mcq'){expect(html.match(/type="radio"/g)).toHaveLength(4);expect(html).not.toContain(q.correctAnswer+' selected');}
     else if(type==='fill_blank'){expect(html).toContain('aria-label="Blank 1"');expect(html).toContain('blank 1');}
     else expect(html).toContain('<textarea');
     if(q.codeSnippet)expect(html).toContain('<pre');
   }
 });
 it('preserves answers across navigation and renders finalized points and authored review',async()=>{
   vi.stubGlobal('window',{addEventListener:vi.fn(),removeEventListener:vi.fn(),confirm:()=>true});
   const base=ACTIVE_EXAMS[0];const pool=ACTIVE_POOLS[base.id];const questions=['predict_output','fill_blank','mcq','coding'].map(type=>pool.find(q=>q.type===type)!);
   const exam={...base,questions};const visible=publicExam(exam);
   const attempt={examId:exam.id,score:100,passed:true,generatedQuestions:questions,questionScores:questions.map(q=>({questionId:q.id,earned:q.points,possible:q.points}))};
   vi.mocked(trustedRequest).mockImplementation(async(path)=>path.endsWith('/start')?{exam:visible,sessionId:'test-session',deadlineAt:Date.now()+2700000,serverNow:Date.now()} as any:{attempt,progress:{completedUnitIds:[]}} as any);
   let view:ReturnType<typeof create>;
   await act(async()=>{view=create(<AssessmentProvider><ExamView exam={{...base,questions:[]}} userId="user" onExitExam={()=>{}} onOpenDocs={()=>{}}/></AssessmentProvider>);});
   const navigate=async(label:string)=>{const button=view!.root.findAllByType('button').find(b=>b.children.join('')===label)!;await act(async()=>button.props.onClick());};
   await act(async()=>view!.root.findByType('textarea').props.onChange({target:{value:'my output\n  spaces'}}));
   await navigate('Next');expect(view!.root.findByType('input').props.value).toBe('');
   await act(async()=>view!.root.findByType('input').props.onChange({target:{value:'push_back'}}));
   await navigate('Previous');expect(view!.root.findByType('textarea').props.value).toBe('my output\n  spaces');
   await navigate('Submit exam');expect(vi.mocked(trustedRequest).mock.calls.at(-1)![1]).toMatchObject({answers:{[questions[0].id]:'my output\n  spaces',[questions[1].id]:'push_back'}});
   const html=JSON.stringify(view!.toJSON());expect(html).toContain('100');expect(html).toContain('Correct answer:');expect(html).toContain(questions[0].explanation);
   await act(async()=>view!.unmount());
 });
 it('ignores an old session response after the signed-in user changes',async()=>{
   vi.stubGlobal('window',{addEventListener:vi.fn(),removeEventListener:vi.fn(),confirm:()=>true});
   const base=ACTIVE_EXAMS[0];const question=publicExam(base).questions[0];
   let finishFirst!:(value:any)=>void;
   vi.mocked(trustedRequest).mockImplementationOnce(()=>new Promise(resolve=>{finishFirst=resolve;})).mockResolvedValueOnce({exam:{...publicExam(base),questions:[{...question,question:'Current account question'}]},sessionId:'new',serverNow:Date.now(),deadlineAt:Date.now()+100000} as any);
   let view:ReturnType<typeof create>;
   const props={exam:{...base,questions:[]},onExitExam:()=>{},onOpenDocs:()=>{}};
   await act(async()=>{view=create(<AssessmentProvider><ExamView {...props} userId="old"/></AssessmentProvider>);});
   await act(async()=>{view!.update(<AssessmentProvider><ExamView {...props} userId="new"/></AssessmentProvider>);});
   await act(async()=>{finishFirst({exam:{...publicExam(base),questions:[{...question,question:'Old account question'}]},sessionId:'old',serverNow:Date.now(),deadlineAt:Date.now()+100000});});
   expect(JSON.stringify(view!.toJSON())).toContain('Current account question');expect(JSON.stringify(view!.toJSON())).not.toContain('Old account question');
   await act(async()=>view!.unmount());
 });
 it('keeps historical finalized explanations readable without any grader',()=>{
   const html=renderToStaticMarkup(<ExamResults attempt={{examId:'old',score:63,passed:true,generatedQuestions:[{id:'old',type:'code-analysis',points:15,question:'Historical question',explanation:'Saved explanation'}],explanationResults:{old:{feedback:'Saved rubric feedback'} as any}}}/>);
   expect(html).toContain('63');expect(html).toContain('Saved rubric feedback');expect(html).toContain('Saved explanation');
 });
});
