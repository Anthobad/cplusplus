import type { Unit, TheorySection, CodeExample } from '../types';
import { GUIDE_WALKTHROUGHS } from './guideWalkthroughs.js';
import { SORTING_LESSONS } from './sortingLessons.js';

// Content additions only: original IDs, challenges, quizzes and progress gates are retained.
const additions: Record<number, { sections: TheorySection[]; examples: CodeExample[] }> = {};
function lesson(topic: number, title: string, content: string, code?: string, output?: string) {
  if (GUIDE_WALKTHROUGHS[title]) content += `\n\n${GUIDE_WALKTHROUGHS[title]}`;
  const entry = additions[topic] ||= { sections: [], examples: [] };
  entry.sections.push({ title, content });
  if (title === 'Implementing the seven required sorting algorithms') entry.sections.push(...SORTING_LESSONS);
  if (code) entry.examples.push({ id: `guide-t${topic}-${entry.examples.length + 1}`, title,
    code, output, explanation: content, keyTakeaways: [title] });
}

lesson(1, 'C++ Evolution: the features behind each standard',
  'C++ grew from Bjarne Stroustrup’s C with Classes into a language combining procedural, object-oriented and generic programming. C++98 standardized the language and STL; C++03 refined that standard. C++11 introduced move semantics, lambdas, auto, smart pointers and threads. C++14 refined generic lambdas and constexpr. C++17 added structured bindings, optional and filesystem. C++20 added concepts, ranges, coroutines and modules; C++23 adds facilities such as std::expected. A language standard, a compiler’s support and its standard-library implementation are separate concerns. This website’s evaluator targets C++20. Select -std=c++20 explicitly rather than relying on a compiler’s default.');
lesson(12, 'Compilation: preprocessing, compilation, assembly and linking',
  'A translation unit is one source file after preprocessing. Preprocessing expands #include and macros and selects conditional compilation branches. Compilation checks language rules and translates code to assembly; assembly creates an object file containing machine code and symbols. Linking resolves symbols across object files and libraries and creates an executable. A syntax/type error occurs during compilation; an undefined reference or duplicate definition is a linker error. Execution starts only after a successful build. Header guards or #pragma once prevent repeated inclusion in one translation unit; they do not prevent definitions in separate translation units from violating the One Definition Rule. Keep ordinary non-inline function definitions in one .cpp file.',
  String.raw`// Commands to run in a terminal, not C++ source:
// g++ -std=c++20 -E main.cpp -o main.ii   # preprocess
// g++ -std=c++20 -S main.ii -o main.s    # compile
// g++ -c main.s -o main.o               # assemble
// g++ main.o -o app                    # link
#include <iostream>
int main() {
    std::cout << "Built and running\n";
}`, 'Built and running\n');
lesson(12, 'Separate compilation: a header and two source files',
  'Declare int add(int, int); in add.hpp behind an include guard. Define it once in add.cpp, including add.hpp. main.cpp includes add.hpp and calls add. Build with g++ -std=c++20 main.cpp add.cpp -o app, or compile each .cpp with -c then link their .o files. A declaration lets the caller type-check; a definition supplies the implementation. Templates generally need their definitions visible at the instantiation site. Run ./app on Unix-like systems; its exit status is available through the shell. This multi-file exercise is for a local compiler; the existing website challenge evaluator still accepts its original single submission.');
