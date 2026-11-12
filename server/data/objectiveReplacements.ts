import type { ExamQuestionDetail } from '../../src/types';
/** Authored replacements: each key names the retired learning objective, not a reused question ID. */
export const replacements: Record<string, Partial<ExamQuestionDetail>> = {};
function mcq(id:string, question:string, options:string[], correctAnswer:number, explanation:string, codeSnippet?:string) {
  replacements[id]={type:'mcq',question,options,correctAnswer,explanation,codeSnippet};
}
function output(id:string, body:string, expected:string, explanation:string, includes='') {
  replacements[id]={type:'predict_output',question:'What is the output of this C++20 program?',
    codeSnippet:`#include <iostream>\n${includes}\nint main() {\n${body}\n}`,acceptedAnswers:[expected],explanation};
}
function blank(id:string, question:string, codeSnippet:string, acceptedAnswers:string[], explanation:string) {
  replacements[id]={type:'fill_blank',question,codeSnippet,acceptedAnswers,explanation};
}
// Fourteen conceptual questions, including concurrency rules unsuitable for deterministic output exercises.
mcq('ef-wtw-2','A unique_ptr uses a stateful custom deleter whose runtime state is needed when deleting. Which footprint claim is justified?',[
  'All unique_ptr specializations must have exactly the size of one pointer','The deleter state needs a representation; empty-deleter compression does not imply pointer-only storage for this specialization',
  'The standard requires a shared ownership control block','Stateful deleters are forbidden for unique_ptr'],1,
  'Stateless deleters can often occupy no additional storage through empty-base or no-unique-address techniques. A stateful deleter must preserve its state, and exact size is not a universal language guarantee.');
mcq('ef-wtw-4','A large object created with make_shared has no shared owners but still has weak observers. What storage tradeoff can occur?',[
  'The object destructor must wait for all weak observers','The combined allocation may remain reserved although the object has been destroyed',
  'The object remains legally dereferenceable through the weak pointer','The object is copied into every weak observer'],1,
  'make_shared can combine object and control-block allocation. Destruction and release of that combined storage are separate events.');
mcq('estl-wtw-1','A hostile input causes many unordered_map keys to share a bucket. What is the portable complexity conclusion?',[
  'All lookups remain worst-case constant','Worst-case lookup can become linear in container size',
  'The standard requires conversion into a balanced tree','Collisions make key equality unnecessary'],1,
  'Hash tables offer average constant lookup, not worst-case constant lookup. Collision resolution still needs equality checks.');
mcq('estl-wtw-2','Why can introsort switch to heapsort after excessive partition depth?',[
  'To guarantee stable ordering of equivalent keys','To avoid quadratic partition behavior while retaining an O(n log n) worst-case bound',
  'To eliminate all comparisons','Because the C++ standard requires that exact algorithm'],1,
  'Heapsort bounds the remaining worst-case work. std::sort specifies complexity and ordering requirements rather than mandating introsort.');
mcq('estl-wtw-3','Why does geometric capacity growth give vector amortized constant push_back?',[
  'Every individual insertion is worst-case constant','The sum of earlier relocation sizes is bounded by a constant multiple of the final size',
  'Existing elements never move','Reallocations occur once per element'],1,
  'A geometric series bounds total relocation work over many insertions. One insertion can still relocate all existing elements.');
mcq('esys-wtw-2','After compare_exchange_weak fails inside a retry loop, what must the algorithm account for?',[
  'Failure proves another thread changed the value','Failure can be spurious, and expected may have been updated with the observed value',
  'All memory orders become sequentially consistent','The operation guarantees starvation freedom'],1,
  'Weak compare-exchange can fail spuriously and updates expected on failure. The desired value may need recomputation; progress guarantees require separate reasoning.');
mcq('esys-ca-1','A condition-variable consumer uses if (!ready) cv.wait(lock). Which correction handles spurious wakeups?',[
  'Replace the mutex with volatile','Use cv.wait(lock, [&]{ return ready; }) with ready protected by the same mutex',
  'Call notify_one before acquiring the mutex and omit the predicate','Read ready without synchronization after waking'],1,
  'Wakeup alone does not establish the predicate. A predicate wait repeats the check while holding the shared mutex.');
mcq('esys-ca-2','A local joinable std::thread reaches its destructor without join or detach. What is required?',[
  'Its destructor joins automatically','std::terminate is invoked','The worker is paused until the next thread starts','The destructor safely detaches automatically'],1,
  'A joinable std::thread destructor calls terminate. Establish a lifetime policy, such as joining before destruction or using jthread.');
