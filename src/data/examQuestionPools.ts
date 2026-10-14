import { ExamQuestionDetail, Exam } from "../types";
import { withAssessmentPools } from './assessmentContent';

/**
 * Extensive question pools for each of the 4 milestone exams.
 * Each pool contains diverse questions across:
 * - MCQs (Multiple Choice)
 * - True / False
 * - Why This Code Works (Deep Systems & Memory Mechanics)
 * - Code Analysis (Finding Subtle Bugs, Race Conditions, Memory Leaks)
 * - Coding Challenges (Real hands-on C++ implementations)
 */
export const EXAM_QUESTION_POOLS: Record<string, ExamQuestionDetail[]> = withAssessmentPools({
  "exam-foundations": [
    // --- MCQs (10 pts each) ---
    {
      id: "ef-mcq-1",
      type: "mcq",
      category: "Smart Pointers & Memory",
      difficulty: "Medium",
      points: 10,
      question: "What is the memory size of `std::unique_ptr<int>` with the stateless default deleter on a typical 64-bit architecture?",
      options: ["8 bytes (same size as raw pointer via Empty Base Optimization)", "16 bytes (pointer + control block)", "24 bytes", "32 bytes"],
      correctAnswer: 0,
      explanation: "Due to the Empty Base Optimization (EBO) on the stateless default deleter, `std::unique_ptr` typically incurs zero size overhead over a raw pointer: typically 8 bytes on 64-bit platforms. Stateful custom deleters can increase this size."
    },
    {
      id: "ef-mcq-2",
      type: "mcq",
      category: "Move Semantics",
      difficulty: "Medium",
      points: 10,
      question: "What does `std::move(x)` do at runtime?",
      options: [
        "It copies memory to a new thread",
        "It clears the contents of x and zeros the RAM",
        "It performs zero runtime work; it is purely an unconditional compile-time cast to an rvalue reference (T&&)",
        "It calls the destructor of x"
      ],
      correctAnswer: 2,
      explanation: "`std::move` generates no CPU instructions; it is purely a static_cast to `T&&` so that move constructors or move assignments can be selected by overload resolution."
    },
    {
      id: "ef-mcq-3",
      type: "mcq",
      category: "Pointer Arithmetic",
      difficulty: "Medium",
      points: 10,
      question: "If `int* ptr` points to address `0x1000`, what is the hexadecimal address value of `ptr + 2` on a system where `sizeof(int) == 4`?",
      options: ["0x1002", "0x1004", "0x1008", "0x1010"],
      correctAnswer: 2,
      explanation: "Pointer arithmetic scales by the size of the pointed-to type: `0x1000 + (2 * sizeof(int)) = 0x1000 + 8 = 0x1008`."
    },
    {
      id: "ef-mcq-4",
      type: "mcq",
      category: "Architecture & Types",
      difficulty: "Easy",
      points: 10,
      question: "What is the relationship between `sizeof(int*)` and `sizeof(char*)` on a modern 64-bit operating system?",
      options: [
        "sizeof(int*) is 4 times larger than sizeof(char*)",
        "Both are typically 8 bytes because virtual memory addresses on standard 64-bit architectures are 64 bits wide",
        "sizeof(char*) is 1 byte, sizeof(int*) is 4 bytes",
        "It depends on compiler optimization flags"
      ],
      correctAnswer: 1,
      explanation: "Regardless of what type they point to, raw data pointers on typical 64-bit systems store a 64-bit virtual memory address and typically occupy 8 bytes."
    },
    {
      id: "ef-mcq-5",
      type: "mcq",
      category: "Smart Pointers",
      difficulty: "Hard",
      points: 10,
      question: "How does `std::shared_ptr` handle a custom deleter compared to `std::unique_ptr`?",
      options: [
        "`std::unique_ptr` type-erases the deleter into its control block; `std::shared_ptr` includes the deleter in its template type signature",
        "`std::shared_ptr` type-erases the deleter into its heap control block; `std::unique_ptr` requires the deleter type as part of its template type signature",
        "Neither allows custom deleters",
        "Both require the deleter type in their template parameters"
      ],
      correctAnswer: 1,
      explanation: "`std::unique_ptr<T, Deleter>` encodes the deleter type in the template signature (to avoid heap control block overhead), while `std::shared_ptr<T>` uses type erasure inside the heap control block."
    },
    {
      id: "ef-mcq-6",
      type: "mcq",
      category: "Dynamic Memory",
      difficulty: "Medium",
      points: 10,
      question: "Why does invoking scalar `delete ptr;` on memory allocated with array `new int[10];` cause Undefined Behavior?",
      options: [
        "Array new stores metadata (such as element count) in a cookie prefix; `delete[]` reads this cookie to call all destructors and free the entire chunk, whereas `delete` assumes a single object",
        "The OS refuses to deallocate arrays",
        "It only affects char arrays, not int arrays",
        "delete operates on the stack, delete[] on the heap"
      ],
      correctAnswer: 0,
      explanation: "Array allocations prefix memory with metadata recording the array length. Mismatched deallocation misinterprets this offset, leading to memory corruption or crashes."
    },
    {
      id: "ef-mcq-7",
      type: "mcq",
      category: "Smart Pointers",
      difficulty: "Hard",
      points: 10,
      question: "What is the primary architectural purpose of `std::weak_ptr` in modern C++ systems?",
      options: [
        "To allocate memory with lower CPU priority",
        "To break cyclic reference count deadlocks between `std::shared_ptr` instances while retaining observer capability",
        "To replace raw pointers in C++98",
        "To permit direct mutation without locking"
      ],
      correctAnswer: 1,
      explanation: "When two objects point to each other with `shared_ptr`, their `use_count` never reaches 0 (memory leak). A `weak_ptr` observes without incrementing `use_count`, breaking the cycle."
    },
    {
      id: "ef-mcq-8",
      type: "mcq",
      category: "Optimization & RVO",
      difficulty: "Hard",
      points: 10,
      question: "What is Named Return Value Optimization (NRVO) in modern C++?",
      options: [
        "The compiler renames variables to save disk space",
        "The compiler constructs a returned local object directly in the memory storage allocated for the caller's return slot, eliminating copy and move operations",
        "A runtime optimization performed by the CPU hardware cache",
        "An algorithm that converts recursion to iteration"
      ],
      correctAnswer: 1,
      explanation: "NRVO is a compiler elision optimization where the return value is directly instantiated in the caller's memory space, avoiding constructor calls entirely."
    },

    // --- True / False (10 pts each) ---
    {
      id: "ef-tf-1",
      type: "true-false",
      category: "Memory Safety",
      difficulty: "Easy",
      points: 10,
      question: "In C++, taking the address of a local stack variable and returning it from a function creates a dangling pointer and causes Undefined Behavior.",
      correctAnswer: true,
      explanation: "Stack frame memory for local variables is invalidated when the function returns. Returning a pointer/reference to local stack memory is a catastrophic dangling pointer."
    },
    {
      id: "ef-tf-2",
      type: "true-false",
      category: "Smart Pointers",
      difficulty: "Hard",
      points: 10,
      question: "Using `std::make_shared` is always preferred even if you have large objects and long-lived `std::weak_ptr` instances.",
      correctAnswer: false,
      explanation: "`make_shared` allocates the object and control block in one contiguous memory block. If `weak_ptr` instances outlive the `shared_ptr`, the entire combined memory block cannot be freed until all weak_ptrs are destroyed, keeping the dead object's memory allocated."
    },
    {
      id: "ef-tf-3",
      type: "true-false",
      category: "OOP & RAII",
      difficulty: "Medium",
      points: 10,
      question: "If a C++ class manages a raw heap resource and implements a custom destructor, failing to implement or delete the copy constructor and copy assignment operator violates the Rule of Three.",
      correctAnswer: true,
      explanation: "Without a custom copy constructor, the compiler creates a default memberwise shallow copy. When copied, both instances hold the same pointer, triggering a double-free crash upon destruction."
    },
    {
      id: "ef-tf-4",
      type: "true-false",
      category: "Language Standards",
      difficulty: "Easy",
      points: 10,
      question: "In modern C++, `nullptr` has type `std::nullptr_t` and is safely type-distinct from the integer literal `0`.",
      correctAnswer: true,
      explanation: "`nullptr` is strongly typed (`std::nullptr_t`), eliminating ambiguous overload resolution bugs that occurred with the C-style macro `NULL` (which was integer 0 or (void*)0)."
    },
    {
      id: "ef-tf-5",
      type: "true-false",
      category: "Move Semantics",
      difficulty: "Medium",
      points: 10,
      question: "Calling `std::move` on a `const` object (e.g. `const std::string s; auto s2 = std::move(s);`) will silently invoke the copy constructor instead of the move constructor.",
      correctAnswer: true,
      explanation: "`std::move` on `const T` yields `const T&&`. Move constructors require `T&&` (non-const), so overload resolution falls back to the copy constructor `T(const T&)`. No move occurs!"
    },
    {
      id: "ef-tf-6",
      type: "true-false",
      category: "Thread Safety",
      difficulty: "Hard",
      points: 10,
      question: "Because `std::shared_ptr` uses atomic reference counting for its control block, reading and mutating the pointed-to object from multiple threads without locks is thread-safe.",
      correctAnswer: false,
      explanation: "Only the control block's reference counters are atomic. The underlying pointed-to object has zero thread synchronization; concurrent unsynchronized writes to the managed object cause data races."
    },

    // --- Why This Code Works (15 pts) ---
    {
      id: "ef-wtw-1",
      type: "why-this-code-works",
      category: "Memory Layout & Internals",
      difficulty: "Hard",
      points: 15,
      question: "Why does `std::shared_ptr` require two separate reference counts (`use_count` and `weak_count`) inside its heap control block?",
      codeSnippet: `std::shared_ptr<Node> s = std::make_shared<Node>();
std::weak_ptr<Node> w = s;`,
      explanation: "The managed object is destroyed as soon as `use_count` reaches 0. However, the heap control block itself cannot be deallocated until `weak_count` ALSO reaches 0, because remaining `weak_ptr`s need to read the control block to check `expired()`.",
      rubricKeywords: ["use_count", "weak_count", "control block", "destroyed", "deallocated", "expired"]
    },
    {
      id: "ef-wtw-2",
      type: "why-this-code-works",
      category: "Zero-Cost Abstractions",
      difficulty: "Hard",
      points: 15,
      question: "Explain why `std::unique_ptr<T>` with the stateless default deleter `std::default_delete<T>` typically occupies zero extra bytes beyond a raw `T*` pointer.",
      codeSnippet: `std::unique_ptr<int> u = std::make_unique<int>(42);
static_assert(sizeof(u) == sizeof(int*));`,
      explanation: "`std::default_delete<T>` is a stateless empty class (0 non-static data members). C++ compilers apply the Empty Base Optimization (EBO) (or `[[no_unique_address]]` in C++20), allowing the empty deleter to occupy 0 bytes of subobject storage.",
      rubricKeywords: ["Empty Base Optimization", "EBO", "empty class", "zero bytes", "no_unique_address", "sizeof"]
    },
    {
      id: "ef-wtw-3",
      type: "why-this-code-works",
      category: "RAII & Exceptions",
      difficulty: "Hard",
      points: 15,
      question: "Explain the mechanics of Stack Unwinding and how RAII guarantees that allocated heap memory is freed when an exception is thrown.",
      codeSnippet: `void process() {
    auto res = std::make_unique<Buffer>();
    throw std::runtime_error("Failure!");
}`,
      explanation: "When an exception is thrown, the C++ runtime unwinds the call stack frame by frame. For every active automatic (stack) object in exiting scopes, its destructor is deterministically invoked. The `std::unique_ptr` destructor automatically executes `delete` on the heap buffer.",
      rubricKeywords: ["stack unwinding", "destructor", "deterministic", "scope", "delete", "exception"]
    },
    {
      id: "ef-wtw-4",
      type: "why-this-code-works",
      category: "Memory Allocation",
      difficulty: "Hard",
      points: 15,
      question: "Why does `std::make_shared<T>()` perform better in cache locality and allocation overhead than `std::shared_ptr<T>(new T())`?",
      codeSnippet: `auto p1 = std::make_shared<Widget>();           // Optimal
std::shared_ptr<Widget> p2(new Widget());        // Suboptimal`,
      explanation: "`new Widget()` performs two independent heap allocations: one for `Widget` and one for the control block, scattering them in RAM. `std::make_shared` executes a single contiguous heap allocation holding both the control block and `Widget` side-by-side, cutting heap allocator overhead by 50% and improving CPU cache prefetching.",
      rubricKeywords: ["single allocation", "contiguous", "cache locality", "control block", "two allocations", "heap overhead"]
    },

    // --- Code Analysis (15 pts) ---
    {
      id: "ef-ca-1",
      type: "code-analysis",
      category: "Rule of Three/Five",
      difficulty: "Hard",
      points: 15,
      question: "Identify the critical defect in this class and state which rule it violates:",
      codeSnippet: `class Buffer {
    char* data;
    int size;
public:
    Buffer(int s) : size(s), data(new char[s]) {}
    ~Buffer() { delete[] data; }
    // No copy constructor or copy assignment declared!
};`,
      explanation: "Violates the Rule of Three. The compiler generates a shallow copy constructor and copy assignment operator that simply copy the raw pointer `data`. When copied, two Buffers point to the exact same heap memory, triggering a double-free crash when both destructors run.",
      rubricKeywords: ["Rule of Three", "double free", "shallow copy", "copy constructor", "delete[]"]
    },
    {
      id: "ef-ca-2",
      type: "code-analysis",
      category: "Dangling Reference",
      difficulty: "Medium",
      points: 15,
      question: "Analyze this function and explain why calling `std::cout << getGreeting();` results in Undefined Behavior:",
      codeSnippet: `const std::string& getGreeting() {
    std::string msg = "Hello from Systems C++";
    return msg; // Returning reference to local
}`,
      explanation: "`msg` is an automatic stack variable. When `getGreeting()` returns, `msg` is destroyed by its destructor and its stack memory is reclaimed. Returning a reference (`const std::string&`) leaves the caller with a dangling reference to deallocated memory.",
      rubricKeywords: ["dangling reference", "stack variable", "destroyed", "deallocated", "undefined behavior", "lifetime"]
    },
    {
      id: "ef-ca-3",
      type: "code-analysis",
      category: "Memory Leak",
      difficulty: "Hard",
      points: 15,
      question: "Identify the memory leak that occurs in this snippet even though smart pointers are used:",
      codeSnippet: `struct Node {
    std::shared_ptr<Node> next;
};

void buildCycle() {
    auto a = std::make_shared<Node>();
    auto b = std::make_shared<Node>();
    a->next = b;
    b->next = a; // Cyclic link!
}`,
      explanation: "Creates a circular reference: `a` points to `b` and `b` points to `a`. When `buildCycle()` exits, the outer references go out of scope, but each Node's `use_count` remains at 1 because they point to each other. Neither destructor ever runs, leaking both Nodes. The fix is to change one pointer to `std::weak_ptr<Node>`.",
      rubricKeywords: ["circular reference", "cyclic", "use_count", "memory leak", "weak_ptr", "destructor"]
    },

    // --- Coding Challenges (20 pts) ---
    {
      id: "ef-cc-1",
      type: "coding-challenge",
      category: "Move Semantics Implementation",
      difficulty: "Hard",
      points: 20,
      question: "Implement a move constructor and move assignment operator for a lightweight `DynamicArray` struct:",
      codeSnippet: `struct DynamicArray {
    int* ptr = nullptr;
    size_t sz = 0;

    // TODO: Write DynamicArray(DynamicArray&& other) noexcept
    // TODO: Write DynamicArray& operator=(DynamicArray&& other) noexcept
};`,
      explanation: "The move constructor must steal `other.ptr` and `other.sz`, then nullify `other.ptr = nullptr; other.sz = 0;`. The move assignment operator must first `delete[] ptr;`, steal from other, reset other, and return `*this`.",
      rubricKeywords: ["other.ptr = nullptr", "other.sz = 0", "delete[]", "noexcept", "return *this"]
    },
    {
      id: "ef-cc-2",
      type: "coding-challenge",
      category: "RAII Implementation",
      difficulty: "Hard",
      points: 20,
      question: "Implement a minimal `ScopedInt` RAII wrapper that acquires heap memory in constructor and deletes in destructor, with deleted copy constructor:",
      codeSnippet: `class ScopedInt {
    int* val;
public:
    explicit ScopedInt(int v) : val(new int(v)) {}
    ~ScopedInt() { delete val; }
    
    // Disallow copying:
    ScopedInt(const ScopedInt&) = delete;
    ScopedInt& operator=(const ScopedInt&) = delete;

    int get() const { return *val; }
};`,
      explanation: "Delete copy operations via `= delete` to enforce sole ownership semantics. In destructor, clean up using `delete val;`.",
      rubricKeywords: ["delete", "= delete", "explicit", "destructor"]
    }
  ],

  "exam-stl": [
    // --- MCQs (10 pts each) ---
    {
      id: "estl-mcq-1",
      type: "mcq",
      category: "STL Algorithms",
      difficulty: "Medium",
      points: 10,
      question: "Why does `std::sort` fail to compile when passed `std::list::begin()` and `std::list::end()`?",
      options: [
        "`std::sort` only works on numbers",
        "`std::sort` requires RandomAccessIterator (`it + n` in O(1)); `std::list` iterators are only BidirectionalIterators",
        "`std::list` is already sorted",
        "`std::sort` cannot swap list nodes"
      ],
      correctAnswer: 1,
      explanation: "Introsort requires random access arithmetic for pivot selection and partitioning in O(1); `std::list` provides `list.sort()` instead."
    },
    {
      id: "estl-mcq-2",
      type: "mcq",
      category: "Views & Strings",
      difficulty: "Medium",
      points: 10,
      question: "What is the memory ownership model of `std::string_view`?",
      options: [
        "It owns heap memory with copy-on-write",
        "It is a non-owning read-only view consisting solely of a pointer and a length",
        "It automatically garbage collects strings",
        "It creates a null-terminated heap copy"
      ],
      correctAnswer: 1,
      explanation: "`std::string_view` holds `const char*` and `size_t` with zero ownership and zero allocation."
    },
    {
      id: "estl-mcq-3",
      type: "mcq",
      category: "Containers",
      difficulty: "Hard",
      points: 10,
      question: "What is the internal memory layout of `std::deque` in most standard C++ implementations?",
      options: [
        "A single contiguous dynamic buffer like `std::vector`",
        "A doubly-linked list where every node stores a single element",
        "A central map of pointers pointing to fixed-size contiguous memory pages (chunks)",
        "A binary search tree"
      ],
      correctAnswer: 2,
      explanation: "`std::deque` (double-ended queue) uses an array of pointers to fixed-size memory blocks (pages), allowing O(1) push and pop at both ends without reallocating existing elements."
    },
    {
      id: "estl-mcq-4",
      type: "mcq",
      category: "Adaptors",
      difficulty: "Medium",
      points: 10,
      question: "By default, what is the underlying container and ordering of `std::priority_queue<int>`?",
      options: [
        "`std::list`, min-element at top",
        "`std::vector`, max-element at top (using `std::less<int>`)",
        "`std::deque`, FIFO ordering",
        "`std::set`, sorted balance"
      ],
      correctAnswer: 1,
      explanation: "Default `std::priority_queue` is a max-heap backed by `std::vector` using `std::less`, placing the greatest element at `.top()`."
    },
    {
      id: "estl-mcq-5",
      type: "mcq",
      category: "Containers",
      difficulty: "Medium",
      points: 10,
      question: "What is the time complexity difference for lookups between `std::map` and `std::unordered_map`?",
      options: [
        "`std::map` is O(1) average; `std::unordered_map` is O(N)",
        "`std::map` is guaranteed O(log N) worst-case; `std::unordered_map` is O(1) average but O(N) worst-case",
        "Both are strictly O(1) at all times",
        "`std::map` is O(N); `std::unordered_map` is O(log N)"
      ],
      correctAnswer: 1,
      explanation: "`std::map` is backed by a Red-Black tree (guaranteed O(log N) worst-case). `std::unordered_map` is a hash table (O(1) average, but degrades to O(N) under hash collisions)."
    },
    {
      id: "estl-mcq-6",
      type: "mcq",
      category: "Vector Mechanics",
      difficulty: "Medium",
      points: 10,
      question: "What happens to iterators pointing into a `std::vector` when a new element is added via `push_back` and `size() == capacity()`?",
      options: [
        "Iterators remain valid indefinitely",
        "All iterators, pointers, and references to elements are invalidated due to reallocation of the underlying buffer",
        "Only the end iterator is invalidated",
        "The compiler throws an exception"
      ],
      correctAnswer: 1,
      explanation: "When capacity is exceeded, the vector allocates a new memory block, copies/moves elements, and frees the old block. All existing iterators now point to freed memory (dangling)."
    },
    {
      id: "estl-mcq-7",
      type: "mcq",
      category: "Modern C++",
      difficulty: "Hard",
      points: 10,
      question: "What is `std::span` introduced in C++20?",
      options: [
        "A thread synchronization primitive",
        "A non-owning view over a contiguous sequence of objects (pointer + size), generalizing string_view to any type T",
        "A replacement for std::vector with automatic garbage collection",
        "A memory mapped file reader"
      ],
      correctAnswer: 1,
      explanation: "`std::span<T>` provides a lightweight, non-owning view over any contiguous container (C array, `std::vector`, `std::array`)."
    },

    // --- True / False (10 pts each) ---
    {
      id: "estl-tf-1",
      type: "true-false",
      category: "STL Idioms",
      difficulty: "Medium",
      points: 10,
      question: "`std::remove(v.begin(), v.end(), val)` shrinks the `size()` of `v` by the number of elements removed.",
      correctAnswer: false,
      explanation: "`std::remove` only shifts non-matching elements forward; to shrink the container, the classic erase-remove idiom `v.erase(std::remove(...), v.end())` is required."
    },
    {
      id: "estl-tf-2",
      type: "true-false",
      category: "Associative Containers",
      difficulty: "Hard",
      points: 10,
      question: "The comparator passed to `std::map` must implement a Strict Weak Ordering, meaning `comp(a, a)` MUST always return `false`.",
      correctAnswer: true,
      explanation: "Comparators must be irreflexive; returning true for equal elements breaks Red-Black tree balancing logic and causes undefined behavior."
    },
    {
      id: "estl-tf-3",
      type: "true-false",
      category: "Associative Containers",
      difficulty: "Medium",
      points: 10,
      question: "Using `operator[]` on `std::map<std::string, int> m;` with a key that does not exist will automatically insert a new element with a default-constructed value (0).",
      correctAnswer: true,
      explanation: "`m[key]` inserts `std::make_pair(key, V{})` if key is absent. For read-only lookups, use `m.find(key)` or `m.at(key)` to prevent unintended mutations."
    },
    {
      id: "estl-tf-4",
      type: "true-false",
      category: "Vector Specialization",
      difficulty: "Hard",
      points: 10,
      question: "`std::vector<bool>` stores a standard contiguous array of `bool` bytes where `&v[0]` returns a valid `bool*`.",
      correctAnswer: false,
      explanation: "`std::vector<bool>` is a famous historical specialization that compresses booleans into 1 bit per element. Because single bits are not addressable in C++, `operator[]` returns a proxy object (`std::vector<bool>::reference`), NOT a `bool&`."
    },
    {
      id: "estl-tf-5",
      type: "true-false",
      category: "Algorithms",
      difficulty: "Medium",
      points: 10,
      question: "`std::lower_bound` requires the input range to be partitioned/sorted with respect to the search value to execute in logarithmic $O(\\log N)$ comparisons.",
      correctAnswer: true,
      explanation: "Binary search algorithms (`lower_bound`, `upper_bound`, `binary_search`) require a sorted or partitioned range; running them on unsorted data results in incorrect results or infinite loops."
    },

    // --- Why This Code Works (15 pts) ---
    {
      id: "estl-wtw-1",
      type: "why-this-code-works",
      category: "Hash Table Mechanics",
      difficulty: "Hard",
      points: 15,
      question: "Explain why and how `std::unordered_map` degrades from O(1) average lookup to O(N) worst-case lookup, and how the container resolves collisions internally.",
      explanation: "Internally `std::unordered_map` uses an array of buckets with separate chaining (linked list per bucket). When keys produce hash collisions, multiple entries are chained into the same bucket. If all keys hash to the same bucket (e.g. hash collision attack or poor hash function), searching requires traversing a linked list of length N, degrading lookup from O(1) to O(N).",
      rubricKeywords: ["separate chaining", "buckets", "linked list", "hash collision", "O(N) worst case", "modulo"]
    },
    {
      id: "estl-wtw-2",
      type: "why-this-code-works",
      category: "Sorting & Algorithms",
      difficulty: "Hard",
      points: 15,
      question: "Explain Introsort: Why does `std::sort` start with Quicksort and switch to Heapsort when recursion depth exceeds $2 \\log_2 N$?",
      explanation: "Quicksort has optimal $O(N \\log N)$ average performance with superior cache locality, but has an $O(N^2)$ worst-case on pathological pivot choices. By switching to Heapsort once recursion depth reaches $2 \\log_2 N$, Introsort guarantees a worst-case $O(N \\log N)$ bound while retaining Quicksort's speed.",
      rubricKeywords: ["Introsort", "Quicksort", "Heapsort", "recursion depth", "O(N log N) worst-case", "O(N^2)"]
    },
    {
      id: "estl-wtw-3",
      type: "why-this-code-works",
      category: "Amortized Analysis",
      difficulty: "Hard",
      points: 15,
      question: "Prove why geometric expansion (doubling capacity) in `std::vector` achieves amortized $O(1)$ `push_back`, while expanding by a constant $+K$ would yield $O(N)$ amortized time.",
      explanation: "Doubling capacity means reallocation happens at sizes 1, 2, 4, 8... Total elements copied across N insertions is $1 + 2 + 4 + ... + N \\approx 2N$. Divided by N pushes: $2N / N = 2 = O(1)$ amortized cost. Growing by constant $K$ requires $N/K$ reallocations copying $K + 2K + 3K + ... \\approx O(N^2)$ total operations, which averages to $O(N)$ per push.",
      rubricKeywords: ["geometric expansion", "doubling", "sum of powers", "2N operations", "amortized O(1)", "constant K is O(N)"]
    },

    // --- Code Analysis (15 pts) ---
    {
      id: "estl-ca-1",
      type: "code-analysis",
      category: "Iterator Invalidation",
      difficulty: "Hard",
      points: 15,
      question: "Explain why calling `it = v.begin()` before `v.push_back(42)` makes dereferencing `*it` undefined behavior in this snippet:",
      codeSnippet: `std::vector<int> v;
v.reserve(2);
v.push_back(1);
v.push_back(2);
auto it = v.begin();
v.push_back(3); // push exceeds capacity
std::cout << *it;`,
      explanation: "Initial capacity was 2. Adding the third element exceeds capacity, forcing the vector to allocate a larger memory block, move existing elements, and free the old buffer. `it` still points to the deallocated buffer, resulting in a use-after-free dangling pointer dereference.",
      rubricKeywords: ["reallocation", "capacity", "dangling pointer", "use-after-free", "invalidation"]
    },
    {
      id: "estl-ca-2",
      type: "code-analysis",
      category: "Dangling String View",
      difficulty: "Hard",
      points: 15,
      question: "Identify the lifetime bug in this code involving `std::string_view`:",
      codeSnippet: `std::string_view getFullMessage(const std::string& first, const std::string& second) {
    std::string combined = first + " " + second;
    return combined; // Returns string_view of temporary
}`,
      explanation: "`combined` is a local temporary `std::string` that is destroyed when `getFullMessage()` exits. Returning a `std::string_view` leaves it pointing to deallocated heap memory, causing a use-after-free bug upon access.",
      rubricKeywords: ["temporary", "lifetime", "dangling", "destroyed", "use-after-free", "string_view"]
    },
    {
      id: "estl-ca-3",
      type: "code-analysis",
      category: "Iterator Mutation Bug",
      difficulty: "Medium",
      points: 15,
      question: "Explain why this loop crashing when erasing elements from `std::vector` occurs:",
      codeSnippet: `std::vector<int> nums = {1, 2, 3, 4, 5};
for (auto it = nums.begin(); it != nums.end(); ++it) {
    if (*it % 2 == 0) {
        nums.erase(it); // Critical bug here!
    }
}`,
      explanation: "`nums.erase(it)` invalidates `it` and all subsequent iterators. The loop then performs `++it` on an invalidated iterator, causing undefined behavior or crashes. The return value `it = nums.erase(it)` must be captured instead of executing `++it`.",
      rubricKeywords: ["erase", "invalidated iterator", "return value", "++it", "undefined behavior"]
    },

    // --- Coding Challenges (20 pts) ---
    {
      id: "estl-cc-1",
      type: "coding-challenge",
      category: "Algorithms & Hash Maps",
      difficulty: "Hard",
      points: 20,
      question: "Implement an algorithm to group anagrams using `std::unordered_map` in C++:",
      codeSnippet: `#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

std::vector<std::vector<std::string>> groupAnagrams(const std::vector<std::string>& strs) {
    // Return groups of anagrams
    return {};
}`,
      explanation: "Sort each string to use as the canonical map key: `std::unordered_map<std::string, std::vector<std::string>> groups;`. Iterate over words, sort a copy, push into `groups[sortedKey].push_back(word)`, and return the grouped vectors.",
      rubricKeywords: ["std::sort", "unordered_map", "key", "push_back"]
    },
    {
      id: "estl-cc-2",
      type: "coding-challenge",
      category: "Priority Queue Heap",
      difficulty: "Hard",
      points: 20,
      question: "Find the Kth largest element in an unsorted `std::vector<int>` using a min-heap `std::priority_queue`:",
      codeSnippet: `#include <vector>
#include <queue>

int findKthLargest(const std::vector<int>& nums, int k) {
    // Implement using min-heap priority_queue of size k
    return 0;
}`,
      explanation: "Maintain a min-heap `std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap;`. Push elements, and if `minHeap.size() > k`, pop the smallest. After iterating, `minHeap.top()` is the kth largest.",
      rubricKeywords: ["priority_queue", "greater", "minHeap.pop()", "top()"]
    }
  ],

  "exam-systems": [
    // --- MCQs (10 pts each) ---
    {
      id: "esys-mcq-1",
      type: "mcq",
      category: "Memory Alignment & Padding",
      difficulty: "Hard",
      points: 10,
      question: "Why does `sizeof(Derived)` include padding when containing `char` followed by `double` on a 64-bit architecture?",
      options: [
        "Hardware requires 64-bit alignment for double so addresses are multiples of 8",
        "C++ reserves memory for future virtual functions",
        "The stack requires 128-byte alignment",
        "Compilers intentionally waste memory"
      ],
      correctAnswer: 0,
      explanation: "Natural memory alignment requires 8-byte types like `double` to align to addresses divisible by 8. A `char` (1 byte) is padded with 7 bytes so the `double` begins at an 8-byte boundary."
    },
    {
      id: "esys-mcq-2",
      type: "mcq",
      category: "Concurrency & Hardware",
      difficulty: "Hard",
      points: 10,
      question: "What is 'False Sharing' in high-performance multithreaded C++?",
      options: [
        "Using a mutex incorrectly",
        "Two threads on separate cores mutating independent variables that reside on the same 64-byte cache line",
        "Sharing pointers without const",
        "Inheriting from private base classes"
      ],
      correctAnswer: 1,
      explanation: "Independent variables on the same 64-byte cache line trigger unnecessary cache coherence invalidations across CPU cores, stalling processor pipelines."
    },
    {
      id: "esys-mcq-3",
      type: "mcq",
      category: "Hardware Atomics",
      difficulty: "Hard",
      points: 10,
      question: "How do `std::atomic<int>` operations avoid kernel-level thread context switches?",
      options: [
        "They disable the operating system scheduler",
        "They compile to atomic hardware CPU bus-locked instructions (e.g. `LOCK XADD` or LL/SC) executed directly in hardware registers",
        "They use hidden spinlocks allocated in OS kernel space",
        "They copy the variable to GPU registers"
      ],
      correctAnswer: 1,
      explanation: "Lock-free atomics map directly to CPU assembly instructions, avoiding expensive OS system calls and thread scheduling overhead."
    },
    {
      id: "esys-mcq-4",
      type: "mcq",
      category: "Runtime Type Info (RTTI)",
      difficulty: "Hard",
      points: 10,
      question: "Why is `dynamic_cast` significantly slower than `static_cast` in polymorphic C++ code?",
      options: [
        "It allocates heap memory on every call",
        "It traverses runtime type information (RTTI) metadata structures at runtime to verify class inheritance relationships",
        "It performs a cryptographic hash of the pointer",
        "It locks a global mutex"
      ],
      correctAnswer: 1,
      explanation: "`dynamic_cast` must read the object's `type_info` and walk the class hierarchy DAG to verify that the target type is a valid subobject, whereas `static_cast` is purely compile-time pointer adjustment."
    },
    {
      id: "esys-mcq-5",
      type: "mcq",
      category: "Synchronization",
      difficulty: "Hard",
      points: 10,
      question: "Why does `std::condition_variable::wait` require a `std::unique_lock<std::mutex>` rather than `std::lock_guard<std::mutex>`?",
      options: [
        "`std::lock_guard` cannot be copied",
        "`std::condition_variable` must atomically unlock the mutex while going to sleep, and re-acquire it upon waking up; `std::lock_guard` does not support explicit unlock/lock operations",
        "`std::unique_lock` is faster than `std::lock_guard`",
        "`std::lock_guard` is only supported on Windows"
      ],
      correctAnswer: 1,
      explanation: "`wait()` atomically releases the mutex and suspends the thread, then re-acquires the mutex before returning. `std::unique_lock` provides `.unlock()` and `.lock()`, which `std::lock_guard` lacks."
    },
    {
      id: "esys-mcq-6",
      type: "mcq",
      category: "OOP Mechanics",
      difficulty: "Hard",
      points: 10,
      question: "What happens when an object of derived class `Derived` is passed by value to a function expecting `Base` (`void fn(Base b);`)?",
      options: [
        "Compile-time error",
        "Object Slicing occurs: the Derived-specific member variables and vptr are sliced off; only the Base subobject is copied into `b`",
        "The function executes the Derived virtual methods dynamically",
        "Memory leak"
      ],
      correctAnswer: 1,
      explanation: "Passing by value copies only `sizeof(Base)` bytes via Base's copy constructor, slicing away the Derived portion and resetting the vptr to `Base`."
    },

    // --- True / False (10 pts each) ---
    {
      id: "esys-tf-1",
      type: "true-false",
      category: "Polymorphism Internals",
      difficulty: "Hard",
      points: 10,
      question: "Calling a virtual function inside a Base class constructor will dispatch dynamically to the Derived class override in C++.",
      correctAnswer: false,
      explanation: "In C++, the Derived object is not yet constructed when the Base constructor runs. The vptr points to Base's vtable, calling the Base implementation."
    },
    {
      id: "esys-tf-2",
      type: "true-false",
      category: "Multithreading",
      difficulty: "Medium",
      points: 10,
      question: "A `std::condition_variable` can experience spurious wakeups, meaning a thread may wake up from `cv.wait()` even if no thread called `notify_one()` or `notify_all()`.",
      correctAnswer: true,
      explanation: "Operating system context switches and signal handling can wake waiting threads spuriously. Condition variable waits must always check the condition in a `while` loop or use the predicate overload."
    },
    {
      id: "esys-tf-3",
      type: "true-false",
      category: "OOP Internals",
      difficulty: "Hard",
      points: 10,
      question: "In multiple inheritance (e.g. `class C : public A, public B`), an instance of `C` typically contains multiple `vptr` pointers in its memory layout.",
      correctAnswer: true,
      explanation: "Because pointers to `A` and `B` can both refer to `C` at different memory offsets, each base subobject requiring dynamic dispatch retains its own `vptr` pointing to appropriate vtable entries."
    },
    {
      id: "esys-tf-4",
      type: "true-false",
      category: "Concurrency",
      difficulty: "Hard",
      points: 10,
      question: "Declaring a member variable as `volatile int x;` in C++ guarantees atomic synchronization and prevents data races between threads.",
      correctAnswer: false,
      explanation: "`volatile` in C++ only informs the compiler not to optimize away reads/writes (intended for memory-mapped hardware I/O). It provides ZERO thread synchronization, memory barriers, or atomicity. Use `std::atomic` instead."
    },

    // --- Why This Code Works (15 pts) ---
    {
      id: "esys-wtw-1",
      type: "why-this-code-works",
      category: "Assembly & Vtable Layout",
      difficulty: "Advanced",
      points: 15,
      question: "Explain the assembly and memory layout mechanics of a virtual function call through a base pointer `Base* b = new Derived(); b->render();`.",
      explanation: "Each polymorphic object contains a hidden 8-byte `vptr` as its first field. When `b->render()` is called, the CPU dereferences `b` to read `vptr`, looks up the offset for `render()` in `Derived`'s static `vtable` array (.rodata), and executes an indirect `call` instruction to that address.",
      rubricKeywords: ["vptr", "vtable", "indirect call", "offset", "function pointer", "dereference"]
    },
    {
      id: "esys-wtw-2",
      type: "why-this-code-works",
      category: "Hardware Atomics & CAS",
      difficulty: "Advanced",
      points: 15,
      question: "Explain how Compare-And-Swap (`std::atomic::compare_exchange_weak`) enables lock-free algorithms, and why it is typically executed in a `while` loop.",
      codeSnippet: `int expected = count.load();
while (!count.compare_exchange_weak(expected, expected + 1)) {
    // Retry loop
}`,
      explanation: "CAS atomically checks if the memory location holds `expected`. If true, it writes the new value; if false, it updates `expected` with the current value. The `while` loop retries if another thread concurrently mutated the value, achieving thread safety without OS mutex locking.",
      rubricKeywords: ["compare_exchange_weak", "CAS", "expected", "atomically", "lock-free", "retry loop"]
    },

    // --- Code Analysis (15 pts) ---
    {
      id: "esys-ca-1",
      type: "code-analysis",
      category: "Multithreading Concurrency Bug",
      difficulty: "Hard",
      points: 15,
      question: "Identify the critical bug in this multithreaded condition variable wait loop:",
      codeSnippet: `std::mutex m;
std::condition_variable cv;
bool ready = false;

void worker() {
    std::unique_lock<std::mutex> lk(m);
    if (!ready) {
        cv.wait(lk); // Critical bug here!
    }
    // Process work
}`,
      explanation: "Using an `if` statement instead of a `while` loop or predicate overload exposes the worker to spurious wakeups. The OS can wake the thread without a notify, causing it to proceed even though `ready` is still false.",
      rubricKeywords: ["spurious wakeup", "while loop", "predicate", "ready == false"]
    },
    {
      id: "esys-ca-2",
      type: "code-analysis",
      category: "Thread Lifetime Bug",
      difficulty: "Hard",
      points: 15,
      question: "Explain what happens when `startWorker()` finishes and why the program crashes:",
      codeSnippet: `void startWorker() {
    std::thread t([]{
        // Work
    });
    // Exits scope here
}`,
      explanation: "`t` is a joinable thread object. When `startWorker()` exits, `t`'s destructor is invoked while `t.joinable()` is true. Under the C++ standard, destroying a joinable thread calls `std::terminate()`, immediately aborting the application.",
      rubricKeywords: ["joinable", "std::terminate", "crash", "join()", "detach()", "destructor"]
    },
    {
      id: "esys-ca-3",
      type: "code-analysis",
      category: "Deadlock Bug",
      difficulty: "Hard",
      points: 15,
      question: "Identify the concurrency flaw in these two functions running on separate threads:",
      codeSnippet: `std::mutex m1, m2;

void threadA() {
    std::lock_guard<std::mutex> l1(m1);
    std::lock_guard<std::mutex> l2(m2);
}

void threadB() {
    std::lock_guard<std::mutex> l1(m2); // Opposite order!
    std::lock_guard<std::mutex> l2(m1);
}`,
      explanation: "Lock acquisition inversion causes a classic Deadlock. If threadA acquires `m1` while threadB acquires `m2`, each thread will wait indefinitely for the other to release the second mutex. Use `std::scoped_lock(m1, m2)` or enforce a strict global lock hierarchy.",
      rubricKeywords: ["deadlock", "lock ordering", "inversion", "scoped_lock", "wait indefinitely"]
    },

    // --- Coding Challenges (20 pts) ---
    {
      id: "esys-cc-1",
      type: "coding-challenge",
      category: "Thread Synchronization",
      difficulty: "Hard",
      points: 20,
      question: "Write a thread-safe bounded queue `push` method using `std::mutex` and `std::condition_variable`:",
      codeSnippet: `#include <queue>
#include <mutex>
#include <condition_variable>

class ThreadSafeQueue {
    std::queue<int> q;
    std::mutex mtx;
    std::condition_variable cv;
public:
    void push(int val) {
        // Implement thread-safe push and notify
    }
};`,
      explanation: "Acquire lock via `std::lock_guard<std::mutex> lock(mtx);`, push to queue `q.push(val);`, and call `cv.notify_one();`.",
      rubricKeywords: ["lock_guard", "unique_lock", "q.push", "notify_one"]
    },
    {
      id: "esys-cc-2",
      type: "coding-challenge",
      category: "Lock-Free Primitives",
      difficulty: "Hard",
      points: 20,
      question: "Implement a lightweight SpinLock class using `std::atomic_flag` with `test_and_set` and `clear`:",
      codeSnippet: `#include <atomic>

class SpinLock {
    std::atomic_flag flag = ATOMIC_FLAG_INIT;
public:
    void lock() {
        // Busy wait until acquired
    }
    void unlock() {
        // Release flag
    }
};`,
      explanation: "In `lock()`, loop while `flag.test_and_set(std::memory_order_acquire)`. In `unlock()`, call `flag.clear(std::memory_order_release)`.",
      rubricKeywords: ["test_and_set", "clear", "memory_order_acquire", "memory_order_release"]
    }
  ],

  "exam-final": [
    // --- MCQs (10 pts each) ---
    {
      id: "efin-mcq-1",
      type: "mcq",
      category: "Exception Specifications",
      difficulty: "Hard",
      points: 10,
      question: "What happens if an exception escapes a function declared with the `noexcept` specifier in modern C++?",
      options: [
        "The exception is caught by a hidden global handler",
        "`std::terminate()` is immediately invoked by the C++ runtime, terminating the application without further stack unwinding",
        "The function returns a default-constructed value",
        "The compiler fails to link the binary"
      ],
      correctAnswer: 1,
      explanation: "`noexcept` guarantees to the compiler that no exception will escape; if one does, the runtime calls `std::terminate()` without running further stack unwinding."
    },
    {
      id: "efin-mcq-2",
      type: "mcq",
      category: "Cache Locality & Architecture",
      difficulty: "Hard",
      points: 10,
      question: "Why is a `std::vector` of small structs typically significantly faster to iterate than a `std::list` of the same structs?",
      options: [
        "Vector has O(log N) traversal",
        "Contiguous memory layout enables spatial cache locality and hardware prefetching on 64-byte cache lines, whereas list causes constant pointer-chasing cache misses",
        "List requires kernel system calls to advance pointers",
        "Vector uses GPU registers"
      ],
      correctAnswer: 1,
      explanation: "CPUs fetch 64-byte chunks into L1 cache; contiguous vector elements hit the cache, whereas node-based lists scatter memory across heap pages."
    },
    {
      id: "efin-mcq-3",
      type: "mcq",
      category: "Sanitizers & Tooling",
      difficulty: "Hard",
      points: 10,
      question: "Can AddressSanitizer (`-fsanitize=address`) and ThreadSanitizer (`-fsanitize=thread`) be compiled together in a single GCC binary?",
      options: [
        "Yes, it is recommended for all production builds",
        "No, they have conflicting shadow memory architectures and cannot be used simultaneously",
        "Yes, but only on ARM processors",
        "Only when compiling with -O3"
      ],
      correctAnswer: 1,
      explanation: "ASan and TSan both define proprietary incompatible shadow memory mappings and will generate compile/link errors if combined."
    },
    {
      id: "efin-mcq-4",
      type: "mcq",
      category: "Generic Programming & Templates",
      difficulty: "Advanced",
      points: 10,
      question: "What does `std::forward<T>(arg)` achieve in generic code compared to `std::move`?",
      options: [
        "It always casts to an rvalue reference",
        "It conditionally preserves the original value category (lvalue or rvalue) of a forwarding reference `T&&` (Perfect Forwarding)",
        "It moves arg to a worker thread",
        "It copies arg into registers"
      ],
      correctAnswer: 1,
      explanation: "`std::forward` is conditional: if `T` was deduced as an lvalue reference, it casts to lvalue; if deduced as non-reference, it casts to rvalue. This enables perfect forwarding without unnecessary moves or copies."
    },
    {
      id: "efin-mcq-5",
      type: "mcq",
      category: "Memory Management",
      difficulty: "Hard",
      points: 10,
      question: "What is Placement New in C++ (`new (address) T()`)?",
      options: [
        "A faster version of malloc",
        "A mechanism to construct an object in pre-allocated raw memory storage without allocating new heap memory",
        "An allocation placed in CPU L1 cache",
        "A feature deprecated in C++20"
      ],
      correctAnswer: 1,
      explanation: "Placement new calls the constructor of `T` directly inside an existing memory buffer (e.g. in custom memory pools or `std::vector` capacity buffer) without allocating."
    },
    {
      id: "efin-mcq-6",
      type: "mcq",
      category: "Memory Model",
      difficulty: "Advanced",
      points: 10,
      question: "What is the Strict Aliasing Rule in C++?",
      options: [
        "Variable names must be unique within a file",
        "Two pointers of different incompatible types cannot point to the same memory location, allowing the compiler to optimize memory loads into CPU registers",
        "All references must be const",
        "Pointers cannot be passed to functions"
      ],
      correctAnswer: 1,
      explanation: "The Strict Aliasing Rule permits compilers to assume that reads through pointer `T1*` will never be affected by writes through `T2*`. Violating it via `reinterpret_cast` causes undefined behavior."
    },

    // --- True / False (10 pts each) ---
    {
      id: "efin-tf-1",
      type: "true-false",
      category: "Virtual Destructors",
      difficulty: "Medium",
      points: 10,
      question: "In C++, deleting an object of a derived class through a base pointer `Base* b = new Derived(); delete b;` when `Base` has a non-virtual destructor is safe as long as Derived has no member variables.",
      correctAnswer: false,
      explanation: "Deleting through a base pointer with a non-virtual destructor is explicitly Undefined Behavior under the C++ ISO standard, regardless of member variables."
    },
    {
      id: "efin-tf-2",
      type: "true-false",
      category: "Templates & Compilation",
      difficulty: "Medium",
      points: 10,
      question: "In standard C++, template class and function definitions must generally be present in header files because the compiler needs full source code to instantiate templates for specific types.",
      correctAnswer: true,
      explanation: "Templates are blueprints instantiated at compile time per translation unit. Without the definition in the header, other translation units produce link errors."
    },
    {
      id: "efin-tf-3",
      type: "true-false",
      category: "Standards & Specifications",
      difficulty: "Hard",
      points: 10,
      question: "Marking a move constructor `noexcept` is required for `std::vector` to use move operations instead of copy operations when reallocating its internal buffer.",
      correctAnswer: true,
      explanation: "To uphold the Strong Exception Guarantee, `std::vector` will only move elements during reallocation if the move constructor is `noexcept`. Otherwise, it falls back to copying so it can roll back if an exception is thrown."
    },
    {
      id: "efin-tf-4",
      type: "true-false",
      category: "Memory Management",
      difficulty: "Easy",
      points: 10,
      question: "Memory allocated using C-style `malloc()` can be deallocated safely using C++ `delete`.",
      correctAnswer: false,
      explanation: "`malloc`/`free` and `new`/`delete` must never be mixed. `delete` expects C++ runtime heap metadata and executes destructors; mixing them causes undefined behavior and heap corruption."
    },

    // --- Why This Code Works (15 pts) ---
    {
      id: "efin-wtw-1",
      type: "why-this-code-works",
      category: "RAII & Exception Safety",
      difficulty: "Advanced",
      points: 15,
      question: "Explain how RAII eliminates resource leaks in modern C++ even in the presence of runtime exceptions, compared to manual try/catch/finally in other languages.",
      explanation: "RAII binds resource lifetime to object lifetime. Objects allocated on the stack have their destructors deterministically called by the C++ runtime during stack unwinding whenever a scope exits—whether by normal return, break, or thrown exception. This guarantees cleanups with zero chance of programmer omission or exception swallowing.",
      rubricKeywords: ["stack unwinding", "deterministic destructors", "scope exit", "exception safety", "resource leak"]
    },
    {
      id: "efin-wtw-2",
      type: "why-this-code-works",
      category: "Move Semantics & Exception Safety",
      difficulty: "Advanced",
      points: 15,
      question: "Explain why `std::vector` requires `noexcept` on move constructors to provide the Strong Exception Guarantee during reallocation.",
      explanation: "During reallocation, if a move constructor throws mid-way, already-moved elements in the old buffer are in moved-from states and cannot be restored to their original values, breaking the strong guarantee. If `is_nothrow_move_constructible` is false, `std::vector` copies elements instead so it can discard the new buffer and maintain original state if a copy throws.",
      rubricKeywords: ["Strong Exception Guarantee", "noexcept", "moved-from", "roll back", "copy fallback", "reallocation"]
    },

    // --- Code Analysis (15 pts) ---
    {
      id: "efin-ca-1",
      type: "code-analysis",
      category: "Threading & Destructor Safety",
      difficulty: "Hard",
      points: 15,
      question: "Analyze the following snippet and describe what bug occurs when `startTask()` finishes:",
      codeSnippet: `void startTask() {
    std::thread t([]{
        // Long background job
    });
    // Function exits here without t.join() or t.detach()
}`,
      explanation: "`t` is a joinable `std::thread`. When `startTask()` returns, `t`'s destructor is called while `t.joinable()` is still true. In C++11/14/17, the `std::thread` destructor calls `std::terminate()`, causing an immediate program crash.",
      rubricKeywords: ["joinable", "std::terminate", "crash", "join()", "detach()"]
    },
    {
      id: "efin-ca-2",
      type: "code-analysis",
      category: "Object Slicing",
      difficulty: "Hard",
      points: 15,
      question: "Identify the object slicing bug in this polymorphic logging snippet:",
      codeSnippet: `class Animal { public: virtual void speak() { std::cout << "?"; } };
class Dog : public Animal { public: void speak() override { std::cout << "Woof"; } };

void printVoice(Animal a) { // Bug here!
    a.speak();
}`,
      explanation: "`printVoice(Animal a)` accepts `Animal` by value. When a `Dog` object is passed, it is sliced: only the `Animal` subobject is copied into parameter `a`, and `a`'s vptr points to `Animal`'s vtable. It will print '?' instead of 'Woof'. The fix is `void printVoice(const Animal& a)`.",
      rubricKeywords: ["object slicing", "by value", "by reference", "const Animal&", "vptr", "Woof"]
    },

    // --- Coding Challenges (20 pts) ---
    {
      id: "efin-cc-1",
      type: "coding-challenge",
      category: "Two-Pointer Optimization",
      difficulty: "Hard",
      points: 20,
      question: "Write an in-place string compaction function that removes all spaces in-place in O(N) time and O(1) extra space:",
      codeSnippet: `#include <string>

void removeSpaces(std::string& s) {
    // Two-pointer in-place compaction
}`,
      explanation: "Use two pointers: `size_t write = 0; for (size_t read = 0; read < s.size(); ++read) { if (s[read] != ' ') s[write++] = s[read]; } s.resize(write);`.",
      rubricKeywords: ["write", "read", "s.resize", "O(N)"]
    },
    {
      id: "efin-cc-2",
      type: "coding-challenge",
      category: "Template Implementation",
      difficulty: "Advanced",
      points: 20,
      question: "Implement a simplified version of `std::make_unique<T>` using variadic templates and perfect forwarding:",
      codeSnippet: `#include <memory>
#include <utility>

template<typename T, typename... Args>
std::unique_ptr<T> my_make_unique(Args&&... args) {
    // Return std::unique_ptr<T> with forwarded args
    return nullptr;
}`,
      explanation: "Use `return std::unique_ptr<T>(new T(std::forward<Args>(args)...));` to forward constructor arguments perfectly to `T`'s constructor.",
      rubricKeywords: ["std::unique_ptr<T>", "new T", "std::forward<Args>(args)..."]
    }
  ]
});