lesson(9, 'Method signatures, static methods and instance methods',
  'A signature distinguishes overloads by name and parameter types; return type alone cannot distinguish overloads. An instance member is called on an object and has this; a static member belongs to the class and has no this. Static methods can access static data directly but need an explicit object to access instance data. Use const member methods for observations. Pass inexpensive scalars by value, mutable caller state by reference, and expensive read-only objects by const reference.',
  String.raw`#include <iostream>
struct Counter {
    int value {};
    inline static int calls {};
    static int doubled(int n) {
        ++calls;
        return 2*n;
    }
    void add(int n) {
        value += n;
    }
    int get() const {
        return value;
    }
};
int main() {
    Counter c;
    c.add(Counter::doubled(3));
    std::cout<<c.get()<<" "<<Counter::calls<<"\n";
}`, '6 1\n');
lesson(15, 'Class members, constructor variants and object lifecycle',
  'A class declaration names data and member functions; public exposes its interface, private hides implementation, and protected allows derived-class access. Constructors initialize members in their declaration order before the body executes. Know default, parameterized, delegating, copy and move constructors. A copy creates a separate object from an lvalue; a move transfers movable state and leaves the source valid but potentially unspecified. Objects with automatic storage are destroyed when scope ends; owned members are destroyed in reverse construction order. Prefer initializer lists, RAII and the Rule of Zero when standard members already manage resources. Accessors (getters/setters) preserve invariants instead of exposing writable fields.',
  String.raw`#include <iostream>
#include <string>
#include <utility>
class Device {
    std::string name_;
    public:
    Device() : Device("unnamed") {}
    explicit Device(std::string name) : name_(std::move(name)) {}
    Device(const Device&) = default;
    Device(Device&&) noexcept = default;
    ~Device() = default;
    const std::string& name() const {
        return name_;
    }
    void rename(std::string name) {
        name_ = std::move(name);
    }
};
int main() {
    Device a("sensor");
    Device b(a);
    Device c(std::move(b));
    c.rename("meter");
    std::cout<<a.name()<<" "<<c.name()<<"\n";
}`, 'sensor meter\n');
lesson(15, 'Nested classes, static/const members, friends and enumerations',
  'A nested class is a member type, such as Meter::Reading. It has no implicit enclosing Meter instance: pass an object when accessing its state. A static data member is shared by instances; inline static (C++17) can be defined in the class. A const data member must be initialized and cannot subsequently be assigned, which can disable generated assignment operators. A const member method restricts mutation of the object’s ordinary members, not unrelated external state. friend grants a named function/class access to private members; friendship is neither inherited nor transitive. An unscoped enum introduces enumerators into its surrounding scope and can convert to an integer; enum class keeps names scoped and requires explicit conversion.',
  String.raw`#include <iostream>
class Meter {
    int value_;
    const int scale_;
    public:
    enum class Unit {
        Celsius, Fahrenheit
    };
    class Reading {
        public: static int raw(const Meter& m) {
            return m.value_;
        }
    };
    inline static int samples {};
    Meter(int value,int scale):value_(value),scale_(scale) {}
    int scaled() const {
        return value_*scale_;
    }
    static void sample() {
        ++samples;
    }
    friend bool equal(const Meter& a,const Meter& b) {
        return a.scaled()==b.scaled();
    }
};
int main() {
    Meter a(3,2),b(2,3);
    Meter::sample();
    std::cout<<Meter::Reading::raw(a)<<" "<<equal(a,b)<<" "<<Meter::samples<<"\n";
}`, '3 1 1\n');
lesson(28, 'Inheritance shapes, trade-offs and safe casting',
  'Single inheritance has one base; multilevel inheritance chains levels; hierarchical inheritance gives one base several derived types; multiple inheritance gives a class multiple bases. Public inheritance should model substitutability (IS-A), enabling reuse through a stable interface. Protected/private inheritance restrict conversion and inherited accessibility. Inheritance can also create tight coupling; prefer composition for HAS-A relationships. Upcasting from derived to an accessible unambiguous base is implicit. A checked dynamic_cast downcast requires a polymorphic base: a failed pointer cast returns nullptr; a failed reference cast throws std::bad_cast. A static_cast downcast is not a runtime check. Never treat reinterpret_cast or const_cast as substitutes for safe object relationships.');
