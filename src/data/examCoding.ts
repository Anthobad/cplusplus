/** Public contracts only. Drivers, hidden tests and reference solutions stay on the server. */
export const EXAM_CODING: Record<string, { challengeId: string; initialCode: string; instructions: string; context?: string }> = {
  'ef-cc-1': {
    challengeId: 'exam-ef-cc-1',
    instructions: 'Submit the complete DynamicArray class below, without main. Transfer ptr and sz, leave moved-from objects empty, and release previous destination storage. Self-move may preserve the buffer or leave the destination empty. Copying is disabled. The driver checks ownership and cleanup.',
    initialCode: `struct DynamicArray {
    int* ptr = nullptr;
    size_t sz = 0;
    DynamicArray() = default;
    ~DynamicArray() { delete[] ptr; }
    DynamicArray(const DynamicArray&) = delete;
    DynamicArray& operator=(const DynamicArray&) = delete;
    DynamicArray(DynamicArray&& other) noexcept {
        // Transfer ownership and empty other.
    }
    DynamicArray& operator=(DynamicArray&& other) noexcept {
        // Release old storage, transfer ownership, handle self-move.
        return *this;
    }
};`,
  },
  'ef-cc-2': {
    challengeId: 'exam-ef-cc-2',
    instructions: 'Submit a complete ScopedInt class without main. It must have explicit ScopedInt(int), int get() const, correct resource cleanup, and deleted copy construction/assignment. The driver checks lifetime and noncopyability.',
    initialCode: `class ScopedInt {
    int* val;
public:
    explicit ScopedInt(int value) {
        // Acquire an int initialized to value.
    }
    ~ScopedInt() {
        // Release owned storage.
    }
    ScopedInt(const ScopedInt&) = delete;
    ScopedInt& operator=(const ScopedInt&) = delete;
    int get() const {
        return 0; // Return the owned value.
    }
};`,
  },
  'estl-cc-1': {
    challengeId: 'exam-estl-cc-1', instructions: 'Submit groupAnagrams without main. Preserve every input occurrence, including duplicates and empty strings. Group and word order do not matter. Inputs contain lowercase English letters.',
    initialCode: `std::vector<std::vector<std::string>> groupAnagrams(const std::vector<std::string>& words) {
    return {};
}`,
  },
  'estl-cc-2': {
    challengeId: 'exam-estl-cc-2', instructions: 'Submit findKthLargest without main. Count duplicate occurrences separately. Inputs are nonempty and 1 <= k <= nums.size(); all values fit int.',
    initialCode: `int findKthLargest(const std::vector<int>& nums, int k) {
    return 0;
}`,
  },
  'esys-cc-1': {
    challengeId: 'exam-esys-cc-1', instructions: 'The driver supplies the displayed ThreadSafeQueue declaration with private q, mtx and cv. Submit ONLY the out-of-class push definition below. Lock the shared mutex, append val, then notify a waiting consumer. This queue has no capacity limit.',
    initialCode: `void ThreadSafeQueue::push(int val) {
    // Synchronize q.push(val) and notify a waiting consumer.
}`,
    context: `// Supplied by the evaluator; do not redeclare this class in your answer.
class ThreadSafeQueue {
    std::queue<int> q;
    std::mutex mtx;
    std::condition_variable cv;
public:
    void push(int val);
};`,
  },
  'esys-cc-2': {
    challengeId: 'exam-esys-cc-2', instructions: 'Submit the complete SpinLock class without main. Provide lock() and unlock() using atomic_flag with acquire/release synchronization. The driver checks exclusion, release and concurrent protected updates.',
    initialCode: `class SpinLock {
    std::atomic_flag flag = ATOMIC_FLAG_INIT;
public:
    void lock() {
        // Acquire the flag, retrying while owned.
    }
    void unlock() {
        // Release the flag.
    }
};`,
  },
  'efin-cc-1': {
    challengeId: 'exam-efin-cc-1', instructions: 'Submit removeSpaces without main. Remove every ASCII space character (\' \'), preserving the order of all other characters. Tabs are retained. Handle empty and all-space input.',
    initialCode: `void removeSpaces(std::string& text) {
    // Compact text and update its size.
}`,
  },
  'efin-cc-2': {
    challengeId: 'exam-efin-cc-2', instructions: 'Submit the function template below without main. Forward constructor arguments, including lvalues and move-only rvalues, into a new scalar T owned by unique_ptr. Array types are out of scope.',
    initialCode: `template<typename T, typename... Args>
std::unique_ptr<T> my_make_unique(Args&&... args) {
    return nullptr;
}`,
  },
  'ex1-q7': {
    challengeId: 'exam-ex1-q7', instructions: 'Submit reverseBuffer without main. Reverse the existing elements using constant auxiliary storage. A null buffer or length <= 1 is a no-op.',
    initialCode: `void reverseBuffer(int* buffer, int length) {
    // Reverse the buffer in place.
}`,
  },
  'ex3-q7': {
    challengeId: 'exam-ex3-q7', instructions: 'Submit the complete IntArray class below without main. Implement an independent deep-copy constructor; preserve the supplied ownership policy and public data/size fields. Handle size zero.',
    initialCode: `class IntArray {
public:
    int* data;
    int size;
    explicit IntArray(int count) : data(new int[count]{}), size(count) {}
    ~IntArray() { delete[] data; }
    IntArray& operator=(const IntArray&) = delete;
    IntArray(const IntArray& other) : data(nullptr), size(0) {
        // Allocate independent storage and copy the elements.
    }
};`,
  },
};

EXAM_CODING['ex2-q7'] = EXAM_CODING['estl-cc-1'];
EXAM_CODING['ex4-q7'] = EXAM_CODING['efin-cc-1'];