/**
 * Returns all questions in the pool for a given exam ID.
 */
export function getExamQuestionPool(examId: string): ExamQuestionDetail[] {
  return EXAM_QUESTION_POOLS[examId] || [];
}

/**
 * Returns statistics about the question pool for a given exam.
 */
export function getExamPoolStatistics(examId: string) {
  const pool = getExamQuestionPool(examId);
  const categories = Array.from(new Set(pool.map(q => q.category || "General").filter(Boolean)));

  return {
    total: pool.length,
    mcqs: pool.filter(q => q.type === "mcq").length,
    trueFalse: pool.filter(q => q.type === "true-false").length,
    whyWorks: pool.filter(q => q.type === "why-this-code-works").length,
    codeAnalysis: pool.filter(q => q.type === "code-analysis").length,
    challenges: pool.filter(q => q.type === "coding-challenge").length,
    categories
  };
}

/**
 * Shuffles an array with an optional seed or random numbers.
 */
function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Shuffles options for a multiple choice question while updating the correctAnswer index.
 */
function shuffleMcqOptions(q: ExamQuestionDetail): ExamQuestionDetail {
  if (q.type !== "mcq" || !q.options || typeof q.correctAnswer !== "number") {
    return q;
  }

  const originalCorrectText = q.options[q.correctAnswer];
  const shuffledOptions = shuffleArray(q.options);
  const newCorrectIndex = shuffledOptions.indexOf(originalCorrectText);

  return {
    ...q,
    options: shuffledOptions,
    correctAnswer: newCorrectIndex >= 0 ? newCorrectIndex : q.correctAnswer
  };
}