lesson(29, 'Abstraction, overloading, overriding and static polymorphism',
  'Abstraction exposes the operations callers need while hiding implementation. An abstract class has at least one pure virtual function and cannot be instantiated. Overriding supplies a derived implementation of a virtual function with a matching signature; override asks the compiler to check this. Overloading supplies multiple functions with different parameter lists and is selected at compile time. Templates and overloads provide static polymorphism; virtual calls through a base pointer/reference provide dynamic polymorphism. Use a virtual destructor when deleting derived objects through a base interface.',
  String.raw`#include <iostream>
struct Shape {
    virtual ~Shape()=default;
    virtual int area() const=0;
};
struct Square:Shape {
    int side;
    explicit Square(int s):side(s) {}
    int area() const override {
        return side*side;
    }
};
int doubleValue(int n) {
    return 2*n;
}
double doubleValue(double n) {
    return 2*n;
}
int main() {
    Square s(3);
    const Shape& base=s;
    std::cout<<base.area()<<" "<<doubleValue(4)<<" "<<doubleValue(1.5)<<"\n";
}`, '9 8 3\n');
lesson(31, 'Association, aggregation and composition: ownership decides',
  'Association means objects collaborate without implying ownership. Aggregation is a whole/part relationship where parts can outlive the whole; model a non-owning pointer/reference and document lifetime requirements. Composition owns parts whose lifetime is controlled by the whole, often through value members or unique_ptr. A Team observing an externally owned Person is aggregation; an Order owning LineItem values is composition. Inheritance expresses IS-A, whereas both aggregation and composition express HAS-A with different ownership. Non-owning links must not outlive their targets; avoid confusing a shared_ptr with a universally correct design choice.',
  String.raw`#include <iostream>
#include <string>
struct Person {
    std::string name;
};
struct Team {
    const Person& lead;
};
// non-owning: Person must outlive Team
struct Engine {
    int cores;
};
struct Computer {
    Engine engine;
};
// owned value member
int main() {
    Person p {
        "Ada"
    };
    Team team {
        p
    };
    Computer pc {
 {
            8
        }
    };
    std::cout<<team.lead.name<<" "<<pc.engine.cores<<"\n";
}`, 'Ada 8\n');
lesson(33, 'Processes, threads, fork/join and race conditions',
  'A process has its own virtual address space; threads within one process share memory but have their own execution stacks. Fork/join as a parallel pattern splits work into tasks and waits for completion before combining results. std::thread starts a thread and join waits for it; it does not fork a process. On POSIX, fork creates a child process and waitpid joins its termination; these OS-specific APIs are not portable C++ library facilities. After fork in a multithreaded process, the child must respect async-signal-safety restrictions until exec. A data race is unsynchronized conflicting access to the same memory with at least one writer, and is undefined behavior in C++. Protect shared state with a mutex/RAII lock, or give each task disjoint output storage and join before reading it.',
  String.raw`#include <iostream>
#include <thread>
int main() {
    int left=0,right=0;
    std::thread a([&] {
        for(int i=1;i<=3;++i)left+=i;
    }
    );
    std::thread b([&] {
        for(int i=4;i<=6;++i)right+=i;
    }
    );
    a.join();
    b.join();
    std::cout<<left+right<<"\n";
}`, '21\n');
lesson(21, 'Duplicate-key sets: multiset and unordered_multiset',
  'set and unordered_set store unique keys; multiset and unordered_multiset retain duplicates. multiset orders values with logarithmic insert/find; unordered_multiset uses hashing with average constant-time lookup and linear worst case. count and equal_range expose duplicate occurrences. erase(key) removes all matching keys, whereas erase(iterator) removes one occurrence. In hash containers, iteration order is unspecified and rehashing invalidates iterators.',
  String.raw`#include <iostream>
#include <set>
#include <unordered_set>
int main() {
    std::multiset<int> ordered {
        2,1,2
    };
    ordered.erase(ordered.find(2));
    std::unordered_multiset<int> hashed {
        2,2,3
    };
    std::cout<<ordered.count(2)<<" "<<hashed.count(2)<<"\n";
}`, '1 2\n');
lesson(22, 'Duplicate-key maps: multimap and unordered_multimap',
  'multimap and unordered_multimap allow multiple values for the same key. Ordered multimap groups equivalent keys in comparator order; unordered_multimap hashes keys and offers average constant-time lookup. Use equal_range to visit every value belonging to one key. Neither provides operator[]: selecting one value among duplicate keys would be ambiguous. erase(key) removes all entries for that key; erase(iterator) removes one. Choose unique-key maps when one key must identify one value.',
  String.raw`#include <iostream>
#include <map>
#include <unordered_map>
#include <string>
int main() {
    std::multimap<std::string,int> scores {
 {
            "Ada",10
        }
        , {
            "Ada",20
        }
    };
    auto [first,last]=scores.equal_range("Ada");
    int sum=0;
    for(auto it=first;it!=last;++it)sum+=it->second;
    std::unordered_multimap<int,int> hashed {
 {
            1,4
        }
        , {
            1,5
        }
    };
    std::cout<<sum<<" "<<hashed.count(1)<<"\n";
}`, '30 2\n');
lesson(27, 'Function objects, lambdas and standard algorithms',
  'A function object is an object with operator(); it can carry state such as a threshold. Lambdas define callable objects concisely, capturing values by copy or referring to existing objects by reference. A reference capture must not outlive its target. Standard algorithms operate on iterator ranges [first,last); understand iterator categories and invalidation. Prefer a direct callable/template parameter when type erasure is unnecessary; std::function provides a uniform callable wrapper with possible overhead.',
  String.raw`#include <algorithm>
#include <functional>
#include <iostream>
#include <vector>
struct Above {
    int threshold;
    bool operator()(int n)const {
        return n>threshold;
    }
};
int main() {
    std::vector<int> values {
        1,4,7
    };
    int limit=3;
    std::function<bool(int)> predicate=[limit](int n) {
        return n>limit;
    };
    std::cout<<std::count_if(values.begin(),values.end(),Above {
        limit
    }
    )<<" "<<predicate(7)<<"\n";
}`, '2 1\n');
lesson(36, 'Brute force, greedy choice and divide-and-conquer',
  'Brute force enumerates candidates and checks them: it is simple and useful as a correctness oracle, but pair enumeration costs O(n²). Greedy algorithms commit to a locally attractive choice; correctness needs an exchange argument or another invariant, not intuition. For maximum non-overlapping intervals, choose the earliest finishing compatible interval; the objective here is interval count, not weighted profit. Divide-and-conquer splits a problem, solves subproblems recursively and combines their results; merge sort has T(n)=2T(n/2)+O(n)=O(n log n). Contrast this with dynamic programming, which caches overlapping subproblems.',
  String.raw`#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>
bool brutePair(const std::vector<int>& a,int target) {
    for(int i=0;i<(int)a.size();++i)for(int j=i+1;j<(int)a.size();++j)if(a[i]+a[j]==target)return true;
    return false;
}
int schedule(std::vector<std::pair<int,int>> intervals) {
    std::sort(intervals.begin(),intervals.end(),[](auto a,auto b) {
        return a.second<b.second;
    }
    );
    int count=0,end=0;
    bool first=true;
    for(auto [start,finish]:intervals)if(first||start>=end) {
        ++count;
        end=finish;
        first=false;
    }
    return count;
}
int main() {
    std::cout<<brutePair( {
        2,7,11
    }
    ,9)<<" "<<schedule( {
 {
            0,3
        }
        , {
            1,2
        }
        , {
            2,4
        }
        , {
            3,5
        }
    }
    )<<"\n";
}`, '1 2\n');
lesson(36, 'Merge intervals: sorting establishes the invariant',
  'For closed intervals [start,end], sort by start. Maintain a result whose final interval is the union of all overlapping intervals seen since its start. If the next start is at most the current end, extend the end; otherwise start another interval. Sorting costs O(n log n); the scan costs O(n). Touching endpoints merge for closed intervals; half-open intervals may require a different overlap predicate. Validate start <= end when accepting external input.',
  String.raw`#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>
std::vector<std::pair<int,int>> mergeIntervals(std::vector<std::pair<int,int>> a) {
    std::sort(a.begin(),a.end());
    std::vector<std::pair<int,int>> out;
    for(auto [start,end]:a) {
        if(out.empty()||start>out.back().second)out.push_back( {
            start,end
        }
        );
        else out.back().second=std::max(out.back().second,end);
    }
    return out;
}
int main() {
    for(auto [start,end]:mergeIntervals( {
 {
            1,3
        }
        , {
            2,6
        }
        , {
            8,10
        }
        , {
            10,12
        }
    }
    ))std::cout<<start<<" "<<end<<"\n";
}`, '1 6\n8 12\n');
lesson(36, 'Cyclic sort: restricted values map to target positions',
  'When the input is a permutation of 1..n, value v belongs at index v-1. Swap the current value into its target until the current index is correct, then advance. Every productive swap places at least one value, giving O(n) time and O(1) auxiliary space under this precondition. This is not a general-purpose comparison sort. Duplicates or out-of-range values require explicit handling; otherwise a naive implementation can loop or index out of bounds. Variants find missing/duplicate values by inspecting positions after placement.',
  String.raw`#include <iostream>
#include <stdexcept>
#include <utility>
#include <vector>
void cyclicSort(std::vector<int>& a) {
    for(int value:a)if(value<1||value>(int)a.size())throw std::invalid_argument("expected 1..n");
    for(int i=0;i<(int)a.size();) {
        int target=a[i]-1;
        if(target==i)++i;
        else {
            if(a[target]==a[i])throw std::invalid_argument("duplicate value");
            std::swap(a[i],a[target]);
        }
    }
}
int main() {
    std::vector<int> a {
        3,1,4,2
    };
    cyclicSort(a);
    for(int n:a)std::cout<<n<<" ";
    std::cout<<"\n";
}`, '1 2 3 4 \n');
lesson(36, 'Subsets: include/exclude backtracking',
  'For each element, branch into excluding it or including it. A path reaching index n is one subset. Push before the include branch and pop afterward to restore the caller’s state. There are 2^n subsets; copying their elements costs O(n·2^n) total output time/space, with O(n) extra recursion/path space excluding the returned results. Inputs with duplicate values need a uniqueness policy, often sorting and skipping equivalent choices. This differs from permutations, where order within the selection matters.',
  String.raw`#include <iostream>
#include <vector>
void subsets(const std::vector<int>& a,int index,std::vector<int>& path,std::vector<std::vector<int>>& out) {
    if(index==(int)a.size()) {
        out.push_back(path);
        return;
    }
    subsets(a,index+1,path,out);
    path.push_back(a[index]);
    subsets(a,index+1,path,out);
    path.pop_back();
}
int main() {
    std::vector<int> path;
    std::vector<std::vector<int>> out;
    subsets( {
        1,2,3
    }
    ,0,path,out);
    std::cout<<out.size()<<" "<<path.size()<<"\n";
}`, '8 0\n');
lesson(36, 'Topological sort: Kahn’s algorithm and cycle detection',
  'A topological order places every directed edge u→v with u before v. It exists only for a DAG. Count incoming edges; enqueue vertices with indegree zero; remove one, append it to the order and decrement its outgoing neighbors’ indegrees. If fewer than V vertices are processed, a directed cycle exists. Adjacency-list time and space are O(V+E). Several valid orders may exist. DFS finishing order is another approach, but cycle detection must distinguish active recursion-stack vertices from already completed vertices.',
  String.raw`#include <iostream>
#include <queue>
#include <stdexcept>
#include <vector>
std::vector<int> topologicalSort(const std::vector<std::vector<int>>& g) {
    std::vector<int> indegree(g.size()),order;
    for(const auto& neighbors:g)for(int v:neighbors)++indegree.at(v);
    std::queue<int> ready;
    for(int u=0;u<(int)g.size();++u)if(!indegree[u])ready.push(u);
    while(!ready.empty()) {
        int u=ready.front();
        ready.pop();
        order.push_back(u);
        for(int v:g[u])if(--indegree[v]==0)ready.push(v);
    }
    if(order.size()!=g.size())throw std::invalid_argument("directed cycle");
    return order;
}
int main() {
    for(int n:topologicalSort( {
 {
            1,2
        }
        , {
            3
        }
        , {
            3
        }
        , {}
    }
    ))std::cout<<n<<" ";
    std::cout<<"\n";
}`, '0 1 2 3 \n');
lesson(36, 'Min/max heaps and top K elements',
  'A binary min-heap keeps each parent <= its children; a max-heap reverses the inequality. A heap is not globally sorted. Its root is inspected in O(1), insert/remove-root cost O(log n), and bottom-up heap construction costs O(n). priority_queue is a max-heap by default; std::greater makes it a min-heap. To retain the K largest stream values, keep a min-heap of size at most K and discard its smallest element on overflow: O(n log K) time, O(K) storage. Define behavior for K=0 or K>n. Sorting K retained values for presentation adds O(K log K).',
  String.raw`#include <algorithm>
#include <functional>
#include <iostream>
#include <queue>
#include <vector>
std::vector<int> topK(const std::vector<int>& a,int k) {
    if(k<=0)return {};
    std::priority_queue<int,std::vector<int>,std::greater<int>> heap;
    for(int n:a) {
        heap.push(n);
        if((int)heap.size()>k)heap.pop();
    }
    std::vector<int> out;
    while(!heap.empty()) {
        out.push_back(heap.top());
        heap.pop();
    }
    std::reverse(out.begin(),out.end());
    return out;
}
int main() {
    for(int n:topK( {
        5,1,9,3,7
    }
    ,3))std::cout<<n<<" ";
    std::cout<<"\n";
}`, '9 7 5 \n');
lesson(36, 'Sliding window: maintain a reversible window invariant',
  'For a fixed-width window, add the entering element and subtract the leaving element instead of recomputing each sum. This gives O(n) time and O(1) auxiliary space. Variable-width windows need a condition that behaves monotonically as the boundaries move: for example, shrinking a sum while it exceeds a target assumes nonnegative values. Negative numbers can invalidate that reasoning. State the invariant and input assumptions before choosing a window algorithm.',
  String.raw`#include <algorithm>
#include <iostream>
#include <stdexcept>
#include <vector>
long long maxWindow(const std::vector<int>& a,int k) {
    if(k<=0||k>(int)a.size())throw std::invalid_argument("window size");
    long long sum=0;
    for(int i=0;i<k;++i)sum+=a[i];
    long long best=sum;
    for(int i=k;i<(int)a.size();++i) {
        sum+=static_cast<long long>(a[i])-a[i-k];
        best=std::max(best,sum);
    }
    return best;
}
int main() {
    std::cout<<maxWindow( {
        2,1,5,1,3,2
    }
    ,3)<<"\n";
}`, '9\n');
lesson(37, 'Implementing the seven required sorting algorithms',
  'Selection sort repeatedly selects the smallest remaining item: O(n²) comparisons, O(1) extra space, normally unstable. Bubble sort swaps adjacent inversions: O(n²) worst case, O(n) best case with early exit, stable with strict comparisons. Insertion sort grows a sorted prefix: O(n²) worst case, O(n) on sorted input, stable. Merge sort divides and merges: O(n log n), O(n) buffer, stable when equal left elements win. Quick sort partitions around a pivot: average O(n log n), worst O(n²), usually unstable; pivot selection matters. Heap sort builds a heap then moves its root to the end: O(n log n), O(1) extra space, unstable. Bucket sort distributes by a known value range; its cost depends on distribution and bucket sorting. The example below uses ten buckets for integers 0..99, O(n+k) storage and O(n²) worst-case time with insertion-sorted buckets. It is not valid for arbitrary values without a different mapping.',
  String.raw`#include <algorithm>
#include <iostream>
#include <stdexcept>
#include <vector>
using Array=std::vector<int>;
void selectionSort(Array& a) {
    for(int i=0;i<(int)a.size();++i) {
        int best=i;
        for(int j=i+1;j<(int)a.size();++j)if(a[j]<a[best])best=j;
        std::swap(a[i],a[best]);
    }
}
void bubbleSort(Array& a) {
    for(int end=(int)a.size();end>1;--end) {
        bool swapped=false;
        for(int i=1;i<end;++i)if(a[i-1]>a[i]) {
            std::swap(a[i-1],a[i]);
            swapped=true;
        }
        if(!swapped)break;
    }
}
void insertionSort(Array& a) {
    for(int i=1;i<(int)a.size();++i) {
        int value=a[i],j=i;
        while(j>0&&a[j-1]>value) {
            a[j]=a[j-1];
            --j;
        }
        a[j]=value;
    }
}
void mergeRange(Array& a,Array& buffer,int left,int right) {
    if(right-left<2)return;
    int mid=left+(right-left)/2;
    mergeRange(a,buffer,left,mid);
    mergeRange(a,buffer,mid,right);
    int i=left,j=mid,k=left;
    while(i<mid&&j<right)buffer[k++]=a[i]<=a[j]?a[i++]:a[j++];
    while(i<mid)buffer[k++]=a[i++];
    while(j<right)buffer[k++]=a[j++];
    for(k=left;k<right;++k)a[k]=buffer[k];
}
void mergeSort(Array& a) {
    Array buffer(a.size());
    mergeRange(a,buffer,0,(int)a.size());
}
void quickRange(Array& a,int left,int right) {
    if(left>=right)return;
    int pivot=a[left+(right-left)/2],i=left,j=right;
    while(i<=j) {
        while(a[i]<pivot)++i;
        while(a[j]>pivot)--j;
        if(i<=j) {
            std::swap(a[i++],a[j--]);
        }
    }
    if(left<j)quickRange(a,left,j);
    if(i<right)quickRange(a,i,right);
}
void quickSort(Array& a) {
    if(!a.empty())quickRange(a,0,(int)a.size()-1);
}
void siftDown(Array& a,int size,int root) {
    for(;;) {
        int largest=root,left=2*root+1,right=left+1;
        if(left<size&&a[left]>a[largest])largest=left;
        if(right<size&&a[right]>a[largest])largest=right;
        if(largest==root)return;
        std::swap(a[root],a[largest]);
        root=largest;
    }
}
void heapSort(Array& a) {
    int n=(int)a.size();
    for(int i=n/2-1;i>=0;--i)siftDown(a,n,i);
    for(int end=n-1;end>0;--end) {
        std::swap(a[0],a[end]);
        siftDown(a,end,0);
    }
}
void bucketSort(Array& a) {
    std::vector<Array> buckets(10);
    for(int n:a) {
        if(n<0||n>=100)throw std::invalid_argument("bucket range 0..99");
        buckets[n/10].push_back(n);
    }
    a.clear();
    for(auto& bucket:buckets) {
        insertionSort(bucket);
        a.insert(a.end(),bucket.begin(),bucket.end());
    }
}
int main() {
    for(auto sort: {
        selectionSort,bubbleSort,insertionSort,mergeSort,quickSort,heapSort,bucketSort
    }
    ) {
        Array a {
            5,2,1,2,3
        };
        sort(a);
        for(int n:a)std::cout<<n<<" ";
        std::cout<<"\n";
    }
}`, '1 2 2 3 5 \n'.repeat(7));
lesson(38, 'Linear search and explicit graph traversal',
  'Linear search examines candidates until a match: O(n) worst case and no sorted-input requirement. Binary search instead halves a sorted random-access range, O(log n) comparisons. BFS uses a queue and marks nodes when enqueued, preventing duplicate work; DFS uses recursion or a stack and tracks visited nodes to handle cycles. Adjacency-list traversals take O(V+E). Starting from one vertex only visits its reachable component; iterate over unvisited vertices to cover a disconnected graph.',
  String.raw`#include <iostream>
#include <queue>
#include <vector>
int linearSearch(const std::vector<int>& a,int value) {
    for(int i=0;i<(int)a.size();++i)if(a[i]==value)return i;
    return -1;
}
std::vector<int> bfs(const std::vector<std::vector<int>>& g,int start) {
    std::vector<int> order;
    std::vector<bool> seen(g.size());
    std::queue<int> q;
    seen.at(start)=true;
    q.push(start);
    while(!q.empty()) {
        int u=q.front();
        q.pop();
        order.push_back(u);
        for(int v:g[u])if(!seen.at(v)) {
            seen[v]=true;
            q.push(v);
        }
    }
    return order;
}
void dfs(const std::vector<std::vector<int>>& g,int u,std::vector<bool>& seen,std::vector<int>& order) {
    if(seen.at(u))return;
    seen[u]=true;
    order.push_back(u);
    for(int v:g[u])dfs(g,v,seen,order);
}
int main() {
    std::vector<std::vector<int>> g {
 {
            1,2
        }
        , {
            3
        }
        , {
            3
        }
        , {}
    };
    std::cout<<linearSearch( {
        4,8,2
    }
    ,8)<<"\n";
    for(int n:bfs(g,0))std::cout<<n<<" ";
    std::cout<<"\n";
    std::vector<bool> seen(g.size());
    std::vector<int> order;
    dfs(g,0,seen,order);
    for(int n:order)std::cout<<n<<" ";
    std::cout<<"\n";
}`, '1\n0 1 2 3 \n0 1 3 2 \n');

