import { CppDocItem } from "../../types";

export const ITERATOR_DOCS: CppDocItem[] = [
  {
    name: "std::advance & std::distance",
    category: "iterator",
    header: "<iterator>",
    synopsis: "template<class InputIt, class Distance> void advance(InputIt& it, Distance n); template<class InputIt> typename iterator_traits<InputIt>::difference_type distance(InputIt first, InputIt last);",
    timeComplexity: "O(1) for RandomAccessIterator (pointer arithmetic); O(N) for Forward/Bidirectional iterators.",
    description: "std::advance increments (or decrements) an iterator by n elements in-place. std::distance returns the number of hops from first to last. Uses iterator_traits dispatch at compile-time to choose the fastest implementation.",
    example: `#include <iterator>
#include <list>
#include <vector>
#include <iostream>

int main() {
    std::list<int> l = {10, 20, 30, 40, 50};
    auto it = l.begin();
    std::advance(it, 3); // O(N) traversal on linked list
    std::cout << "Value at index 3: " << *it << "\\n"; // 40

    std::vector<int> v = {1, 2, 3, 4, 5};
    std::cout << "Vector distance: " << std::distance(v.begin(), v.end()) << "\\n"; // O(1)
    return 0;
}`,
    commonPitfalls: "std::advance modifies the iterator passed to it; it does not return a new iterator. For ForwardIterator, distance between first and last must be reachable by incrementing; passing reversed iterators causes an infinite loop."
  },
  {
    name: "std::next & std::prev",
    category: "iterator",
    header: "<iterator>",
    synopsis: "template<class InputIt> InputIt next(InputIt it, typename iterator_traits<InputIt>::difference_type n = 1); (C++11)",
    timeComplexity: "O(1) for RandomAccessIterator; O(n) for non-random iterators.",
    description: "Returns the nth successor (or predecessor for std::prev) of an iterator without modifying the original iterator. Enables chaining in functional calls and template code.",
    example: `#include <iterator>
#include <set>
#include <iostream>

int main() {
    std::set<int> numbers = {5, 10, 15, 20, 25};

    // Get 2nd element without altering set.begin()
    auto second = std::next(numbers.begin());
    auto fourth = std::next(numbers.begin(), 3);
    auto last = std::prev(numbers.end());

    std::cout << "2nd: " << *second << ", 4th: " << *fourth << ", Last: " << *last << "\\n";
    return 0;
}`,
    commonPitfalls: "Cannot call std::prev on a forward iterator (e.g., std::forward_list iterators) as they cannot decrement."
  },
  {
    name: "std::back_inserter, std::front_inserter, std::inserter",
    category: "iterator",
    header: "<iterator>",
    synopsis: "template<class Container> back_insert_iterator<Container> back_inserter(Container& c);",
    timeComplexity: "O(1) per inserted element (plus any container reallocation cost)",
    description: "Convenience helper functions constructing insert iterators. Assigning to a back_inserter calls container.push_back(value); front_inserter calls container.push_front(value); inserter calls container.insert(pos, value).",
    example: `#include <iterator>
#include <vector>
#include <deque>
#include <algorithm>
#include <iostream>

int main() {
    std::vector<int> src = {1, 2, 3};
    std::deque<int> dq;

    // Push elements to front of deque: {3, 2, 1}
    std::copy(src.begin(), src.end(), std::front_inserter(dq));

    // Append to back of vector
    std::copy(dq.begin(), dq.end(), std::back_inserter(src));

    for (int n : src) std::cout << n << " "; // 1 2 3 3 2 1
    return 0;
}`,
    commonPitfalls: "The target container must support the corresponding operation! E.g. std::vector does NOT support push_front, so std::front_inserter(vec) will not compile."
  },
  {
    name: "std::reverse_iterator & rbegin / rend",
    category: "iterator",
    header: "<iterator>",
    synopsis: "template<class Iter> class reverse_iterator;",
    timeComplexity: "Zero runtime overhead over base iterator",
    description: "Iterator adaptor that reverses the direction of a given iterator. When incremented, the reverse iterator steps backward. Dereferencing returns `*std::prev(base)`.",
    example: `#include <iterator>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> v = {10, 20, 30, 40};
    for (auto rit = v.rbegin(); rit != v.rend(); ++rit) {
        std::cout << *rit << " "; // 40 30 20 10
    }
    std::cout << "\\n";

    // Converting reverse_iterator to base iterator:
    auto r = v.rbegin(); // points to 40
    auto baseIt = r.base(); // points to v.end()!
    return 0;
}`,
    commonPitfalls: "Off-by-one with .base(): `rit.base()` points to the element AFTER the one referenced by `rit`. E.g. `v.rbegin().base() == v.end()`."
  },
  {
    name: "std::move_iterator & std::make_move_iterator",
    category: "iterator",
    header: "<iterator>",
    synopsis: "template<class Iter> class move_iterator; (C++11)",
    timeComplexity: "Zero runtime overhead (pure compile-time type cast to rvalue reference); enables move constructors instead of copies",
    description: "Iterator adaptor that behaves like the underlying iterator, but dereferencing converts the result into an rvalue reference (via std::move). Ideal for moving elements between containers without allocating copies.",
    example: `#include <iterator>
#include <vector>
#include <string>
#include <iostream>

int main() {
    std::vector<std::string> src = {"high-performance", "low-latency", "c++20"};
    std::vector<std::string> dest;

    // Moves strings from src into dest without deep copies!
    dest.insert(dest.end(), 
                std::make_move_iterator(src.begin()), 
                std::make_move_iterator(src.end()));

    std::cout << "Dest size: " << dest.size() << ", First string: " << dest[0] << "\\n";
    std::cout << "Src first string empty? " << (src[0].empty() ? "yes" : "no") << "\\n"; // yes
    return 0;
}`,
    commonPitfalls: "Elements in source container are moved-from and left in a valid but unspecified state."
  },
  {
    name: "std::istream_iterator & std::ostream_iterator",
    category: "iterator",
    header: "<iterator>",
    synopsis: "template<class T> class istream_iterator; template<class T> class ostream_iterator;",
    timeComplexity: "O(1) per token parse/write",
    description: "Stream iterators that treat input streams (like std::cin, std::stringstream) or output streams (std::cout) as sequences of typed objects.",
    example: `#include <iterator>
#include <vector>
#include <sstream>
#include <iostream>

int main() {
    std::string text = "42 100 256 1024";
    std::istringstream iss(text);

    // Read all ints directly into vector via iterator range
    std::vector<int> numbers((std::istream_iterator<int>(iss)), 
                             std::istream_iterator<int>());

    // Print all ints separated by comma
    std::copy(numbers.begin(), numbers.end(), 
              std::ostream_iterator<int>(std::cout, ", "));
    return 0;
}`,
    commonPitfalls: "C++ Most Vexing Parse: When initializing a container with `istream_iterator`, wrap the first argument in parentheses: `std::vector<int> v((std::istream_iterator<int>(stream)), ...)`."
  },
  {
    name: "Iterator Categories & C++20 ContiguousIterator",
    category: "iterator",
    header: "<iterator>",
    synopsis: "struct input_iterator_tag; forward_iterator_tag; bidirectional_iterator_tag; random_access_iterator_tag; contiguous_iterator_tag; (C++20)",
    timeComplexity: "Compile-time tag dispatching (zero runtime overhead)",
    description: "The 5 classic STL iterator concepts plus C++20 Contiguous Iterator. Contiguous iterators guarantee that elements are adjacent in physical memory (like raw pointers, std::vector, std::array), enabling SIMD vectorization and memmove optimizations.",
    example: `#include <iterator>
#include <vector>
#include <list>
#include <type_traits>
#include <iostream>

int main() {
    using VecIter = std::vector<int>::iterator;
    using ListIter = std::list<int>::iterator;

    std::cout << "Vector is Random Access: " 
              << std::is_base_of_v<std::random_access_iterator_tag, 
                                   std::iterator_traits<VecIter>::iterator_category> 
              << "\\n";
    return 0;
}`,
    commonPitfalls: "Using pointer arithmetic (`it + 5`) on non-random-access iterators (like std::list or std::set) is a compile error. Use `std::advance(it, 5)` or `std::next(it, 5)`."
  }
];
