/** Trusted reference submissions used only by automated compiler tests. */
export const EXAM_SOLUTIONS: Record<string, string> = {
  'exam-ef-cc-1': `struct DynamicArray {
    int* ptr = nullptr; size_t sz = 0;
    DynamicArray() = default;
    ~DynamicArray() { delete[] ptr; }
    DynamicArray(const DynamicArray&) = delete;
    DynamicArray& operator=(const DynamicArray&) = delete;
    DynamicArray(DynamicArray&& other) noexcept : ptr(other.ptr), sz(other.sz) {
        other.ptr = nullptr; other.sz = 0;
    }
    DynamicArray& operator=(DynamicArray&& other) noexcept {
        if (this != &other) {
            delete[] ptr; ptr = other.ptr; sz = other.sz;
            other.ptr = nullptr; other.sz = 0;
        }
        return *this;
    }
};`,
  'exam-ef-cc-2': `class ScopedInt {
    int* val;
public:
    explicit ScopedInt(int v) : val(new int(v)) {}
    ~ScopedInt() { delete val; }
    ScopedInt(const ScopedInt&) = delete;
    ScopedInt& operator=(const ScopedInt&) = delete;
    int get() const { return *val; }
};`,
  'exam-estl-cc-1': `std::vector<std::vector<std::string>> groupAnagrams(const std::vector<std::string>& words) {
    std::unordered_map<std::string, std::vector<std::string>> groups;
    for (const auto& word : words) { auto key = word; std::sort(key.begin(), key.end()); groups[key].push_back(word); }
    std::vector<std::vector<std::string>> result;
    for (auto& entry : groups) result.push_back(entry.second);
    return result;
}`,
  'exam-estl-cc-2': `int findKthLargest(const std::vector<int>& values, int k) {
    std::priority_queue<int, std::vector<int>, std::greater<int>> heap;
    for (int value : values) { heap.push(value); if (heap.size() > static_cast<size_t>(k)) heap.pop(); }
    return heap.top();
}`,
  'exam-esys-cc-1': `void ThreadSafeQueue::push(int val) {
    { std::lock_guard<std::mutex> lock(mtx); q.push(val); }
    cv.notify_one();
}`,
  'exam-esys-cc-2': `class SpinLock {
    std::atomic_flag flag = ATOMIC_FLAG_INIT;
public:
    void lock() { while (flag.test_and_set(std::memory_order_acquire)) std::this_thread::yield(); }
    void unlock() { flag.clear(std::memory_order_release); }
};`,
  'exam-efin-cc-1': `void removeSpaces(std::string& text) {
    size_t written = 0;
    for (char value : text) if (value != ' ') text[written++] = value;
    text.resize(written);
}`,
  'exam-efin-cc-2': `template<typename T, typename... Args>
std::unique_ptr<T> my_make_unique(Args&&... args) {
    return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}`,
  'exam-ex1-q7': `void reverseBuffer(int* buffer, int length) {
    if (!buffer || length <= 1) return;
    for (int left = 0, right = length - 1; left < right; ++left, --right) std::swap(buffer[left], buffer[right]);
}`,
  'exam-ex3-q7': `class IntArray {
public:
    int* data; int size;
    explicit IntArray(int n) : data(new int[n]{}), size(n) {}
    ~IntArray() { delete[] data; }
    IntArray& operator=(const IntArray&) = delete;
    IntArray(const IntArray& other) : data(new int[other.size]), size(other.size) {
        std::copy(other.data, other.data + size, data);
    }
};`,
};