lesson(1, "Interview guide: learning resources and external practice", "References from the interview guide. External exercises are optional practice and do not award website assessment credit or replace the existing graded challenge. Read the problem constraints, explain your algorithm and complexity, and test edge cases before submitting on its platform.\n\nLearnCPP: https://www.learncpp.com/\n\nGeeksforGeeks — C++: https://www.geeksforgeeks.org/c-plus-plus/");

lesson(19, "Interview guide: learning resources and external practice", "References from the interview guide. External exercises are optional practice and do not award website assessment credit or replace the existing graded challenge. Read the problem constraints, explain your algorithm and complexity, and test edge cases before submitting on its platform.\n\nGeeksforGeeks — Data Structures: https://www.geeksforgeeks.org/data-structures/\n\nLeft Rotation: https://www.hackerrank.com/challenges/array-left-rotation/problem?isFullScreen=true");

lesson(28, "Interview guide: learning resources and external practice", "References from the interview guide. External exercises are optional practice and do not award website assessment credit or replace the existing graded challenge. Read the problem constraints, explain your algorithm and complexity, and test edge cases before submitting on its platform.\n\nGeeksforGeeks — OOP: https://www.geeksforgeeks.org/object-oriented-programming-in-cpp/\n\nMulti-Level Inheritance: https://www.hackerrank.com/challenges/multi-level-inheritance-cpp/problem?isFullScreen=true");

