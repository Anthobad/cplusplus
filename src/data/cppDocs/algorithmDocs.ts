import { CppDocItem } from "../../types";

export const ALGORITHM_DOCS: CppDocItem[] = [
  {
    name: "std::sort & std::stable_sort",
    category: "algorithm",
    header: "<algorithm>",
    synopsis: "template<class RandomIt, class Compare> void sort(RandomIt first, RandomIt last, Compare comp);",
    timeComplexity: "std::sort: O(N log N) Introsort. std::stable_sort: O(N log N) Merge sort with buffer.",
    description: "Sorts the elements in the range [first, last). std::sort uses Introsort (hybrid of Quicksort, Heapsort when recursion depth exceeds 2*log(N), and Insertion sort). std::stable_sort preserves relative order of equivalent elements.",
    example: `#include <algorithm>
#include <vector>
#include <iostream>

struct Candidate { std::string name; int score; };

int main() {
    std::vector<Candidate> candidates = {{"Alice", 95}, {"Bob", 80}, {"Charlie", 95}};

    // Stable sort preserves initial order of Alice before Charlie!
    std::stable_sort(candidates.begin(), candidates.end(), [](const Candidate& a, const Candidate& b) {
        return a.score > b.score; // Descending
    });

    for (const auto& c : candidates) {
        std::cout << c.name << ": " << c.score << "\\n";
    }
    return 0;
}`,
    commonPitfalls: "Comparator MUST implement Strict Weak Ordering! comp(x, x) must be false. Writing `<=` instead of `<` causes buffer overflow, out-of-bounds reads, and segmentation faults."
  },
  {
    name: "std::binary_search, std::lower_bound, std::upper_bound, std::equal_range",
    category: "algorithm",
    header: "<algorithm>",
    synopsis: "template<class ForwardIt, class T> ForwardIt lower_bound(ForwardIt first, ForwardIt last, const T& value);",
    timeComplexity: "O(log N) comparisons on RandomAccess ranges; O(N) steps on non-random iterators.",
    description: "Binary search routines on sorted ranges: binary_search returns bool; lower_bound returns iterator to first element >= value; upper_bound returns iterator to first element > value; equal_range returns pair [lower_bound, upper_bound].",
    example: `#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> data = {10, 20, 30, 30, 30, 40, 50};

    auto [low, high] = std::equal_range(data.begin(), data.end(), 30);
    std::cout << "Count of 30s: " << std::distance(low, high) << "\\n"; // 3
    std::cout << "First 30 index: " << (low - data.begin()) << "\\n";   // 2
    return 0;
}`,
    commonPitfalls: "Range must already be partitioned or sorted! Calling binary search functions on an unsorted range yields undefined behavior."
  },
  {
    name: "std::remove & std::remove_if (Erase-Remove Idiom)",
    category: "algorithm",
    header: "<algorithm>",
    synopsis: "template<class ForwardIt, class UnaryPredicate> ForwardIt remove_if(ForwardIt first, ForwardIt last, UnaryPredicate p);",
    timeComplexity: "O(N) linear time; single pass over elements",
    description: "Moves non-matching elements to the front of the range and returns a past-the-end iterator for the new logical end. It does NOT erase elements or resize the container! In C++20, prefer `std::erase_if(container, pred)`.",
    example: `#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> v = {1, 2, 3, 4, 5, 6, 7, 8};

    // Classic Erase-Remove Idiom
    v.erase(std::remove_if(v.begin(), v.end(), [](int n) {
        return n % 2 == 0; // Remove evens
    }), v.end());

    // v is now {1, 3, 5, 7}
    for (int n : v) std::cout << n << " ";
    return 0;
}`,
    commonPitfalls: "Forgetting to call container.erase(): std::remove only shifts elements; the size of the container remains unchanged without erase()!"
  },
  {
    name: "std::unique",
    category: "algorithm",
    header: "<algorithm>",
    synopsis: "template<class ForwardIt> ForwardIt unique(ForwardIt first, ForwardIt last);",
    timeComplexity: "O(N) comparisons and moves",
    description: "Eliminates all but the first element from every consecutive group of equivalent elements. Typically called after std::sort to deduplicate an entire container.",
    example: `#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> v = {4, 1, 2, 1, 4, 3, 2};
    std::sort(v.begin(), v.end()); // {1, 1, 2, 2, 3, 4, 4}

    auto last = std::unique(v.begin(), v.end());
    v.erase(last, v.end());

    // v is now {1, 2, 3, 4}
    for (int n : v) std::cout << n << " ";
    return 0;
}`,
    commonPitfalls: "Only removes CONSECUTIVE duplicates! If the vector is not sorted first, duplicates separated by other elements will NOT be removed."
  },
  {
    name: "std::all_of, std::any_of, std::none_of",
    category: "algorithm",
    header: "<algorithm>",
    synopsis: "template<class InputIt, class UnaryPredicate> bool all_of(InputIt first, InputIt last, UnaryPredicate p);",
    timeComplexity: "O(N) worst case; short-circuits on first determinative element",
    description: "Range quantifier predicates: all_of returns true if all elements satisfy pred; any_of returns true if at least one satisfies pred; none_of returns true if no elements satisfy pred. Short-circuits immediately.",
    example: `#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> scores = {85, 92, 78, 90};

    bool allPassing = std::all_of(scores.begin(), scores.end(), [](int s) { return s >= 50; });
    bool hasDistinction = std::any_of(scores.begin(), scores.end(), [](int s) { return s >= 90; });

    std::cout << "All passed: " << allPassing << ", Has distinction: " << hasDistinction << "\\n";
    return 0;
}`,
    commonPitfalls: "Vacuous truth: On an empty range [first, first), std::all_of and std::none_of return true, while std::any_of returns false."
  },
  {
    name: "std::find, std::find_if, std::find_if_not",
    category: "algorithm",
    header: "<algorithm>",
    synopsis: "template<class InputIt, class UnaryPredicate> InputIt find_if(InputIt first, InputIt last, UnaryPredicate p);",
    timeComplexity: "O(N) comparisons; linear scan",
    description: "Finds the first element in the range [first, last) satisfying the specified condition. Returns last if no element matches.",
    example: `#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> v = {3, 7, 10, 15};
    auto it = std::find_if(v.begin(), v.end(), [](int n) { return n % 2 == 0; });

    if (it != v.end()) {
        std::cout << "First even number: " << *it << "\\n"; // 10
    }
    return 0;
}`,
    commonPitfalls: "Always check `it != v.end()` before dereferencing `*it`. Dereferencing the end iterator causes undefined behavior."
  },
  {
    name: "std::count & std::count_if",
    category: "algorithm",
    header: "<algorithm>",
    synopsis: "template<class InputIt, class UnaryPredicate> typename iterator_traits<InputIt>::difference_type count_if(InputIt first, InputIt last, UnaryPredicate p);",
    timeComplexity: "O(N) linear time",
    description: "Returns the number of elements in the range [first, last) that satisfy the condition.",
    example: `#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> v = {1, 2, 3, 2, 4, 2, 5};
    int twos = std::count(v.begin(), v.end(), 2);
    int odds = std::count_if(v.begin(), v.end(), [](int n) { return n % 2 != 0; });

    std::cout << "Twos: " << twos << ", Odds: " << odds << "\\n"; // Twos: 3, Odds: 4
    return 0;
}`,
    commonPitfalls: "Return type is `difference_type` (signed integer `ptrdiff_t`), not `unsigned int` or `size_t`."
  },
  {
    name: "std::copy, std::copy_if, std::copy_backward",
    category: "algorithm",
    header: "<algorithm>",
    synopsis: "template<class InputIt, class OutputIt> OutputIt copy(InputIt first, InputIt last, OutputIt d_first);",
    timeComplexity: "O(N) copies or memmove when types are trivially copyable",
    description: "Copies elements from range [first, last) into destination d_first. Optimized to memmove / memcpy by standard library implementations when pointers to trivial types are supplied.",
    example: `#include <algorithm>
#include <vector>
#include <iterator>
#include <iostream>

int main() {
    std::vector<int> src = {10, 25, 30, 45, 50};
    std::vector<int> evens;

    // Use back_inserter when target vector is empty
    std::copy_if(src.begin(), src.end(), std::back_inserter(evens), [](int n) {
        return n % 2 == 0;
    });

    for (int n : evens) std::cout << n << " "; // 10 30 50
    return 0;
}`,
    commonPitfalls: "Destination buffer must have sufficient space if writing directly to raw iterators! E.g. `dest.resize(src.size())` or use `std::back_inserter`."
  },
  {
    name: "std::transform",
    category: "algorithm",
    header: "<algorithm>",
    synopsis: "template<class InputIt, class OutputIt, class UnaryOp> OutputIt transform(InputIt first1, InputIt last1, OutputIt d_first, UnaryOp op);",
    timeComplexity: "O(N) applications of op",
    description: "Applies the given function to a range and stores the result in another range. Can also zip two ranges together with a binary operator.",
    example: `#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> a = {1, 2, 3};
    std::vector<int> b = {10, 20, 30};
    std::vector<int> sum(a.size());

    // Binary transform adds a + b
    std::transform(a.begin(), a.end(), b.begin(), sum.begin(), std::plus<int>());

    for (int n : sum) std::cout << n << " "; // 11 22 33
    return 0;
}`,
    commonPitfalls: "When transforming two ranges, range 2 must contain at least as many elements as range 1."
  },
  {
    name: "std::reverse & std::rotate",
    category: "algorithm",
    header: "<algorithm>",
    synopsis: "void reverse(BidirectionalIt first, BidirectionalIt last); ForwardIt rotate(ForwardIt first, ForwardIt middle, ForwardIt last);",
    timeComplexity: "O(N) swaps",
    description: "std::reverse reverses the order of elements in [first, last). std::rotate performs left rotation such that the element at middle becomes the new first element.",
    example: `#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> v = {1, 2, 3, 4, 5};
    // Rotate left by 2 positions: element '3' becomes the new front
    std::rotate(v.begin(), v.begin() + 2, v.end());

    // v is now {3, 4, 5, 1, 2}
    for (int n : v) std::cout << n << " ";
    return 0;
}`,
    commonPitfalls: "The `middle` parameter in std::rotate specifies the element that will move to the front."
  },
  {
    name: "std::shuffle",
    category: "algorithm",
    header: "<algorithm>",
    synopsis: "template<class RandomIt, class URBG> void shuffle(RandomIt first, RandomIt last, URBG&& g);",
    timeComplexity: "O(N) linear time; Fisher-Yates shuffle",
    description: "Reorders elements randomly using a Uniform Random Bit Generator (such as std::mt19937). Replaces deprecated std::random_shuffle.",
    example: `#include <algorithm>
#include <vector>
#include <random>
#include <iostream>

int main() {
    std::vector<int> deck = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    std::random_device rd;
    std::mt19937 g(rd());

    std::shuffle(deck.begin(), deck.end(), g);
    for (int card : deck) std::cout << card << " ";
    return 0;
}`,
    commonPitfalls: "Do not use `std::random_shuffle` (removed in C++17). std::shuffle requires a real C++11 random engine generator."
  },
  {
    name: "std::nth_element",
    category: "algorithm",
    header: "<algorithm>",
    synopsis: "template<class RandomIt> void nth_element(RandomIt first, RandomIt nth, RandomIt last);",
    timeComplexity: "O(N) average linear time (Quickselect algorithm)",
    description: "Partially sorts the range [first, last) such that the element at the nth position is the one that would be in that position if the range were fully sorted, with all preceding elements <= nth element and all succeeding elements >= nth element. Perfect for finding medians and k-th order statistics.",
    example: `#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> scores = {50, 10, 80, 20, 90, 70, 30};
    auto medianIt = scores.begin() + scores.size() / 2;

    std::nth_element(scores.begin(), medianIt, scores.end());
    std::cout << "Median score: " << *medianIt << "\\n"; // 50 in O(N) time!
    return 0;
}`,
    commonPitfalls: "The elements before and after `nth` are not sorted amongst themselves."
  },
  {
    name: "std::make_heap, std::push_heap, std::pop_heap",
    category: "algorithm",
    header: "<algorithm>",
    synopsis: "void make_heap(RandomIt first, RandomIt last); void push_heap(...); void pop_heap(...);",
    timeComplexity: "make_heap: O(N); push_heap and pop_heap: O(log N)",
    description: "Constructs and manipulates a max-heap in-place within a contiguous sequence. Foundation of std::priority_queue.",
    example: `#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> v = {3, 1, 4, 1, 5, 9};
    std::make_heap(v.begin(), v.end()); // v[0] is 9

    v.push_back(10);
    std::push_heap(v.begin(), v.end()); // Sifts 10 up

    std::pop_heap(v.begin(), v.end()); // Moves max to back
    int maxVal = v.back();
    v.pop_back();

    std::cout << "Popped max: " << maxVal << "\\n"; // 10
    return 0;
}`,
    commonPitfalls: "pop_heap swaps the maximum element with the last element; it does NOT remove it. You must call `v.pop_back()` afterwards."
  },
  {
    name: "std::next_permutation & std::prev_permutation",
    category: "algorithm",
    header: "<algorithm>",
    synopsis: "template<class BidirectionalIt> bool next_permutation(BidirectionalIt first, BidirectionalIt last);",
    timeComplexity: "O(N) swaps and comparisons per permutation",
    description: "Rearranges elements into the lexicographically next greater (or previous) permutation. Returns false and wraps around to smallest permutation when the sequence was already strictly descending.",
    example: `#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> v = {1, 2, 3};
    do {
        for (int n : v) std::cout << n << " ";
        std::cout << "\\n";
    } while (std::next_permutation(v.begin(), v.end()));
    return 0;
}`,
    commonPitfalls: "To generate ALL permutations, the range must be sorted in ascending order before the loop begins."
  },
  {
    name: "std::set_intersection, std::set_union, std::set_difference",
    category: "algorithm",
    header: "<algorithm>",
    synopsis: "OutputIt set_intersection(InputIt1 first1, InputIt1 last1, InputIt2 first2, InputIt2 last2, OutputIt d_first);",
    timeComplexity: "O(N + M) linear time merge",
    description: "Computes mathematical set operations on two SORTED ranges in linear time. Outputs elements common to both (intersection), in either (union), or only in the first (difference).",
    example: `#include <algorithm>
#include <vector>
#include <iterator>
#include <iostream>

int main() {
    std::vector<int> s1 = {1, 2, 4, 7, 9};
    std::vector<int> s2 = {2, 3, 4, 8, 9};
    std::vector<int> common;

    std::set_intersection(s1.begin(), s1.end(), s2.begin(), s2.end(), std::back_inserter(common));
    for (int n : common) std::cout << n << " "; // 2 4 9
    return 0;
}`,
    commonPitfalls: "Both input ranges MUST be sorted with respect to the same comparator; otherwise, output is corrupted."
  }
];