mcq('esys-ca-3','Two paths lock mutexes A and B in opposite orders. Which change addresses the deadlock risk?',[
  'Make the shared data volatile','Use std::scoped_lock with both mutexes on each path',
  'Insert a fixed sleep before the second lock','Join a worker after acquiring the first mutex'],1,
  'A coordinated multi-mutex locking algorithm avoids the circular wait introduced by inconsistent sequential lock order.');
mcq('efin-wtw-2','A vector can copy elements, but moving them may throw. Why may it copy during reallocation?',[
  'Copying always uses less memory','Copying can preserve the original elements if constructing the new allocation fails',
  'The standard forbids throwing move constructors','std::move automatically falls back to memcpy'],1,
  'A throwing move may already alter source elements. Copying can support the strong exception guarantee when the relevant operations are available.');
mcq('efin-ca-1','A function creates a joinable local std::thread and returns without joining it. Which outcome follows?',[
  'Normal automatic detachment','Termination by the thread destructor','Guaranteed data race in every program','Automatic transfer to a global thread pool'],1,
  'A joinable std::thread must be joined or detached before destruction. This rule is independent of whether its task already finished.');
mcq('ex3-q4','A class owns an int* and deletes it in its destructor. Its generated copy operations copy that pointer. What is the principal defect?',[
  'Copying produces independent allocations','Copies can own the same allocation, causing double deletion',
  'The destructor becomes virtual automatically','The pointer cannot be null after construction'],1,
  'Memberwise pointer copying does not clone owned storage. Define ownership-aware copy operations or disable copying.');
mcq('ex4-q1','Which RAII property makes exception paths safer than manually paired acquisition/release?',[
  'Destructors execute for fully constructed automatic objects during stack unwinding',
  'Every destructor can safely throw during unwinding','Exceptions prevent destructors from executing','All allocations become garbage-collected'],0,
  'Ownership follows object lifetime. Completed local objects are destroyed during unwinding, so resource release belongs in their destructors.');
mcq('ex4-q4','A local thread object is still joinable when its enclosing function returns. Which fix establishes a safe completion boundary?',[
  'Set the object to volatile','Join it before leaving the scope','Ignore its destructor','Increment a non-atomic shared flag'],1,
  'join waits for completion and makes the thread object non-joinable. It does not repair unsynchronized conflicting accesses inside the worker.');