lesson(34, "Interview guide: learning resources and external practice", "References from the interview guide. External exercises are optional practice and do not award website assessment credit or replace the existing graded challenge. Read the problem constraints, explain your algorithm and complexity, and test edge cases before submitting on its platform.\n\nGeeksforGeeks — Algorithms: https://www.geeksforgeeks.org/fundamentals-of-algorithms/");

lesson(10, "Interview guide: learning resources and external practice", "References from the interview guide. External exercises are optional practice and do not award website assessment credit or replace the existing graded challenge. Read the problem constraints, explain your algorithm and complexity, and test edge cases before submitting on its platform.\n\nStrong Password: https://www.hackerrank.com/challenges/strong-password/problem?isFullScreen=true\n\nFunny String: https://www.hackerrank.com/challenges/funny-string/problem?isFullScreen=true\n\nLongest Common Prefix: https://leetcode.com/problems/longest-common-prefix/");

lesson(20, "Interview guide: learning resources and external practice", "References from the interview guide. External exercises are optional practice and do not award website assessment credit or replace the existing graded challenge. Read the problem constraints, explain your algorithm and complexity, and test edge cases before submitting on its platform.\n\nInsert A Node At A Specific Position In A LinkedList: https://www.hackerrank.com/challenges/insert-a-node-at-a-specific-position-in-a-linked-list/problem?isFullScreen=true");

