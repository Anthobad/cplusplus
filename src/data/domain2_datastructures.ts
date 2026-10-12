import { Unit } from "../types";

export const DOMAIN_2_UNITS: Unit[] = [
  // 19. Array
  {
    id: "topic-19",
    weekNumber: 19,
    phaseId: "phase-2",
    title: "Sequential Arrays: std::vector & std::array",
    subtitle: "Dynamic Array Internals, Geometric Growth Factor, Iterator Invalidation & Stack std::array",
    goals: "Master std::vector contiguous memory, capacity growth factors (1.5x / 2.0x), reserve() vs resize(), and fixed-size std::array.",
    topics: ["std::vector", "std::array", "Capacity vs Size", "Growth Factor", "Iterator Invalidation", "reserve() vs resize()"],
    theory: {
      overview: "`std::vector` is the default go-to container in C++. It encapsulates a dynamically-allocated contiguous array managed by three raw pointers (`start`, `finish`, `end_of_storage`). Contiguous memory maximizes CPU cache line spatial locality.",
      sections: [
        {
          title: "1. Capacity, Growth & Reallocation",
          content: "• `size()`: Number of actual elements currently stored.\n• `capacity()`: Total elements allocated before a reallocation is forced.\n• When `size() == capacity()` and `push_back()` is invoked, the vector allocates a new memory block scaled by a geometric growth factor (usually $2.0\\times$ in GCC/Clang or $1.5\\times$ in MSVC), moves/copies existing elements, and frees the old buffer.\n• Pre-allocating with `v.reserve(N)` eliminates $O(\\log N)$ reallocations."
        },
        {
          title: "2. std::array (Stack Allocation)",
          content: "`std::array<T, N>` is a thin wrapper over a fixed C-style array `T data[N]`. It has zero heap overhead, stores elements directly on the stack or inline inside containing structs, and knows its own size."
        }
      ]
    },
    deepDive: {
      topic: "Iterator Invalidation on Reallocation",
      breakdown: [
        "If a vector reallocates, ALL existing iterators, pointers, and references to elements are invalidated!",
        "If no reallocation occurs (capacity was reserved), only iterators past the insertion point are invalidated."
      ],
      interviewQuestion: "What is the difference between reserve() and resize() in std::vector?",
      idealAnswer: "`reserve(n)` allocates memory on the heap so that `capacity()` is at least `n`, but does NOT change `size()` and does NOT construct any elements. `resize(n)` changes `size()` to `n`, constructing new default-initialized elements if `n > size()` or destroying excess elements if `n < size()`."
    },
    codeExamples: [
      {
        id: "ex-t19-1",
        title: "vector Growth & reserve()",
        code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v;
    std::cout << "Initial capacity: " << v.capacity() << "\\n";

    v.reserve(100); // Pre-allocate heap buffer
    std::cout << "Reserved capacity: " << v.capacity() << ", size: " << v.size() << "\\n";

    for (int i = 0; i < 5; ++i) v.push_back(i * 10);
    std::cout << "After inserts: size=" << v.size() << ", capacity=" << v.capacity() << "\\n";
    return 0;
}`,
        explanation: "reserve() sets capacity to 100 without constructing dummy elements.",
        output: "Initial capacity: 0\nReserved capacity: 100, size: 0\nAfter inserts: size=5, capacity=100",
        keyTakeaways: ["Always reserve() when size is anticipated", "Contiguous memory guarantees CPU cache hits"]
      }
    ],
    exercises: {
      trueFalse: [
        {
          id: "tf-t19-1",
          statement: "Calling vector.resize(10) leaves size() unchanged while allocating memory.",
          isTrue: false,
          explanation: "resize() directly changes size() and constructs elements; reserve() changes capacity without altering size()."
        }
      ],
      mcqs: [
        {
          id: "mcq-t19-1",
          question: "What is the amortized time complexity of std::vector::push_back()?",
          options: ["O(N)", "O(1)", "O(log N)", "O(N^2)"],
          correctAnswer: 1,
          explanation: "Due to geometric capacity doubling, push_back runs in amortized O(1) time."
        }
      ],
      whyThisWorks: [
        {
          id: "wtw-t19-1",
          title: "Amortized O(1) Growth Analysis",
          code: `// Doubling capacity from 1 -> 2 -> 4 -> 8 -> 16...`,
          question: "Why does geometric growth guarantee amortized O(1) instead of linear increment?",
          stepByStep: [
            "Linear increment (+10 every time) copies N elements every 10 pushes, totaling O(N^2) work.",
            "Geometric doubling doubles the buffer size, meaning reallocations occur exponentially less frequently.",
            "Total copies for N inserts is N + N/2 + N/4 + ... <= 2N, giving an amortized cost of O(1) per insert."
          ],
          coreConcept: "Geometric buffer scaling yields amortized O(1) insertions."
        }
      ],
      codingChallenge: {
        id: "cc-t19",
        title: "Prefix Sum Array",
        difficulty: "Easy",
        initialCode: `#include <vector>

// Return prefix sum array of input vector: out[i] = sum(v[0]...v[i])
std::vector<int> computePrefixSums(const std::vector<int>& v) {
    // Write your code here
    return {};
}`,
        solutionCode: `#include <vector>

std::vector<int> computePrefixSums(const std::vector<int>& v) {
    if (v.empty()) return {};
    std::vector<int> prefix;
    prefix.reserve(v.size());
    int running = 0;
    for (int num : v) {
        running += num;
        prefix.push_back(running);
    }
    return prefix;
}`,
        expectedBehavior: "Compute and return prefix sum array in O(N) time.",
        hints: ["Use running sum and push_back to reserved vector"],
        testCases: [
          { input: "4 1 2 3 4", expectedOutput: "1 3 6 10" },
          { input: "3 5 -2 7", expectedOutput: "5 3 10" }
        ],
        driverCode: `#include <iostream>
#include <vector>
int main() {
    int n;
    if (std::cin >> n) {
        std::vector<int> v(n);
        for (int i = 0; i < n; ++i) std::cin >> v[i];
        auto res = computePrefixSums(v);
        for (size_t i = 0; i < res.size(); ++i) {
            std::cout << res[i] << (i + 1 < res.size() ? " " : "");
        }
        std::cout << "\\n";
    }
    return 0;
}`
      }
    },
    quiz: {
      id: "quiz-t19",
      title: "Array Quiz",
      passingScorePercentage: 70,
      questions: [
        {
          id: "q-t19-1",
          type: "mcq",
          question: "Where does std::array allocate its elements?",
          options: ["Always in the heap", "Directly in place (stack or containing object)", "In shared memory", "In the data segment"],
          correctAnswerIndex: 1,
          explanation: "std::array is a fixed-size stack/inline container with zero heap allocations."
        }
      ]
    }
  },

  // 20. List
  {
    id: "topic-20",
    weekNumber: 20,
    phaseId: "phase-2",
    title: "Linked Lists: std::list & std::forward_list",
    subtitle: "Doubly-Linked Lists, Singly-Linked forward_list, O(1) Splice & Cache Miss Trade-offs",
    goals: "Master node-based storage, O(1) node splicing, and the cache locality penalties of linked lists vs vectors.",
    topics: ["std::list", "std::forward_list", "Doubly-Linked vs Singly-Linked", "O(1) Splice", "Cache Locality Trade-offs"],
    theory: {
      overview: "`std::list` is a doubly-linked list where each node contains pointers to `prev` and `next`. `std::forward_list` is a singly-linked list with only a `next` pointer, minimizing memory per node.",
      sections: [
        {
          title: "1. O(1) Splice Operations",
          content: "`std::list::splice` transfers nodes between lists in $O(1)$ time simply by repointing node pointers—without copying or reallocating heap elements!"
        },
        {
          title: "2. The Cache Inefficiency of Linked Lists",
          content: "Because every node is allocated independently on the heap (`new Node`), elements are scattered across heap pages. Traversing a linked list causes repeated CPU L1/L2 cache misses, making `std::vector` much faster than `std::list` even for frequent insertions in benchmark practice."
        }
      ]
    },
    deepDive: {
      topic: "Bidirectional vs Forward Iterators",
      breakdown: [
        "std::list provides BidirectionalIterators (`++it`, `--it`).",
        "std::forward_list provides ForwardIterators (only `++it`), eliminating the backward pointer to save 1 pointer (typically 8 bytes on 64-bit platforms) per node.",
        "Neither provides RandomAccessIterators: accessing element $K$ requires $O(K)$ pointer hops."
      ],
      interviewQuestion: "Why is std::vector almost always faster than std::list even when inserting elements?",
      idealAnswer: "Vector elements are contiguous in physical memory, allowing CPUs to load 64-byte chunks into high-speed L1/L2 cache lines and trigger hardware prefetching. In contrast, each node in std::list is independently allocated on the heap, scattering addresses. Traversing a list causes repeated cache misses and pointer indirection overhead, drastically outweighing the cost of vector element shifting."
    },
    codeExamples: [
      {
        id: "ex-t20-1",
        title: "O(1) Node Splicing with std::list",
        code: `#include <iostream>
#include <list>

int main() {
    std::list<int> listA = {1, 2, 3};
    std::list<int> listB = {10, 20};

    // Splice all elements of listB into listA after first element in O(1)
    auto it = listA.begin();
    ++it; // Points to 2
    listA.splice(it, listB);

    for (int n : listA) std::cout << n << " ";
    std::cout << "\\n";
    std::cout << "listB empty? " << (listB.empty() ? "yes" : "no") << "\\n";
    return 0;
}`,
        explanation: "splice moves nodes between lists in O(1) by updating pointers; listB is emptied.",
        output: "1 10 20 2 3\nlistB empty? yes",
        keyTakeaways: ["splice transfers nodes in O(1)", "list iterators are never invalidated by insertion/erasure of other nodes"]
      }
    ],
    exercises: {
      trueFalse: [
        {
          id: "tf-t20-1",
          statement: "std::sort can be used directly on a std::list iterator range.",
          isTrue: false,
          explanation: "std::sort requires RandomAccessIterators. std::list provides bidirectional iterators, so you must use list.sort() instead."
        }
      ],
      mcqs: [
        {
          id: "mcq-t20-1",
          question: "What is the memory size overhead of each node in a std::list on 64-bit systems?",
          options: ["0 bytes", "8 bytes", "16 bytes (prev and next pointers) plus heap header", "32 bytes"],
          correctAnswer: 2,
          explanation: "On typical 64-bit systems, each node holds 2 pointers (8 bytes prev + 8 bytes next = 16 bytes) plus allocator heap bookkeeping."
        }
      ],
      whyThisWorks: [
        {
          id: "wtw-t20-1",
          title: "Pointer Repointing in Splice",
          code: `listA.splice(pos, listB);`,
          question: "Why does splice run in O(1) time without copying elements?",
          stepByStep: [
            "listB's head and tail nodes are unlinked from listB.",
            "They are spliced into listA by updating adjacent node next and prev pointers.",
            "Zero heap allocations or element copy constructors are invoked."
          ],
          coreConcept: "Node transfer occurs strictly via pointer reassignment."
        }
      ],
      codingChallenge: {
        id: "cc-t20",
        title: "Remove Even Elements from List",
        difficulty: "Easy",
        initialCode: `#include <list>

// Remove all even elements from list in-place
void removeEvens(std::list<int>& lst) {
    // Write your solution here
}`,
        solutionCode: `#include <list>

void removeEvens(std::list<int>& lst) {
    lst.remove_if([](int n) { return n % 2 == 0; });
}`,
        expectedBehavior: "Remove all even elements from list using remove_if.",
        hints: ["Use lst.remove_if with a lambda checking n % 2 == 0"],
        testCases: [
          { input: "5 1 2 3 4 5", expectedOutput: "1 3 5" },
          { input: "4 2 4 6 8", expectedOutput: "" }
        ],
        driverCode: `#include <iostream>
#include <list>
int main() {
    int n;
    if (std::cin >> n) {
        std::list<int> l;
        for (int i = 0; i < n; ++i) {
            int v; std::cin >> v; l.push_back(v);
        }
        removeEvens(l);
        for (auto it = l.begin(); it != l.end(); ++it) {
            std::cout << *it << (std::next(it) != l.end() ? " " : "");
        }
        std::cout << "\\n";
    }
    return 0;
}`
      }
    },
    quiz: {
      id: "quiz-t20",
      title: "List Quiz",
      passingScorePercentage: 70,
      questions: [
        {
          id: "q-t20-1",
          type: "mcq",
          question: "Which linked list container has the minimum memory footprint per element?",
          options: ["std::vector", "std::list", "std::forward_list", "std::deque"],
          correctAnswerIndex: 2,
          explanation: "std::forward_list stores only a single forward pointer per node, minimizing memory overhead."
        }
      ]
    }
  },

  // 21. Set
  {
    id: "topic-21",
    weekNumber: 21,
    phaseId: "phase-2",
    title: "Ordered & Hash Sets: std::set & std::unordered_set",
    subtitle: "Red-Black Balanced BSTs ($O(\\log N)$) vs Hash Buckets ($O(1)$) & Multiset Variants",
    goals: "Master balanced tree ordering vs hash bucket mechanisms, hash collisions, and multiset duplicates.",
    topics: ["std::set", "std::unordered_set", "Red-Black Tree", "Hash Buckets", "std::multiset", "Lookup Complexity"],
    theory: {
      overview: "C++ provides two distinct set paradigms: `std::set` (ordered, implemented as a Red-Black self-balancing BST with $O(\\log N)$ operations) and `std::unordered_set` (hash table with $O(1)$ average lookup and separate chaining buckets).",
      sections: [
        {
          title: "1. std::set: Red-Black Tree Invariants",
          content: "Elements are strictly ordered by `<`. Search, insert, and erase are guaranteed $O(\\log N)$ worst-case. In-order traversal visits elements in sorted order."
        },
        {
          title: "2. std::unordered_set: Hash Buckets",
          content: "Elements are hashed via `std::hash<Key>`. Average lookup is $O(1)$. If all keys hash to the same bucket (hash collision attack), performance degrades to $O(N)$."
        }
      ]
    },
    deepDive: {
      topic: "Choosing std::set vs std::unordered_set",
      breakdown: [
        "Choose std::set if you need ordered traversal, range queries (`lower_bound`/`upper_bound`), or guaranteed $O(\\log N)$ worst-case.",
        "Choose std::unordered_set for raw lookup throughput ($O(1)$ average)."
      ],
      interviewQuestion: "What is the worst-case time complexity of std::set vs std::unordered_set?",
      idealAnswer: "std::set is a balanced Red-Black tree, so its worst-case lookup, insertion, and deletion are strictly guaranteed to be O(log N). std::unordered_set is a hash table; while its average lookup is O(1), its worst-case degrades to O(N) if keys produce hash collisions that map into the same bucket."
    },
    codeExamples: [
      {
        id: "ex-t21-1",
        title: "Ordered vs Unordered Set Usage",
        code: `#include <iostream>
#include <set>
#include <unordered_set>

int main() {
    std::set<int> ordered = {50, 10, 30, 20};
    std::cout << "Ordered set (sorted): ";
    for (int n : ordered) std::cout << n << " ";
    std::cout << "\\n";

    std::unordered_set<int> hashSet = {50, 10, 30, 20};
    std::cout << "Contains 30? " << (hashSet.count(30) ? "yes" : "no") << "\\n";
    return 0;
}`,
        explanation: "std::set automatically sorts keys; unordered_set offers fast hash lookup.",
        output: "Ordered set (sorted): 10 20 30 50\nContains 30? yes",
        keyTakeaways: ["std::set is sorted O(log N)", "unordered_set is hashed O(1)"]
      }
    ],
    exercises: {
      trueFalse: [
        {
          id: "tf-t21-1",
          statement: "std::unordered_set guarantees elements are stored in ascending sorted order.",
          isTrue: false,
          explanation: "std::unordered_set order depends on hash buckets and is pseudo-random; only std::set is sorted."
        }
      ],
      mcqs: [
        {
          id: "mcq-t21-1",
          question: "What underlying data structure powers std::set in standard C++ implementations?",
          options: ["Hash table", "B-Tree", "Red-Black Tree (Self-balancing BST)", "Skip list"],
          correctAnswer: 2,
          explanation: "std::set is implemented as a Red-Black self-balancing Binary Search Tree."
        }
      ],
      whyThisWorks: [
        {
          id: "wtw-t21-1",
          title: "lower_bound on std::set",
          code: `auto it = orderedSet.lower_bound(25);`,
          question: "Why does calling the member function s.lower_bound() take O(log N) while std::lower_bound(s.begin(), s.end()) takes O(N)?",
          stepByStep: [
            "Member function s.lower_bound() traverses tree pointers directly in O(log N).",
            "Free algorithm std::lower_bound only sees bidirectional iterators and must step through nodes one by one in O(N).",
            "Always prefer member algorithms on associative containers."
          ],
          coreConcept: "Member algorithms exploit internal tree structure for O(log N) efficiency."
        }
      ],
      codingChallenge: {
        id: "cc-t21",
        title: "Distinct Elements Counter",
        difficulty: "Easy",
        initialCode: `#include <vector>
#include <unordered_set>

// Count number of distinct unique integers using std::unordered_set
int countDistinct(const std::vector<int>& nums) {
    // Write your code here
    return 0;
}`,
        solutionCode: `#include <vector>
#include <unordered_set>

int countDistinct(const std::vector<int>& nums) {
    std::unordered_set<int> uniqueElements(nums.begin(), nums.end());
    return static_cast<int>(uniqueElements.size());
}`,
        expectedBehavior: "Return the count of distinct elements in the vector.",
        hints: ["Construct std::unordered_set<int> from iterators and return .size()"],
        testCases: [
          { input: "6 1 2 2 3 4 4", expectedOutput: "4" },
          { input: "3 5 5 5", expectedOutput: "1" }
        ],
        driverCode: `#include <iostream>
#include <vector>
int main() {
    int n;
    if (std::cin >> n) {
        std::vector<int> v(n);
        for (int i = 0; i < n; ++i) std::cin >> v[i];
        std::cout << countDistinct(v) << "\\n";
    }
    return 0;
}`
      }
    },
    quiz: {
      id: "quiz-t21",
      title: "Set Quiz",
      passingScorePercentage: 70,
      questions: [
        {
          id: "q-t21-1",
          type: "mcq",
          question: "Which container allows duplicate key elements?",
          options: ["std::set", "std::unordered_set", "std::multiset", "std::map"],
          correctAnswerIndex: 2,
          explanation: "std::multiset stores multiple duplicate keys in sorted order."
        }
      ]
    }
  },

  // 22. Map
  {
    id: "topic-22",
    weekNumber: 22,
    phaseId: "phase-2",
    title: "Maps: std::map, std::unordered_map & operator[] Hazards",
    subtitle: "Red-Black Tree vs Hash Map, operator[] Default Insertion Hazard & Structured Bindings",
    goals: "Master associative key-value mapping, the subtle side-effects of operator[], find vs count, and C++17 structured bindings.",
    topics: ["std::map", "std::unordered_map", "operator[] Side-effects", "Structured Bindings (C++17)", "insert_or_assign"],
    theory: {
      overview: "Associative maps bind keys to values. `std::map` maintains sorted order via Red-Black trees ($O(\\log N)$), while `std::unordered_map` provides hashed lookup ($O(1)$ average).",
      sections: [
        {
          title: "1. The operator[] Default Insertion Hazard",
          content: "In `m[key]`, if `key` does not exist, `operator[]` silently default-constructs a value, inserts the pair into the map, and returns a reference! For read-only lookups, always use `.find(key)` or `.contains(key)` (C++20)."
        },
        {
          title: "2. C++17 Structured Bindings",
          content: "```cpp\nfor (const auto& [key, value] : myMap) {\n    std::cout << key << \": \" << value << '\\n';\n}\n```\nUnpacks the `std::pair<const Key, Value>` cleanly without verbose `.first` and `.second` access."
        }
      ]
    },
    deepDive: {
      topic: "try_emplace and insert_or_assign (C++17)",
      breakdown: [
        "`try_emplace` avoids constructing the value object if the key already exists.",
        "`insert_or_assign` updates existing values or inserts new ones cleanly without default constructor overhead."
      ],
      interviewQuestion: "What is the critical side effect of using operator[] on a std::map for lookup?",
      idealAnswer: "If the queried key does not exist in the map, `operator[]` will silently insert a new key-value pair into the map using the value's default constructor. This mutates the map during read operations, invalidates const references, and introduces unintended entries. To query without insertion, use `find()` or C++20 `contains()`."
    },
    codeExamples: [
      {
        id: "ex-t22-1",
        title: "Safe Lookup & Structured Bindings",
        code: `#include <iostream>
#include <unordered_map>
#include <string>

int main() {
    std::unordered_map<std::string, int> stock = {{"apple", 50}, {"banana", 30}};

    // Safe lookup without operator[] insertion
    if (auto it = stock.find("orange"); it != stock.end()) {
        std::cout << "Oranges in stock: " << it->second << "\\n";
    } else {
        std::cout << "No oranges found (map size unchanged: " << stock.size() << ")\\n";
    }

    // Structured bindings iteration
    for (const auto& [item, count] : stock) {
        std::cout << item << ": " << count << "\\n";
    }
    return 0;
}`,
        explanation: "find() avoids silent insertion; structured bindings iterate key-value pairs cleanly.",
        output: "No oranges found (map size unchanged: 2)\napple: 50\nbanana: 30",
        keyTakeaways: ["find() prevents silent insertions", "Structured bindings unpack [k, v]"]
      }
    ],
    exercises: {
      trueFalse: [
        {
          id: "tf-t22-1",
          statement: "Calling map[key] on a const std::map compiles successfully.",
          isTrue: false,
          explanation: "operator[] is not a const method because it may mutate the map by inserting a default element; it does not compile on const maps."
        }
      ],
      mcqs: [
        {
          id: "mcq-t22-1",
          question: "Which C++17 feature unpacks key and value directly in loop headers?",
          options: ["Concepts", "Structured Bindings", "constexpr if", "Fold Expressions"],
          correctAnswer: 1,
          explanation: "Structured bindings (for (const auto& [k, v] : map)) unpack pair members directly."
        }
      ],
      whyThisWorks: [
        {
          id: "wtw-t22-1",
          title: "operator[] Insertion Mechanics",
          code: `int val = countMap["missingKey"]; // size increases by 1!`,
          question: "Why does reading missingKey increase the map size?",
          stepByStep: [
            "operator[] calls lower_bound or hash lookup.",
            "Finding no match, it constructs std::pair('missingKey', int{}) with value 0.",
            "It inserts this pair into the map and returns a reference to the 0 value."
          ],
          coreConcept: "operator[] is an insert-or-access operator, not a pure reader."
        }
      ],
      codingChallenge: {
        id: "cc-t22",
        title: "Word Frequency Counter",
        difficulty: "Easy",
        initialCode: `#include <string>
#include <vector>
#include <unordered_map>

// Return count of most frequent string in words
int maxFrequency(const std::vector<std::string>& words) {
    // Write your code here
    return 0;
}`,
        solutionCode: `#include <string>
#include <vector>
#include <unordered_map>

int maxFrequency(const std::vector<std::string>& words) {
    if (words.empty()) return 0;
    std::unordered_map<std::string, int> freq;
    int maxCount = 0;
    for (const auto& w : words) {
        int count = ++freq[w];
        if (count > maxCount) maxCount = count;
    }
    return maxCount;
}`,
        expectedBehavior: "Count and return the maximum frequency among all words.",
        hints: ["Track frequencies with unordered_map<string, int> and track maxCount"],
        testCases: [
          { input: "5 apple banana apple cherry apple", expectedOutput: "3" },
          { input: "3 a b c", expectedOutput: "1" }
        ],
        driverCode: `#include <iostream>
#include <vector>
#include <string>
int main() {
    int n;
    if (std::cin >> n) {
        std::vector<std::string> words(n);
        for (int i = 0; i < n; ++i) std::cin >> words[i];
        std::cout << maxFrequency(words) << "\\n";
    }
    return 0;
}`
      }
    },
    quiz: {
      id: "quiz-t22",
      title: "Map Quiz",
      passingScorePercentage: 70,
      questions: [
        {
          id: "q-t22-1",
          type: "mcq",
          question: "How should you safely check if a key exists in a map without inserting it?",
          options: ["if (m[key] != 0)", "if (m.find(key) != m.end())", "if (m.at(key))", "if (m.insert(key))"],
          correctAnswerIndex: 1,
          explanation: "m.find(key) != m.end() searches without mutating or inserting elements."
        }
      ]
    }
  },

  // 23. Stack
  {
    id: "topic-23",
    weekNumber: 23,
    phaseId: "phase-2",
    title: "Container Adapters: std::stack & LIFO Protocol",
    subtitle: "Adapter Architecture, Underlying Containers & Why pop() Returns void",
    goals: "Master container adapter design, stack operations, underlying sequence backings, and exception safety in pop().",
    topics: ["std::stack", "LIFO Semantics", "Container Adapters", "Underlying std::deque", "Why pop() Returns void"],
    theory: {
      overview: "`std::stack` is not an independent container; it is a Container Adapter that wraps an underlying sequential container (by default `std::deque`) to expose a strict Last-In-First-Out (LIFO) interface: `push`, `pop`, `top`, `empty`.",
      sections: [
        {
          title: "1. Why does pop() return void in C++?",
          content: "In other languages (Java, Python), `pop()` removes and returns the top value. In C++, `pop()` returns `void`; `top()` must be called first. This design is dictated by Exception Safety: if `pop()` returned by value, copy-constructing the return value might throw an exception after the element was already removed from the container, permanently destroying data!"
        }
      ]
    },
    deepDive: {
      topic: "Customizing Underlying Container",
      breakdown: [
        "`std::stack<T, Container>` allows custom backing: `std::stack<int, std::vector<int>>` or `std::stack<int, std::list<int>>`.",
        "Default is `std::deque` because deque does not require reallocating large contiguous blocks, growing chunk by chunk."
      ],
      interviewQuestion: "Why does std::stack::pop() return void instead of the popped element?",
      idealAnswer: "To guarantee Strong Exception Safety. If `pop()` removed the element and returned it by value, the return value's copy constructor could throw an exception during transfer to the caller. At that point, the top element has already been destroyed from the stack, causing irreversible data loss. Separating the inspection (`top()`) from the destruction (`pop()`) guarantees that if copying throws, the stack remains intact."
    },
    codeExamples: [
      {
        id: "ex-t23-1",
        title: "Safe Stack Usage: Balanced Parentheses",
        code: `#include <iostream>
#include <stack>
#include <string>

bool isBalanced(const std::string& expr) {
    std::stack<char> s;
    for (char ch : expr) {
        if (ch == '(') s.push(ch);
        else if (ch == ')') {
            if (s.empty()) return false;
            s.pop();
        }
    }
    return s.empty();
}

int main() {
    std::cout << "(()()): " << (isBalanced("(()())") ? "true" : "false") << "\\n";
    std::cout << "(())): " << (isBalanced("(()))") ? "true" : "false") << "\\n";
    return 0;
}`,
        explanation: "Demonstrates stack LIFO pairing for parenthesis validation.",
        output: "(()()): true\n(())): false",
        keyTakeaways: ["Check !s.empty() before pop()", "pop() returns void for exception safety"]
      }
    ],
    exercises: {
      trueFalse: [
        {
          id: "tf-t23-1",
          statement: "Calling s.pop() on an empty std::stack returns an empty optional value.",
          isTrue: false,
          explanation: "Calling pop() on an empty stack is undefined behavior; empty() must always be checked first."
        }
      ],
      mcqs: [
        {
          id: "mcq-t23-1",
          question: "What is the default underlying container for std::stack?",
          options: ["std::vector", "std::deque", "std::list", "std::array"],
          correctAnswer: 1,
          explanation: "std::deque is the default underlying container for std::stack and std::queue."
        }
      ],
      whyThisWorks: [
        {
          id: "wtw-t23-1",
          title: "Exception Safety in pop()",
          code: `T val = s.top();\ns.pop();`,
          question: "How does this two-step idiom preserve data on exceptions?",
          stepByStep: [
            "s.top() returns a reference, attempting to copy/move into val.",
            "If copy construction throws, the element is still safely on the stack.",
            "Only when copy succeeds is s.pop() called to destroy the element."
          ],
          coreConcept: "Separating top() and pop() provides strong exception safety."
        }
      ],
      codingChallenge: {
        id: "cc-t23",
        title: "Reverse String with Stack",
        difficulty: "Easy",
        initialCode: `#include <string>
#include <stack>

// Reverse string using std::stack
std::string reverseStringWithStack(const std::string& s) {
    // Write your solution here
    return "";
}`,
        solutionCode: `#include <string>
#include <stack>

std::string reverseStringWithStack(const std::string& s) {
    std::stack<char> st;
    for (char c : s) st.push(c);
    std::string reversed;
    reversed.reserve(s.size());
    while (!st.empty()) {
        reversed.push_back(st.top());
        st.pop();
    }
    return reversed;
}`,
        expectedBehavior: "Reverse the input string using std::stack.",
        hints: ["Push each character onto stack, then pop into result"],
        testCases: [
          { input: "hello", expectedOutput: "olleh" },
          { input: "cpp", expectedOutput: "ppc" }
        ],
        driverCode: `#include <iostream>
#include <string>
int main() {
    std::string s;
    if (std::cin >> s) {
        std::cout << reverseStringWithStack(s) << "\\n";
    }
    return 0;
}`
      }
    },
    quiz: {
      id: "quiz-t23",
      title: "Stack Quiz",
      passingScorePercentage: 70,
      questions: [
        {
          id: "q-t23-1",
          type: "mcq",
          question: "Which operation returns the top element of a std::stack?",
          options: ["pop()", "top()", "front()", "peek()"],
          correctAnswerIndex: 1,
          explanation: "top() returns a reference to the topmost element in std::stack."
        }
      ]
    }
  },

  // 24. Queue
  {
    id: "topic-24",
    weekNumber: 24,
    phaseId: "phase-2",
    title: "Queues & Priority Queues: FIFO, Deque & Binary Heaps",
    subtitle: "std::queue, std::priority_queue (Max/Min Heaps) & std::deque Chunked Allocation",
    goals: "Master FIFO queues, double-ended queues (deque), and binary heap priority queues with custom comparators.",
    topics: ["std::queue (FIFO)", "std::deque", "std::priority_queue", "Binary Max-Heap", "Min-Heap with greater<T>"],
    theory: {
      overview: "`std::queue` provides First-In-First-Out (FIFO) semantics. `std::priority_queue` provides a binary heap where the highest-priority element is always accessible at `top()` in $O(1)$, inserting in $O(\\log N)$.",
      sections: [
        {
          title: "1. std::deque Chunked Memory Allocation",
          content: "`std::deque` (double-ended queue) is implemented as a central map of pointers pointing to fixed-size chunk buffers (e.g. 512 bytes). It provides $O(1)$ push/pop at both front and back without full reallocation."
        },
        {
          title: "2. std::priority_queue Max-Heap vs Min-Heap",
          content: "By default, `std::priority_queue<T>` is a Max-Heap (largest element on top). To make a Min-Heap, supply `std::vector<T>` and `std::greater<T>`:\n`std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap;`."
        }
      ]
    },
    deepDive: {
      topic: "Heapifying Complexity: O(N) vs O(N log N)",
      breakdown: [
        "Constructing a priority_queue from a vector (`std::priority_queue pq(v.begin(), v.end())`) uses Floyd's heapify in $O(N)$ time!",
        "Pushing elements one by one takes $O(N \\log N)$. Always pass iterator ranges when bulk initializing."
      ],
      interviewQuestion: "How do you configure std::priority_queue as a min-heap in C++?",
      idealAnswer: "By default, `std::priority_queue<T>` defaults to `std::priority_queue<T, std::vector<T>, std::less<T>>`, creating a max-heap. To configure a min-heap, specify all three template arguments: `std::priority_queue<T, std::vector<T>, std::greater<T>> minHeap;`."
    },
    codeExamples: [
      {
        id: "ex-t24-1",
        title: "Min-Heap vs Max-Heap Usage",
        code: `#include <iostream>
#include <queue>
#include <vector>

int main() {
    // Default Max-Heap
    std::priority_queue<int> maxHeap;
    maxHeap.push(30); maxHeap.push(10); maxHeap.push(50);
    std::cout << "Max-heap top: " << maxHeap.top() << "\\n"; // 50

    // Min-Heap
    std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap;
    minHeap.push(30); minHeap.push(10); minHeap.push(50);
    std::cout << "Min-heap top: " << minHeap.top() << "\\n"; // 10
    return 0;
}`,
        explanation: "std::greater creates a min-heap where smallest element stays on top.",
        output: "Max-heap top: 50\nMin-heap top: 10",
        keyTakeaways: ["Default priority_queue is max-heap", "Use std::greater for min-heap"]
      }
    ],
    exercises: {
      trueFalse: [
        {
          id: "tf-t24-1",
          statement: "std::priority_queue allows random access to elements via operator[].",
          isTrue: false,
          explanation: "std::priority_queue is an adapter; only top() is accessible."
        }
      ],
      mcqs: [
        {
          id: "mcq-t24-1",
          question: "What is the insertion time complexity for std::priority_queue?",
          options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
          correctAnswer: 1,
          explanation: "Inserting into a binary heap requires percolating up, running in O(log N) time."
        }
      ],
      whyThisWorks: [
        {
          id: "wtw-t24-1",
          title: "Linear Time Heap Construction",
          code: `std::priority_queue<int> pq(v.begin(), v.end());`,
          question: "Why does bulk construction run in O(N) rather than O(N log N)?",
          stepByStep: [
            "It copies the vector and calls std::make_heap internally.",
            "make_heap starts at the lowest non-leaf nodes and sifts down.",
            "Most nodes are near the bottom of the tree with small heights, mathematically converging to O(N) total operations."
          ],
          coreConcept: "Bottom-up heapify runs in linear O(N) time."
        }
      ],
      codingChallenge: {
        id: "cc-t24",
        title: "Kth Smallest Element Using Min-Heap",
        difficulty: "Easy",
        initialCode: `#include <vector>
#include <queue>

// Return kth smallest element (1-indexed) in nums
int findKthSmallest(const std::vector<int>& nums, int k) {
    // Write your code with min-heap
    return 0;
}`,
        solutionCode: `#include <vector>
#include <queue>

int findKthSmallest(const std::vector<int>& nums, int k) {
    std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap(nums.begin(), nums.end());
    for (int i = 1; i < k; ++i) {
        minHeap.pop();
    }
    return minHeap.top();
}`,
        expectedBehavior: "Find the kth smallest element using priority_queue.",
        hints: ["Initialize min-heap from vector and pop k-1 times"],
        testCases: [
          { input: "6 7 10 4 3 20 15 3", expectedOutput: "7" },
          { input: "5 1 2 3 4 5 1", expectedOutput: "1" }
        ],
        driverCode: `#include <iostream>
#include <vector>
int main() {
    int n;
    if (std::cin >> n) {
        std::vector<int> nums(n);
        for (int i = 0; i < n; ++i) std::cin >> nums[i];
        int k; std::cin >> k;
        std::cout << findKthSmallest(nums, k) << "\\n";
    }
    return 0;
}`
      }
    },
    quiz: {
      id: "quiz-t24",
      title: "Queue Quiz",
      passingScorePercentage: 70,
      questions: [
        {
          id: "q-t24-1",
          type: "mcq",
          question: "Which method retrieves the front element of a standard std::queue?",
          options: ["top()", "front()", "peek()", "head()"],
          correctAnswerIndex: 1,
          explanation: "std::queue uses front() to read the oldest inserted element."
        }
      ]
    }
  },

  // 25. Tree
  {
    id: "topic-25",
    weekNumber: 25,
    phaseId: "phase-2",
    title: "Trees: Binary Trees, BSTs & Balancing Properties",
    subtitle: "Node Architecture, BST Invariants, Traversals (Pre/In/Post/Level) & Balancing",
    goals: "Master node-pointer binary tree structures, binary search tree invariants, recursive tree traversals, and balance factors.",
    topics: ["Binary Tree", "Binary Search Tree (BST)", "In-Order Traversal", "Level-Order BFS", "Tree Height", "AVL & Red-Black Balancing"],
    theory: {
      overview: "A Binary Search Tree (BST) maintains the invariant: for every node $X$, all keys in the left subtree are $< X$, and all keys in the right subtree are $> X$. In-order traversal of a BST visits nodes in sorted order.",
      sections: [
        {
          title: "1. The 4 Tree Traversals",
          content: "• **Pre-order (Root, Left, Right)**: Useful for serialization and cloning.\n• **In-order (Left, Root, Right)**: Yields sorted keys on a BST.\n• **Post-order (Left, Right, Root)**: Useful for bottom-up destruction and evaluating expressions.\n• **Level-order (BFS)**: Uses a queue to traverse layer by layer."
        },
        {
          title: "2. The Degeneracy Hazard",
          content: "Unbalanced BSTs degrade to linked lists ($O(N)$ search) if keys are inserted in sorted order. Self-balancing trees (AVL, Red-Black) maintain $O(\\log N)$ height via rotations."
        }
      ]
    },
    deepDive: {
      topic: "Safe Tree Destruction via Post-Order",
      breakdown: [
        "In recursive tree destructors, deleting children before the parent prevents reading deallocated memory.",
        "For very deep trees (> 100,000 nodes), recursive destruction can overflow the call stack; use iterative queue-based cleanup."
      ],
      interviewQuestion: "Why does in-order traversal of a binary search tree produce sorted output?",
      idealAnswer: "Because the BST invariant guarantees that for every node, all values in its left subtree are strictly less than the node, and all values in its right subtree are strictly greater. In-order traversal visits: 1) the entire left subtree (all smaller values), 2) the current node, and 3) the entire right subtree (all larger values), inductively producing non-decreasing sorted order."
    },
    codeExamples: [
      {
        id: "ex-t25-1",
        title: "BST Node Insertion & In-Order Print",
        code: `#include <iostream>

struct TreeNode {
    int val;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;
    TreeNode(int v) : val(v) {}
};

TreeNode* insert(TreeNode* root, int val) {
    if (!root) return new TreeNode(val);
    if (val < root->val) root->left = insert(root->left, val);
    else root->right = insert(root->right, val);
    return root;
}

void printInOrder(TreeNode* root) {
    if (!root) return;
    printInOrder(root->left);
    std::cout << root->val << " ";
    printInOrder(root->right);
}

int main() {
    TreeNode* root = nullptr;
    for (int x : {50, 30, 70, 20, 40}) root = insert(root, x);
    std::cout << "Sorted BST: ";
    printInOrder(root); // 20 30 40 50 70
    std::cout << "\\n";
    return 0;
}`,
        explanation: "Recursive insertion preserves BST invariant; in-order traversal prints sorted keys.",
        output: "Sorted BST: 20 30 40 50 70",
        keyTakeaways: ["BST invariant: left < node < right", "In-order traversal produces sorted keys"]
      }
    ],
    exercises: {
      trueFalse: [
        {
          id: "tf-t25-1",
          statement: "A completely degenerate binary search tree with N elements has O(1) search time.",
          isTrue: false,
          explanation: "A degenerate tree degrades to a linked list with worst-case O(N) search time."
        }
      ],
      mcqs: [
        {
          id: "mcq-t25-1",
          question: "Which traversal of a Binary Search Tree produces values in strictly sorted order?",
          options: ["Pre-order", "In-order", "Post-order", "Level-order"],
          correctAnswer: 1,
          explanation: "In-order traversal (Left, Root, Right) produces sorted order on a BST."
        }
      ],
      whyThisWorks: [
        {
          id: "wtw-t25-1",
          title: "BST Search Invariant",
          code: `bool search(TreeNode* root, int target) {\n    if (!root) return false;\n    if (root->val == target) return true;\n    return target < root->val ? search(root->left, target) : search(root->right, target);\n}`,
          question: "Why does this run in O(height) time?",
          stepByStep: [
            "At every node, the comparison eliminates half the remaining subtree.",
            "If target < root->val, it can only exist in the left subtree.",
            "The search path descends from root to leaf, touching at most 'height' nodes."
          ],
          coreConcept: "BST invariant enables binary branch pruning at every step."
        }
      ],
      codingChallenge: {
        id: "cc-t25",
        title: "Compute Max Depth of Binary Tree",
        difficulty: "Easy",
        initialCode: `#include <algorithm>

struct Node {
    int val;
    Node* left;
    Node* right;
};

// Return maximum depth (number of nodes along longest path from root to leaf)
int maxDepth(Node* root) {
    // Write your recursive code here
    return 0;
}`,
        solutionCode: `#include <algorithm>

struct Node {
    int val;
    Node* left;
    Node* right;
};

int maxDepth(Node* root) {
    if (!root) return 0;
    return 1 + std::max(maxDepth(root->left), maxDepth(root->right));
}`,
        expectedBehavior: "Compute and return maximum height/depth of binary tree.",
        hints: ["If root is null return 0; else return 1 + max(left, right)"],
        testCases: [
          { input: "3", expectedOutput: "2" },
          { input: "1", expectedOutput: "1" }
        ],
        driverCode: `#include <iostream>
struct Node { int val; Node* left = nullptr; Node* right = nullptr; };
int main() {
    int count;
    if (std::cin >> count) {
        if (count == 0) { std::cout << "0\\n"; return 0; }
        Node* root = new Node{1};
        if (count > 1) root->left = new Node{2};
        if (count > 2) root->right = new Node{3};
        std::cout << maxDepth(root) << "\\n";
    }
    return 0;
}`
      }
    },
    quiz: {
      id: "quiz-t25",
      title: "Tree Quiz",
      passingScorePercentage: 70,
      questions: [
        {
          id: "q-t25-1",
          type: "mcq",
          question: "What is the maximum number of children a node can have in a binary tree?",
          options: ["1", "2", "3", "Unlimited"],
          correctAnswerIndex: 1,
          explanation: "In a binary tree, each node has at most two children (left and right)."
        }
      ]
    }
  },

  // 26. Graphs
  {
    id: "topic-26",
    weekNumber: 26,
    phaseId: "phase-2",
    title: "Graph Representations & Architectures",
    subtitle: "Directed/Undirected, Acyclic/DAGs, Adjacency List vs Adjacency Matrix",
    goals: "Master graph representations in C++, spatial trade-offs (Matrix vs List), and directed acyclic graphs (DAGs).",
    topics: ["Directed vs Undirected", "Adjacency List", "Adjacency Matrix", "DAGs", "Topological Ordering", "Graph Density"],
    theory: {
      overview: "Graphs consist of vertices $V$ and edges $E$. Representation choice fundamentally impacts performance: Adjacency Lists (`vector<vector<int>>`) are optimal for sparse graphs, while Adjacency Matrices (`vector<vector<bool>>`) provide $O(1)$ edge existence queries for dense graphs.",
      sections: [
        {
          title: "1. Adjacency List vs Adjacency Matrix",
          content: "• **Adjacency List (`vector<vector<int>> adj`)**: Space $O(V + E)$. Iterating neighbors is $O(\\text{degree}(u))$. Optimal for sparse real-world graphs (social networks, roads).\n• **Adjacency Matrix (`bool matrix[V][V]`)**: Space $O(V^2)$. Edge check `hasEdge(u, v)` is $O(1)$. Inefficient for sparse graphs."
        },
        {
          title: "2. Directed Acyclic Graphs (DAGs)",
          content: "A directed graph with no cycles. Essential for dependency graphs (build systems like Make/CMake, task scheduling). Every DAG has at least one valid Topological Sort."
        }
      ]
    },
    deepDive: {
      topic: "Cache Locality in Graph Representations",
      breakdown: [
        "A 2D vector `vector<vector<int>>` scatters sub-vectors across the heap, causing pointer chasing.",
        "High-performance systems use Compressed Sparse Row (CSR): two flat 1D vectors (`offsets` and `edges`) in contiguous memory!"
      ],
      interviewQuestion: "When should you choose an Adjacency Matrix over an Adjacency List?",
      idealAnswer: "Choose an Adjacency Matrix when the graph is dense (number of edges $E \\approx V^2$), when the number of vertices $V$ is small, or when the algorithm requires frequent $O(1)$ edge existence checks (`hasEdge(u, v)`). For sparse graphs ($E \\ll V^2$), an Adjacency List is vastly superior, using $O(V + E)$ space instead of $O(V^2)$."
    },
    codeExamples: [
      {
        id: "ex-t26-1",
        title: "Adjacency List Representation",
        code: `#include <iostream>
#include <vector>

class Graph {
    int V;
    std::vector<std::vector<int>> adj;
public:
    Graph(int v) : V(v), adj(v) {}
    void addEdge(int u, int v) {
        adj[u].push_back(v); // Directed edge u -> v
    }
    void printNeighbors(int u) const {
        std::cout << "Neighbors of " << u << ": ";
        for (int v : adj[u]) std::cout << v << " ";
        std::cout << "\\n";
    }
};

int main() {
    Graph g(4);
    g.addEdge(0, 1);
    g.addEdge(0, 2);
    g.addEdge(1, 2);
    g.printNeighbors(0); // 1 2
    return 0;
}`,
        explanation: "Adjacency list stores neighbor lists per vertex in O(V + E) space.",
        output: "Neighbors of 0: 1 2",
        keyTakeaways: ["Adjacency list uses O(V + E) memory", "Best for sparse graphs"]
      }
    ],
    exercises: {
      trueFalse: [
        {
          id: "tf-t26-1",
          statement: "An Adjacency Matrix representation uses O(V + E) space.",
          isTrue: false,
          explanation: "An Adjacency Matrix requires O(V^2) memory regardless of the number of edges."
        }
      ],
      mcqs: [
        {
          id: "mcq-t26-1",
          question: "What is the time complexity to check if an edge exists between u and v in an Adjacency Matrix?",
          options: ["O(V)", "O(1)", "O(E)", "O(log V)"],
          correctAnswer: 1,
          explanation: "In an adjacency matrix, checking matrix[u][v] is a direct O(1) index lookup."
        }
      ],
      whyThisWorks: [
        {
          id: "wtw-t26-1",
          title: "Adjacency List Edge Check",
          code: `bool hasEdge(int u, int v) {\n    for (int n : adj[u]) if (n == v) return true;\n    return false;\n}`,
          question: "Why is this O(degree(u)) instead of O(1)?",
          stepByStep: [
            "Neighbors of u are stored in a sequential vector.",
            "Finding v requires linear search across u's neighbor list.",
            "Therefore, worst-case lookup time is proportional to the out-degree of vertex u."
          ],
          coreConcept: "Adjacency list trades edge query speed for minimal memory footprint."
        }
      ],
      codingChallenge: {
        id: "cc-t26",
        title: "Count Undirected Edges in Adjacency List",
        difficulty: "Easy",
        initialCode: `#include <vector>

// Return total undirected edge count given adjacency list representation of an undirected graph
int countEdges(const std::vector<std::vector<int>>& adj) {
    // Write your code here
    return 0;
}`,
        solutionCode: `#include <vector>

int countEdges(const std::vector<std::vector<int>>& adj) {
    int sum = 0;
    for (const auto& neighbors : adj) {
        sum += neighbors.size();
    }
    return sum / 2; // Handshaking lemma
}`,
        expectedBehavior: "Return total edge count for an undirected graph using handshaking lemma.",
        hints: ["Sum degrees of all vertices and divide by 2"],
        testCases: [
          { input: "3 2 1 2 2 0 2 2 0 1", expectedOutput: "3" },
          { input: "2 1 1 1 0", expectedOutput: "1" }
        ],
        driverCode: `#include <iostream>
#include <vector>
int main() {
    int v;
    if (std::cin >> v) {
        std::vector<std::vector<int>> adj(v);
        for (int i = 0; i < v; ++i) {
            int deg; std::cin >> deg;
            adj[i].resize(deg);
            for (int j = 0; j < deg; ++j) std::cin >> adj[i][j];
        }
        std::cout << countEdges(adj) << "\\n";
    }
    return 0;
}`
      }
    },
    quiz: {
      id: "quiz-t26",
      title: "Graphs Quiz",
      passingScorePercentage: 70,
      questions: [
        {
          id: "q-t26-1",
          type: "mcq",
          question: "What does DAG stand for in graph theory?",
          options: ["Direct Array Grid", "Directed Acyclic Graph", "Dynamic Allocation Graph", "Distributed Asynchronous Group"],
          correctAnswerIndex: 1,
          explanation: "DAG stands for Directed Acyclic Graph."
        }
      ]
    }
  },

  // 27. Manipulating Data Structures
  {
    id: "topic-27",
    weekNumber: 27,
    phaseId: "phase-2",
    title: "Manipulating Data Structures: Iterators, Lambdas & Erase-Remove",
    subtitle: "Iterators, <functional>, Lambda Captures, <algorithm> & the Erase-Remove Idiom",
    goals: "Master iterator categories, lambda capture rules (`[=]`, `[&]`, `[this]`), algorithm pipelines, and the erase-remove idiom.",
    topics: ["Iterator Hierarchy", "Lambda Captures", "erase-remove Idiom", "<algorithm>", "std::erase_if (C++20)"],
    theory: {
      overview: "Manipulating C++ data structures efficiently requires mastering the iterator hierarchy (Input, Output, Forward, Bidirectional, Random-Access, Contiguous), lambda capture semantics, and container mutation algorithms.",
      sections: [
        {
          title: "1. The Erase-Remove Idiom & std::erase_if",
          content: "`std::remove` shifts non-matching elements forward, returning an iterator to the new logical end; it cannot shrink container size because algorithms only see iterators! To actually deallocate elements, use:\n`v.erase(std::remove(v.begin(), v.end(), val), v.end());`\nIn C++20, this is simplified to: `std::erase(v, val);` and `std::erase_if(v, predicate);`."
        },
        {
          title: "2. Lambda Capture Semantics",
          content: "• `[]`: No captures.\n• `[=]`: Capture all referenced outer variables by copy.\n• `[&]`: Capture all referenced outer variables by reference.\n• `[x, &y]`: Explicit capture `x` by value, `y` by reference.\n• `[val = std::move(p)]`: Init capture (C++14) moving move-only types into lambda closure."
        }
      ]
    },
    deepDive: {
      topic: "Dangling Reference Hazard with Lambda [&]",
      breakdown: [
        "Capturing local stack variables by reference in an asynchronous or detached lambda creates dangling references!",
        "When the calling function returns, stack variables are destroyed. The lambda invokes Undefined Behavior.",
        "Rule: Capture by value or move ownership when lambdas outlive caller scope."
      ],
      interviewQuestion: "Explain the erase-remove idiom in C++. Why is std::remove alone insufficient to remove elements from a std::vector?",
      idealAnswer: "`std::remove` is a generic free function template that operates strictly on iterators. Because it does not have access to the underlying `std::vector` object or its internal size/capacity members, it cannot deallocate memory or adjust `size()`. It merely shifts the retained elements to the front of the range and returns a past-the-end iterator. To actually shrink the vector and destroy remaining elements, the container member function `v.erase()` must be called with that returned iterator."
    },
    codeExamples: [
      {
        id: "ex-t27-1",
        title: "Erase-Remove vs C++20 erase_if",
        code: `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> v = {1, 2, 3, 2, 4, 2, 5};

    // Classic C++ erase-remove idiom
    v.erase(std::remove(v.begin(), v.end(), 2), v.end());

    std::cout << "Remaining: ";
    for (int n : v) std::cout << n << " "; // 1 3 4 5
    std::cout << "\\nSize: " << v.size() << "\\n"; // 4
    return 0;
}`,
        explanation: "std::remove shifts elements forward; v.erase truncates excess elements.",
        output: "Remaining: 1 3 4 5\nSize: 4",
        keyTakeaways: ["std::remove does not shrink container", "Always pair with v.erase()"]
      }
    ],
    exercises: {
      trueFalse: [
        {
          id: "tf-t27-1",
          statement: "Calling std::remove(v.begin(), v.end(), 5) automatically decrements v.size().",
          isTrue: false,
          explanation: "std::remove operates on iterators and cannot alter container size. v.erase() must be called to shrink size."
        }
      ],
      mcqs: [
        {
          id: "mcq-t27-1",
          question: "Which capture mode allows moving a std::unique_ptr into a lambda closure?",
          options: ["Capture by reference [&]", "Capture by value [=]", "Init-capture / generalized capture [ptr = std::move(ptr)]", "Default capture []"],
          correctAnswer: 2,
          explanation: "C++14 init-capture [p = std::move(p)] enables transferring ownership of move-only types into closures."
        }
      ],
      whyThisWorks: [
        {
          id: "wtw-t27-1",
          title: "std::remove Element Shifting",
          code: `auto newEnd = std::remove(v.begin(), v.end(), 2);`,
          question: "What state are the elements between newEnd and v.end() in?",
          stepByStep: [
            "std::remove moves elements not matching '2' to the front.",
            "It returns newEnd pointing to the first element that should be removed.",
            "Elements between newEnd and v.end() are in valid but unspecified states, ready to be erased."
          ],
          coreConcept: "Algorithms reorder elements; container methods alter capacity and size."
        }
      ],
      codingChallenge: {
        id: "cc-t27",
        title: "Remove Negative Values with Erase-Remove",
        difficulty: "Easy",
        initialCode: `#include <vector>
#include <algorithm>

// Remove all negative numbers in-place from v using erase and remove_if
void removeNegatives(std::vector<int>& v) {
    // Write your solution here
}`,
        solutionCode: `#include <vector>
#include <algorithm>

void removeNegatives(std::vector<int>& v) {
    v.erase(std::remove_if(v.begin(), v.end(), [](int n) {
        return n < 0;
    }), v.end());
}`,
        expectedBehavior: "Remove negative numbers in-place from vector.",
        hints: ["Call v.erase(std::remove_if(v.begin(), v.end(), predicate), v.end())"],
        testCases: [
          { input: "6 5 -2 10 -8 0 7", expectedOutput: "5 10 0 7" },
          { input: "3 -1 -2 -3", expectedOutput: "" }
        ],
        driverCode: `#include <iostream>
#include <vector>
int main() {
    int n;
    if (std::cin >> n) {
        std::vector<int> v(n);
        for (int i = 0; i < n; ++i) std::cin >> v[i];
        removeNegatives(v);
        for (size_t i = 0; i < v.size(); ++i) {
            std::cout << v[i] << (i + 1 < v.size() ? " " : "");
        }
        std::cout << "\\n";
    }
    return 0;
}`
      }
    },
    quiz: {
      id: "quiz-t27",
      title: "Manipulating Data Structures Quiz",
      passingScorePercentage: 70,
      questions: [
        {
          id: "q-t27-1",
          type: "mcq",
          question: "Which C++ standard introduced std::erase and std::erase_if convenience functions?",
          options: ["C++98", "C++11", "C++17", "C++20"],
          correctAnswerIndex: 3,
          explanation: "C++20 introduced std::erase and std::erase_if for uniform, concise container erasure."
        }
      ]
    }
  }
];
