import type { ServerCodingChallenge } from './challengeRegistry.js';

const headers = String.raw`#include <algorithm>
#include <atomic>
#include <chrono>
#include <condition_variable>
#include <cstdlib>
#include <functional>
#include <iomanip>
#include <iostream>
#include <memory>
#include <mutex>
#include <new>
#include <queue>
#include <stdexcept>
#include <string>
#include <thread>
#include <type_traits>
#include <utility>
#include <unordered_map>
#include <vector>
using std::size_t;
`;

function challenge(id: string, title: string, driverCode: string,
  publicInputs: string[], hiddenInputs: string[], extraPrefix = ''): ServerCodingChallenge {
  return { id, title, sourcePrefix: headers + extraPrefix, alwaysUseDriver: true, driverCode,
    comparator: 'trimmed',
    publicTests: publicInputs.map(input => ({ input, expectedOutput: 'OK' })),
    hiddenTests: hiddenInputs.map(input => ({ input, expectedOutput: 'OK', isHidden: true })),
  };
}

// These counters observe cleanup during a test scope, without relying on allocator layout.
const allocationProbe = (array: boolean) => String.raw`
// Allocation elision can otherwise hide a missing release from the counters.
// This applies only to the ownership-probe exam translation units (the runner stays unchanged).
#pragma GCC optimize("O0")
static long examAllocations = 0, examDeallocations = 0;
void* operator new${array ? '[]' : ''}(std::size_t bytes) {
    void* result = std::malloc(bytes ? bytes : 1);
    if (!result) throw std::bad_alloc{};
    ++examAllocations;
    return result;
}
void operator delete${array ? '[]' : ''}(void* pointer) noexcept {
    if (pointer) ++examDeallocations;
    std::free(pointer);
}
void operator delete${array ? '[]' : ''}(void* pointer, std::size_t) noexcept {
    ::operator delete${array ? '[]' : ''}(pointer);
}
`;

const queueDeclaration = String.raw`
class ThreadSafeQueue {
    std::queue<int> q;
    std::mutex mtx;
    std::condition_variable cv;
    friend struct ExamQueueProbe;
public:
    void push(int val);
};
`;