lesson(23, "Interview guide: learning resources and external practice", "References from the interview guide. External exercises are optional practice and do not award website assessment credit or replace the existing graded challenge. Read the problem constraints, explain your algorithm and complexity, and test edge cases before submitting on its platform.\n\nEqual Stacks: https://www.hackerrank.com/challenges/equal-stacks/problem?isFullScreen=true\n\nBalanced Brackets: https://www.hackerrank.com/challenges/balanced-brackets/problem?isFullScreen=true");

lesson(27, "Interview guide: learning resources and external practice", "References from the interview guide. External exercises are optional practice and do not award website assessment credit or replace the existing graded challenge. Read the problem constraints, explain your algorithm and complexity, and test edge cases before submitting on its platform.\n\nRemove Element: https://leetcode.com/problems/remove-element/");

lesson(15, "Interview guide: learning resources and external practice", "References from the interview guide. External exercises are optional practice and do not award website assessment credit or replace the existing graded challenge. Read the problem constraints, explain your algorithm and complexity, and test edge cases before submitting on its platform.\n\nRectangle Area: https://www.hackerrank.com/challenges/rectangle-area/problem?isFullScreen=true");

lesson(31, "Interview guide: learning resources and external practice", "References from the interview guide. External exercises are optional practice and do not award website assessment credit or replace the existing graded challenge. Read the problem constraints, explain your algorithm and complexity, and test edge cases before submitting on its platform.\n\nDesign Twitter: https://leetcode.com/problems/design-twitter/\n\nDesign Food Rating System: https://leetcode.com/problems/design-a-food-rating-system/\n\nDesign Movie Rental System: https://leetcode.com/problems/design-movie-rental-system/");

