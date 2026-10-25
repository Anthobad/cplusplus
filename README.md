# Modern C++ Systems Engineering & Interview Roadmap

A production-grade, full-stack C++ interview preparation and mastery platform designed for senior and systems software engineering candidates.

[Security and migration requirements](docs/security-assessment-hardening.md): Node 24, server-verified Firebase authentication, trusted assessment writes and shared quotas are required. Review the migration/rollout notes before deploying the tightened Firestore rules; browser caches are never imported as verified evidence.

The [production backend build](docs/production-backend-esm-fix.md) compiles Firebase and Sandbox module boundaries into `server-build/server.cjs`, outside public frontend assets. Vercel loads this same artifact. Run `npm run test:backend` to check native startup and Firebase verification with synchronous `require(ESM)` disabled.

The roadmap also offers [Optional Interview Practice](docs/optional-interview-practice.md): five lessons with compiler-tested exercises for binary search, BFS, DFS, backtracking, and dynamic programming. This track is separate from the 39-topic progression.

[Curriculum loading](docs/deferred-curriculum-loading.md) uses generated domain assets. Standard npm dev/build/test/lint commands generate them automatically; run `npm run generate:curriculum` before invoking tooling directly on a fresh checkout.

---

## 🏛️ Curriculum Architecture (4 Knowledge Domains)

The curriculum has been reorganized into four structured Knowledge Domains matching rigorous real-world interview standards:

### I. Language Basics (Topics 1 – 18)
- **1. C++ Evolution**: Bjarne Stroustrup history, C with Classes, C++98/03, modern revisions (C++11, C++14, C++17, C++20, C++23) and standard deprecations.
- **2. Compilation**: 4-phase pipeline (Preprocessing `#include`/`#define`, Compilation to ASM, Assembly to object files `.o`/`.obj`, Linking with libraries).
- **3. Running C++ Code**: Entry point `main(int argc, char* argv[])`, standard return conventions, platform runners (`g++`, `clang++`, MSVC).
- **4. Variables**:
  - Declaration and Initialization (direct, copy, uniform/brace initialization `int x{0}`)
  - Memory Location & Lifecycle (stack, data segment, BSS, text segment)
  - Primitive Types (`char`, `int`, `float`, `double`, `bool`, fixed-width `int32_t`, `uint64_t`)
  - Non-Primitive Types (structs, classes, enums, unions)
  - Casting (`static_cast`, `dynamic_cast`, `const_cast`, `reinterpret_cast`)
  - Const Variables (`const`, `constexpr`, `consteval`, immutability rules)
- **5. Methods**:
  - Signatures and name mangling
  - Static methods (class-level, no `this` pointer)
  - Instance methods (member methods and implicit `this`)
  - Pass by Value vs Pass by Reference (`const T&`, `T&`, rvalue reference `T&&`)
- **6. Operator Precedence**: Order of operations, unary vs binary associativity, short-circuit evaluation.
- **7. Math Operations**: Arithmetic operators, integer overflow, floating-point precision, `<cmath>`, `<numeric>`, bitwise shifts.
- **8. String Manipulation**: C-style strings (`char*`, null-termination), `std::string`, `std::string_view` (zero-copy slicing), SSO (Small String Optimization).
- **9. Conditionals**: `if`, `else if`, `else`, if with initializer (`if (init; cond)` in C++17), and `switch` statements with `[[fallthrough]]`.
- **10. Loops**: `for`, range-based for (`for (const auto& item : vec)`), `while`, `do-while`, recursion as an iterative alternative.
- **11. I/O Streams**: `std::cin`, `std::cout`, `std::cerr`, `std::clog`, buffer flushing, `std::ios::sync_with_stdio(false)`, stream manipulators.
- **12. Exceptions**: `try`, `catch`, `throw`, standard exception hierarchy (`std::exception`, `std::runtime_error`), `noexcept` specifier, exception safety guarantees.
- **13. Multi-Threading (Basic)**:
  - Processes vs Threads (address space isolation vs shared memory)
  - `std::thread`, `join()`, and `detach()`
  - Mutexes (`std::mutex`, `std::lock_guard`, `std::unique_lock`, `std::scoped_lock`)
  - Race conditions, data races, deadlocks, and atomics (`std::atomic`)