/**
 * Generates a randomized, balanced 100-point exam from the question pool.
 *
 * Stratified Exam Composition:
 * - 3 MCQs (10 pts each = 30 pts)
 * - 2 True/False (10 pts each = 20 pts)
 * - 1 Why This Code Works (15 pts)
 * - 1 Code Analysis / Bug Finding (15 pts)
 * - 1 Coding Challenge (20 pts)
 * Total: 30 + 20 + 15 + 15 + 20 = 100 Points!
 */
export function generateRandomizedExam(baseExam: Exam): Exam {
  const pool = getExamQuestionPool(baseExam.id);
  if (!pool || pool.length === 0) {
    return baseExam;
  }

  const mcqs = pool.filter(q => q.type === "mcq");
  const trueFalse = pool.filter(q => q.type === "true-false");
  const whyWorks = pool.filter(q => q.type === "why-this-code-works");
  const codeAnalysis = pool.filter(q => q.type === "code-analysis");
  const challenges = pool.filter(q => q.type === "coding-challenge");

  // Sample stratified subset
  const sampledMcqs = shuffleArray(mcqs).slice(0, 3).map(shuffleMcqOptions);
  const sampledTrueFalse = shuffleArray(trueFalse).slice(0, 2);
  const sampledWhyWorks = shuffleArray(whyWorks).slice(0, 1);
  const sampledCodeAnalysis = shuffleArray(codeAnalysis).slice(0, 1);
  const sampledChallenge = shuffleArray(challenges).slice(0, 1);

  // Normalize point values to ensure exact 100 points
  const finalQuestions: ExamQuestionDetail[] = [
    ...sampledMcqs.map((q, idx) => ({ ...q, points: 10, id: `${q.id}_s${idx}` })),
    ...sampledTrueFalse.map((q, idx) => ({ ...q, points: 10, id: `${q.id}_s${idx}` })),
    ...sampledWhyWorks.map((q, idx) => ({ ...q, points: 15, id: `${q.id}_s${idx}` })),
    ...sampledCodeAnalysis.map((q, idx) => ({ ...q, points: 15, id: `${q.id}_s${idx}` })),
    ...sampledChallenge.map((q, idx) => ({ ...q, points: 20, id: `${q.id}_s${idx}` }))
  ];

  return {
    ...baseExam,
    questions: finalQuestions,
    poolSize: pool.length,
    isRandomizedPool: true
  };
}
