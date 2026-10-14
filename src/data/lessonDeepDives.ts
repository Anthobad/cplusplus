import type { DeepDive } from '../types';

type Dive = [topic: string, breakdown: string[], question: string, answer: string];
const dives: Record<number, Dive> = {
  1: ['The as-if rule and zero-overhead abstractions', [
    'C++ specifies observable behavior rather than exact instructions. A compiler may transform code when the required observable behavior is preserved.',
    'A small function may be inlined and its constant result folded, but neither its size nor inline syntax forces that optimization.',
    'The zero-overhead principle motivates efficient abstractions. Compare an abstraction against equivalent manual behavior, not against doing no work.',
  ], 'Why can a small function call disappear in optimized code, and what must stay the same?', 'Inlining and constant folding may eliminate a call when the compiler can prove the result. The required observable behavior must remain the same. This is an optimization opportunity, not a promise that every call has zero overhead.'],
  2: ['Scope, lifetime and initialized state', [
    'Scope is where a name can be found. Lifetime is when the object exists. Storage duration controls how long its storage is available.',
    'An ordinary automatic int without an initializer has an indeterminate value; reading it as an int is undefined behavior in C++20.',
    'Undefined behavior does not promise a crash, diagnostic or random-looking result. Initialize before use rather than relying on observed runs.',
  ], 'Why is a successful run not proof that an uninitialized int is safe?', 'Undefined behavior places no requirements on that execution under C++20. A value that happens to look correct on one build does not establish a valid program. Explicit initialization provides a usable initial state.'],
  3: ['const, constexpr and consteval', [
    'const restricts modification but its initializer may be evaluated at runtime.',
    'A constexpr variable needs a constant-expression initializer. A constexpr function can be evaluated at compile time in a suitable context or called at runtime.',
    'A consteval immediate function requires constant evaluation. A cast still needs value-range and lifetime preconditions; explicit syntax is not a runtime validation.',
  ], 'How do const and constexpr differ for a value read from input?', 'An input-derived value can initialize const and remain read-only afterward. It ordinarily cannot initialize a constexpr variable because input is not a constant expression. A constexpr function may still process input at runtime.'],
  4: ['Grouping versus evaluation order', [
    'Precedence and associativity define the expression tree. They do not generally order every operand’s evaluation.',
    'Built-in && and || specifically evaluate the left operand first and conditionally omit the right operand.',
    'Overloaded logical operators require argument evaluation and do not offer that built-in short-circuit protection.',
  ], 'Why does a nonzero-denominator guard belong before division?', 'Built-in && evaluates the guard first and skips division if it is false. Reversing the operands or substituting bitwise & loses the protection.'],
  5: ['Arithmetic checks before the operation', [
    'Signed overflow is undefined behavior. Unsigned wraparound is defined modulo the type’s range, but may still violate the algorithm’s requirements.',
    'For positive b, a > max - b detects upper overflow before a + b; negative b requires a lower-bound check. The checking expressions must themselves be safe.',
    'Floating comparison policy depends on the domain. Relative and absolute tolerances serve different scales; NaN and infinity need explicit handling.',
  ], 'Why does assigning an int product to long long not necessarily prevent overflow?', 'The multiplication’s operands determine its evaluation type. Two ints multiply as int before assignment. Promoting an operand first changes the intermediate type, whose range must still be sufficient.'],
  6: ['Buffering, flushing and input state', [
    'A newline separates lines. endl additionally requests flushing; a flush’s exact OS operations and cost depend on the stream buffer and environment.',
    'Disabling C/C++ stream synchronization permits independent buffering. Untying cin from cout removes automatic pre-input flushing, so interactive prompts may need an explicit flush.',
    'A read loop should condition its body on successful extraction. Treat malformed input and end-of-file according to the application’s policy.',
  ], 'When would flushing be necessary even though it can cost extra work?', 'A prompt or protocol message may need delivery before waiting for a response. Batch output can usually use newline without per-line flushing. Choose based on communication needs rather than a universal speed rule.'],
  7: ['Language control flow versus compiler strategy', [
    'The first matching branch in an if/else chain runs. switch follows case labels until a break, return or the statement’s end.',
    'A compiler may use a jump table, a comparison tree or another compliant representation for switch.',
    'likely/unlikely attributes are hints, not truth assertions or fixed latency guarantees. Test boundaries before optimizing branch layout.',
  ], 'Why can a broad passing-score condition hide a later high-grade branch?', 'A score satisfying the broad condition enters that first branch and skips the rest of the chain. Put the more specific condition first or design nonoverlapping conditions.'],
  8: ['Loop invariants and a termination measure', [
    'An invariant holds before and after each iteration: for a summing loop, the accumulator can equal the sum of the already-visited prefix.',
    'A termination measure must progress, such as the number of remaining indices decreasing.',
    'An unsigned reverse loop cannot rely on becoming negative. Use a valid half-open pattern or reverse iterators. Tail-call optimization is not guaranteed.',
  ], 'How would you justify both correctness and termination of a prefix-summing loop?', 'Initially the empty-prefix sum is zero. Each iteration adds the next value, preserving the invariant for a longer prefix. The index increases toward a finite bound; on exit the prefix is the entire range.'],
  9: ['Value, alias and lifetime contracts', [
    'A value parameter owns a separate parameter object. A reference parameter aliases an existing object.',
    'const reference restricts writes through that access path; another alias may still modify the object.',
    'Returning a reference to an ordinary local object produces a dangling result. Choose an owning return value unless borrowing a longer-lived object is intentional.',
  ], 'When should a function return a value instead of a reference?', 'Return a value when the result needs independent ownership or is newly constructed inside the function. Return a reference only when its target remains alive and the borrowing contract is clear.'],
  10: ['Owning strings and borrowed views', [
    'string_view does not keep its character storage alive and need not end at a null terminator.',
    'Destroying or reallocating the owner invalidates views into its old storage. A short string’s inline buffer does not remove this lifetime requirement.',
    'SSO thresholds, object sizes and layouts depend on the library. The string object may itself be automatic, static or dynamically stored.',
  ], 'Is returning a view of a local string safe because the string is short?', 'No. Inline storage belongs to that local string object and ends with its lifetime just as allocated storage does. Return an owning string or borrow from an owner whose lifetime is established.'],
  11: ['Storage, ownership and pointer validity', [
    'Automatic storage is commonly implemented with a stack or registers. Dynamic allocation normally uses an allocator; not every allocation calls the OS.',
    'Match scalar new/delete, array new[]/delete[], and malloc/free. There is no universal array-cookie layout explaining every implementation.',
    'A pointer’s non-null value proves neither target lifetime nor type correctness. Array arithmetic is limited to the same array and its one-past endpoint.',
  ], 'Which facts must you establish before dereferencing a raw pointer?', 'It must refer to a live object within valid bounds, with an appropriate type and access permissions. Non-null is only one necessary check in interfaces that permit null; ownership and lifetime need separate evidence.'],
  12: ['Separate compilation and initialization dependencies', [
    'Headers share declarations; source files provide ordinary non-inline definitions. Include guards act within one translation unit, not across the linker’s inputs.',
    'Dynamic initialization order across files depends on the categories of variables and sequencing rules. Avoid constructing one global through another with an unresolved dependency.',
    'A function-local static defers initialization until first use and has synchronized initialization since C++11. It does not solve every shutdown dependency.',
  ], 'How does construct-on-first-use reduce an initialization dependency problem?', 'A function initializes its local static when control first reaches that declaration, so callers request an initialized object rather than assuming an unrelated file’s global has already been constructed. Lifetime and destruction dependencies still require design.'],
  13: ['Qualified names and ADL customization', [
    'Qualified lookup explicitly selects a scope. An unqualified function call can also use namespaces associated with its argument types.',
    'using std::swap; swap(a, b); combines a standard fallback with ADL-discovered custom swaps.',
    'A broad using directive in a header spreads lookup effects to its includers. Use narrow declarations or qualification when customization is not required.',
  ], 'Why does generic swap code often avoid writing only std::swap(a, b)?', 'The unqualified call permits ADL to find an efficient type-specific swap. A using declaration supplies std::swap as the fallback. A fully qualified call does not perform that same customization lookup.'],
  14: ['Conditional exception guarantees', [
    'Strong means rollback on failure, basic means valid invariants/no leaks, and a no-throw guarantee means the operation does not throw.',
    'Vector can prefer copying over a potentially throwing move when copying is available. For a move-only throwing type, movement can still occur with conditional/weaker guarantees.',
    'An exception escaping noexcept invokes terminate. Do not rely on a fixed unwinding strategy before termination, or let destructors throw during unwinding.',
  ], 'Why can copying help vector preserve old elements during reallocation?', 'A successful copy leaves its source unchanged, so a failed later copy allows abandoning the new buffer. A throwing move may already have changed sources. The available copy/move operations determine which strategy and guarantee apply.'],
  15: ['Memberwise copying and the Rule of Zero', [
    'Member alignment can insert padding; exact offsets and total size depend on the ABI. Copying is specified by member operations, not an assumed raw-byte layout.',
    'Generated copying invokes each member’s copy operation. An int copies a value; string copies owned text; a raw pointer copies an address.',
    'An owning raw pointer plus a deleting destructor needs copying/movement to be implemented correctly or prohibited. The Three/Five rules flag related design decisions rather than universal syntax requirements.',
    'Rule of Zero uses standard owning members to manage resources. Const methods protect ordinary members through this, while mutable and indirect state need deliberate treatment.',
  ], 'Why does string membership often make a safer value type than a raw owning char pointer?', 'string already implements destruction, copying and movement of its owned buffer. A raw pointer’s generated copy shares the address without establishing shared ownership, so a deleting destructor can cause double deletion.'],
  16: ['Language semantics versus execution cost', [
    'C++ supports values and aliases; Java primitives are values while object variables generally carry references.',
    'C++ destruction defines ordinary cleanup boundaries, not fixed execution durations. Java resource closure uses mechanisms beyond garbage collection.',
    'Compilers and JVMs can transform allocations and execution. Choose based on requirements and measurements rather than universal speed claims.',
  ], 'Why should resource closure be considered separately from memory reclamation?', 'Files, sockets and locks need timely release even when memory could remain allocated. C++ RAII and Java try-with-resources connect such release to program structure rather than waiting for garbage collection.'],
  17: ['Iterator requirements and callable specialization', [
    'Algorithms require particular iterator capabilities. find needs traversal; sort needs random access and sortable values.',
    'A lambda has a concrete closure type that stores captures. A compiler can specialize and inline calls, but is not required to remove every indirect call or outperform another interface.',
    'The container–iterator–algorithm separation allows reuse across compatible structures rather than implementing every operation separately for every container.',
  ], 'Why can find work on list while std::sort cannot?', 'find only advances through elements. std::sort requires random-access iterator operations that list does not supply. list.sort instead works with its node structure.'],
  18: ['Shared ownership, weak observation and allocation', [
    'Returning a named local may permit optional NRVO, eliminating a transfer copy/move while still constructing the object. Certain prvalue-return constructions have guaranteed elision since C++17. Moving a const string ordinarily selects copying because its move constructor needs a non-const rvalue.',
    'Separate shared_ptr objects sharing one control block can manage ownership safely across threads; that does not synchronize writes to the managed object or all accesses to the same handle.',
    'weak_ptr::lock attempts to obtain a strong owner. Do not use an expired object through a saved raw pointer.',
    'make_shared commonly combines object/control-block storage. Weak owners can keep that allocation reserved after object destruction; use implementation details to inform, not replace, ownership reasoning.',
  ], 'Why is a cycle of shared_ptr owners a problem, and where can weak_ptr help?', 'Every object in a strong cycle can keep another’s strong count nonzero after outside owners disappear. A weak relationship observes without contributing a strong owner; lock obtains ownership only when the target still exists.'],
  19: ['Invalidation depends on the operation', [
    'Vector reallocation invalidates every element iterator, pointer and reference.',
    'Without reallocation, push_back preserves existing element handles but invalidates the old end. Middle insertion/erase invalidates positions at or after the affected point.',
    'reserve requests a capacity lower bound, not an exact count or a size change. Constant-amortized appending does not make every individual append constant-time.',
  ], 'Does reserve alone prove that an old iterator remains safe after any later edit?', 'No. It can avoid reallocation within the requested capacity, but middle insertion/erasure still shifts elements and invalidates affected positions. Recheck the specific operation’s rules.'],
  20: ['Known-position cost and node transfer', [
    'A list insertion at a known iterator can be O(1); locating that iterator can be O(n). Analyze the complete task.',
    'Whole-list and single-node splice are constant time. Cross-list range splice can be linear; valid allocator relationships are required.',
    'Stable node handles can justify a list. Contiguous traversal, indexing and lower per-element overhead can favor a vector. Neither choice is universally faster.',
  ], 'Why is O(1) insertion not enough to claim a linked list wins for arbitrary-position edits?', 'The position may require traversal, and allocation and cache costs still contribute. Compare the full operation mix and handle-stability requirements against vector’s indexing and shifting.'],
  21: ['Ordered lookup and hash guarantees', [
    'set member lower_bound exploits ordered-container structure in logarithmic time. Generic lower_bound over its bidirectional iterators can take linear iterator increments despite logarithmic comparisons.',
    'Unordered lookup has average constant and worst-case linear complexity. Rehash changes bucket organization and invalidates iterators, but not pointers/references to remaining elements.',
    'Comparator equivalence and hash equality define uniqueness. Duplicate-key containers explicitly choose to retain multiple equivalents.',
  ], 'Why prefer set.lower_bound(value) over generic lower_bound on set iterators?', 'The member operation can follow the container’s search structure in logarithmic time. The generic algorithm sees only bidirectional iteration and may need linear total movement.'],
  22: ['Insertion, update and argument evaluation', [
    'operator[] may insert a value-initialized mapped object. find, contains and at express different read-only behaviors.',
    'try_emplace avoids in-container mapped construction if the key exists, but its argument expressions are evaluated before the function runs.',
    'insert_or_assign deliberately updates or inserts. multimap equal_range groups equivalent keys without a unique-key operator[].',
  ], 'Why can try_emplace(key, expensive()) still run expensive when key exists?', 'Function arguments must be evaluated before entering try_emplace. The operation can avoid constructing its mapped value from those arguments, but does not defer arbitrary argument expressions.'],
  23: ['Separate observation and removal', [
    'top exposes the current value; pop destroys it and returns void. A copy made before pop remains independent.',
    'If copying throws before pop, the stack element can remain in place. A throwing move may modify the source, so guarantees depend on element behavior.',
    'A reference returned by top must not be used after its element is removed. Empty-stack access violates a precondition.',
  ], 'Why can copying top before popping be safer than a hypothetical pop-and-return operation?', 'The copy can finish before removal commits. If it fails without changing the source, the element remains. Separating the steps also makes the lifetime of the removed element explicit.'],
  24: ['Heap construction and selection policy', [
    'A heap constrains parents and children, not every pair of elements. Its extreme root is available without a fully sorted sequence.',
    'Bottom-up heap construction from n items is O(n): most nodes are near the leaves and require little work. Repeated individual pushes cost O(n log n) in the worst case.',
    'FIFO, min-priority and max-priority policies answer different scheduling questions. Equal-priority stability needs explicit extra policy if required.',
  ], 'Why can bulk heap construction beat inserting the same values one at a time?', 'Bottom-up construction adjusts short subtrees for most nodes, giving linear total work. Repeated insertion can each traverse a logarithmic path, totaling O(n log n).'],
  25: ['Height, traversal and ownership', [
    'BST search costs O(h); balancing controls h so worst-case paths stay logarithmic.',
    'A full traversal is O(n), with recursion depth O(h). Sorted in-order output requires the BST invariant.',
    'Owned child nodes need cleanup. Recursive ownership chains can themselves create deep destructor calls; iterative cleanup needs an explicit ownership-safe design.',
  ], 'Why can a BST containing sorted-insertion keys search in linear time?', 'Without balancing, each insertion can extend one side, producing height n. A search may visit that entire root-to-leaf chain.'],
  26: ['Graph density and representation', [
    'Adjacency lists use O(V+E) storage; matrices use O(V²). Fast individual edge checks and fast neighbor enumeration favor different representations.',
    'Disconnected graphs require multiple traversal starts to cover all vertices. Directed and undirected cycle tests use different conditions.',
    'Compressed sparse row stores edge ranges in flat arrays for compact traversal, but updating its structure is less straightforward than editing separate neighbor vectors.',
  ], 'When might a matrix be preferable despite its quadratic space?', 'When the graph is dense or constant-time edge queries dominate and V² storage is acceptable. Sparse neighbor traversal generally favors adjacency lists.'],
  27: ['Callable captures and logical end', [
    'remove returns the new logical end without shrinking the container. Erase destroys trailing objects, but vector capacity need not shrink.',
    'Value capture stores a copy at closure creation; reference capture borrows. Copying a pointer is not owning its target.',
    'A stored callable must retain valid captured state. std::function unifies compatible signatures with type erasure, but may have extra cost compared with a concrete callable type.',
  ], 'Why can returning a lambda that captures a local by reference be invalid?', 'The closure retains a reference after the local object’s lifetime ends. A value capture or an appropriate owning capture can preserve the needed state instead.'],
  28: ['Safe hierarchy navigation', [
    'Public inheritance enables a base view when the base is accessible and unambiguous; multiple inheritance can complicate that conversion.',
    'A polymorphic dynamic_cast pointer downcast checks the runtime relationship and returns null on failure; reference failure throws bad_cast.',
    'A static downcast provides no runtime proof. Virtual inheritance can share a common base in a diamond; the most-derived constructor initializes that virtual base.',
  ], 'When is dynamic_cast preferable to an unchecked downcast?', 'When the dynamic type is not established by the interface and the program needs a checked hierarchy conversion. Handle a failed pointer result or reference exception rather than assuming the target type.'],
  29: ['Virtual dispatch during lifetime transitions', [
    'Calling a virtual method through a base view normally selects the object’s final override.',
    'During construction/destruction, dispatch respects the class layer currently under construction/destruction rather than entering unavailable derived state.',
    'Polymorphic deletion needs an appropriate destructor policy. Public virtual destruction supports it; protected nonvirtual destruction can prohibit deletion through the base interface.',
  ], 'Why should a base constructor not rely on a derived override?', 'The derived layer is not yet initialized. Virtual dispatch from the base constructor does not call the derived override as though the complete derived object already existed.'],
  30: ['Conventional operators and comparison categories', [
    'Operator overloads retain the grammar’s existing precedence and operand count. Keep arithmetic and mutation meanings conventional.',
    'Stream insertion is normally a nonmember taking ostream& first and returning that stream to chain writes.',
    'Defaulted three-way comparison can provide equality under its language rules; hand-written <=> needs separate equality if required. Float-like values can have partial ordering.',
  ], 'Why return a stream reference from operator<< instead of void?', 'Returning the same stream allows the next insertion in a chain to use it, preserving normal stream syntax and state.'],
  31: ['Substitutability follows the contract', [
    'Encapsulation keeps object invariants enforceable through a small interface. Ownership is part of that interface’s lifetime contract.',
    'A mutable Rectangle interface allowing independently set width/height is not automatically satisfied by a Square that forces them equal.',
    'Composition avoids imposing an unsuitable is-a relationship. Dependency inversion introduces an abstraction when policy should not depend on a volatile detail.',
  ], 'Why can Square inheriting from a mutable Rectangle violate substitutability?', 'A caller may rely on changing width without changing height. A square override that changes both violates that base behavior. A different immutable interface or composition can avoid the incompatible contract.'],
  32: ['Constraints and two-stage checking', [
    'For a deduced forwarding reference T&&, T can represent an lvalue reference or a value type. std::forward<T>(argument) preserves the corresponding value category; std::move always requests an rvalue expression. A variadic Args&&... parameter pack can forward constructor arguments with std::forward<Args>(args)... .',
    'A template definition is parsed and nondependent names are checked before any concrete type is selected.',
    'Dependent operations are checked when instantiated; concepts state requirements on suitable arguments, not proofs of runtime value safety.',
    'Full specialization selects a particular template case. Function templates use overloads rather than partial specialization; visible definitions or explicit instantiation must support use.',
  ], 'Why can a template definition compile but one later call fail?', 'Some operations depend on the substituted type. The definition may be syntactically valid while a selected type lacks a required operation or fails a constraint.'],
  33: ['Synchronization, invariants and waiting', [
    'False sharing is cache-coherence contention between distinct objects sharing a cache line. It is a performance issue, not necessarily a data race. No universal cache-line byte count is promised.',
    'unique_lock supports unlocking/relocking around a condition-variable wait; lock_guard does not. Atomic compare_exchange_weak can fail spuriously, so retry loops must refresh desired state as needed. Atomics need not all be lock-free.',
    'A basic atomic_flag spinlock repeatedly test_and_set with acquire until successful, then clears with release to unlock. It can waste CPU and has no general fairness guarantee; prefer standard mutexes unless requirements justify and validate spinning.',
    'Join orders worker completion before the joining thread proceeds. It does not synchronize conflicting accesses between two workers during their execution.',
    'A mutex protects a shared invariant only when all relevant accesses follow the protocol. An atomic increment protects that operation, not arbitrary multi-step transactions.',
    'Condition variables wait for shared state: use a predicate under the same mutex because wakeups can be spurious. Notifications do not replace checking the condition. Consistent lock order helps avoid deadlocks.',
  ], 'Why must a condition-variable wait recheck a predicate?', 'A wakeup can be spurious, or another worker can change the state before the waiter reacquires the mutex. The predicate under the lock establishes whether the needed condition actually holds.'],
  34: ['Recurrences and amortized bounds', [
    'Write a cost function for a specified case. O, Omega and Theta are bounds, not automatic worst/best-case labels.',
    'Merge sort’s recurrence T(n)=2T(n/2)+Theta(n) has logarithmically many levels, each doing linear merge work, yielding Theta(n log n).',
    'Amortized vector growth bounds the whole operation sequence without assuming random inputs. Average-case analysis instead needs a distribution assumption.',
  ], 'How can one expensive append coexist with amortized O(1) append?', 'Across a geometrically growing sequence, total relocation work is linear in the number of appended elements. Dividing that total by the sequence length gives a constant amortized bound, despite occasional linear individual operations.'],
  35: ['Peak live workspace', [
    'Count additional memory simultaneously live, not the cumulative sum of every allocation over time.',
    'Recursive call depth counts as workspace. An explicit stack still consumes space even when allocated outside the machine call stack.',
    'Fixed counters and a swap temporary are O(1). Copying a whole n-element input is O(n) and may be a worthwhile trade for preserving the original.',
  ], 'Why does replacing recursion with an explicit stack not automatically make an algorithm constant-space?', 'The explicit stack may still store one pending state per depth or vertex. It changes management and location of the storage, not necessarily the number of live states.'],
  36: ['Prove an elimination or greedy choice', [
    'Two pointers and windows discard candidates only when sortedness or another monotone property makes the discard safe.',
    'Greedy interval scheduling chooses earliest finishing compatible intervals; an exchange argument shows replacing a first optimal choice with that interval leaves no less remaining room.',
    'Top-k selection retains a min-heap of up to k candidates. Handle k=0 and k>n; total work includes any sorting used to present retained results.',
  ], 'What evidence should accompany choosing a greedy algorithm?', 'State why committing to the local choice cannot exclude every optimal solution, usually with an exchange argument or invariant. A plausible choice or a few passing examples are not a correctness proof.'],
  37: ['Complexity, stability and comparator contracts', [
    'Comparison-based general sorting has an Omega(n log n) worst-case comparison lower bound. Bucket methods use extra assumptions about values and distributions.',
    'Stable sorting preserves equivalent elements’ earlier relative order. A strict weak comparator must be irreflexive and consistently transitive.',
    'std::sort provides O(n log n) comparisons without a mandated introsort implementation. stable_sort has O(n log n) comparisons with sufficient extra memory and may use O(n log² n) comparisons otherwise in C++20.',
  ], 'Why is returning a <= b an invalid ordering comparator?', 'It declares a value less than itself and equivalent values less than each other, violating strict weak ordering. Algorithms rely on that ordering contract, so use a consistent strict relation.'],
  38: ['Binary-search invariants and traversal reachability', [
    'A shrinking half-open candidate interval can converge to an insertion position; membership needs a separate bounds/equality check.',
    'Standard lower/upper-bound operations require suitable partitioning; sortedness under the same comparison is a straightforward sufficient condition.',
    'BFS discovers shortest edge-count distances from a start in an unweighted graph. DFS explores depth-first; disconnected components require further starts.',
  ], 'Why can lower_bound return a valid iterator without finding the target?', 'It locates the first value not less than the target, which can be a larger value. It can also return end. Check against end and compare the found value before reporting membership.'],
  39: ['Progress, live depth and repeated subproblems', [
    'A valid recursion argument identifies both a base case and a measure that decreases toward it on every recursive path.',
    'Memoization changes repeated computation into reuse, but requires cache storage and does not necessarily reduce active call depth.',
    'An iterative translation must preserve pending work and traversal order. Frame sizes, overflow symptoms and tail-call optimization depend on implementation.',
  ], 'How do you analyze time and memory of memoized Fibonacci separately?', 'There are O(n) distinct states with constant arithmetic work per state under a bounded-number model, plus O(n) cached values. A simple recursive version can still have O(n) active depth. An iterative pair of values avoids the cache and recursive chain when only the final value is needed.'],
};