- **14. Templates**: Function templates, class templates, template specialization, non-type template parameters (NTTP), SFINAE, Concepts (C++20).
- **15. Differences between C++ and Java**: Memory management (RAII vs Garbage Collection), compilation targets (native machine code vs JVM bytecode), pointers/references, multiple inheritance, operator overloading.
- **16. STL (Standard Template Library)**: Containers, Iterators, Algorithms, and Functors architecture.
- **17. Namespaces**: `namespace`, nested namespaces, inline namespaces (API versioning), `using namespace` pitfalls, ADL (Argument-Dependent Lookup).
- **18. Smart Pointers**: `std::unique_ptr` (exclusive ownership, zero overhead), `std::shared_ptr` (atomic reference counting, control block), `std::weak_ptr` (breaking cycles), `std::make_unique` vs `std::make_shared`.

---

### II. Data Structures (Topics 19 – 27)
- **1. Array**: `std::vector` (dynamic array, amortized $O(1)$ push_back, capacity vs size, iterator invalidation) & `std::array` (fixed-size, stack-allocated, contiguous).
- **2. List**: `std::list` (doubly-linked, non-contiguous, cache friendliness trade-offs) & `std::forward_list` (singly-linked, minimum memory footprint).
- **3. Set**: `std::set` (Red-Black self-balancing BST, $O(\log n)$, strictly ordered), `std::unordered_set` (hash table, $O(1)$ average, collision buckets), `std::multiset`, and `std::unordered_multiset`.
- **4. Map**: `std::map` (ordered key-value, Red-Black tree), `std::unordered_map` (hash map, load factor, rehashing), `std::multimap`, and `std::unordered_multimap`.
- **5. Stack**: `std::stack` container adapter (LIFO semantics, default `std::deque` backing).
- **6. Queue**:
  - `std::queue` (FIFO container adapter)
  - `std::priority_queue` (max-heap adapter over `std::vector` using `std::push_heap`/`pop_heap`)
  - `std::deque` (double-ended chunked array buffer, $O(1)$ push/pop at both front and back)
- **7. Tree**:
  - Binary Tree (node structure, traversals, height)
  - Binary Search Tree (BST invariants, search, insertion, deletion)
- **8. Graphs**:
  - Directed vs Undirected graphs
  - Adjacency List vs Adjacency Matrix representations
  - Acyclic Graphs & Directed Acyclic Graphs (DAG)
- **9. Manipulating Data Structures**:
  - Iterators (input, output, forward, bidirectional, random-access, contiguous)
  - Function Objects (`<functional>`, `std::function`, functors)
  - Lambda Expressions (`[captures](params) -> ret { body }`, capture by value/ref, mutable lambdas)
  - STL Algorithms (`<algorithm>`: `std::sort`, `std::transform`, `std::find_if`, `std::accumulate`)

---

### III. Object-Oriented Programming (Topics 28 – 33)
- **1. Classes and Objects**:
  - Class vs Struct (default access public vs private)
  - Object lifecycle (construction, lifetime, destruction)
  - Access Modifiers (`public`, `protected`, `private`)
  - Methods, data members, constructors (default, parameterized, copy, move)
  - Destructors, Accessors, `static` members, `const` member functions
  - `friend` classes and functions, `enum class` scoped enumerations
  - Header (`.hpp`/`.h`) vs Implementation (`.cpp`) splitting
  - The Rule of Three (Destructor, Copy Constructor, Copy Assignment) and Rule of Five (Move Constructor, Move Assignment) / Rule of Zero.
- **2. Pointers & Memory Fundamentals**:
  - What are pointers? (Memory addresses, address-of `&`, dereference `*`)
  - Stack memory allocation (automatic storage, call frames, cache locality)
  - Heap memory allocation (dynamic storage, `new`/`delete`, memory leaks)
  - References vs Pointers as method parameters (nullability, re-seating)
  - Pointer arithmetic (scaling by `sizeof(T)`, array indexing duality)
  - Smart Pointers bridge to RAII.
- **3. Inheritance**:
  - Derived classes, `public`/`protected`/`private` inheritance modes
  - Single, multiple, hierarchical, and multilevel inheritance
  - Downcasting and upcasting (`static_cast` vs `dynamic_cast`)
- **4. Polymorphism**:
  - Dynamic polymorphism via `virtual` functions and pure virtual functions (`= 0`)
  - Abstract classes and interfaces
  - Virtual Table (`vtable`) and virtual pointer (`vptr`) layout & overhead
  - Virtual Destructors (preventing undefined behavior during polymorphic deletion)
  - The Diamond Problem and `virtual` base classes
  - Static polymorphism (Function Overloading, Templates, CRTP).
- **5. Operator Overloading**:
  - Arithmetic (`+`, `-`, `*`), stream (`<<`, `>>`), subscript (`[]`), and assignment (`=`) operators.
  - Member vs non-member friend operator declarations.
- **6. Further OOP & Design Principles**:
  - Composition vs Inheritance (has-a vs is-a, code reuse trade-offs)
  - Association and Aggregation
  - Encapsulation and data hiding
  - **SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.