// Twelve output problems. Every program is complete, single-threaded and avoids addresses/UB.
output('ef-wtw-1','  struct Tracked { ~Tracked(){std::cout << "destroy ";} };\n  auto owner=std::make_shared<Tracked>();\n  std::weak_ptr<Tracked> observer=owner;\n  { auto copy=owner; std::cout << observer.use_count() << " "; }\n  std::cout << observer.use_count() << " ";\n  owner.reset(); std::cout << observer.expired() << "\\n";','2 1 destroy 1','The scoped copy raises the strong count to two, then leaves one owner. Resetting that owner destroys the object. Weak bookkeeping remains valid so expired() can still be queried.','#include <memory>');
output('ef-ca-2','  std::string s="hello";\n  std::string_view v=s;\n  s[0]=\'H\';\n  std::cout << v << "\\n";','Hello','The view borrows the live string storage. Changing a character without invalidating storage is visible through the view.','#include <string>\n#include <string_view>');
output('ef-ca-3','  auto owner=std::make_shared<int>(9);\n  std::weak_ptr<int> observer=owner;\n  owner.reset();\n  std::cout << observer.expired() << "\\n";','1','Weak observation does not extend the managed object lifetime. After the last shared owner resets, the observer is expired.','#include <memory>');
output('exam-foundations-understanding-transfer','  int x=4;\n  auto byValue=[](int n){n=8;};\n  auto byRef=[](int& n){n=9;};\n  byValue(x); std::cout << x << " ";\n  byRef(x); std::cout << x << "\\n";','4 9','A value parameter changes only its copy; a reference parameter aliases and changes the caller object.');
output('estl-ca-2','  std::string owner="alpha";\n  std::string_view view(owner.data(),3);\n  owner[1]=\'L\';\n  std::cout << view << "\\n";','aLp','A view is not an owning copy. Its range remains valid because owner stays alive and no storage-invalidating operation occurs.','#include <string>\n#include <string_view>');
output('exam-stl-understanding-transfer','  std::vector<int> v{1,2,1,3};\n  auto end=std::remove(v.begin(),v.end(),1);\n  std::cout << v.size() << " " << (end-v.begin()) << "\\n";\n  v.erase(end,v.end());\n  for(int n:v) std::cout << n;\n  std::cout << "\\n";','4 2\n23','remove compacts the retained prefix without shrinking the container. erase then removes the tail and changes size.','#include <vector>\n#include <algorithm>');
output('esys-wtw-1','  struct B { virtual int value() const {return 1;} virtual ~B()=default; };\n  struct D:B { int value() const override {return 2;} };\n  D d; const B& b=d; std::cout << b.value() << "\\n";','2','A reference preserves the dynamic object, so a virtual call dispatches to D. No vtable layout assumption is needed.');
output('exam-systems-understanding-transfer','  struct B { virtual int value() const {return 1;} virtual ~B()=default; };\n  struct D:B { int value() const override {return 3;} };\n  D d; B sliced=d; const B& view=d;\n  std::cout << sliced.value() << " " << view.value() << "\\n";','1 3','Copying a Base value slices the derived object. A Base reference continues to refer to the original dynamic type.');
output('efin-ca-2','  struct B { virtual char tag() const {return \'B\';} virtual ~B()=default; };\n  struct D:B { char tag() const override {return \'D\';} };\n  D d; B copy=d;\n  std::cout << copy.tag() << d.tag() << "\\n";','BD','The copied Base object has only Base state and behavior, while the original Derived still dispatches to D.');
output('ex1-q3','  auto p=std::make_shared<int>(5);\n  std::weak_ptr<int> w=p;\n  { auto q=p; std::cout << q.use_count() << " "; }\n  p.reset(); std::cout << w.expired() << "\\n";','2 1','The second shared owner raises the strong count to two. After both strong owners leave, the weak observer is expired.','#include <memory>');
output('ex3-q1','  struct B { virtual int f(){return 4;} virtual ~B()=default; };\n  struct D:B { int f() override{return 7;} };\n  D d; B* p=&d; std::cout << p->f() << "\\n";','7','Virtual dispatch follows the dynamic type through a base pointer; a particular physical vtable representation is not required.');
output('exam-final-understanding-transfer','  int a[]={3,1,2};\n  for(int i=1;i<3;++i){\n    int key=a[i],j=i;\n    while(j>0 && a[j-1]>key){a[j]=a[j-1];--j;}\n    a[j]=key;\n    for(int v:a)std::cout<<v;\n    std::cout<<"\\n";\n  }','132\n123','Each insertion extends the sorted prefix. The first inserts 1 before 3; the second inserts 2 between 1 and 3.');
// Eight constrained blanks, each a single numbered token with an explicit finite answer set.
blank('ef-wtw-3','Fill blank 1 with the standard factory function name that creates unique ownership.',
  'auto p = std::/* blank 1 */<int>(42);',['make_unique'],'make_unique constructs a uniquely owned object. Its owner destroys the object during ordinary scope exit or unwinding.');
blank('ef-ca-1','Fill blank 1 with the keyword that disables copying this owning type.',
  'Owner(const Owner&) = /* blank 1 */;',['delete'],'A deleted copy constructor rejects accidental shared raw ownership at compile time.');
blank('estl-ca-1','Fill blank 1 with the vector method that requests storage for at least 100 elements without constructing them.',
  'std::vector<int> v;\nv./* blank 1 */(100);',['reserve'],'reserve changes capacity without creating elements. Later growth beyond capacity can invalidate all iterators.');
blank('estl-ca-3','Fill blank 1 with the vector method whose return value is the next valid iterator.',
  'if (*it == 0) it = values./* blank 1 */(it);\nelse ++it;',['erase'],'erase invalidates the erased position and subsequent vector iterators; its returned iterator is the supported continuation.');
blank('efin-wtw-1','Fill blank 1 with the standard unique-ownership smart pointer type.',
  'std::/* blank 1 */<Resource> resource;',['unique_ptr'],'unique_ptr binds exclusive resource ownership to object lifetime and can perform cleanup during stack unwinding.');
blank('ex1-q4','Fill blank 1 with the qualifier that prevents a borrowed vector parameter from being modified through this reference.',
  'void process(/* blank 1 */ std::vector<std::string>& data);',['const'],'A const reference avoids copying the whole container while forbidding mutation through the parameter.');
blank('ex2-q1','Fill blank 1 with the standard hash-map container name (unique keys, average constant lookup).',
  'std::/* blank 1 */<std::string, int> counts;',['unordered_map'],'unordered_map uses hashing with average constant operations and possible linear worst-case lookup.');
blank('ex2-q4','Fill blank 1 with the vector insertion method that may invalidate all iterators when capacity is exhausted.',
  'std::vector<int> v{1,2};\nv./* blank 1 */(3);',['push_back'],'push_back appends an element. If reallocation occurs, iterators into the old storage are invalid.');
