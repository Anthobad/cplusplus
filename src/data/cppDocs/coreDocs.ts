import { CppDocItem } from "../../types";

export const CORE_DOCS: CppDocItem[] = [
  // ==========================================
  // CONTAINERS & VIEWS
  // ==========================================
  {
    name: "std::vector",
    category: "containers",
    header: "<vector>",
    synopsis: "template<class T, class Allocator = std::allocator<T>> class vector;",
    timeComplexity: "O(1) amortized push_back, O(1) random access operator[], O(N) insertion/erasure in middle",
    description: "Sequence container encapsulating dynamic-size contiguous arrays. Stores elements in contiguous memory, enabling CPU cache prefetching and pointer arithmetic. Automatically reallocates and doubles capacity when size reaches capacity.",
    example: `#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec;
    vec.reserve(100); // Pre-allocate to prevent reallocation & invalidation
    vec.push_back(10);
    vec.push_back(20);
    vec.emplace_back(30); // Construct in-place

    std::cout << "Size: " << vec.size() << ", Capacity: " << vec.capacity() << "\\n";
    for (int x : vec) std::cout << x << " ";
    return 0;
}`,
    commonPitfalls: "Iterator invalidation: Any push_back or insert causing size > capacity reallocates heap memory, invalidating all iterators, pointers, and references! Always reserve() when size is estimated."
  },
  {
    name: "std::unordered_map",
    category: "containers",
    header: "<unordered_map>",
    synopsis: "template<class Key, class T, class Hash = std::hash<Key>, class KeyEqual = std::equal_to<Key>> class unordered_map;",
    timeComplexity: "O(1) average case find/insert/erase; O(N) worst-case under adversarial hash collisions.",
    description: "Associative container of key-value pairs with unique keys organized into hash buckets. Search, insertion, and erasure operate in average constant time. Elements are unordered; order changes when rehashing occurs.",
    example: `#include <unordered_map>
#include <string>
#include <iostream>

int main() {
    std::unordered_map<std::string, int> wordCount;
    wordCount.max_load_factor(0.7f);
    wordCount.reserve(1024);

    wordCount["systems"] = 42;
    wordCount.insert({"kernel", 19});

    auto it = wordCount.find("systems");
    if (it != wordCount.end()) {
        std::cout << it->first << " -> " << it->second << "\\n";
    }
    std::cout << "Buckets: " << wordCount.bucket_count() 
              << ", Load: " << wordCount.load_factor() << "\\n";
    return 0;
}`,
    commonPitfalls: "Adversarial collision DoS: Default std::hash can be attacked in competitive programming or web servers. Rehashing invalidates all iterators (though references remain valid). operator[] inserts a default value if key is not found!"
  },
  {
    name: "std::unordered_set",
    category: "containers",
    header: "<unordered_set>",
    synopsis: "template<class Key, class Hash = std::hash<Key>, class KeyEqual = std::equal_to<Key>> class unordered_set;",
    timeComplexity: "O(1) average case search/insert/delete; O(N) worst case.",
    description: "Hash-table based set storing unique keys without associated values. Ideal for fast membership testing, duplicate elimination, and visited state tracking in graphs.",
    example: `#include <unordered_set>
#include <iostream>

int main() {
    std::unordered_set<int> visited;
    visited.insert(101);
    visited.insert(202);

    if (visited.count(101)) {
        std::cout << "101 already visited!\\n";
    }
    return 0;
}`,
    commonPitfalls: "Keys are immutable: modifying a key directly in the set corrupts the internal bucket invariants. Erase and re-insert if you need to alter a key."
  },
  {
    name: "std::map",
    category: "containers",
    header: "<map>",
    synopsis: "template<class Key, class T, class Compare = std::less<Key>> class map;",
    timeComplexity: "O(log N) guaranteed for find, insert, and erase operations.",
    description: "Ordered associative container containing key-value pairs with unique keys. Implemented as a self-balancing Red-Black binary search tree. Iterating yields keys in strictly sorted order. Provides lower_bound() and upper_bound().",
    example: `#include <map>
#include <string>
#include <iostream>

int main() {
    std::map<std::string, double> latency;
    latency["NVMe"] = 0.05;
    latency["RAM"] = 0.01;
    latency["Network"] = 1.5;

    // Keys iterate in alphabetical order: Network, NVMe, RAM
    for (const auto& [dev, ms] : latency) {
        std::cout << dev << ": " << ms << " ms\\n";
    }
    return 0;
}`,
    commonPitfalls: "Node-based overhead: every node is a distinct heap allocation. Severe CPU cache line misses compared to flat_map or sorted vectors. Use only when dynamic sorted ordering or stable iterators are needed."
  },
  {
    name: "std::set",
    category: "containers",
    header: "<set>",
    synopsis: "template<class Key, class Compare = std::less<Key>> class set;",
    timeComplexity: "O(log N) find, insert, and delete guaranteed.",
    description: "Sorted associative container of unique elements implemented as a self-balancing binary search tree. Supports logarithmic range queries, lower_bound, and upper_bound.",
    example: `#include <set>
#include <iostream>

int main() {
    std::set<int> thresholds = {10, 25, 50, 100};
    auto it = thresholds.lower_bound(30); // Finds 50 (first element >= 30)
    if (it != thresholds.end()) {
        std::cout << "Next higher threshold: " << *it << "\\n";
    }
    return 0;
}`,
    commonPitfalls: "Iterators to std::set are const; you cannot modify an element via its iterator. Dereferencing returns const Key&."
  },
  {
    name: "std::deque",
    category: "containers",
    header: "<deque>",
    synopsis: "template<class T, class Allocator = std::allocator<T>> class deque;",
    timeComplexity: "O(1) push_front, push_back, pop_front, pop_back. O(1) random access.",
    description: "Double-ended queue implemented as an array of fixed-size chunks. Unlike std::vector, elements are not stored in a single contiguous memory block, so push_front and push_back never reallocate existing elements.",
    example: `#include <deque>
#include <iostream>

int main() {
    std::deque<int> dq;
    dq.push_back(100);
    dq.push_front(50);
    dq.push_front(25);

    std::cout << "Front: " << dq.front() << ", Back: " << dq.back() << "\\n";
    return 0;
}`,
    commonPitfalls: "Not strictly contiguous in memory: you cannot pass &dq[0] to C APIs expecting a raw array buffer. Iterators are heavier than vector pointers."
  },
  {
    name: "std::list",
    category: "containers",
    header: "<list>",
    synopsis: "template<class T, class Allocator = std::allocator<T>> class list;",
    timeComplexity: "O(1) insertion and erasure anywhere once iterator is positioned. O(1) splice. O(N) search.",
    description: "Doubly-linked list. Inserting and erasing elements does not invalidate existing iterators or pointers to other elements. Can transfer (splice) sub-lists between lists in O(1) time without copying.",
    example: `#include <list>
#include <iostream>

int main() {
    std::list<int> l1 = {1, 2, 5};
    auto it = l1.begin();
    std::advance(it, 2);
    l1.insert(it, 3); // O(1) insertion

    for (int n : l1) std::cout << n << " ";
    return 0;
}`,
    commonPitfalls: "High memory overhead per element (prev and next pointers per node) and terrible cache locality due to heap fragmentation. Rarely preferred over std::vector in modern systems unless splicing or non-invalidating iterators are required."
  },
  {
    name: "std::array",
    category: "containers",
    header: "<array>",
    synopsis: "template<class T, std::size_t N> struct array;",
    timeComplexity: "O(1) random access, zero heap allocation, zero size overhead.",
    description: "Encapsulates a fixed-size stack-allocated array. Provides STL container interface (begin, end, size, at, operator[]) with zero runtime overhead over C-style raw arrays T arr[N].",
    example: `#include <array>
#include <algorithm>
#include <iostream>

int main() {
    std::array<int, 4> packet = {0xAA, 0x01, 0x00, 0xFF};
    std::sort(packet.begin(), packet.end());
    std::cout << "Size: " << packet.size() << ", First: " << packet[0] << "\\n";
    return 0;
}`,
    commonPitfalls: "Size N is fixed at compile time and part of the type signature: std::array<int, 4> and std::array<int, 5> are incompatible types."
  },
  {
    name: "std::priority_queue",
    category: "containers",
    header: "<queue>",
    synopsis: "template<class T, class Container = std::vector<T>, class Compare = std::less<typename Container::value_type>> class priority_queue;",
    timeComplexity: "O(log N) push and pop; O(1) top().",
    description: "Container adaptor providing constant-time lookup of the largest (or smallest) element using a binary heap algorithm built over an underlying contiguous container.",
    example: `#include <queue>
#include <iostream>

int main() {
    // Min-heap
    std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap;
    minHeap.push(30);
    minHeap.push(10);
    minHeap.push(20);

    while (!minHeap.empty()) {
        std::cout << minHeap.top() << " ";
        minHeap.pop();
    }
    return 0;
}`,
    commonPitfalls: "Container adaptors do not support range-based for loops or random access. You cannot inspect non-top elements without popping them."
  },
  {
    name: "std::span",
    category: "containers",
    header: "<span>",
    synopsis: "template<class ElementType, std::size_t Extent = std::dynamic_extent> class span; (C++20)",
    timeComplexity: "O(1) creation, indexing, subspan; zero memory allocations.",
    description: "A non-owning view over a contiguous sequence of objects. Can refer to a std::vector, std::array, C-style raw array, or pointer+size pair. Replaces (T* ptr, size_t size) function signatures with type safety.",
    example: `#include <span>
#include <vector>
#include <iostream>

void printBuffer(std::span<const int> sp) {
    std::cout << "Elements (" << sp.size() << "): ";
    for (int val : sp) std::cout << val << " ";
    std::cout << "\\n";
}

int main() {
    std::vector<int> v = {1, 2, 3};
    int rawArr[] = {4, 5, 6, 7};
    printBuffer(v);
    printBuffer(rawArr);
    return 0;
}`,
    commonPitfalls: "Does not own the memory: if the underlying vector reallocates or goes out of scope, the span becomes a dangling pointer!"
  },

  // ==========================================
  // SMART POINTERS & MEMORY MANAGEMENT
  // ==========================================
  {
    name: "std::unique_ptr",
    category: "smart_pointers",
    header: "<memory>",
    synopsis: "template<class T, class Deleter = std::default_delete<T>> class unique_ptr;",
    timeComplexity: "Zero runtime space and time overhead compared to raw pointer! (Zero-cost abstraction)",
    description: "Smart pointer that owns and manages another object through a pointer and disposes of that object when the unique_ptr goes out of scope. Non-copyable (move-only) ensuring single ownership semantics.",
    example: `#include <memory>
#include <iostream>

struct Socket {
    int fd;
    Socket(int f) : fd(f) {}
    ~Socket() { std::cout << "Socket " << fd << " closed\\n"; }
};

int main() {
    auto sock = std::make_unique<Socket>(8080);
    // Transfer ownership
    std::unique_ptr<Socket> worker = std::move(sock);
    // sock is now nullptr
    return 0;
}`,
    commonPitfalls: "Cannot be copied: calling copy constructor causes compiler error. Must use std::move(). Never pass unique_ptr by value unless explicitly sinking ownership."
  },
  {
    name: "std::shared_ptr & std::weak_ptr",
    category: "smart_pointers",
    header: "<memory>",
    synopsis: "template<class T> class shared_ptr; template<class T> class weak_ptr;",
    timeComplexity: "O(1) copy/destroy. Atomic increments/decrements on control block reference counters.",
    description: "std::shared_ptr retains shared ownership through a reference-counted control block. Destroyed when the last shared_ptr is deallocated. std::weak_ptr is a non-owning observer used to break cyclic references and check if object still exists via lock().",
    example: `#include <memory>
#include <iostream>

struct GraphNode {
    int id;
    std::shared_ptr<GraphNode> child;
    std::weak_ptr<GraphNode> parent; // Weak pointer prevents cyclic memory leak!
    GraphNode(int i) : id(i) {}
};

int main() {
    auto root = std::make_shared<GraphNode>(1);
    auto leaf = std::make_shared<GraphNode>(2);
    root->child = leaf;
    leaf->parent = root;

    if (auto p = leaf->parent.lock()) {
        std::cout << "Parent node id: " << p->id << "\\n";
    }
    return 0;
}`,
    commonPitfalls: "Circular shared_ptr references result in perpetual refCount > 0, creating permanent memory leaks. Control block atomic operations have CPU cache synchronization cost."
  },
  {
    name: "std::pmr::monotonic_buffer_resource",
    category: "smart_pointers",
    header: "<memory_resource>",
    synopsis: "class monotonic_buffer_resource : public memory_resource; (C++17)",
    timeComplexity: "O(1) bump-pointer allocation; O(1) bulk deallocation of entire arena.",
    description: "Polymorphic Memory Resource (PMR) arena allocator. Allocates memory sequentially from a pre-allocated stack/heap buffer with zero individual free overhead. Releases all memory at once on destruction, ideal for games, compilers, and high-frequency trading (HFT).",
    example: `#include <memory_resource>
#include <vector>
#include <iostream>

int main() {
    char stackBuffer[1024];
    std::pmr::monotonic_buffer_resource memPool(stackBuffer, sizeof(stackBuffer));

    // Vector allocates directly from stackBuffer with zero heap calls!
    std::pmr::vector<int> numbers(&memPool);
    for (int i = 0; i < 100; ++i) numbers.push_back(i);

    std::cout << "Allocated " << numbers.size() << " elements on PMR arena!\\n";
    return 0;
}`,
    commonPitfalls: "Individual deallocations are no-ops; memory is only reclaimed when the entire resource is destructed or deallocate() is called on the resource."
  },

  // ==========================================
  // MODERN C++ UTILITIES & TYPES
  // ==========================================
  {
    name: "std::move & std::forward",
    category: "utilities",
    header: "<utility>",
    synopsis: "template<class T> constexpr typename std::remove_reference<T>::type&& move(T&& t) noexcept;",
    timeComplexity: "Zero runtime cost: pure compile-time cast to rvalue reference (T&&).",
    description: "std::move unconditionally casts an lvalue to an rvalue reference, enabling move constructors and move assignment operators to transfer ownership of resources without deep copies. std::forward conditionally casts to rvalue only if its argument was initialized with an rvalue, preserving value category in generic templates (Perfect Forwarding).",
    example: `#include <utility>
#include <vector>
#include <string>
#include <iostream>

template<typename T>
void relay(T&& arg) {
    // Perfect forwarding preserves lvalue or rvalue
    process(std::forward<T>(arg));
}

void process(const std::string& lval) { std::cout << "Lvalue ref\\n"; }
void process(std::string&& rval) { std::cout << "Rvalue ref\\n"; }

int main() {
    std::string s = "Hello";
    relay(s);            // Calls lvalue
    relay(std::move(s)); // Calls rvalue
    return 0;
}`,
    commonPitfalls: "std::move does not move anything at runtime. Accessing an object after std::move leaves it in a 'valid but unspecified' state."
  },
  {
    name: "std::optional",
    category: "utilities",
    header: "<optional>",
    synopsis: "template<class T> class optional; (C++17)",
    timeComplexity: "O(1) operations, zero dynamic heap allocation. Size is sizeof(T) + sizeof(bool) + padding.",
    description: "Manages an optional contained value, which may or may not be present. Eliminates sentinel values like -1 or nullptr. Stores the value inline within its own footprint.",
    example: `#include <optional>
#include <string>
#include <iostream>

std::optional<int> parsePort(const std::string& str) {
    try {
        int p = std::stoi(str);
        if (p >= 1 && p <= 65535) return p;
    } catch (...) {}
    return std::nullopt; // Empty state
}

int main() {
    auto port = parsePort("8080");
    std::cout << "Port: " << port.value_or(80) << "\\n";
    return 0;
}`,
    commonPitfalls: "Calling .value() on an empty optional throws std::bad_optional_access. Always check has_value() or use value_or()."
  },
  {
    name: "std::variant & std::visit",
    category: "utilities",
    header: "<variant>",
    synopsis: "template<class... Types> class variant; (C++17)",
    timeComplexity: "O(1) index check, zero heap allocation. Type-safe tagged union.",
    description: "Type-safe union representing one of several possible types. Knows which type it currently holds. std::visit allows compile-time pattern matching over variants. Can hold containers (e.g. std::set, std::vector) or primitive types.",
    example: `#include <variant>
#include <set>
#include <string>
#include <iostream>

using Value = std::variant<int, std::string, std::set<int>>;

int main() {
    Value v = std::set<int>{1, 2, 3};

    std::visit([](auto&& arg) {
        using T = std::decay_t<decltype(arg)>;
        if constexpr (std::is_same_v<T, std::set<int>>) {
            std::cout << "Contains set of size: " << arg.size() << "\\n";
        } else {
            std::cout << "Value: " << arg << "\\n";
        }
    }, v);
    return 0;
}`,
    commonPitfalls: "std::get<T>(v) throws std::bad_variant_access if variant does not currently contain type T. Check with std::holds_alternative<T>(v)."
  },
  {
    name: "std::tuple & std::pair",
    category: "utilities",
    header: "<tuple>",
    synopsis: "template<class... Types> class tuple;",
    timeComplexity: "O(1) compile-time access via std::get<I> or structured bindings.",
    description: "Fixed-size collection of heterogeneous values. Supports C++17 structured bindings auto [a, b, c] = myTuple; for clean multi-return functions.",
    example: `#include <tuple>
#include <string>
#include <iostream>

std::tuple<std::string, int, bool> getHostInfo() {
    return {"localhost", 3000, true};
}

int main() {
    auto [host, port, ssl] = getHostInfo();
    std::cout << host << ":" << port << " (SSL=" << ssl << ")\\n";
    return 0;
}`,
    commonPitfalls: "Cannot iterate tuples with a standard runtime for loop; must use template metaprogramming or fold expressions std::apply."
  },
  {
    name: "std::function",
    category: "utilities",
    header: "<functional>",
    synopsis: "template<class R, class... Args> class function<R(Args...)>;",
    timeComplexity: "Indirect function call via function pointer. Allocates heap if callable exceeds small buffer optimization (SBO) limit.",
    description: "General-purpose polymorphic function wrapper. Can store, copy, and invoke any Callable target: lambdas, function pointers, member function pointers, or bind expressions.",
    example: `#include <functional>
#include <iostream>

void execute(std::function<void(int)> callback) {
    callback(42);
}

int main() {
    int factor = 2;
    // Captures factor in lambda
    execute([factor](int val) {
        std::cout << "Result: " << val * factor << "\\n";
    });
    return 0;
}`,
    commonPitfalls: "Indirection overhead: invoking std::function involves a virtual dispatch or function pointer call. Compilers often cannot inline through std::function."
  },

  // ==========================================
  // CONCURRENCY & MULTITHREADING
  // ==========================================
  {
    name: "std::thread & std::jthread",
    category: "concurrency",
    header: "<thread>",
    synopsis: "class thread; class jthread; (C++20)",
    timeComplexity: "Kernel thread creation overhead; O(1) join/detach.",
    description: "Manages execution threads. std::jthread (C++20) automatically joins on destruction and supports cooperative thread cancellation via std::stop_token.",
    example: `#include <thread>
#include <iostream>

void worker(int id) {
    std::cout << "Worker " << id << " executed.\\n";
}

int main() {
    // std::jthread automatically joins on scope exit!
    std::jthread t1(worker, 1);
    std::jthread t2(worker, 2);
    return 0;
}`,
    commonPitfalls: "Destructing an unjoined, non-detached std::thread calls std::terminate(), crashing the entire application! Always use std::jthread or call .join() in RAII wrappers."
  },
  {
    name: "std::mutex & std::shared_mutex",
    category: "concurrency",
    header: "<mutex>",
    synopsis: "class mutex; class shared_mutex; (C++17)",
    timeComplexity: "Fast-path atomic lock acquisition; kernel wait state if contested.",
    description: "Synchronization primitive used to protect shared data from concurrent access. std::shared_mutex enables Reader-Writer locking: multiple readers can lock shared simultaneously, while writes require exclusive lock.",
    example: `#include <shared_mutex>
#include <mutex>
#include <unordered_map>
#include <string>

class ConcurrentCache {
    std::unordered_map<std::string, int> data;
    mutable std::shared_mutex rwLock;
public:
    int read(const std::string& k) const {
        std::shared_lock<std::shared_mutex> rLock(rwLock); // Multiple readers
        return data.at(k);
    }
    void write(const std::string& k, int v) {
        std::unique_lock<std::shared_mutex> wLock(rwLock); // Exclusive writer
        data[k] = v;
    }
};`,
    commonPitfalls: "Never manually call mtx.lock() and mtx.unlock(); if an exception is thrown, the mutex will never be unlocked, causing a permanent deadlock. Always use RAII wrappers (std::lock_guard, std::unique_lock, std::shared_lock)."
  },
  {
    name: "std::lock_guard & std::unique_lock",
    category: "concurrency",
    header: "<mutex>",
    synopsis: "template<class Mutex> class lock_guard; template<class Mutex> class unique_lock;",
    timeComplexity: "RAII scoped wrapper with zero runtime penalty over raw mutex.",
    description: "RAII wrappers that acquire a mutex in their constructor and release it in their destructor. std::unique_lock also supports deferred locking, timeouts, unlocking before scope ends, and integration with std::condition_variable.",
    example: `#include <mutex>
#include <vector>

std::mutex g_mtx;
std::vector<int> g_sharedList;

void addEntry(int val) {
    std::lock_guard<std::mutex> lock(g_mtx); // Unlocked automatically on return
    g_sharedList.push_back(val);
}`,
    commonPitfalls: "Forgetting to name the lock guard: writing std::lock_guard<std::mutex>(mtx); creates a temporary object that is immediately destroyed on that line, leaving the critical section unprotected!"
  },
  {
    name: "std::condition_variable",
    category: "concurrency",
    header: "<condition_variable>",
    synopsis: "class condition_variable;",
    timeComplexity: "Thread put to sleep until notified; wakes without busy-spinning.",
    description: "Synchronization primitive used to block one or more threads until another thread modifies a shared variable and notifies the condition_variable. Requires a std::unique_lock<std::mutex>.",
    example: `#include <condition_variable>
#include <mutex>
#include <queue>

std::queue<int> taskQueue;
std::mutex queueMtx;
std::condition_variable cv;

void consumer() {
    std::unique_lock<std::mutex> lock(queueMtx);
    // Predicate guards against spurious wakeups!
    cv.wait(lock, []{ return !taskQueue.empty(); });
    int task = taskQueue.front();
    taskQueue.pop();
}

void producer(int val) {
    {
        std::lock_guard<std::mutex> lock(queueMtx);
        taskQueue.push(val);
    }
    cv.notify_one();
}`,
    commonPitfalls: "Spurious wakeups: A waiting thread can wake up even without any notify call. You MUST always pass a predicate lambda cv.wait(lock, []{ return condition; });."
  },
  {
    name: "std::atomic<T>",
    category: "concurrency",
    header: "<atomic>",
    synopsis: "template<class T> struct atomic;",
    timeComplexity: "Hardware lock-free instructions (e.g. LOCK CMPXCHG on x86-64).",
    description: "Provides atomic operations on types without requiring a mutex. Prevents data races and allows specifying memory order semantics (memory_order_relaxed, acquire, release, seq_cst).",
    example: `#include <atomic>
#include <iostream>

std::atomic<int> g_counter{0};

void increment() {
    // Lock-free atomic increment
    g_counter.fetch_add(1, std::memory_order_relaxed);
}

int main() {
    increment();
    std::cout << "Atomic value: " << g_counter.load() << "\\n";
    return 0;
}`,
    commonPitfalls: "False sharing: If two atomic variables reside on the same 64-byte CPU cache line, concurrent writes by different CPU cores invalidate each other's L1 cache, degrading performance. Use alignas(64)."
  },
  {
    name: "std::future & std::async",
    category: "concurrency",
    header: "<future>",
    synopsis: "template<class Function, class... Args> future<...> async(Function&& f, Args&&... args);",
    timeComplexity: "O(1) future setup, blocks on future.get() until asynchronous task finishes.",
    description: "Provides high-level task-based concurrency. std::async runs a callable in a separate thread (or deferred), returning a std::future holding the eventual result or exception.",
    example: `#include <future>
#include <iostream>

int computeHash(int input) {
    return input * 7919;
}

int main() {
    std::future<int> fut = std::async(std::launch::async, computeHash, 42);
    // Do other work while thread computes...
    int res = fut.get(); // Blocks until finished
    std::cout << "Computed: " << res << "\\n";
    return 0;
}`,
    commonPitfalls: "Destructor of future returned from std::async(std::launch::async, ...) blocks until the thread finishes! Do not ignore the returned future or it will run synchronously."
  }
];