---

### IV. Algorithms (Topics 34 – 39)
- **1. Time Complexity**: Big-O, Big-$\Omega$, Big-$\Theta$, asymptotic analysis, recursive recurrence relations (Master Theorem).
- **2. Space Complexity**: Auxiliary space, call stack space, in-place algorithms.
- **3. Algorithmic Techniques**:
  - Brute Force, Greedy, Divide and Conquer
  - Two Pointers Technique
  - Fast & Slow Pointers (Floyd's Cycle Finding)
  - Merge Intervals Technique
  - Sliding Window Technique (fixed and dynamic size)
  - Cyclic Sort Technique
  - Subsets Technique (backtracking and bit manipulation)
  - Topological Sort (Kahn's algorithm & DFS with recursion stack)
  - Top K Elements (min-heap / max-heap patterns)
- **4. Sorting**:
  - Quadratic sorts: Selection Sort, Bubble Sort, Insertion Sort
  - Log-linear sorts: Merge Sort, Quick Sort (pivot strategies, introsort), Heap Sort
  - Non-comparative: Bucket Sort, Counting Sort, Radix Sort.
- **5. Searching**:
  - Tree Traversals: Pre-order, In-order, Post-order, Level-order
  - Graph Traversals: Breadth-First Search (BFS) and Depth-First Search (DFS)
  - Linear Search ($O(n)$) and Binary Search ($O(\log n)$) on sorted arrays/ranges.
- **6. Recursion**:
  - Iterative vs Recursive mental models
  - Call stack frame overhead and stack overflow limits
  - Memoization and intermediate state maintenance
  - Base case identification and recursive invariant induction.

---

## 🔒 Code Evaluation & Sandbox Architecture

### Real Compiler & Test Execution Engine
1. **Runner Architecture & Safety**:
   - Vercel production uses `VercelSandboxCodeRunner`, creating an isolated ephemeral microVM for every submission.
   - Google production retains `IsolatedProductionRunner` when an external endpoint is configured, otherwise Wandbox.
   - Local development may use `LocalCodeRunner`, which executes code on the development host using `g++` and must not be used for untrusted public submissions.
   - Production never runs student C++ on the application host, and never changes providers after an execution failure.
   - Select a provider with the server-only `CODE_RUNNER_MODE`: `vercel-sandbox`, `wandbox`, or `isolated`; `local` is restricted to development.
   - Vercel configuration, compiler provisioning, limits, validation, and deployment requirements are documented in [docs/vercel-sandbox-integration.md](docs/vercel-sandbox-integration.md).
2. **Execution & Resource Limits**:
   - Compiles with modern flags (`-O2 -std=c++20 -Wall -Wextra`).
   - Process bounds include execution timeout (2500ms max) and stdout/stderr output caps (64 KB max).
   - Evaluates trusted server-side public tests and hidden tests retrieved strictly from the server challenge registry.
   - Hidden test case inputs and expected outputs are never exposed in client bundles or API responses.
3. **Deterministic Scoring**:
   - Score is calculated deterministically: $\frac{\text{passed tests}}{\text{total tests}} \times 100$.
   - **Zero Fake Pass Fallbacks**: Any failed evaluation reports `"Code evaluation is temporarily unavailable"` and never modifies user progress. Code length or heuristics never result in a passing grade.
4. **Decoupled AI Review**:
   - AI provides qualitative review (idiomatic C++, readability, time/space complexity) but never overrides compiler/test correctness.
   - If tests fail, the evaluation outcome is strictly FAILED regardless of AI comments.

---

## 🎯 Practice Mode vs. Assessment Mode

- **Practice Mode**:
  - Hints enabled.
  - Interactive AI Mentor guidance available.
  - Public test case runner with detailed stdout/stderr inspector.
  - Solution reveal available (marks the challenge as "assisted").
- **Assessment Mode**:
  - Active globally when `assessmentMode !== "none"` (`quiz`, `exam`, `coding-assessment`, `mock-interview`).
  - Standard AI Mentor and hints are locked out.
  - Solution reveal disabled.
  - Gated by authoritative server-side hidden test cases and real compilation.
  - Required to unlock downstream units and certification milestone credentials.
- **Assistance Tracking**:
  - `wasAssisted` tracks whether the candidate consulted official solutions or hints during practice.
  - Assisted attempts can never be presented as independently verified assessment results (`verified: false`).
  - Frontend assistance tracking is designed for personal learning and self-paced interview preparation; it is not tamper-proof certification authority.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start local full-stack server
npm run dev
```

App runs on `http://localhost:3000`.
