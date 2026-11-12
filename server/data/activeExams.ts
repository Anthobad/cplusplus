import { createHash } from 'node:crypto';
import type { Exam, ExamQuestionDetail } from '../../src/types';
import { CURRICULUM_EXAMS } from './legacyExams';
import { EXAM_QUESTION_POOLS } from './legacyQuestionPools';
import { withQuestionTopics } from '../../src/data/examTopics';
import { replacements } from './objectiveReplacements';

// Four plausible conclusions for former binary statements; IDs change because the answer contract changes.
const binaryChoices: Record<string, [string, string[], number]> = {
 'ef-tf-1':['A pointer to an ordinary local int is returned. After the local dies, what does dereferencing it do?', ['Extends the lifetime','Has undefined behavior','Creates a copy of the local','Produces a guaranteed null value'],1],
 'ef-tf-2':['A large make_shared object has no strong owners but long-lived weak observers. What can remain allocated?', ['The undestroyed object itself','Combined allocation storage, despite object destruction','One new copy per observer','Only the original stack frame'],1],
 'ef-tf-3':['A raw-resource owner defines a destructor. What should its copy policy address?', ['Nothing: compiler copying clones allocations','Deep-copy semantics or disabled copying','Only its public getters','Only whether the destructor is inline'],1],
 'ef-tf-4':['What is the type of nullptr in C++20?', ['int','void*','std::nullptr_t','unsigned long'],2],
 'ef-tf-5':['const std::string original="text"; auto copy=std::move(original); Which constructor ordinarily initializes copy?', ['Copy constructor','Non-const move constructor','Default constructor followed by swap','No constructor because original is destroyed'],0],
 'ef-tf-6':['Two threads share a shared_ptr to an ordinary mutable int. What does reference-count thread safety guarantee?', ['All writes to the int are synchronized','Safe bookkeeping for distinct shared_ptr instances, not arbitrary pointee mutation','No mutex is ever needed','Atomic integer arithmetic through operator*'],1],
 'estl-tf-1':['After remove(v.begin(),v.end(),value), before erase, what is true?', ['The vector size has shrunk','A logical end is returned; size has not changed','Capacity is guaranteed to shrink','Every trailing element equals value'],1],
 'estl-tf-2':['Which comparator property is required by strict weak ordering?', ['comp(a,a) is true','comp(a,a) is false','Equal keys must compare true in both directions','The comparator must use operator<='],1],
 'estl-tf-3':['What does m[key] do for an absent key in map<string,int>?', ['Throws out_of_range','Inserts a value-initialized int','Leaves the map unchanged and returns -1','Invalidates every iterator'],1],
 'estl-tf-4':['Which statement about vector<bool> is portable?', ['Its elements always occupy separate bool bytes','Its reference can be a proxy instead of bool&','&v[0] must be a bool*','It cannot represent false values'],1],
 'estl-tf-5':['What does lower_bound require for its logarithmic comparison guarantee?', ['A range partitioned with respect to the search predicate/value','Distinct values only','A vector with capacity equal to size','A hash function'],0],
 'esys-tf-1':['Which override can a virtual call in a Base constructor select for the object under construction?', ['The most-derived override unconditionally','The override in the currently constructing class hierarchy','A random override based on padding','The compiler must reject all such calls'],1],
 'esys-tf-2':['A condition-variable wait returns. Which conclusion is valid?', ['The predicate must now be true','The predicate must be rechecked under the mutex','notify_one must have run','The lock is permanently released'],1],
 'esys-tf-3':['What does C++ guarantee about physical vptr count and offset?', ['One pointer at offset zero for all classes','A fixed count for multiple inheritance','No universal physical vptr layout','No dynamic dispatch is permitted'],2],
 'esys-tf-4':['What does volatile provide for shared ordinary data?', ['Atomic read-modify-write','Mutual exclusion','Neither atomic synchronization nor data-race protection','The same semantics as a mutex'],2],
 'efin-tf-1':['A Derived allocated by ordinary new is deleted through Base* with a nonvirtual Base destructor. What follows?', ['Safe if Derived has no fields','Undefined behavior','Guaranteed destructor chaining','A compile-time error in all programs'],1],
 'efin-tf-2':['Why are template definitions usually visible where instantiated?', ['The compiler generally needs the definition to generate the specialization','Templates are interpreted at runtime','Headers are the only legal source files','Explicit instantiation is forbidden'],0],
 'efin-tf-3':['Which statement about vector relocation is accurate?', ['It can never move a potentially throwing type','Its choice depends on available move/copy operations and exception guarantees','It always copies even a noexcept movable type','noexcept makes allocation infallible'],1],
 'efin-tf-4':['Which release matches a successful malloc allocation?', ['delete','delete[]','free','Calling the pointer destructor'],2],
 'ex1-q6':['Which property is lost when && is implemented as an ordinary overloaded operator function?', ['Operator return values','Built-in short-circuit operand evaluation','The ability to accept class operands','All overload resolution'],1],
 'ex3-q6':['Which statement about C++ friendship is correct?', ['Friendship is automatically inherited','Friendship is not automatically inherited or transitive','Every derived member is a friend of the base friends','Friendship establishes shared ownership'],1],
 'ex4-q6':['Why does the tortoise-and-hare technique detect a cycle in a linked list using constant extra space?', ['It stores every visited node','Fast and slow pointers eventually meet in a cycle','It sorts the list first','It requires pointer addresses to be numerically ordered'],1],
};
const binaryAliases:Record<string,string>={'ex1-q2':'ef-tf-1','ex2-q3':'estl-tf-1','ex2-q6':'estl-tf-2','ex3-q3':'esys-tf-1','ex4-q3':'efin-tf-1'};
function active(q:ExamQuestionDetail):ExamQuestionDetail {
 let converted:ExamQuestionDetail;
 if(q.type==='mcq')converted={...q};
 else if(q.type==='coding-challenge')converted={...q,type:'coding'};
 else if(q.type==='true-false'){
   const tuple=binaryChoices[binaryAliases[q.id]||q.id];
   if(!tuple)throw new Error(`Missing objective conversion ${q.id}`);
   converted={...q,id:`obj-${q.id}`,type:'mcq',question:tuple[0],options:tuple[1],correctAnswer:tuple[2]};
 } else {
   const replacement=replacements[q.id];
   if(!replacement)throw new Error(`Missing deterministic replacement ${q.id}`);
   converted={...q,...replacement,id:`det-${q.id}`};
 }
 // Do not retain retired rubric or reference-solution snippets on active objective questions.
 const {rubricKeywords:_rubric,testCases:_tests,driverCode:_driver,...clean}=converted;
 return withQuestionTopics({...clean,schemaVersion:2,difficulty:q.difficulty||'Medium',
   ...(converted.type==='mcq'?{optionIds:converted.options!.map(text=>`${converted.id}:${createHash('sha256').update(converted.id+'\0'+text).digest('hex').slice(0,16)}`)}:{})});
}
export const ACTIVE_POOLS=Object.fromEntries(Object.entries(EXAM_QUESTION_POOLS).map(([id,questions])=>[id,questions.map(active)]));
export const ACTIVE_EXAMS:Exam[]=CURRICULUM_EXAMS.map(e=>({...e,schemaVersion:2,questions:e.questions.map(active)}));
const shuffle=<T,>(items:T[])=>{
 const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;
};
export function generateActiveExam(base:Exam):Exam {
 const pool=ACTIVE_POOLS[base.id];if(!pool?.length)return base;
 const original=pool.filter(q=>q.type==='mcq'&&!q.id.startsWith('obj-')&&!q.id.startsWith('det-'));
 const binary=pool.filter(q=>q.id.startsWith('obj-'));
 const replacements=pool.filter(q=>q.id.startsWith('det-'));
 const coding=pool.filter(q=>q.type==='coding');
 const questions=[...shuffle(original).slice(0,3).map(q=>({...q,points:10})),
   ...shuffle(binary).slice(0,2).map(q=>({...q,points:10})),
   ...shuffle(replacements).slice(0,2).map(q=>({...q,points:15})),
   ...shuffle(coding).slice(0,1).map(q=>({...q,points:20}))].map(q=>{
     if(q.type!=='mcq')return q;
     const order=shuffle(q.options!.map((_,i)=>i));
     return {...q,options:order.map(i=>q.options![i]),optionIds:order.map(i=>q.optionIds![i])};
   });
 if(questions.length!==8||questions.reduce((n,q)=>n+q.points,0)!==100)throw new Error('Incomplete exam composition.');
 // Keep the trusted key as stable option ID, independent of shuffled positions.
 return {...base,schemaVersion:2,questions,poolSize:pool.length,isRandomizedPool:true};
}
/** Active keys use stable IDs; numeric keys are retained only in the private authored bank. */
for(const q of [...Object.values(ACTIVE_POOLS).flat(),...ACTIVE_EXAMS.flatMap(e=>e.questions)]){
 if(q.type==='mcq')q.correctAnswer=q.optionIds![q.correctAnswer];
}
export function publicExam(exam:Exam):Exam {
 return {...exam,questions:exam.questions.map(q=>{
   const {correctAnswer:_key,acceptedAnswers:_accepted,explanation:_explanation,rubricKeywords:_rubric,
     testCases:_tests,driverCode:_driver,...visible}=q;
   return {...visible,explanation:''};
 })};
}
export function compatibleExam(exam:Exam){return exam.schemaVersion===2 && exam.questions.every(q=>q.schemaVersion===2&&['mcq','predict_output','fill_blank','coding'].includes(q.type));}