const diagrams: Record<number, string> = {
  9: 'caller score: 10\n  value parameter -> separate int: 10\n  int& parameter -> aliases caller score',
  11: 'values:   [10] [25] [30]  (one past)\n           ^    ^             ^\n         first second        end\nValid element indices: 0, 1, 2; end is not an element.',
  18: 'Before move: first --owns--> int(42)\nAfter move:  first is empty\n             second --owns--> int(42)\nDestroy second -> release int exactly once.',
  19: 'size = 2, capacity >= 4\n[constructed][constructed][reserved storage ...]\nIndices 0 and 1 are elements; index 2 is not yet an element.',
  25: '       2\n      / \\\n     1   3\nPre-order: 2 1 3\nIn-order:  1 2 3\nPost-order:1 3 2',
  29: 'Dog object <--- const Animal& reference\n                  virtual voice() -> Dog override\nSeparate Animal value copied from Dog base subobject\n                  virtual voice() -> Animal implementation',
  33: 'worker A: lock -> increment -> unlock --\\\n                                         joins -> main reads\nworker B: lock -> increment -> unlock --/\nBoth workers use the same mutex.',
  39: 'sumTo(3) waits for sumTo(2)\n  sumTo(2) waits for sumTo(1)\n    sumTo(1) waits for sumTo(0)\n      sumTo(0) returns 0\n    return 1 + 0 = 1\n  return 2 + 1 = 3\nreturn 3 + 3 = 6',
};

export function teachingDeepDive(topic: number): DeepDive {
  const [title, breakdown, interviewQuestion, idealAnswer] = dives[topic];
  return { topic: title, breakdown, interviewQuestion, idealAnswer, diagramAscii: diagrams[topic] };
}