lesson(36, "Interview guide: learning resources and external practice", "References from the interview guide. External exercises are optional practice and do not award website assessment credit or replace the existing graded challenge. Read the problem constraints, explain your algorithm and complexity, and test edge cases before submitting on its platform.\n\nPicking Numbers: https://www.hackerrank.com/challenges/picking-numbers/problem?isFullScreen=true\n\nBirthday Cake Candles: https://www.hackerrank.com/challenges/birthday-cake-candles/problem?isFullScreen=true");

lesson(39, "Interview guide: learning resources and external practice", "References from the interview guide. External exercises are optional practice and do not award website assessment credit or replace the existing graded challenge. Read the problem constraints, explain your algorithm and complexity, and test edge cases before submitting on its platform.\n\nPalindrome Number: https://leetcode.com/problems/palindrome-number/");

lesson(25, "Interview guide: learning resources and external practice", "References from the interview guide. External exercises are optional practice and do not award website assessment credit or replace the existing graded challenge. Read the problem constraints, explain your algorithm and complexity, and test edge cases before submitting on its platform.\n\nSelf Balancing Tree: https://www.hackerrank.com/challenges/self-balancing-tree/problem?isFullScreen=true\n\nFind Bottom Left Tree Value: https://leetcode.com/problems/find-bottom-left-tree-value/");

