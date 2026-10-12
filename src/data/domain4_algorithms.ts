import { Unit } from "../types";

export const DOMAIN_4_UNITS: Unit[] = [
  // 34. Time Complexity
  {
    id: "topic-34",
    weekNumber: 34,
    phaseId: "phase-4",
    title: "Time Complexity & Asymptotic Analysis",
    subtitle: "Big-O, Omega, Theta, Growth Hierarchy & Amortized Analysis",
    goals: "Master asymptotic analysis, Big-O worst-case bounds, Big-Omega best-case, Big-Theta tight bounds, and amortized aggregate analysis.",
    topics: ["Big-O Asymptotics", "Big-Omega & Big-Theta", "Growth Hierarchy", "Amortized Analysis", "Master Theorem"],
    theory: {
      overview: "Asymptotic notation describes algorithm performance scaling as input size $N \\to \\infty$. Big-O ($O$) defines the asymptotic upper bound (worst-case ceiling); Big-Omega ($\\Omega$) defines the lower bound; Big-Theta ($\\Theta$) denotes a tight bound.",
      sections: [
        {
          title: "1. The Complexity Hierarchy",
          content: "$$O(1) < O(\\log N) < O(\\sqrt{N}) < O(N) < O(N \\log N) < O(N^2) < O(N^3) < O(2^N) < O(N!)$$\nIn systems engineering, keeping hot loops at $O(1)$, $O(\\log N)$, or $O(N)$ is essential for sub-millisecond SLAs."
        },
        {
          title: "2. Amortized Analysis",
          content: "Amortized complexity averages the time taken by a sequence of operations over time. For example, `vector::push_back` occasionally costs $O(N)$ when reallocating, but occurs so infrequently that the amortized cost per push is strictly $O(1)$."
        }
      ]
    },
    deepDive: {
      topic: "The Master Theorem",
      breakdown: [
        "For divide-and-conquer recurrences of the form: $T(N) = aT(N/b) + O(N^d)$:",
        "Case 1: If $d < \\log_b a$, then $T(N) = O(N^{\\log_b a})$.",
        "Case 2: If $d = \\log_b a$, then $T(N) = O(N^d \\log N)$ (e.g. Merge Sort: $a=2, b=2, d=1 \\implies O(N \\log N)$).",
        "Case 3: If $d > \\log_b a$, then $T(N) = O(N^d)$."
      ],
      interviewQuestion: "What is the difference between worst-case complexity and amortized complexity?",
      idealAnswer: "Worst-case complexity guarantees the maximum time a single operation could possibly take under the most unfavorable input. Amortized complexity evaluates the total cost of a sequence of operations divided by the number of operations. An individual operation may occasionally be expensive (like vector reallocation taking $O(N)$), but the amortized cost per operation across a sequence remains $O(1)$."
    },
    codeExamples: [
      {
        id: "ex-t34-1",
        title: "Logarithmic vs Linear Scaling",
        code: `#include <iostream>

// O(log N) - Halves search space each step
int logSteps(int n) {
    int steps = 0;
    while (n > 1) {
        n /= 2;
        steps++;
    }
    return steps;
}

int main() {
    std::cout << "Steps for N=1,000,000: " << logSteps(1000000) << "\\n"; // ~19 steps
    return 0;
}`,
        explanation: "Halving the input size per iteration yields logarithmic O(log N) scaling.",
        output: "Steps for N=1,000,000: 19",
        keyTakeaways: ["O(log N) scales to billions gracefully", "Amortized cost accounts for rare expensive operations"]
      }
    ],
    exercises: {
      trueFalse: [
        {
          id: "tf-t34-1",
          statement: "An algorithm with worst-case O(N^2) complexity can have an average-case of O(N log N).",
          isTrue: true,
          explanation: "QuickSort is a famous example: average case is O(N log N), but worst case with poor pivot choice is O(N^2)."
        }
      ],
      mcqs: [
        {
          id: "mcq-t34-1",
          question: "Which asymptotic notation represents a mathematically tight bound?",
          options: ["Big-O", "Big-Omega", "Big-Theta", "Small-o"],
          correctAnswer: 2,
          explanation: "Big-Theta denotes that the function is bounded both from above and below by the same order of growth."
        }
      ],
      whyThisWorks: [
        {
          id: "wtw-t34-1",
          title: "Binary Division Logarithmic Scaling",
          code: `while (n > 0) { n /= 2; }`,
          question: "Why does dividing by 2 run in O(log N) steps?",
          stepByStep: [
            "At step k, the remaining value is N / 2^k.",
            "The loop halts when N / 2^k <= 1, which means 2^k >= N.",
            "Taking log2 of both sides yields k = log2(N) steps."
          ],
          coreConcept: "Repeated division by a constant factor produces logarithmic scaling."
        }
      ],
      codingChallenge: {
        id: "cc-t34",
        title: "Count Division Steps (Log2)",
        difficulty: "Easy",
        initialCode: `#include <iostream>

// Return number of times n can be divided by 2 before reaching 1
int countHalvingSteps(long long n) {
    // Write your code here
    return 0;
}`,
        solutionCode: `#include <iostream>

int countHalvingSteps(long long n) {
    int steps = 0;
    while (n > 1) {
        n /= 2;
        steps++;
    }
    return steps;
}`,
        expectedBehavior: "Count and return the number of integer divisions by 2 until n <= 1.",
        hints: ["Loop while n > 1: n /= 2 and increment step count"],
        testCases: [
          { input: "16", expectedOutput: "4" },
          { input: "1024", expectedOutput: "10" }
        ],
        driverCode: `#include <iostream>
int main() {
    long long n;
    if (std::cin >> n) {
        std::cout << countHalvingSteps(n) << "\\n";
    }
    return 0;
}`
      }
    },
    quiz: {
      id: "quiz-t34",
      title: "Time Complexity Quiz",
      passingScorePercentage: 70,
      questions: [
        {
          id: "q-t34-1",
          type: "mcq",
          question: "What is the time complexity of binary search on a sorted vector?",
          options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
          correctAnswerIndex: 1,
          explanation: "Binary search eliminates half the remaining elements per step, running in O(log N)."
        }
      ]
    }
  },

  // 35. Space Complexity
  {
    id: "topic-35",
    weekNumber: 35,
    phaseId: "phase-4",
    title: "Space Complexity & In-Place Algorithms",
    subtitle: "Auxiliary Space vs Input Space, Recursion Stack Depth & In-Place Memory",
    goals: "Master auxiliary space calculations, call stack memory footprints, and in-place algorithmic transformations.",
    topics: ["Auxiliary Space", "Input Space", "Call Stack Footprint", "In-Place Algorithms ($O(1)$)", "Stack Overflow"],
    theory: {
      overview: "Space complexity measures total memory required as a function of input size. Auxiliary space specifically measures temporary workspace memory allocated by the algorithm, excluding the input data itself.",
      sections: [
        {
          title: "1. Auxiliary Space vs Total Space",
          content: "• **Total Space**: Input memory + auxiliary workspace memory.\n• **Auxiliary Space**: Memory allocated strictly to execute the algorithm. An algorithm sorting an existing array without extra allocation is $O(1)$ auxiliary space (in-place)."
        },
        {
          title: "2. Recursion Stack Memory Footprint",
          content: "Every recursive call allocates a stack frame (return address, arguments, local variables). Recursion to depth $D$ uses $O(D)$ auxiliary stack space. Unbounded recursion causes a segmentation fault stack overflow!"
        }
      ]
    },
    deepDive: {
      topic: "In-Place Algorithm Trade-offs",
      breakdown: [
        "In-place algorithms modify input data directly with $O(1)$ extra memory.",
        "Trade-off: Destroys original input and may prevent concurrent read access from multiple threads."
      ],
      interviewQuestion: "What is the difference between auxiliary space and space complexity?",
      idealAnswer: "Space complexity accounts for the total memory consumed by an algorithm, including the input memory itself. Auxiliary space refers exclusively to the extra, temporary workspace memory allocated by the algorithm during its execution. An in-place sorting algorithm like HeapSort has an $O(N)$ total space complexity (for the array) but $O(1)$ auxiliary space."
    },
    codeExamples: [
      {
        id: "ex-t35-1",
        title: "In-Place Array Reverse (O(1) Auxiliary Space)",
        code: `#include <iostream>
#include <vector>
#include <utility>

void inPlaceReverse(std::vector<int>& arr) {
    size_t left = 0;
    size_t right = arr.size() - 1;
    // Uses only 2 size_t variables: O(1) auxiliary space!
    while (left < right) {
        std::swap(arr[left++], arr[right--]);
    }
}

int main() {
    std::vector<int> data = {1, 2, 3, 4, 5};
    inPlaceReverse(data);
    for (int n : data) std::cout << n << " "; // 5 4 3 2 1
    std::cout << "\\n";
    return 0;
}`,
        explanation: "Two pointers swap elements in-place with O(1) auxiliary memory.",
        output: "5 4 3 2 1",
        keyTakeaways: ["In-place algorithms use O(1) auxiliary space", "Stack depth contributes to space complexity"]
      }
    ],
    exercises: {
      trueFalse: [
        {
          id: "tf-t35-1",
          statement: "A recursive function with depth N requires O(1) auxiliary space.",
          isTrue: false,
          explanation: "Each recursive call pushes a stack frame to memory, consuming O(N) auxiliary stack space."
        }
      ],
      mcqs: [
        {
          id: "mcq-t35-1",
          question: "What is the auxiliary space complexity of standard Merge Sort?",
          options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"],
          correctAnswer: 2,
          explanation: "Merge Sort requires an auxiliary buffer of size O(N) to merge sorted subarrays."
        }
      ],
      whyThisWorks: [
        {
          id: "wtw-t35-1",
          title: "In-Place XOR Swap",
          code: `a ^= b; b ^= a; a ^= b;`,
          question: "Why does this swap two integers with zero auxiliary memory?",
          stepByStep: [
            "First XOR: a becomes a ^ b.",
            "Second XOR: b becomes (a ^ b) ^ b = a.",
            "Third XOR: a becomes (a ^ b) ^ a = b.",
            "Both values are swapped without needing a temporary variable."
          ],
          coreConcept: "Bitwise XOR properties allow in-place value swapping."
        }
      ],
      codingChallenge: {
        id: "cc-t35",
        title: "In-Place Move Zeroes to End",
        difficulty: "Easy",
        initialCode: `#include <vector>

// Move all 0s in nums to the end in-place while maintaining relative order
void moveZeroes(std::vector<int>& nums) {
    // Write your in-place code here
}`,
        solutionCode: `#include <vector>

void moveZeroes(std::vector<int>& nums) {
    size_t writeIdx = 0;
    for (size_t readIdx = 0; readIdx < nums.size(); ++readIdx) {
        if (nums[readIdx] != 0) {
            nums[writeIdx++] = nums[readIdx];
        }
    }
    while (writeIdx < nums.size()) {
        nums[writeIdx++] = 0;
    }
}`,
        expectedBehavior: "Shift all zeroes to the end of the vector in O(1) auxiliary space.",
        hints: ["Use read and write pointers in-place"],
        testCases: [
          { input: "5 0 1 0 3 12", expectedOutput: "1 3 12 0 0" },
          { input: "2 0 0", expectedOutput: "0 0" }
        ],
        driverCode: `#include <iostream>
#include <vector>
int main() {
    int n;
    if (std::cin >> n) {
        std::vector<int> nums(n);
        for (int i = 0; i < n; ++i) std::cin >> nums[i];
        moveZeroes(nums);
        for (size_t i = 0; i < nums.size(); ++i) {
            std::cout << nums[i] << (i + 1 < nums.size() ? " " : "");
        }
        std::cout << "\\n";
    }
    return 0;
}`
      }
    },
    quiz: {
      id: "quiz-t35",
      title: "Space Complexity Quiz",
      passingScorePercentage: 70,
      questions: [
        {
          id: "q-t35-1",
          type: "mcq",
          question: "What is an in-place algorithm?",
          options: [
            "An algorithm that runs in O(1) time",
            "An algorithm that requires O(1) auxiliary memory beyond the input itself",
            "An algorithm that does not use pointers",
            "An algorithm that cannot be multi-threaded"
          ],
          correctAnswerIndex: 1,
          explanation: "In-place algorithms transform input data with O(1) extra workspace memory."
        }
      ]
    }
  },

  // 36. Techniques
  {
    id: "topic-36",
    weekNumber: 36,
    phaseId: "phase-4",
    title: "Core Algorithmic Patterns & Techniques",
    subtitle: "Two Pointers, Fast & Slow, Sliding Window, Merge Intervals & Top K Elements",
    goals: "Master the top technical interview algorithmic patterns: Two Pointers, Sliding Window, Floyd's Cycle, and Top K Heaps.",
    topics: ["Two Pointers", "Fast & Slow Pointers (Floyd's)", "Sliding Window", "Merge Intervals", "Top K Elements", "Greedy & Divide-and-Conquer"],
    theory: {
      overview: "Most FAANG and systems coding interview problems map directly into core algorithmic patterns: Two Pointers (converging/parallel), Sliding Window (subarray bounds), Fast & Slow (cycle detection), and Min/Max Heaps (Top K elements).",
      sections: [
        {
          title: "1. Two Pointers & Sliding Window",
          content: "• **Two Pointers**: Move from opposite ends inward ($O(N)$ pair searching on sorted ranges) or maintain read/write indices.\n• **Sliding Window**: Expands right boundary until a constraint is violated, then shrinks left boundary to find optimal subarrays in $O(N)$."
        },
        {
          title: "2. Fast & Slow Pointers (Floyd's Cycle Detection)",
          content: "Traverse sequence with two pointers: `slow` steps by 1, `fast` steps by 2. If a cycle exists, they must collide inside the cycle in $O(N)$ time with $O(1)$ memory."
        }
      ]
    },
    deepDive: {
      topic: "Top K Elements with Min-Heap Pattern",
      breakdown: [
        "Finding Top K largest elements: maintain a MIN-HEAP of size K.",
        "For each incoming element: if element > heap.top(), pop top and push new element.",
        "Total complexity: $O(N \\log K)$ time and $O(K)$ space, vastly outperforming full $O(N \\log N)$ sorting."
      ],
      interviewQuestion: "How does the Sliding Window pattern reduce O(N^2) brute force subarray checks to O(N)?",
      idealAnswer: "The brute force approach checks all $O(N^2)$ possible subarrays. The Sliding Window maintains a contiguous window defined by `[left, right]`. As the `right` pointer expands, it incorporates new elements, and the `left` pointer advances only when invariants are violated. Because each pointer visits each element at most once, total work is amortized $O(2N) = O(N)$."
    },
    codeExamples: [
      {
        id: "ex-t36-1",
        title: "Two Pointers: Two Sum on Sorted Array",
        code: `#include <iostream>
#include <vector>

bool twoSumSorted(const std::vector<int>& nums, int target) {
    int left = 0;
    int right = static_cast<int>(nums.size()) - 1;

    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) return true;
        if (sum < target) left++;
        else right--;
    }
    return false;
}

int main() {
    std::vector<int> nums = {2, 7, 11, 15};
    std::cout << "Target 9 found: " << (twoSumSorted(nums, 9) ? "true" : "false") << "\\n";
    return 0;
}`,
        explanation: "Two pointers converge from ends in O(N) time with O(1) extra space.",
        output: "Target 9 found: true",
        keyTakeaways: ["Two pointers on sorted arrays runs in O(N)", "Avoids O(N^2) brute force"]
      }
    ],
    exercises: {
      trueFalse: [
        {
          id: "tf-t36-1",
          statement: "Floyd's Tortoise and Hare algorithm requires O(N) auxiliary space to detect cycles.",
          isTrue: false,
          explanation: "Floyd's algorithm requires only two pointers, running in O(1) auxiliary space."
        }
      ],
      mcqs: [
        {
          id: "mcq-t36-1",
          question: "Which data structure pattern is optimal to maintain the top K largest elements from a stream of N elements?",
          options: ["Max-heap of size N", "Min-heap of size K", "Sorted vector of size N", "Hash map"],
          correctAnswer: 1,
          explanation: "A min-heap of size K holds the top K largest items, discarding smaller items in O(N log K)."
        }
      ],
      whyThisWorks: [
        {
          id: "wtw-t36-1",
          title: "Two Pointers Monotonicity",
          code: `if (sum < target) left++; else right--;`,
          question: "Why does this never miss the target on a sorted array?",
          stepByStep: [
            "If sum < target, right is already at its current position, so pairing left with any element smaller than right will also be < target.",
            "Therefore, left cannot be part of the solution with any remaining candidate, and can be safely eliminated.",
            "Inductively, each step safely eliminates one non-viable candidate in O(1)."
          ],
          coreConcept: "Monotonic sorted arrays allow pruning entire rows of possibilities in O(1)."
        }
      ],
      codingChallenge: {
        id: "cc-t36",
        title: "Two Sum on Sorted Range",
        difficulty: "Easy",
        initialCode: `#include <vector>

// Return true if two numbers in sorted vector add up to target
bool hasPairWithSum(const std::vector<int>& sortedNums, int target) {
    // Write your two-pointer solution
    return false;
}`,
        solutionCode: `#include <vector>

bool hasPairWithSum(const std::vector<int>& sortedNums, int target) {
    if (sortedNums.size() < 2) return false;
    int left = 0;
    int right = static_cast<int>(sortedNums.size()) - 1;
    while (left < right) {
        int sum = sortedNums[left] + sortedNums[right];
        if (sum == target) return true;
        if (sum < target) left++;
        else right--;
    }
    return false;
}`,
        expectedBehavior: "Return true (1) if pair adds to target, else false (0).",
        hints: ["Initialize left at 0, right at size - 1; adjust based on sum vs target"],
        testCases: [
          { input: "4 2 7 11 15 9", expectedOutput: "1" },
          { input: "3 1 2 3 10", expectedOutput: "0" }
        ],
        driverCode: `#include <iostream>
#include <vector>
int main() {
    int n;
    if (std::cin >> n) {
        std::vector<int> nums(n);
        for (int i = 0; i < n; ++i) std::cin >> nums[i];
        int target; std::cin >> target;
        std::cout << hasPairWithSum(nums, target) << "\\n";
    }
    return 0;
}`
      }
    },
    quiz: {
      id: "quiz-t36",
      title: "Algorithmic Techniques Quiz",
      passingScorePercentage: 70,
      questions: [
        {
          id: "q-t36-1",
          type: "mcq",
          question: "What is the time complexity of the Sliding Window technique on an array of size N?",
          options: ["O(N^2)", "O(N)", "O(N log N)", "O(log N)"],
          correctAnswerIndex: 1,
          explanation: "Both left and right pointers advance at most N times, running in linear O(N) time."
        }
      ]
    }
  },

  // 37. Sorting
  {
    id: "topic-37",
    weekNumber: 37,
    phaseId: "phase-4",
    title: "Sorting Algorithms & std::sort (Introsort)",
    subtitle: "Quadratic Sorts, Merge Sort, QuickSort, HeapSort & std::sort Hybrid Introsort",
    goals: "Master sorting mechanics, comparison lower bounds ($O(N \\log N)$), stability, and modern C++ std::sort Introsort internals.",
    topics: ["Quadratic Sorts", "Merge Sort", "QuickSort", "HeapSort", "std::sort (Introsort)", "Sorting Stability"],
    theory: {
      overview: "Sorting organizes collections into monotonic sequences. Comparison-based sorting is proven to require $\\Omega(N \\log N)$ comparisons in the worst-case. Modern C++ `std::sort` implements Introsort: a hybrid of QuickSort, HeapSort, and Insertion Sort.",
      sections: [
        {
          title: "1. The 3 Pillars of std::sort (Introsort)",
          content: "1. Starts with **QuickSort** (median-of-3 pivot) for maximum cache locality.\n2. Tracks recursion depth: if depth exceeds $2 \\log_2 N$ (detecting quadratic worst-case path), switches to **HeapSort** to guarantee $O(N \\log N)$ worst-case!\n3. When partition size drops below a threshold (e.g. 16 elements), switches to **Insertion Sort** which is faster due to small constants."
        },
        {
          title: "2. Stability in Sorting",
          content: "A sort is **stable** if elements with equal keys preserve their relative input order. `std::sort` is NOT stable; use `std::stable_sort` (which implements Merge Sort)."
        }
      ]
    },
    deepDive: {
      topic: "Why QuickSort is Faster than MergeSort in Practice",
      breakdown: [
        "QuickSort partitions in-place within contiguous memory, maximizing CPU cache line hits.",
        "MergeSort requires $O(N)$ auxiliary heap memory and copies data back and forth, incurring cache traffic.",
        "QuickSort has smaller constant factors than MergeSort and HeapSort on modern cache-hierarchical hardware."
      ],
      interviewQuestion: "What algorithm does std::sort use under the hood in Modern C++ standard libraries?",
      idealAnswer: "`std::sort` implements Introsort (Introspective Sort), a three-stage hybrid algorithm designed by David Musser. It begins with QuickSort for optimal cache performance. If QuickSort's recursion depth exceeds $2\\log_2 N$, it detects degenerate partitions and switches to HeapSort to prevent $O(N^2)$ worst-case and guarantee $O(N \\log N)$ bounds. For small partitions (typically $\\le 16$ elements), it switches to Insertion Sort, which has the smallest constant factors."
    },
    codeExamples: [
      {
        id: "ex-t37-1",
        title: "Introsort & Custom Comparator",
        code: `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> numbers = {5, 2, 8, 1, 9, 3};

    // Ascending sort via std::sort (Introsort)
    std::sort(numbers.begin(), numbers.end());

    // Descending sort with lambda comparator
    std::sort(numbers.begin(), numbers.end(), [](int a, int b) {
        return a > b;
    });

    for (int n : numbers) std::cout << n << " ";
    std::cout << "\\n";
    return 0;
}`,
        explanation: "std::sort uses Introsort; custom lambda inlines comparison.",
        output: "9 8 5 3 2 1",
        keyTakeaways: ["std::sort is Introsort O(N log N)", "Use std::stable_sort when order matters"]
      }
    ],
    exercises: {
      trueFalse: [
        {
          id: "tf-t37-1",
          statement: "std::sort guarantees that elements with equal keys remain in their original relative order.",
          isTrue: false,
          explanation: "std::sort is not a stable sort; std::stable_sort must be used if stability is required."
        }
      ],
      mcqs: [
        {
          id: "mcq-t37-1",
          question: "When does std::sort (Introsort) switch from QuickSort to HeapSort?",
          options: [
            "When memory runs out",
            "When recursion depth exceeds 2 * log2(N)",
            "When elements are already sorted",
            "After 100 iterations"
          ],
          correctAnswer: 1,
          explanation: "Introsort monitors recursion depth; if depth exceeds 2*log2(N), it switches to HeapSort to prevent O(N^2) degradation."
        }
      ],
      whyThisWorks: [
        {
          id: "wtw-t37-1",
          title: "Insertion Sort on Small Ranges",
          code: `if (high - low < 16) insertionSort(low, high);`,
          question: "Why is Insertion Sort faster than QuickSort on small ranges?",
          stepByStep: [
            "QuickSort has function call overhead, pivot selection, and stack partitioning logic.",
            "On arrays of size <= 16, N^2 is at most 256 operations, running in a few CPU registers.",
            "Insertion Sort has near-zero overhead and performs minimal branching on small cached arrays."
          ],
          coreConcept: "Small constant factors make simple algorithms faster on tiny inputs."
        }
      ],
      codingChallenge: {
        id: "cc-t37",
        title: "Sort In-Place Descending",
        difficulty: "Easy",
        initialCode: `#include <vector>
#include <algorithm>

// Sort vector in descending order in-place using std::sort
void sortDescending(std::vector<int>& nums) {
    // Write your solution here
}`,
        solutionCode: `#include <vector>
#include <algorithm>

void sortDescending(std::vector<int>& nums) {
    std::sort(nums.begin(), nums.end(), [](int a, int b) {
        return a > b;
    });
}`,
        expectedBehavior: "Sort the vector descending in-place.",
        hints: ["Use std::sort with greater<int>() or a > b lambda"],
        testCases: [
          { input: "5 3 1 4 1 5", expectedOutput: "5 4 3 1 1" },
          { input: "3 10 20 30", expectedOutput: "30 20 10" }
        ],
        driverCode: `#include <iostream>
#include <vector>
int main() {
    int n;
    if (std::cin >> n) {
        std::vector<int> nums(n);
        for (int i = 0; i < n; ++i) std::cin >> nums[i];
        sortDescending(nums);
        for (size_t i = 0; i < nums.size(); ++i) {
            std::cout << nums[i] << (i + 1 < nums.size() ? " " : "");
        }
        std::cout << "\\n";
    }
    return 0;
}`
      }
    },
    quiz: {
      id: "quiz-t37",
      title: "Sorting Quiz",
      passingScorePercentage: 70,
      questions: [
        {
          id: "q-t37-1",
          type: "mcq",
          question: "What is the theoretical lower bound on comparisons for comparison-based sorting of N items?",
          options: ["O(N)", "Omega(N log N)", "O(log N)", "Omega(N^2)"],
          correctAnswerIndex: 1,
          explanation: "Information theory dictates that any comparison-based sort must make at least Omega(N log N) comparisons."
        }
      ]
    }
  },

  // 38. Searching
  {
    id: "topic-38",
    weekNumber: 38,
    phaseId: "phase-4",
    title: "Searching: Binary Search, BFS/DFS & Bounds",
    subtitle: "Tree Traversals, Graph BFS/DFS, Binary Search, lower_bound & upper_bound",
    goals: "Master Linear and Binary Search, STL binary search functions (lower_bound, upper_bound), and Graph BFS/DFS.",
    topics: ["Binary Search", "std::lower_bound", "std::upper_bound", "Breadth-First Search (BFS)", "Depth-First Search (DFS)"],
    theory: {
      overview: "Searching locates target items in collections. Binary Search ($O(\\log N)$) operates on sorted contiguous or random-access ranges. BFS traverses layer-by-layer using a queue (finding shortest paths), while DFS traverses paths deeply using a stack or recursion.",
      sections: [
        {
          title: "1. std::lower_bound vs std::upper_bound",
          content: "On a sorted range:\n• `std::lower_bound`: Returns an iterator to the first element $\\ge$ value.\n• `std::upper_bound`: Returns an iterator to the first element $>$ value.\n• The half-open range `[lower_bound, upper_bound)` represents all occurrences of value."
        },
        {
          title: "2. Graph BFS vs DFS",
          content: "• **BFS (`std::queue`)**: Explores closest neighbors first. Guarantees shortest path on unweighted graphs in $O(V + E)$.\n• **DFS (`std::stack` or recursion)**: Explores depth first. Uses $O(V)$ stack space; used for topological sorting, cycle detection, and connected components."
        }
      ]
    },
    deepDive: {
      topic: "Binary Search Off-by-One Bugs",
      breakdown: [
        "In `while (low <= high)`, mid must be computed safely: `mid = low + (high - low) / 2`.",
        "Adjust boundaries cleanly: `low = mid + 1` and `high = mid - 1` to prevent infinite loops."
      ],
      interviewQuestion: "What is the difference between std::lower_bound and std::upper_bound in C++?",
      idealAnswer: "`std::lower_bound` returns an iterator pointing to the first element that is not less than (i.e. greater than or equal to) the target value. `std::upper_bound` returns an iterator pointing to the first element that is strictly greater than the target value. If the value exists in the sorted range, `lower_bound` points to its first occurrence, and `upper_bound` points immediately past its last occurrence."
    },
    codeExamples: [
      {
        id: "ex-t38-1",
        title: "lower_bound & upper_bound Range Search",
        code: `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> sorted = {10, 20, 20, 20, 30, 40};

    auto low = std::lower_bound(sorted.begin(), sorted.end(), 20);
    auto up = std::upper_bound(sorted.begin(), sorted.end(), 20);

    std::cout << "First occurrence index: " << std::distance(sorted.begin(), low) << "\\n"; // 1
    std::cout << "Count of 20: " << std::distance(low, up) << "\\n"; // 3
    return 0;
}`,
        explanation: "Distance between lower_bound and upper_bound yields frequency count in O(log N).",
        output: "First occurrence index: 1\nCount of 20: 3",
        keyTakeaways: ["lower_bound finds first >= val", "upper_bound finds first > val"]
      }
    ],
    exercises: {
      trueFalse: [
        {
          id: "tf-t38-1",
          statement: "Binary search can be performed in O(log N) time on a standard std::list.",
          isTrue: false,
          explanation: "std::list iterators are bidirectional; advancing takes O(N) steps, so binary search degrades to linear time."
        }
      ],
      mcqs: [
        {
          id: "mcq-t38-1",
          question: "Which traversal algorithm is guaranteed to find the shortest path on an unweighted graph?",
          options: ["Depth-First Search (DFS)", "Breadth-First Search (BFS)", "Binary Search", "Post-Order Traversal"],
          correctAnswer: 1,
          explanation: "BFS visits nodes layer by layer, guaranteeing the shortest path in unweighted graphs."
        }
      ],
      whyThisWorks: [
        {
          id: "wtw-t38-1",
          title: "Equal Range via Lower/Upper Bound",
          code: `auto [low, up] = std::equal_range(v.begin(), v.end(), 20);`,
          question: "Why does equal_range run in O(log N) rather than counting matches linearly?",
          stepByStep: [
            "equal_range performs binary search on both bounds simultaneously.",
            "Each bound search halves the search space.",
            "All occurrences of the target lie in [low, up) without scanning remaining elements."
          ],
          coreConcept: "Binary search bounds isolate identical elements in logarithmic time."
        }
      ],
      codingChallenge: {
        id: "cc-t38",
        title: "Standard Binary Search",
        difficulty: "Easy",
        initialCode: `#include <vector>

// Return index of target in sortedNums, or -1 if not found
int binarySearch(const std::vector<int>& sortedNums, int target) {
    // Write your code here
    return -1;
}`,
        solutionCode: `#include <vector>

int binarySearch(const std::vector<int>& sortedNums, int target) {
    int low = 0;
    int high = static_cast<int>(sortedNums.size()) - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (sortedNums[mid] == target) return mid;
        if (sortedNums[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`,
        expectedBehavior: "Return index of target in sorted vector, or -1 if absent.",
        hints: ["Compute mid = low + (high - low) / 2; update low/high"],
        testCases: [
          { input: "5 10 20 30 40 50 30", expectedOutput: "2" },
          { input: "4 1 3 5 7 2", expectedOutput: "-1" }
        ],
        driverCode: `#include <iostream>
#include <vector>
int main() {
    int n;
    if (std::cin >> n) {
        std::vector<int> nums(n);
        for (int i = 0; i < n; ++i) std::cin >> nums[i];
        int target; std::cin >> target;
        std::cout << binarySearch(nums, target) << "\\n";
    }
    return 0;
}`
      }
    },
    quiz: {
      id: "quiz-t38",
      title: "Searching Quiz",
      passingScorePercentage: 70,
      questions: [
        {
          id: "q-t38-1",
          type: "mcq",
          question: "What does std::lower_bound return if all elements in the range are smaller than the search value?",
          options: ["v.begin()", "v.end()", "nullptr", "Throws std::out_of_range"],
          correctAnswerIndex: 1,
          explanation: "If no element is >= value, std::lower_bound returns the past-the-end iterator v.end()."
        }
      ]
    }
  },

  // 39. Recursion
  {
    id: "topic-39",
    weekNumber: 39,
    phaseId: "phase-4",
    title: "Recursion, Call Stack Mechanics & Induction",
    subtitle: "Iterative vs Recursive, Stack Overhead, Intermediate Results & Mathematical Induction",
    goals: "Master recursive mental models, call frame overhead, base case validation, and memoized recursion.",
    topics: ["Recursion vs Iteration", "Call Frame Overhead", "Base Cases", "Mathematical Induction", "Memoization"],
    theory: {
      overview: "Recursion solves problems by decomposing them into smaller subproblems of the exact same form. Every recursive function requires two essential components: Base Cases (termination conditions) and Recursive Steps (advancing toward the base case).",
      sections: [
        {
          title: "1. The Anatomy of a Call Frame",
          content: "Every recursive call pushes a stack frame to memory (typically 32–64 bytes) storing return address, arguments, and local variables. If recursion depth exceeds available stack space, the process crashes with a Stack Overflow (SIGSEGV)."
        },
        {
          title: "2. Recursion to Iteration Conversion",
          content: "Any recursive algorithm can be converted into an iterative loop by maintaining an explicit `std::stack` in heap memory, bypassing OS call stack limits."
        }
      ]
    },
    deepDive: {
      topic: "Memoization (Top-Down Dynamic Programming)",
      breakdown: [
        "Naive recursive Fibonacci $F(N) = F(N-1) + F(N-2)$ recalculates subproblems exponentially ($O(2^N)$ time!).",
        "Caching results in a hash table or vector (`memo[n]`) collapses runtime to linear $O(N)$!"
      ],
      interviewQuestion: "What causes a stack overflow in recursive functions, and how do you protect against it?",
      idealAnswer: "A stack overflow occurs when recursive calls exceed the thread's call stack memory limit (typically 1–8 MB). It is caused by missing or unreachable base cases, or inputs requiring excessive recursion depth. To protect against stack overflow: 1) ensure base cases are reached for all inputs, 2) structure recursion as tail-recursion to enable compiler Tail Call Optimization (TCO), or 3) rewrite the algorithm iteratively using an explicit `std::stack` or `std::vector` on the heap."
    },
    codeExamples: [
      {
        id: "ex-t39-1",
        title: "Memoized Recursion (Fibonacci)",
        code: `#include <iostream>
#include <vector>

long long fibMemo(int n, std::vector<long long>& memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];
    return memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
}

int main() {
    int n = 50;
    std::vector<long long> memo(n + 1, -1);
    std::cout << "Fib(" << n << "): " << fibMemo(n, memo) << "\\n"; // 12586269025
    return 0;
}`,
        explanation: "Memoization transforms exponential O(2^N) recursion into linear O(N) time.",
        output: "Fib(50): 12586269025",
        keyTakeaways: ["Always establish base cases first", "Memoization prevents repeated subproblem calculation"]
      }
    ],
    exercises: {
      trueFalse: [
        {
          id: "tf-t39-1",
          statement: "A recursive function without a base case will loop indefinitely without crashing.",
          isTrue: false,
          explanation: "Unbounded recursion continuously pushes stack frames until stack memory is exhausted, crashing with a stack overflow."
        }
      ],
      mcqs: [
        {
          id: "mcq-t39-1",
          question: "What is the time complexity of naive, unmemoized recursive Fibonacci F(n) = F(n-1) + F(n-2)?",
          options: ["O(N)", "O(N log N)", "O(2^N)", "O(N^2)"],
          correctAnswer: 2,
          explanation: "Without memoization, the recursive tree branches into two calls per level, yielding O(2^N) exponential complexity."
        }
      ],
      whyThisWorks: [
        {
          id: "wtw-t39-1",
          title: "Mathematical Induction & Recursion",
          code: `int sum(int n) {\n    if (n <= 1) return n;\n    return n + sum(n - 1);\n}`,
          question: "How does mathematical induction prove this function is correct?",
          stepByStep: [
            "Base Case: For n=1, it returns 1, which equals 1*(1+1)/2 = 1 (true).",
            "Inductive Hypothesis: Assume sum(k) correctly computes the sum of 1...k.",
            "Inductive Step: sum(k+1) returns (k+1) + sum(k), which equals (k+1) + k*(k+1)/2 = (k+1)*(k+2)/2. Proven correct for all N."
          ],
          coreConcept: "Recursive correctness mirrors proof by mathematical induction."
        }
      ],
      codingChallenge: {
        id: "cc-t39",
        title: "Recursive Greatest Common Divisor (GCD)",
        difficulty: "Easy",
        initialCode: `#include <iostream>

// Return greatest common divisor of a and b using Euclidean algorithm
long long gcd(long long a, long long b) {
    // Write your recursive code here
    return 0;
}`,
        solutionCode: `#include <iostream>

long long gcd(long long a, long long b) {
    if (b == 0) return a;
    return gcd(b, a % b);
}`,
        expectedBehavior: "Compute GCD using recursive Euclidean algorithm.",
        hints: ["If b == 0 return a; else return gcd(b, a % b)"],
        testCases: [
          { input: "48 18", expectedOutput: "6" },
          { input: "100 25", expectedOutput: "25" }
        ],
        driverCode: `#include <iostream>
int main() {
    long long a, b;
    if (std::cin >> a >> b) {
        std::cout << gcd(a, b) << "\\n";
    }
    return 0;
}`
      }
    },
    quiz: {
      id: "quiz-t39",
      title: "Recursion Quiz",
      passingScorePercentage: 70,
      questions: [
        {
          id: "q-t39-1",
          type: "mcq",
          question: "What hardware memory structure is exhausted when a recursive function overflows?",
          options: ["The GPU VRAM", "The Call Stack", "The BSS Segment", "The L1 Instruction Cache"],
          correctAnswerIndex: 1,
          explanation: "Unbounded recursion exhausts the thread's call stack, triggering a stack overflow."
        }
      ]
    }
  }
];