// Fail builds/startup on malformed authored grading contracts rather than shipping ungradable questions.
for(const q of [...Object.values(ACTIVE_POOLS).flat(),...ACTIVE_EXAMS.flatMap(e=>e.questions)]){
 if(!q.id||!q.question||!q.explanation||!q.difficulty||!q.topicIds?.length||!Number.isInteger(q.points)||q.points<=0)throw new Error(`Invalid authored question ${q.id}`);
 if(q.type==='mcq'){
   if(q.options?.length!==4||new Set(q.options).size!==4||q.optionIds?.length!==4||new Set(q.optionIds).size!==4||!q.optionIds.includes(q.correctAnswer))throw new Error(`Invalid option key ${q.id}`);
 }else if(q.type==='predict_output'||q.type==='fill_blank'){
   if(!q.codeSnippet||!q.acceptedAnswers?.length||q.acceptedAnswers.some(a=>typeof a!=='string'||!a.trim()))throw new Error(`Missing accepted answers ${q.id}`);
   if(q.type==='fill_blank'&&q.codeSnippet.match(/\/\* blank 1 \*\//g)?.length!==1)throw new Error(`Invalid blank ${q.id}`);
 }else if(q.type!=='coding'||!q.codingChallengeId)throw new Error(`Invalid active type ${q.id}`);
}