lesson(22, "Interview guide: learning resources and external practice", "References from the interview guide. External exercises are optional practice and do not award website assessment credit or replace the existing graded challenge. Read the problem constraints, explain your algorithm and complexity, and test edge cases before submitting on its platform.\n\nGroup Anagrams: https://leetcode.com/problems/group-anagrams/");

export function withGuideCoverage(units: Unit[]): Unit[] {
  return units.map(unit => {
    const extra = additions[unit.weekNumber];
    if (!extra) return unit;
    return { ...unit,
      theory: { ...unit.theory, sections: [...unit.theory.sections, ...extra.sections] },
      codeExamples: [...unit.codeExamples, ...extra.examples],
    };
  });
}

lesson(28, 'Multilevel inheritance and checked downcasting',
  'A derived object includes its base subobject; construction goes base-to-derived and destruction goes derived-to-base. This example uses a polymorphic base to check a downcast. A null result means the requested derived type is not present. The Employee class demonstrates multilevel inheritance; adding another class directly derived from Entity would form a hierarchical relationship.',
  String.raw`#include <iostream>
struct Entity {
    virtual ~Entity()=default;
};
struct Person:Entity {
    int age=30;
};
struct Employee:Person {
    int salary=100;
};
int main() {
    Employee employee;
    Entity* base=&employee;
    if(auto* p=dynamic_cast<Employee*>(base))std::cout<<p->age<<" "<<p->salary<<"\n";
    Entity plain;
    std::cout<<(dynamic_cast<Employee*>(&plain)==nullptr)<<"\n";
}`, '30 100\n1\n');
lesson(33, 'POSIX process fork and waitpid',
  'On Unix-like platforms, fork returns zero in the child, a positive child PID in the parent, and -1 on failure. The processes have separate address spaces: changes made by the child do not directly update the parent’s ordinary variables. waitpid collects the child’s exit status and prevents a zombie process. This example is single-threaded and exits the child with _exit; it is an OS-specific supplement, not a portable std::thread replacement.',
  String.raw`#include <cerrno>
#include <iostream>
#include <sys/wait.h>
#include <unistd.h>
int main() {
    pid_t child=fork();
    if(child<0)return 1;
    if(child==0)_exit(7);
    int status=0;
    pid_t result;
    do {
        result=waitpid(child,&status,0);
    }
    while(result<0&&errno==EINTR);
    if(result<0||!WIFEXITED(status))return 1;
    std::cout<<WEXITSTATUS(status)<<"\n";
}`, '7\n');
lesson(25, 'Implementing pre-order, in-order and post-order traversal',
  'The traversal names describe when the root is visited relative to its left and right subtrees. Pre-order visits root first, in-order visits it between the subtrees, and post-order visits it last. Each visits n nodes in O(n) time with O(h) recursion space for tree height h. Empty children form the base case. Only a BST’s in-order traversal is guaranteed to yield sorted keys; an arbitrary binary tree does not have that property.',
  String.raw`#include <iostream>
struct Node {
    int value;
    const Node* left=nullptr;
    const Node* right=nullptr;
};
void preorder(const Node* n) {
    if(!n)return;
    std::cout<<n->value<<" ";
    preorder(n->left);
    preorder(n->right);
}
void inorder(const Node* n) {
    if(!n)return;
    inorder(n->left);
    std::cout<<n->value<<" ";
    inorder(n->right);
}
void postorder(const Node* n) {
    if(!n)return;
    postorder(n->left);
    postorder(n->right);
    std::cout<<n->value<<" ";
}
int main() {
    Node left {
        1
    }
    ,right {
        3
    }
    ,root {
        2,&left,&right
    };
    preorder(&root);
    std::cout<<"\n";
    inorder(&root);
    std::cout<<"\n";
    postorder(&root);
    std::cout<<"\n";
}`, '2 1 3 \n1 2 3 \n1 3 2 \n');
lesson(36, 'Fast and slow pointers: executable cycle detection',
  'Represent a linked successor relation by next[i], with -1 marking the end. Advance one cursor once and the other twice. If they meet, the chain contains a cycle; if the fast cursor reaches the end, it is acyclic. This is O(n) time and O(1) auxiliary storage, excluding the input representation. The example uses checked indexing and assumes nonnegative successors identify valid entries.',
  String.raw`#include <iostream>
#include <vector>
bool hasCycle(const std::vector<int>& next) {
    if(next.empty())return false;
    int slow=0,fast=0;
    while(fast!=-1&&next.at(fast)!=-1) {
        slow=next.at(slow);
        fast=next.at(next.at(fast));
        if(slow==fast)return true;
    }
    return false;
}
int main() {
    std::cout<<hasCycle( {
        1,2,3,1
    }
    )<<" "<<hasCycle( {
        1,2,-1
    }
    )<<"\n";
}`, '1 0\n');
