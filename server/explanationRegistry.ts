import { EXAM_QUESTION_POOLS } from '../src/data/examQuestionPools.js';
import { CURRICULUM_EXAMS } from '../src/data/exams.js';
import type { ExamQuestionDetail } from '../src/types.js';
import { canonicalExplanationId } from '../src/lib/explanationRubric.js';

// Each tuple describes full-credit meaning, not terms to search for in student text.
// Partial credit is appropriate for a correct but incomplete explanation of that meaning.
const expectations: Record<string, [string, string, string]> = {
  'ef-wtw-1': ['Distinguish managed-object lifetime from ownership-bookkeeping lifetime.',
    'The last strong owner releases the object, while remaining weak observers need bookkeeping to test expiration and attempt lock.',
    'A weak observer does not keep the object alive; exact counters/layout are not mandated.'],
  'ef-wtw-2': ['An empty stateless deleter can be stored without increasing typical unique_ptr size.',
    'Explain empty-base or overlapping empty-subobject storage and why no per-instance deleter state needs separate ordinary storage.',
    'This is a typical optimization, not a universal pointer-size guarantee; stateful deleters may increase size.'],
  'ef-wtw-3': ['A fully constructed unique_ptr local releases its owned scalar resource during unwinding to a handler.',
    'Connect throw, scope exit, owner destruction and deleter invocation in that order.',
    'Do not extend the guarantee to abort, forced termination or every uncaught-exception path.'],
  'ef-wtw-4': ['Describe the possible combined object/control-block allocation and its weak-observer tradeoff.',
    'Fewer allocations can reduce overhead, but weak observers may retain the combined storage after object destruction.',
    'Distinguish destruction from freeing storage; no fixed speedup or mandatory layout is promised.'],
  'ef-ca-1': ['Copying a raw exclusive-owning pointer can cause two owners to delete one allocation.',
    'Trace memberwise address copying followed by both destructors attempting cleanup.',
    'Give independent copying, prohibited copying or standard owning members as a fix; double deletion is undefined behavior, not a guaranteed crash.'],
  'ef-ca-2': ['The returned reference dangles after the local string is destroyed.',
    'Trace local construction, return, destruction and the caller attempting to use the ended object.',
    'Return an owning string or refer to an established longer-lived object; no particular crash/output is guaranteed.'],
  'ef-ca-3': ['A cycle of strong shared owners retains both objects after outside owners leave.',
    'Explain why each remaining strong edge prevents a count reaching zero, rather than calling it a mutex deadlock.',
    'Use a weak/nonowning relationship with a lifetime policy and lock before access when needed.'],
  'exam-foundations-understanding-transfer': ['Value parameters are separate objects; reference parameters alias caller state.',
    'Explain why assignment changes only a value parameter but reaches the original through int&.',
    'The borrowed object must remain alive; references do not automatically confer ownership.'],
  'estl-wtw-1': ['Unordered key lookup is average constant-time and worst-case linear.',
    'Explain hashing to buckets and equality checks among candidates when collisions concentrate many keys.',
    'A poor/colliding hash provides a counterexample to guaranteed O(1); a particular linked-list layout is not required.'],
  'estl-wtw-2': ['An introsort fallback avoids basic quicksort quadratic worst-case behavior.',
    'Poor partitions cause excessive depth; heapsort provides an O(n log n) fallback while quicksort remains useful normally.',
    'std::sort mandates its behavior/comparison bound, not this exact hybrid, pivot or depth threshold.'],
  'estl-wtw-3': ['Geometric growth gives constant amortized append, while fixed increments give linear amortized relocation cost.',
    'Use a geometric sum bounded by a constant times n versus an arithmetic sum quadratic in n, then divide total work by n appends.',
    'An individual append can still be linear; the example assumes doubling and fixed positive K rather than requiring a universal growth factor.'],
  'estl-ca-1': ['The saved iterator is invalidated by the forced vector reallocation.',
    'The code fills actual capacity, saves the iterator, then a successful extra push relocates storage; dereferencing the old iterator is invalid.',
    'Reacquire the iterator after insertion or avoid retaining it across relocation. reserve alone does not promise exact capacity.'],
  'estl-ca-2': ['The returned string_view borrows storage whose owning local string dies on return.',
    'Connect nonownership and the local lifetime ending to invalid character access by the caller.',
    'Return an owning string or borrow longer-lived storage; short-string optimization does not cure the lifetime bug.'],
  'estl-ca-3': ['Erasing from vector invalidates the erased iterator and later positions.',
    'The loop increments an invalidated iterator, which is not repaired merely by continuing the loop.',
    'Use it = nums.erase(it) on removal and increment only on retention, or use a suitable erase algorithm.'],
  'exam-stl-understanding-transfer': ['remove compacts values; erase changes the container size.',
    'Explain the retained prefix, returned logical end and destruction of the trailing range.',
    'Capacity need not shrink; C++20 erase is a valid alternative, not evidence that remove alone changes size.'],
  'esys-wtw-1': ['A virtual call through a base view selects the final override for the dynamic object.',
    'Explain how a typical dispatch pointer/table can find the target, or provide equivalent correct dispatch mechanics without prescribing layout.',
    'Table layout, pointer size/offset and actual indirect calls are implementation-dependent; devirtualization is possible.'],
  'esys-wtw-2': ['compare_exchange atomically compares expected and updates on success.',
    'Explain retry on interference or weak spurious failure and refreshing expected/desired as appropriate.',
    'Weak CAS can fail spuriously; not every atomic implementation or containing algorithm is guaranteed lock-free.'],
  'esys-ca-1': ['A single if before condition-variable waiting does not safely establish readiness after wakeup.',
    'A spurious wakeup or intervening state change can allow proceeding while the condition remains false.',
    'Recheck a predicate in a loop or predicate wait under the same mutex; notification alone is not the state.'],
  'esys-ca-2': ['Destroying a joinable std::thread invokes std::terminate.',
    'The local thread handle reaches scope exit still joinable, whether or not its worker has already finished.',
    'Join, use jthread where suitable or detach only with safe captured lifetimes; no particular crash signal is required.'],
  'esys-ca-3': ['Opposite mutex acquisition orders can deadlock.',
    'Describe one worker holding m1 waiting for m2 while the other holds m2 waiting for m1.',
    'Use a consistent global order or scoped_lock; the deadlock is possible, not inevitable on every schedule.'],
  'exam-systems-understanding-transfer': ['A base reference preserves the original dynamic object, while a base value can slice it.',
    'Explain that a separate Base object is constructed from the base subobject, losing derived state and virtual behavior.',
    'Use a reference/pointer with a valid lifetime when polymorphic behavior must be preserved; no fixed byte/vptr-copy story is required.'],
  'efin-wtw-1': ['RAII binds release to a correctly implemented resource-owning object lifetime.',
    'Explain destruction on normal scope exit and unwinding to a handler, avoiding scattered manual cleanup.',
    'Ownership mistakes, strong cycles and forced termination remain limitations; do not promise zero possible leaks.'],
  'efin-wtw-2': ['Vector can prefer copying when moving may throw and copying is available.',
    'Copies leave old elements intact for rollback, while a failed move can leave sources changed.',
    'Move-only throwing types may still be moved with conditional/weaker guarantees; noexcept is not an absolute movement prerequisite.'],
  'efin-ca-1': ['Destroying a joinable std::thread invokes terminate in C++20.',
    'Trace the local thread reaching destruction without join/detach; worker completion alone does not make the handle nonjoinable.',
    'Join, use jthread or provide a safe detach/lifetime design.'],
  'efin-ca-2': ['Passing Dog as an Animal value constructs a sliced Animal with base behavior.',
    'Explain that Animal a is a new base object, so a.speak uses the base implementation rather than Dog behavior.',
    'Use Animal& with the displayed non-const speak, or make speak const consistently before using const Animal&.'],
  'exam-final-understanding-transfer': ['Insertion sort maintains a sorted prefix containing the values processed so far.',
    'Explain shifting larger prefix values and inserting the held next value, preserving the invariant; reversed input causes quadratic total shifts.',
    'Mention the base prefix, termination/full-range conclusion, or stability from shifting strictly larger values.'],
  'ex1-q4': ['Passing the vector by value constructs a separate parameter copy for the shown lvalue call.',
    'The vector and its strings are copied even though the function only reads them, causing avoidable work.',
    'Borrow with const vector<string>& when ownership is not needed, with the caller object remaining alive.'],
};

const aliases: Record<string, string> = {
  'ex1-q3': 'ef-wtw-1', 'ex2-q1': 'estl-wtw-1', 'ex2-q4': 'estl-ca-1',
  'ex3-q1': 'esys-wtw-1', 'ex3-q4': 'ef-ca-1', 'ex4-q1': 'efin-wtw-1', 'ex4-q4': 'efin-ca-1',
};
export const isExplanationQuestion = (q: ExamQuestionDetail) =>
  !['mcq', 'true-false', 'coding-challenge'].includes(q.type);

export const EXPLANATION_REGISTRY = new Map<string, { question: ExamQuestionDetail; expectations: [string, string, string] }>();
for (const question of [...Object.values(EXAM_QUESTION_POOLS).flat(), ...CURRICULUM_EXAMS.flatMap(exam => exam.questions)]) {
  if (!isExplanationQuestion(question)) continue;
  const rubric = expectations[aliases[question.id] || question.id];
  if (!rubric) throw new Error(`Missing explanation rubric: ${question.id}`);
  EXPLANATION_REGISTRY.set(question.id, { question, expectations: rubric });
}
export const getExplanationQuestion = (id: string) => EXPLANATION_REGISTRY.get(canonicalExplanationId(id));
