import { Exam } from "../types";

export const CURRICULUM_EXAMS: Exam[] = [
  {
    id: "exam-foundations",
    title: "Milestone Exam 1: Language Basics",
    subtitle: "Syntax, Compilation, Types, Methods, Flow Control, Pointers, Classes & Smart Pointers",
    description: "Evaluates mastery of C++ Program Structure, Fundamental Types, Memory Sizes & Casting, Methods & References, Flow Control, Raw Pointers, Classes, and Smart Pointers.",
    durationMinutes: 45,
    passingScore: 50,
    allowCppReference: true,
    coversPhases: [1],
    questions: [
      {
        id: "ex1-q1",
        type: "mcq",
        points: 10,
        question: "What is the memory size of `std::unique_ptr<int>` with the stateless default deleter on a typical 64-bit architecture?",
        options: ["8 bytes (same size as raw pointer via Empty Base Optimization)", "16 bytes (pointer + control block)", "24 bytes", "32 bytes"],
        correctAnswer: 0,
        explanation: "Due to the Empty Base Optimization (EBO) on the stateless default deleter, std::unique_ptr stores only the raw pointer (typically 8 bytes on 64-bit platforms). Custom stateful deleters would increase this size."
      },
      {
        id: "ex1-q2",
        type: "true-false",
        points: 10,
        question: "In C++, returning a pointer or reference to a local stack variable causes a dangling reference and triggers Undefined Behavior.",
        correctAnswer: true,
        explanation: "Stack frame memory for local variables is invalidated when the function returns. Returning an address to dead stack memory is an invalid dangling pointer."
      },
      {
        id: "ex1-q3",
        type: "why-this-code-works",
        points: 15,
        question: "Why does `std::shared_ptr` require two separate reference counts (`use_count` and `weak_count`) inside its heap control block?",
        codeSnippet: `std::shared_ptr<Node> s = std::make_shared<Node>();
std::weak_ptr<Node> w = s;`,
        explanation: "The managed object is destroyed as soon as `use_count` reaches 0. However, the heap control block itself cannot be deallocated until `weak_count` ALSO reaches 0, because remaining `weak_ptr`s need to read the control block to check `expired()`.",
        rubricKeywords: ["use_count", "weak_count", "control block", "destroyed", "deallocated", "expired"]
      },
      {
        id: "ex1-q4",
        type: "code-analysis",
        points: 15,
        question: "Identify the critical flaw in this function when passing arguments without const reference:",
        codeSnippet: `void processLargeDataset(std::vector<std::string> data) {
    for (const auto& item : data) {
        std::cout << item << "\\n";
    }
}`,
        explanation: "The parameter `std::vector<std::string> data` is passed by value, triggering an expensive deep copy of the entire vector and all its strings on the heap every time the function is called. It should be passed as `const std::vector<std::string>& data`.",
        rubricKeywords: ["pass by value", "deep copy", "heap allocation", "const reference", "performance overhead"]
      },
      {
        id: "ex1-q5",
        type: "mcq",
        points: 10,
        question: "What does `std::move(x)` do at runtime?",
        options: [
            "It copies memory to a new thread",
            "It clears the contents of x and zeros RAM",
            "It performs zero runtime work; it is purely an unconditional compile-time cast to an rvalue reference (T&&)",
            "It calls the destructor of x"
        ],
        correctAnswer: 2,
        explanation: "`std::move` generates zero CPU instructions; it is purely a static_cast to `T&&` so that move constructors or move assignments can be selected."
      },
      {
        id: "ex1-q6",
        type: "true-false",
        points: 10,
        question: "Short-circuit evaluation is guaranteed for custom overloaded operator&& and operator|| functions.",
        correctAnswer: false,
        explanation: "Overloaded operator&& and operator|| lose short-circuit evaluation and evaluate all arguments. Never overload them."
      },
      {
        id: "ex1-q7",
        type: "coding-challenge",
        points: 30,
        question: "Implement an in-place array reverse function `void reverseBuffer(int* buffer, int length)` using raw pointer arithmetic:",
        codeSnippet: `void reverseBuffer(int* buffer, int length) {
    if (!buffer || length <= 1) return;
    int* left = buffer;
    int* right = buffer + length - 1;
    while (left < right) {
        int temp = *left;
        *left = *right;
        *right = temp;
        ++left;
        --right;
    }
}`,
        explanation: "Initialize two pointers: `int* left = buffer; int* right = buffer + length - 1;`. Swap the dereferenced values `*left` and `*right`, advancing `++left` and decrementing `--right` until pointers meet.",
        rubricKeywords: ["buffer", "pointer", "left", "right", "swap", "arithmetic"]
      }
    ]
  },
  {
    id: "exam-stl",
    title: "Milestone Exam 2: Data Structures & STL Containers",
    subtitle: "Vector Internals, Lists, Sets, Maps, Stacks, Queues, Trees, Graphs & Algorithms",
    description: "Evaluates vector capacity growth, Red-Black trees in std::set/map, hash collisions in std::unordered_map, BFS/DFS, and STL algorithm manipulation.",
    durationMinutes: 60,
    passingScore: 50,
    allowCppReference: true,
    coversPhases: [2],
    questions: [
      {
        id: "ex2-q1",
        type: "why-this-code-works",
        points: 20,
        question: "Explain why and how `std::unordered_map` degrades from O(1) average lookup to O(N) worst-case lookup, and how the container resolves collisions internally.",
        explanation: "Internally `std::unordered_map` uses an array of buckets with separate chaining (linked list per bucket). When keys produce hash collisions, multiple entries are chained into the same bucket. If all keys hash to the same bucket, searching requires traversing a linked list of length N, degrading lookup to O(N).",
        rubricKeywords: ["separate chaining", "buckets", "linked list", "hash collision", "O(N) worst case", "modulo"]
      },
      {
        id: "ex2-q2",
        type: "mcq",
        points: 10,
        question: "Why does `std::sort` fail to compile when passed `std::list::begin()` and `std::list::end()`?",
        options: [
            "`std::sort` only works on numbers",
            "`std::sort` requires RandomAccessIterator (`it + n` in O(1)); `std::list` iterators are BidirectionalIterators",
            "`std::list` is already sorted",
            "`std::sort` cannot swap list nodes"
        ],
        correctAnswer: 1,
        explanation: "Introsort requires random access arithmetic for pivot selection and partitioning in O(1); `std::list` provides `list.sort()` instead."
      },
      {
        id: "ex2-q3",
        type: "true-false",
        points: 10,
        question: "`std::remove(v.begin(), v.end(), val)` shrinks the `size()` of `v` by the number of elements removed.",
        correctAnswer: false,
        explanation: "`std::remove` only shifts non-matching elements forward; to shrink the container, the classic erase-remove idiom `v.erase(std::remove(...), v.end())` is required."
      },
      {
        id: "ex2-q4",
        type: "code-analysis",
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
        id: "ex2-q5",
        type: "mcq",
        points: 10,
        question: "What is the typical memory size of `std::string_view` on a 64-bit architecture?",
        options: [
            "8 bytes",
            "Typically 16 bytes (pointer + length words)",
            "24 bytes",
            "32 bytes"
        ],
        correctAnswer: 1,
        explanation: "In typical 64-bit implementations, `std::string_view` holds `const char*` (8 bytes) and `size_t` (8 bytes) with zero heap ownership and zero allocation overhead."
      },
      {
        id: "ex2-q6",
        type: "true-false",
        points: 10,
        question: "The comparator passed to `std::map` must implement a Strict Weak Ordering, meaning `comp(a, a)` MUST always return `false`.",
        correctAnswer: true,
        explanation: "Comparators must be irreflexive; returning true for equal elements breaks Red-Black tree balancing logic and causes undefined behavior."
      },
      {
        id: "ex2-q7",
        type: "coding-challenge",
        points: 25,
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
      }
    ]
  },
  {
    id: "exam-systems",
    title: "Milestone Exam 3: Object-Oriented Programming & Systems Architecture",
    subtitle: "Inheritance, Polymorphism, vtable Dispatch, Operator Overloading, SOLID, Templates & Concurrency",
    description: "Evaluates deep comprehension of inheritance hierarchies, vptr/vtable mechanics, virtual destructors, operator overloading, SOLID design, templates, and multi-threaded synchronization.",
    durationMinutes: 60,
    passingScore: 50,
    allowCppReference: false,
    coversPhases: [3],
    questions: [
      {
        id: "ex3-q1",
        type: "why-this-code-works",
        points: 20,
        question: "Explain the assembly and memory layout mechanics of a virtual function call through a base pointer `Base* b = new Derived(); b->render();`.",
        explanation: "Each polymorphic object contains a hidden 8-byte `vptr` as its first field. When `b->render()` is called, the CPU dereferences `b` to read `vptr`, looks up the offset for `render()` in `Derived`'s static `vtable` array (.rodata), and executes an indirect `call` instruction to that address.",
        rubricKeywords: ["vptr", "vtable", "indirect call", "offset", "function pointer", "dereference"]
      },
      {
        id: "ex3-q2",
        type: "mcq",
        points: 10,
        question: "What catastrophic defect occurs when deleting a Derived object through a Base pointer with a non-virtual destructor?",
        options: [
            "Compilation error",
            "Derived destructor is never invoked, leaking resources and triggering Undefined Behavior",
            "Derived constructor runs again",
            "Automatic fallback to free()"
        ],
        correctAnswer: 1,
        explanation: "Without a virtual destructor, dynamic dispatch does not occur; only Base's destructor runs, skipping Derived's destructor and leaking Derived's resources."
      },
      {
        id: "ex3-q3",
        type: "true-false",
        points: 10,
        question: "Calling a virtual function inside a Base class constructor will dispatch dynamically to the Derived class override in C++.",
        correctAnswer: false,
        explanation: "In C++, the Derived object is not yet constructed when the Base constructor runs. The vptr points to Base's vtable, resolving to the Base implementation."
      },
      {
        id: "ex3-q4",
        type: "code-analysis",
        points: 15,
        question: "Identify the critical flaw in this class design violating the Rule of Three:",
        codeSnippet: `class IntBuffer {
    int* ptr;
    size_t sz;
public:
    IntBuffer(size_t s) : sz(s), ptr(new int[s]) {}
    ~IntBuffer() { delete[] ptr; }
    // No copy constructor or copy assignment operator declared!
};`,
        explanation: "Violates the Rule of Three. The compiler generates a default shallow copy constructor that copies `ptr`. When copied, two IntBuffers point to the same memory, triggering a double-free crash when both destructors run.",
        rubricKeywords: ["Rule of Three", "double free", "shallow copy", "delete[]", "copy constructor"]
      },
      {
        id: "ex3-q5",
        type: "mcq",
        points: 10,
        question: "How does C++ solve the Diamond Problem in multiple inheritance?",
        options: [
            "By forbidding multiple inheritance",
            "Using the 'virtual' keyword in inheritance: `class B : virtual public A`",
            "Using dynamic_cast",
            "With the friend keyword"
        ],
        correctAnswer: 1,
        explanation: "Virtual inheritance ensures only a single shared instance of the common base class exists in the derived object."
      },
      {
        id: "ex3-q6",
        type: "true-false",
        points: 10,
        question: "Friendship in C++ is inherited automatically by derived classes.",
        correctAnswer: false,
        explanation: "Friendship is strictly neither inherited nor transitive in C++."
      },
      {
        id: "ex3-q7",
        type: "coding-challenge",
        points: 25,
        question: "Implement a deep copy constructor for an `IntArray` class:",
        codeSnippet: `class IntArray {
    int* data;
    int size;
public:
    IntArray(int s) : size(s), data(new int[s]) {}
    ~IntArray() { delete[] data; }
    
    // TODO: Write IntArray(const IntArray& other)
};`,
        explanation: "Allocate new memory `data = new int[other.size]; size = other.size;` and copy elements using `std::copy(other.data, other.data + size, data);`.",
        rubricKeywords: ["new int", "size", "std::copy", "deep copy"]
      }
    ]
  },
  {
    id: "exam-final",
    title: "Comprehensive Job-Ready C++ Certification Exam",
    subtitle: "Complete Curriculum Mastery: Domains I–IV (Language, Data Structures, OOP & Algorithms)",
    description: "The culminating comprehensive examination testing algorithmic complexity, sorting & searching, recursion, RAII, and systems engineering.",
    durationMinutes: 90,
    passingScore: 50,
    allowCppReference: true,
    coversPhases: [1, 2, 3, 4],
    questions: [
      {
        id: "ex4-q1",
        type: "why-this-code-works",
        points: 20,
        question: "Explain how RAII eliminates resource leaks in modern C++ even in the presence of runtime exceptions, compared to manual try/catch/finally in other languages.",
        explanation: "RAII binds resource lifetime to object lifetime. Objects allocated on the stack have their destructors deterministically called by the C++ runtime during stack unwinding whenever a scope exits—whether by normal return, break, or thrown exception. This guarantees cleanups with zero chance of programmer omission or exception swallowing.",
        rubricKeywords: ["stack unwinding", "deterministic destructors", "scope exit", "exception safety", "resource leak"]
      },
      {
        id: "ex4-q2",
        type: "mcq",
        points: 10,
        question: "What happens if an exception escapes a function declared with the `noexcept` specifier?",
        options: [
            "The exception is caught by a hidden global handler",
            "`std::terminate()` is immediately invoked by the C++ runtime, terminating the application",
            "The function returns a default-constructed value",
            "The compiler fails to link the binary"
        ],
        correctAnswer: 1,
        explanation: "`noexcept` guarantees to the compiler that no exception will escape; if one does, the runtime calls `std::terminate()` without running further stack unwinding."
      },
      {
        id: "ex4-q3",
        type: "true-false",
        points: 10,
        question: "In C++, deleting an object of a derived class through a base pointer `Base* b = new Derived(); delete b;` when `Base` has a non-virtual destructor is safe as long as Derived has no member variables.",
        correctAnswer: false,
        explanation: "Deleting through a base pointer with a non-virtual destructor is explicitly Undefined Behavior under the C++ ISO standard, regardless of member variables."
      },
      {
        id: "ex4-q4",
        type: "code-analysis",
        points: 15,
        question: "Analyze the following snippet and describe what bug occurs when `worker()` finishes:",
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
        id: "ex4-q5",
        type: "mcq",
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
        id: "ex4-q6",
        type: "true-false",
        points: 10,
        question: "Floyd's Tortoise and Hare algorithm detects cycles in a linked list in O(N) time and O(1) auxiliary space.",
        correctAnswer: true,
        explanation: "Slow advances by 1 and fast advances by 2; if a cycle exists, they meet within the cycle in O(N) steps without allocating extra memory."
      },
      {
        id: "ex4-q7",
        type: "coding-challenge",
        points: 25,
        question: "Write an in-place string compaction function that removes all spaces in-place in O(N) time and O(1) extra space:",
        codeSnippet: `#include <string>

void removeSpaces(std::string& s) {
    // Two-pointer in-place compaction
}`,
        explanation: "Use two pointers: `size_t write = 0; for (size_t read = 0; read < s.size(); ++read) { if (s[read] != ' ') s[write++] = s[read]; } s.resize(write);`.",
        rubricKeywords: ["write", "read", "s.resize", "O(N)"]
      }
    ]
  }
];