export const EXAM_SERVER_CHALLENGES: Record<string, ServerCodingChallenge> = {
  'exam-ef-cc-1': challenge('exam-ef-cc-1', 'DynamicArray move ownership', String.raw`
static_assert(!std::is_copy_constructible_v<DynamicArray>);
static_assert(!std::is_copy_assignable_v<DynamicArray>);
static_assert(std::is_nothrow_move_constructible_v<DynamicArray>);
static_assert(std::is_nothrow_move_assignable_v<DynamicArray>);
int main() {
    int count; std::cin >> count;
    bool ok = true;
    const long allocated = examAllocations, freed = examDeallocations;
    {
        DynamicArray original;
        if (count) {
            original.ptr = new int[count]; original.sz = count;
            for (int i = 0; i < count; ++i) original.ptr[i] = i * 7 - 3;
        }
        int* storage = original.ptr;
        DynamicArray moved(std::move(original));
        ok &= original.ptr == nullptr && original.sz == 0;
        ok &= moved.ptr == storage && moved.sz == static_cast<size_t>(count);
        if (ok) for (int i = 0; i < count; ++i) ok &= moved.ptr[i] == i * 7 - 3;
        DynamicArray destination;
        destination.ptr = new int[2]; destination.sz = 2;
        DynamicArray* returned = &(destination = std::move(moved));
        ok &= returned == &destination && moved.ptr == nullptr && moved.sz == 0;
        ok &= destination.ptr == storage && destination.sz == static_cast<size_t>(count);
        if (ok) {
            destination = std::move(destination);
            ok &= (destination.ptr == storage && destination.sz == static_cast<size_t>(count))
                || (destination.ptr == nullptr && destination.sz == 0);
        }
    }
    ok &= examAllocations - allocated == examDeallocations - freed;
    std::cout << (ok ? "OK" : "FAIL");
}`, ['3', '0'], ['1', '29'], allocationProbe(true)),

  'exam-ef-cc-2': challenge('exam-ef-cc-2', 'ScopedInt RAII', String.raw`
static_assert(!std::is_copy_constructible_v<ScopedInt>);
static_assert(!std::is_copy_assignable_v<ScopedInt>);
static_assert(!std::is_convertible_v<int, ScopedInt>);
int main() {
    int value; std::cin >> value;
    const long allocated = examAllocations, freed = examDeallocations;
    bool ok = true;
    {
        const ScopedInt first(value);
        const ScopedInt second(value + 1);
        ok &= first.get() == value && second.get() == value + 1;
    }
    try { ScopedInt duringUnwind(value); throw 7; } catch (int) {}
    ok &= examAllocations > allocated;
    ok &= examAllocations - allocated == examDeallocations - freed;
    std::cout << (ok ? "OK" : "FAIL");
}`, ['42', '0'], ['-17', '123456'], allocationProbe(false)),

  'exam-estl-cc-1': challenge('exam-estl-cc-1', 'Group anagrams', String.raw`
int main() {
    int count; std::cin >> count;
    std::vector<std::string> words(count);
    for (auto& word : words) std::cin >> std::quoted(word);
    auto groups = groupAnagrams(words);
    std::vector<std::vector<std::string>> expected;
    std::vector<std::string> keys;
    for (const auto& word : words) {
        auto key = word; std::sort(key.begin(), key.end());
        auto it = std::find(keys.begin(), keys.end(), key);
        if (it == keys.end()) { keys.push_back(key); expected.push_back({word}); }
        else expected[it - keys.begin()].push_back(word);
    }
    for (auto& group : groups) std::sort(group.begin(), group.end());
    for (auto& group : expected) std::sort(group.begin(), group.end());
    std::sort(groups.begin(), groups.end()); std::sort(expected.begin(), expected.end());
    std::cout << (groups == expected ? "OK" : "FAIL");
}`, ['6 "eat" "tea" "tan" "ate" "nat" "bat"', '0'],
    ['5 "" "" "a" "a" "b"', '6 "ab" "ba" "abc" "cab" "bca" "z"']),

  'exam-estl-cc-2': challenge('exam-estl-cc-2', 'Kth largest element', String.raw`
int main() {
    int count, k; std::cin >> count >> k;
    std::vector<int> values(count);
    for (auto& value : values) std::cin >> value;
    auto sorted = values; std::sort(sorted.begin(), sorted.end(), std::greater<int>{});
    std::cout << (findKthLargest(values, k) == sorted[k - 1] ? "OK" : "FAIL");
}`, ['6 2 3 2 1 5 6 4', '1 1 -8'],
    ['7 4 5 5 5 4 4 -1 -9', '5 5 -2 -9 0 7 7', '4 1 -2147483648 0 2147483647 -1']),

  'exam-esys-cc-1': challenge('exam-esys-cc-1', 'Synchronized queue push', String.raw`
struct ExamQueueProbe {
    static bool check(int threads, int count) {
        ThreadSafeQueue queue;
        bool notified = false;
        std::atomic<bool> waiting{false};
        std::thread consumer([&] {
            std::unique_lock<std::mutex> lock(queue.mtx);
            waiting = true;
            const auto started = std::chrono::steady_clock::now();
            bool ready = queue.cv.wait_for(lock, std::chrono::milliseconds(600), [&] { return !queue.q.empty(); });
            notified = ready && std::chrono::steady_clock::now() - started < std::chrono::milliseconds(500);
        });
        while (!waiting.load()) std::this_thread::yield();
        { std::lock_guard<std::mutex> released(queue.mtx); }
        queue.push(-7);
        consumer.join();
        std::vector<std::thread> producers;
        for (int t = 0; t < threads; ++t) producers.emplace_back([&, t] {
            for (int i = 0; i < count; ++i) queue.push(t * count + i);
        });
        for (auto& producer : producers) producer.join();
        std::vector<int> actual;
        while (!queue.q.empty()) { actual.push_back(queue.q.front()); queue.q.pop(); }
        std::vector<int> expected{-7};
        for (int i = 0; i < threads * count; ++i) expected.push_back(i);
        std::sort(actual.begin(), actual.end()); std::sort(expected.begin(), expected.end());
        return notified && actual == expected;
    }
};
int main() {
    int threads, count; std::cin >> threads >> count;
    std::cout << (ExamQueueProbe::check(threads, count) ? "OK" : "FAIL");
}`, ['1 3', '2 100'], ['4 500', '6 1000'], queueDeclaration),

  'exam-esys-cc-2': challenge('exam-esys-cc-2', 'SpinLock synchronization', String.raw`
int main() {
    int rounds; std::cin >> rounds;
    SpinLock lock;
    std::atomic<bool> started{false}, entered{false};
    lock.lock();
    std::thread waiter([&] { started = true; lock.lock(); entered = true; lock.unlock(); });
    while (!started.load()) std::this_thread::yield();
    std::this_thread::sleep_for(std::chrono::milliseconds(30));
    bool excluded = !entered.load();
    lock.unlock(); waiter.join();
    int counter = 0;
    std::vector<std::thread> workers;
    for (int t = 0; t < 4; ++t) workers.emplace_back([&] {
        for (int i = 0; i < rounds; ++i) { lock.lock(); ++counter; lock.unlock(); }
    });
    for (auto& worker : workers) worker.join();
    std::cout << (excluded && entered.load() && counter == 4 * rounds ? "OK" : "FAIL");
}`, ['1', '100'], ['2000', '9000']),

  'exam-efin-cc-1': challenge('exam-efin-cc-1', 'In-place space compaction', String.raw`
int main() {
    std::string text; std::getline(std::cin, text);
    auto expected = text;
    expected.erase(std::remove(expected.begin(), expected.end(), ' '), expected.end());
    removeSpaces(text);
    std::cout << (text == expected ? "OK" : "FAIL");
}`, ['a b c', ''], ['     ', ' a  b ', 'a\tb c', 'already_compact']),

  'exam-efin-cc-2': challenge('exam-efin-cc-2', 'Perfect-forwarding unique factory', String.raw`
struct ExamMoveOnly {
    int& alias;
    std::unique_ptr<int> owned;
    ExamMoveOnly(int& ref, std::unique_ptr<int> value) : alias(ref), owned(std::move(value)) {}
};
struct ExamNoCopy {
    int value;
    explicit ExamNoCopy(int v) : value(v) {}
    ExamNoCopy(const ExamNoCopy&) = delete;
};
int main() {
    int value; std::cin >> value;
    auto plain = my_make_unique<int>(value);
    auto defaultValue = my_make_unique<int>();
    auto source = std::make_unique<int>(value + 2);
    auto moved = my_make_unique<ExamMoveOnly>(value, std::move(source));
    auto noCopy = my_make_unique<ExamNoCopy>(value);
    bool ok = plain && *plain == value && defaultValue && *defaultValue == 0;
    ok &= moved && &moved->alias == &value && moved->owned && *moved->owned == value + 2;
    ok &= !source && noCopy && noCopy->value == value;
    std::cout << (ok ? "OK" : "FAIL");
}`, ['3', '0'], ['-7', '999']),

  'exam-ex1-q7': challenge('exam-ex1-q7', 'In-place buffer reverse', String.raw`
int main() {
    int count; std::cin >> count;
    std::vector<int> values(count);
    for (auto& value : values) std::cin >> value;
    auto expected = values; std::reverse(expected.begin(), expected.end());
    reverseBuffer(values.data(), count); reverseBuffer(nullptr, 0);
    std::cout << (values == expected ? "OK" : "FAIL");
}`, ['4 1 2 3 4', '0'], ['1 8', '5 -1 2 0 2 9']),

  'exam-ex3-q7': challenge('exam-ex3-q7', 'IntArray independent deep copy', String.raw`
int main() {
    int count; std::cin >> count;
    bool ok = true;
    {
        IntArray original(count);
        for (int i = 0; i < count; ++i) original.data[i] = i + 5;
        IntArray copy(original);
        ok &= copy.size == count;
        if (count) ok &= copy.data && copy.data != original.data;
        if (ok) for (int i = 0; i < count; ++i) ok &= copy.data[i] == i + 5;
        if (ok && count) { copy.data[0] = 77; ok &= original.data[0] == 5; }
    }
    std::cout << (ok ? "OK" : "FAIL");
}`, ['3', '0'], ['1', '100']),
};
