import type { Unit } from '../types';
import { teachingDeepDive } from './lessonDeepDives';
import { withExampleTeachingNotes } from './exampleTeachingNotes';

/** Teaching content only. IDs, compiler challenges and progression live elsewhere. */
interface BeginnerLesson {
  overview: string;
  model: string;
  code: string;
  output: string;
  trace: string;
  pitfalls: string;
  practice: string;
  decision: [question: string, options: string[], correct: number, explanation: string];
  check: [statement: string, isTrue: boolean, explanation: string];
  alternatives: [string, string, string];
}

const lessons: Record<number, BeginnerLesson> = {
  1: {
    overview: 'A program is a set of instructions. Start by understanding how a source file becomes an executable and how statements inside main produce observable output. No previous C++ knowledge is required.',
    model: 'Source code is the text you write; a compiler checks it and translates it into a program the computer can run. Compilation and execution are separate steps: editing a source file does not change an already-built executable.\n\n#include <iostream> makes standard stream declarations available. int main() defines the entry function of a hosted C++ program. Braces delimit its body. std::cout names the standard output stream; << sends a value to that stream. A quoted string is text, whereas a number such as 2 is a numeric value. A semicolon ends an expression statement. The sequence \\n inside a string represents a newline.\n\nReturning 0 from main reports successful termination to the environment. It does not print 0. Start with sequential statements before adding functions or branches. C++ versions add language and library features; these lessons and the evaluator use C++20.',
    code: String.raw`#include <iostream>

int main() {
    std::cout << "Hello\n";
    std::cout << 2 + 3 << '\n';
    return 0;
}`,
    output: 'Hello\n5\n',
    trace: '1. The program enters main. The include directive has already been processed during the build.\n2. The first output statement writes Hello and a newline.\n3. The second statement evaluates 2 + 3, then writes 5 and a newline.\n4. return 0 ends main successfully. It adds no text to the output.\n\nSave this as main.cpp, build with g++ -std=c++20 main.cpp -o app, then run ./app on Linux or macOS. A missing semicolon is a compile error: execution cannot begin until the build succeeds.',
    pitfalls: 'C++ distinguishes upper- and lowercase names: Main is not main, and Cout is not cout. Quotes delimit text; std::cout << "2 + 3" prints the expression as text rather than calculating it.\n\nThe zero-overhead principle is a design goal: abstractions should avoid unnecessary costs relative to equivalent manual code. It does not promise every function is inlined or every program is fast. A compiler may optimize a small function, but correctness must not depend on that optimization.',
    practice: 'Predict the output after replacing 2 + 3 with "2 + 3", then run it. Answer: the second line becomes the literal text 2 + 3. Explain why returning 5 from main would affect the exit status rather than the displayed calculation.',
    decision: ['Which change prints an expression as text instead of calculating it?', ['Write "2 + 3" in quotes', 'Return 0', 'Remove the include directive', 'Rename main to Main'], 0, 'Quotes create a string literal. return changes the exit status, and removing declarations or the entry point prevents the intended program from building.'],
    check: ['Returning 0 from main automatically prints a zero.', false, 'A return value is reported to the calling environment. Output requires a stream operation such as std::cout << 0.'],
    alternatives: ['Hello\n2 + 3', 'Hello\n5\n0', '5\nHello'],
  },
  2: {
    overview: 'Variables give names to values. Learn how a type determines valid operations, how initialization supplies the first value, and how assignment changes an existing value. Prerequisite: program structure.',
    model: 'A declaration such as int count{3} introduces a name, a type and an initial value. int stores whole numbers; double stores approximate real numbers; bool represents true or false; char stores one character code unit; std::string owns a sequence of characters. The last is a library class, not a built-in numeric type.\n\nInitialization happens when an object is created. Assignment happens later to an existing object. In count = count + 2, the right side is evaluated first, then its result replaces count. A declaration is not an equation that remains connected to its initializer: int copy{count} takes the current value.\n\nUse braces to make initial state explicit. int total{} initializes total to zero; int total; inside a function does not. Brace initialization rejects many narrowing conversions, such as int n{3.5}. auto deduces a type from the initializer; auto n = 3 is int, not a value that can later change its type.',
    code: String.raw`#include <iostream>

int main() {
    int count{3};
    int copy{count};
    count = count + 2;
    double price{1.5};
    bool available{count > 0};
    std::cout << count << ' ' << copy << ' '
              << price << ' ' << available << '\n';
}`,
    output: '5 3 1.5 1\n',
    trace: '1. count begins at 3. copy is a separate integer initialized to 3.\n2. count + 2 evaluates to 5; assignment changes count to 5. copy remains 3.\n3. price holds 1.5. count > 0 evaluates to true.\n4. Without std::boolalpha, the stream prints true as 1 and false as 0. The final output is 5 3 1.5 1.',
    pitfalls: 'In C++20, reading an uninitialized automatic int has undefined behavior. A run that happens to display zero is not evidence of safety. Scope describes where a name can be used; lifetime describes when the object exists. An ordinary local object exists until its block exits, but static and dynamically allocated objects have different lifetimes.\n\nDo not memorize common byte sizes as universal guarantees. sizeof(char) is 1 C++ byte; a byte has at least 8 bits. int is at least 16 bits, while the sizes and representations of bool and floating-point types depend on the implementation.',
    practice: 'Change count after creating copy and predict both values before running. Then add std::boolalpha before printing available. Answer: copy still holds its earlier value and the boolean prints true. Try int n{3.5} separately and read the compiler diagnostic.',
    decision: ['You need an integer accumulator that starts at zero. Which declaration provides that state?', ['int total;', 'int total{};', 'auto total;', 'bool total{true};'], 1, 'Empty braces value-initialize int to zero. An uninitialized local int has no usable initial value, auto needs an initializer, and bool is not an integer accumulator.'],
    check: ['Assigning a new value to count also changes an earlier value copy initialized from count.', false, 'Value copies are independent objects. They do not track subsequent assignments to the original.'],
    alternatives: ['5 5 1.5 1', '3 3 1.5 1', '5 3 1.5 true'],
  },
  3: {
    overview: 'Types affect both storage and conversion. Learn the difference between scope, lifetime and storage duration, and use explicit casts only after checking what information might be lost. Prerequisite: variables.',
    model: 'sizeof(T) reports the storage size of T in C++ bytes. It describes a type on this implementation, not a universal hardware rule. Automatic local objects usually use a call stack, but the language specifies lifetime rather than mandating a physical location; a compiler can use registers or remove storage. Static objects persist for the program lifetime. Dynamic storage persists until released by its owner.\n\nconst prevents modification through that const-qualified object or access path. A const value may be obtained at runtime. A constexpr variable requires a constant-expression initializer; a constexpr function can be called at compile time or runtime. A consteval function requires constant evaluation.\n\nstatic_cast<int>(3.75) explicitly requests conversion to int and yields 3, truncating toward zero. Explicit syntax documents intent but does not make every value safe: converting an out-of-range floating value to int is undefined behavior. Promote an operand before integer division when a fractional result is needed.',
    code: String.raw`#include <iostream>

int main() {
    const int numerator{7};
    const int denominator{2};
    int whole = numerator / denominator;
    double fraction = static_cast<double>(numerator) / denominator;
    int truncated = static_cast<int>(fraction);
    std::cout << whole << ' ' << fraction << ' ' << truncated << '\n';
}`,
    output: '3 3.5 3\n',
    trace: '1. Both operands of numerator / denominator are int, so the division produces int 3.\n2. Casting numerator first makes the second division floating-point; denominator is converted and the result is 3.5.\n3. Converting that representable result back to int discards its fractional part, producing 3.\n4. Casting the result of integer division instead would give 3.0: the lost fraction cannot be recovered.',
    pitfalls: 'Do not use casts merely to silence a warning. Check range and signedness, then ask whether a different type expresses the value better. C-style casts combine several kinds of conversion and hide intent. static_cast does not perform runtime range checks.\n\nScope is not ownership: a raw pointer going out of scope does not automatically free a dynamically allocated object. Topics 11 and 18 explain the distinction in detail. Never write through a cast that removes constness from an object originally defined const.',
    practice: 'Compare static_cast<double>(7 / 2) with static_cast<double>(7) / 2. Answer: 3 versus 3.5 because the first expression converts only after integer division. Explain whether const int x = readValue() would necessarily be a compile-time constant: it would not.',
    decision: ['Which expression preserves the fractional part when a and b are int and b is nonzero?', ['static_cast<double>(a / b)', 'static_cast<double>(a) / b', 'static_cast<int>(a) / b', 'a / b'], 1, 'At least one operand must be floating-point before division. Converting the already-truncated result cannot restore the fraction.'],
    check: ['A constexpr function must execute at compile time on every call.', false, 'A constexpr function permits constant evaluation when the context and arguments allow it. It can also execute at runtime; consteval requires constant evaluation.'],
    alternatives: ['3.5 3.5 3', '3 3 3', '3 3.5 4'],
  },
  4: {
    overview: 'Expressions combine values with operators. Learn how parentheses control grouping and how built-in logical operators can safely avoid evaluating an invalid operation. Prerequisites: types and arithmetic.',
    model: 'Precedence determines how an expression is grouped: 2 + 3 * 4 means 2 + (3 * 4). Parentheses make another grouping explicit. Associativity settles grouping between equal-precedence operators; it does not generally specify the order in which operands execute. Avoid expressions that both modify and inspect the same variable in confusing ways.\n\n== compares values; = assigns one. Built-in && means both conditions must be true and evaluates left first. If the left is false, it skips the right. Built-in || means at least one must be true and skips the right when the left is true. ! negates a boolean.\n\nBitwise &, | and ^ operate on integer bits and do not provide logical short-circuiting. Equality has higher precedence than bitwise &: flags & mask == 0 groups as flags & (mask == 0). Write (flags & mask) == 0 when testing whether those bits are absent.',
    code: String.raw`#include <iostream>

int main() {
    int total{12};
    int count{0};
    bool valid = count != 0 && total / count > 2;
    int flags{6};
    int mask{2};
    std::cout << valid << ' ' << ((flags & mask) != 0) << '\n';
}`,
    output: '0 1\n',
    trace: '1. count != 0 is false, so && skips total / count. No division is evaluated. valid becomes false.\n2. 6 is binary 110 and 2 is binary 010. Their bitwise AND is 010, which is nonzero.\n3. The stream prints false as 0 and true as 1.\n\nReversing the guard to total / count > 2 && count != 0 would evaluate division by zero before it can check count.',
    pitfalls: 'Replacing && with & evaluates both operands and destroys the safety of the guard. Short-circuit guarantees here apply to built-in operators; custom overloaded && and || are function calls whose arguments must be evaluated.\n\nPrecedence does not mean all operands execute from left to right. Prefer separate statements for state changes. Parenthesize mixed logical and bitwise expressions so a reader can check the intended condition without memorizing the precedence table.',
    practice: 'Set count to 3: valid becomes true because 12 / 3 > 2. Set mask to 1: the bit test becomes false because 110 & 001 is zero. Explain why the denominator check must be the left operand of &&.',
    decision: ['Which condition safely guards division when denominator may be zero?', ['value / denominator > 1 && denominator != 0', 'denominator != 0 & value / denominator > 1', 'denominator != 0 && value / denominator > 1', 'value / denominator > 1'], 2, 'Built-in && checks the denominator first and skips division when it is zero. The reversed expression and bitwise & do not provide that protection.'],
    check: ['Operator precedence determines the execution order of all operands.', false, 'Precedence determines grouping. Evaluation order is a separate rule; built-in && and || specifically sequence their left operands first.'],
    alternatives: ['1 1', '0 0', 'The program divides by zero'],
  },
  5: {
    overview: 'Arithmetic is constrained by the chosen representation. Learn integer division, overflow checks and floating-point tolerances so a mathematically plausible expression also behaves correctly in C++.',
    model: 'Integer division truncates toward zero: 7 / 2 is 3 and -7 / 2 is -3. Remainder % is for integer operands and follows that quotient: -7 % 2 is -1. Division by zero is invalid; the minimum signed value divided by -1 is also invalid when the result cannot be represented.\n\nSigned overflow in C++20 is undefined behavior. Unsigned arithmetic wraps modulo its representable range, but a defined wrap can still be a bug. Check bounds before performing an operation, or use a sufficiently wide type and ensure intermediate calculations use it: 1LL * a * b promotes before multiplying.\n\nFloating-point represents many decimal fractions approximately. Equality is appropriate when exact equality is the actual requirement, but computed measurements often need a tolerance. An absolute tolerance handles values near zero; a relative tolerance scales with magnitude. Choose both for the application. Machine epsilon describes spacing near 1, not a universal error budget.',
    code: String.raw`#include <algorithm>
#include <cmath>
#include <iostream>

bool close(double a, double b) {
    constexpr double absoluteTolerance{1e-12};
    constexpr double relativeTolerance{1e-9};
    double scale = std::max(std::abs(a), std::abs(b));
    return std::abs(a - b) <= std::max(absoluteTolerance,
                                      relativeTolerance * scale);
}

int main() {
    std::cout << 7 / 2 << ' ' << -7 / 2 << ' '
              << close(0.1 + 0.2, 0.3) << '\n';
}`,
    output: '3 -3 1\n',
    trace: '1. 7 / 2 truncates 3.5 toward zero to 3; -7 / 2 truncates -3.5 to -3.\n2. The two floating expressions may differ slightly because decimal fractions are rounded.\n3. close compares their absolute difference against the larger of a small absolute allowance and a magnitude-scaled allowance. These finite, small values are within the chosen tolerance.\n4. The example prints 3 -3 1. It is a measurement-comparison demonstration, not a general financial rounding policy.',
    pitfalls: 'Do not calculate a + b and then check whether it overflowed: signed overflow has already occurred. For positive b, a > max - b is an upper-bound check; negative b needs a different lower-bound check.\n\nThe close function assumes finite values: NaN and infinity need an explicit policy. Money often needs integer smallest units or a decimal representation with a specified rounding rule. A larger tolerance can incorrectly merge different results; it must follow problem requirements.',
    practice: 'Predict -7 % 2 and 7.0 / 2, then run them. Answers: -1 and 3.5. Explain why long long result = a * b may still overflow an int multiplication before assignment, and why promoting an operand first matters.',
    decision: ['With int a and b, which expression performs their product as long long?', ['long long result = a * b;', 'long long result = 1LL * a * b;', 'int result = a * b;', 'double result = a * b;'], 1, '1LL promotes the multiplication before it happens. A wider destination alone does not change the type of the intermediate int expression. The wider result must still be representable.'],
    check: ['Defined unsigned wraparound means overflowing an unsigned counter is always logically correct.', false, 'Unsigned wraparound is a language rule. The algorithm may require a value beyond the range, in which case wrapping still gives the wrong result.'],
    alternatives: ['3 -4 1', '3.5 -3.5 1', '3 -3 0'],
  },
  6: {
    overview: 'Streams move formatted data into and out of your program. Learn to validate input and separate required output from diagnostics before applying I/O optimizations.',
    model: 'std::cin >> value attempts formatted extraction: it skips leading whitespace, reads a token appropriate for the type and records whether the operation succeeded. Check the stream, not just the resulting variable. A failed extraction leaves the stream in a failure state until it is cleared.\n\nstd::cout is standard output, the text normally compared against an exercise’s expected output. std::cerr and std::clog write diagnostics to standard error. cerr has unitbuf set by default, causing automatic flushing after output operations; this is more precise than treating all stream implementations as unbuffered.\n\nstd::getline reads a whole line, including spaces, and removes its delimiter. After >>, an unread newline can make the next getline return an empty line; deliberately consume it when appropriate. \\n writes a newline, while std::endl writes a newline and requests a flush. Flush when the receiving user or process needs the text now, rather than after every line.',
    code: String.raw`#include <iostream>
#include <sstream>

int main() {
    std::istringstream input{"4 7 bad"};
    int value{};
    int sum{};
    while (input >> value) {
        sum += value;
    }
    std::cout << sum << '\n';
}`,
    output: '11\n',
    trace: 'The string stream supplies deterministic sample input using the same extraction syntax as cin.\n1. Reading 4 succeeds, so sum becomes 4.\n2. Reading 7 succeeds, so sum becomes 11.\n3. Reading bad into int fails. The while condition is false and its body does not execute.\n4. Output is 11. This demonstrates validated token reading; a production parser may need to distinguish malformed input from normal end-of-file.',
    pitfalls: 'Do not loop with while (!cin.eof()): end-of-file is generally discovered by an attempted read, so this pattern can process stale data. Prefer while (cin >> value). Do not print prompts or debugging text to stdout when the problem requires only an answer.\n\nsync_with_stdio(false) permits independent C and C++ stream buffering, and cin.tie(nullptr) removes automatic cout flushing before input. Apply them before I/O and avoid casually mixing printf/scanf with streams afterward. Interactive prompts may then need std::flush. Performance differences depend on workload; no fixed speedup is guaranteed.',
    practice: 'Replace bad with 9. Answer: 20 because all three tokens are read. Then use input containing only bad: the sum stays zero. Explain how checking extraction prevents using a failed input as though it were valid.',
    decision: ['Which loop processes only successfully read integers?', ['while (!input.eof()) { input >> value; use(value); }', 'while (input >> value) { use(value); }', 'while (true) { use(value); }', 'if (value) { input >> value; }'], 1, 'The extraction is the condition. Its body runs only after a successful read, avoiding stale values on failure or end-of-file.'],
    check: ['std::endl writes a newline and also requests a stream flush.', true, 'Use a newline when only line separation is needed; use a flush when timely delivery is required. The cost of flushing depends on the stream and environment.'],
    alternatives: ['18', '0', 'The loop never terminates'],
  },
  7: {
    overview: 'A conditional chooses which statements execute. Learn branch order, boundary cases and switch control flow before studying compiler branch optimizations.',
    model: 'An if statement evaluates a condition and runs its body only when that condition is true. In an if / else if / else chain, the first matching branch runs and later branches are skipped. Order specific cases before broader ones: score >= 90 must come before score >= 60 when both are possible.\n\nUse braces even for a short body so later edits cannot silently change which statements are conditional. == compares while = assigns. A nonzero integer converts to true, but spelling out the intended comparison makes the condition easier to review.\n\nA switch selects a case using an integral or enumeration value. Once execution enters a case, it continues until break, return or the end of the switch. [[fallthrough]] documents intentional continuation; it does not stop it. A default branch handles values without a listed case. C++17 if (initializer; condition) limits the initialized name to the whole if/else statement.',
    code: String.raw`#include <iostream>

int main() {
    int score{85};
    if (score >= 90) {
        std::cout << "A ";
    } else if (score >= 60) {
        std::cout << "Pass ";
    } else {
        std::cout << "Retry ";
    }
    switch (2) {
        case 1: std::cout << "one"; break;
        case 2: std::cout << "two"; break;
        default: std::cout << "other";
    }
    std::cout << '\n';
}`,
    output: 'Pass two\n',
    trace: '1. 85 >= 90 is false, so the A branch is skipped.\n2. 85 >= 60 is true, so Pass and a space are written. The final else is skipped.\n3. switch selects case 2 and writes two. Its break exits the switch.\n4. A newline completes the output.\n\nAt score 90, the first branch wins; at 60, the second wins; at 59, the final else wins. These boundary checks reveal accidental > versus >= mistakes.',
    pitfalls: 'Two independent if statements can both execute; an if/else chain selects one branch. An else attaches to the nearest unmatched if, another reason to use braces.\n\nA compiler may implement a switch with a jump table, comparisons or another strategy. Neither a jump table nor a fixed timing is required by C++. [[likely]] is a hint for optimization, not a promise about runtime outcomes. Choose understandable conditions before trying to predict hardware branch behavior.',
    practice: 'Try scores 90, 60 and 59 and predict the selected branch first. Remove the break in case 2 and observe that default also executes. Answer: switch cases do not create an implicit break.',
    decision: ['Why should score >= 90 precede score >= 60 in a grading chain?', ['The compiler requires larger numbers first', 'A chain runs its first matching branch', 'All branches execute anyway', 'else can only follow >='], 1, 'A score of 95 satisfies both tests. Putting the broader pass condition first would prevent the A branch from being reached.'],
    check: ['Every switch is guaranteed to compile into a jump table.', false, 'The language defines which statements execute. The compiler selects an implementation based on the cases, target and optimization settings.'],
    alternatives: ['A two', 'Pass twoother', 'Retry two'],
  },
  8: {
    overview: 'Loops repeat work while state changes toward a stopping condition. Learn to trace initialization, condition, body and update so you can prevent off-by-one errors and nontermination.',
    model: 'A for loop runs its initialization once, checks its condition before each iteration, executes its body, then executes its update. for (int i = 0; i < n; ++i) visits 0 through n - 1. The half-open interval [0, n) is convenient because it contains exactly n indices and is empty when n is zero.\n\nA while loop checks its condition first and can run zero times. A do-while checks afterward and runs at least once when reached normally. Use for for a clear progression and while when an event or changing state determines completion.\n\nbreak leaves the innermost loop; continue skips its remaining body. In a for loop, continue still proceeds to the update. In a while loop, any update written later in the body is skipped, which can cause an infinite loop. Range-for visits each element of a range; an auto value is a copy, while auto& can modify the original element.',
    code: String.raw`#include <iostream>

int main() {
    int sum{};
    for (int i{0}; i < 5; ++i) {
        if (i == 2) {
            continue;
        }
        sum += i;
    }
    std::cout << sum << '\n';
}`,
    output: '8\n',
    trace: 'Track i and sum at the end of each body:\ni=0: add 0, sum=0.\ni=1: add 1, sum=1.\ni=2: continue skips addition; the for update still advances i to 3.\ni=3: add 3, sum=4.\ni=4: add 4, sum=8.\ni=5: the condition is false, so there is no sixth body execution.',
    pitfalls: 'Using i <= n for a container of n elements accesses index n, which is outside the valid element range. An unsigned reverse loop with i >= 0 never becomes negative; use a reverse iterator or a carefully written decrement-from-size loop.\n\nDo not insert into or erase from a container during range-for without understanding iterator invalidation. Tail-call optimization for recursion is not guaranteed by C++; use an explicit loop when bounded stack usage is a requirement.',
    practice: 'Replace continue with break. Answer: the loop stops at i=2 and sum is 1. Then change the bound from 5 to 0: sum stays zero because a for condition is tested before the body. Write down which state change guarantees termination.',
    decision: ['What does continue do in a for loop?', ['Ends the whole program', 'Skips the remaining body, then runs the update', 'Skips the update and condition', 'Restarts initialization'], 1, 'continue goes to the next iteration through the for update and condition. break exits the loop, and initialization runs only once.'],
    check: ['A while loop can execute zero times.', true, 'Its condition is tested before the first body execution. do-while tests after its body and therefore runs at least once when reached normally.'],
    alternatives: ['10', '1', '7'],
  },
  9: {
    overview: 'Functions package a task behind named parameters and a result. Learn whether a parameter is a new value or an alias of caller state before using references for efficiency.',
    model: 'A declaration gives a function’s name, parameter types and return type. A definition adds its body. Calling a function evaluates arguments, initializes parameters, runs the body and returns control to the caller. Returning a value supplies a result; it does not automatically change an argument.\n\nAn int parameter is a separate value. An int& parameter is a reference, another name for the caller’s object; writes affect that object. A reference must bind to a suitable object and cannot later be reseated. Assignment through it changes the referred-to object. const T& permits observation without a copy, but cannot keep the object alive indefinitely or make every alias immutable.\n\nPrefer value parameters for inexpensive scalars and const references for larger read-only objects. Use mutable references only when modification is part of the interface. Class methods, introduced in Topic 15, have an implicit object (this); static methods have no implicit object. Return type alone cannot distinguish overloads.',
    code: String.raw`#include <iostream>

void changeCopy(int value) {
    value += 5;
}

void changeOriginal(int& value) {
    value += 5;
}

int main() {
    int score{10};
    changeCopy(score);
    std::cout << score << ' ';
    changeOriginal(score);
    std::cout << score << '\n';
}`,
    output: '10 15\n',
    trace: '1. score starts at 10. changeCopy receives a separate int initialized to 10.\n2. Its parameter becomes 15, but that local parameter disappears when the call returns. score is still 10.\n3. changeOriginal binds value to score. value += 5 therefore changes score itself to 15.\n4. The two observations print 10 15. The distinction is parameter binding, not a different addition operation.',
    pitfalls: 'Never return a reference or pointer to a normal local object: it is destroyed on return. A reference can dangle even though it has no valid null state. A const reference can still refer to an object mutated through another non-const alias.\n\nReference syntax & in a declaration means binding; & in an expression takes an address. Document whether a function mutates input instead of selecting references solely because they seem faster.',
    practice: 'Change changeCopy to return value and assign score = changeCopy(score). Answer: the returned result can update score because the caller explicitly assigns it. Compare this visible data flow with the reference-based update.',
    decision: ['A function must modify a caller-owned int directly. Which parameter expresses that?', ['int value', 'const int& value', 'int& value', 'const int value'], 2, 'int& aliases the caller’s modifiable int. Value parameters are separate objects; const int& prevents modification through that parameter.'],
    check: ['A reference parameter can remain safe after the referenced object has been destroyed.', false, 'An alias does not own or automatically extend every referenced object’s lifetime. Using it after destruction is invalid.'],
    alternatives: ['15 20', '10 10', '15 15'],
  },
  10: {
    overview: 'Strings own text; views borrow it. Learn indexing, searching and substrings first, then reason about who keeps the characters alive when avoiding copies.',
    model: 'std::string owns a sequence of char values. size is the number of characters stored, empty tests whether it has none, += appends, and at checks an index. For ordinary character access, require index < size; the special terminator at size is not a normal text character to modify.\n\nfind returns the position of a match or std::string::npos when absent. Check that sentinel before using the result as an index. substr(pos, count) creates an owning string containing up to count characters starting at pos. It is a copy, not a connection to the original.\n\nstd::string_view is a non-owning range of characters. Creating a view need not copy the text, but the source must remain alive and its storage must remain valid. A substring view is not necessarily null-terminated. Small string optimization commonly stores short text inside the string object itself, wherever that object lives; the threshold and layout are implementation details.',
    code: String.raw`#include <iostream>
#include <string>
#include <string_view>

int main() {
    std::string name{"Ada Lovelace"};
    auto space = name.find(' ');
    if (space != std::string::npos) {
        std::string first = name.substr(0, space);
        std::string_view last{name.data() + space + 1,
                              name.size() - space - 1};
        std::cout << first << '|' << last << '\n';
    }
}`,
    output: 'Ada|Lovelace\n',
    trace: '1. name owns 12 characters. The space is at index 3.\n2. substr(0, 3) copies indices 0, 1 and 2 into first, which owns Ada.\n3. last borrows from index 4 for 8 characters, giving Lovelace. name stays alive and is not changed while last is used.\n4. Output combines the owning substring and the borrowed view. Without a space, the condition would skip both operations.',
    pitfalls: 'Returning a view into a local string creates a dangling view. Changing a string can reallocate its buffer and invalidate existing views; even without reallocation, edits change what a view observes. An owning substring avoids these lifetime dependencies.\n\nstd::string size counts char code units, not necessarily human-visible characters: UTF-8 characters may occupy several bytes. A view’s data() cannot safely be passed to an API expecting a null-terminated string unless that additional requirement is satisfied.',
    practice: 'Use the name Ada with no space and explain why the body is skipped. Then replace first with a copy of the entire name and modify name[0]: the copy is unchanged. Explain which object owns last’s characters.',
    decision: ['A function needs to return text built in a local std::string. Which result safely owns the text?', ['std::string_view pointing into that local string', 'const char* into that local string', 'std::string returned by value', 'A reference to that local string'], 2, 'An owning string result keeps its characters alive independently. Views, pointers and references into the destroyed local would dangle.'],
    check: ['std::string::find returns std::string::npos when no match exists.', true, 'npos is the absence sentinel. Test it before calculating substring offsets or indexing.'],
    alternatives: ['Ada Lovelace|Lovelace', 'Ada| Lovelace', 'Lovelace|Ada'],
  },
  11: {
    overview: 'Pointers refer to objects rather than containing those objects. Learn address-of, dereferencing, lifetime and array bounds before handling dynamically allocated memory.',
    model: 'For int value{4}, &value produces a pointer to value. int* pointer = &value stores that pointer. *pointer accesses the referred-to int; assigning *pointer = 9 changes value. pointer itself and value are distinct objects. A pointer can be reassigned to another object or hold nullptr to represent no object.\n\nA pointer is not proof of ownership or lifetime. Before dereferencing, establish that it refers to a live object of the correct type. A non-null pointer can still dangle after its target is destroyed. Local automatic objects are commonly placed on a stack; new creates an object in dynamic storage. delete destroys and releases a scalar allocation, while delete[] matches array new.\n\nPointer arithmetic is defined within an array and up to its one-past endpoint. Adding 1 moves to the next element, scaled by the element type. You may compare or subtract pointers within their valid common array range; you must not dereference the one-past pointer or walk into unrelated objects.',
    code: String.raw`#include <iostream>

int main() {
    int values[]{10, 20, 30};
    int* first = values;
    int* second = first + 1;
    *second = 25;
    int* end = first + 3;
    std::cout << *first << ' ' << values[1] << ' '
              << (end - first) << '\n';
}`,
    output: '10 25 3\n',
    trace: '1. The array contains three live int objects. In this initialization, values converts to a pointer to its first element.\n2. first + 1 points to values[1], not one byte after first.\n3. *second = 25 updates that second element.\n4. end is the valid one-past pointer. Subtracting first yields 3 elements. end is never dereferenced.\n5. The observed values are 10, 25 and the distance 3.',
    pitfalls: 'A pointer to a local object becomes dangling when the object’s scope exits. delete does not automatically clear every alias. Never mix new with free, malloc with delete, or new[] with scalar delete. These pairings are required by the language, not by a universal allocator metadata layout.\n\nVirtual addresses in a typical process are not raw physical RAM addresses. Allocation is not universally zero cost or a syscall on every request. Prefer containers or smart pointers for ownership once introduced; keep raw pointers for clearly documented borrowing.',
    practice: 'Explain why *(first + 2) is valid but *(first + 3) is not. Answers: the first accesses the third element, while the second attempts to read past the array. Draw arrows from first and second to the actual objects they refer to.',
    decision: ['Which pointer may be formed but must not be dereferenced for a three-element array?', ['A pointer to its first element', 'A pointer to its second element', 'A pointer one past its final element', 'Any non-null pointer'], 2, 'The one-past pointer supports bounds and iteration. It does not refer to an element to read or write. Non-null alone does not establish validity.'],
    check: ['A non-null pointer necessarily points to a live object.', false, 'A pointer may still contain a former address after the target’s lifetime ends. Such a pointer is dangling, and dereferencing it is invalid.'],
    alternatives: ['10 20 3', '10 25 12', '25 20 3'],
  },
  12: {
    overview: 'Building, running and terminating are distinct stages. Learn to identify which stage failed and understand how automatic and static objects participate in normal execution.',
    model: 'A build first preprocesses includes and macros, checks and translates each translation unit, assembles object files and links their symbols into an executable. A syntax/type error is a compilation failure. An undefined reference is usually a linking failure. A valid build can still have invalid runtime behavior; compilation is not a proof of correctness.\n\nA hosted program uses main as its entry function, optionally with argc and argv for command-line arguments. Global/static initialization may happen before main, and local automatic objects are created when their declarations execute. Returning from main normally destroys its locals and performs normal termination, including registered static cleanup. Reaching the end of main is equivalent to returning 0.\n\nA declaration in a header tells another source file how a function can be called; a single definition in a .cpp supplies its body. Header guards prevent repeat inclusion in one translation unit, not duplicate ordinary definitions across files.',
    code: String.raw`#include <iostream>

struct Marker {
    Marker() { std::cout << "created "; }
    ~Marker() { std::cout << "destroyed\n"; }
};

int main() {
    Marker local;
    std::cout << "running ";
    return 0;
}`,
    output: 'created running destroyed\n',
    trace: '1. The executable has already been built before this trace starts.\n2. Entering main reaches the declaration of local. Its constructor prints created and a space.\n3. The next statement prints running and a space.\n4. Returning from main leaves the local’s scope and calls its destructor, which prints destroyed and a newline.\n\nThe struct syntax is a preview; Topic 15 develops constructors and destructors. The important distinction here is that cleanup follows normal object lifetime, rather than requiring a final manual print statement.',
    pitfalls: 'Do not assume every exit path performs normal cleanup. std::exit does not unwind main’s automatic locals; abort, forced process termination and some termination paths can skip destructors. RAII guarantees apply to normal scope exit and stack unwinding to a handler, not every possible process shutdown.\n\nCross-file dynamic initialization dependencies are delicate. A function-local static can defer construction until first use, but dependencies and destruction order still require thought. An OS entry symbol, physical memory layout and syscall names are platform implementation details.',
    practice: 'Build a file with a missing semicolon: classify the error as compilation. Declare int helper(); and call it without providing a definition: classify the undefined reference as linking. Restore the example and predict when destroyed appears.',
    decision: ['A call has a valid declaration, but no definition is supplied to the build. Which stage normally reports an undefined reference?', ['Preprocessing', 'Linking', 'The first loop iteration', 'Input parsing'], 1, 'The caller can be type-checked from the declaration. Linking must resolve the referenced function body and fails when it cannot find it.'],
    check: ['A successful compilation guarantees that a program has no runtime bugs.', false, 'Runtime inputs, lifetime mistakes, out-of-bounds access and logic errors can all remain in a program that builds successfully.'],
    alternatives: ['running created destroyed', 'created running', 'destroyed created running'],
  },
  13: {
    overview: 'Namespaces group related names and prevent collisions. Learn qualified names before studying how unqualified calls can find functions associated with argument types.',
    model: 'Two libraries can each define a function called format. A namespace distinguishes them: text::format and numbers::format are different names. namespace text { ... } groups declarations, and :: selects a name from that scope. Nested namespaces can express a hierarchy, while namespace aliases shorten a long qualification.\n\nusing text::format introduces a particular name for lookup. using namespace text makes a whole namespace participate in lookup and may create ambiguities, especially in a shared header. An unnamed namespace gives internal linkage for appropriate file-local helpers.\n\nArgument-dependent lookup, or ADL, also considers namespaces associated with argument types for an unqualified function call. If a value has type drawing::Point, a call print(value) can find drawing::print. A qualified call drawing::print explicitly chooses that namespace. The generic swap idiom using std::swap; swap(a, b); allows a type-specific overload while retaining a standard fallback.',
    code: String.raw`#include <iostream>

namespace drawing {
    struct Point { int x; };

    void print(const Point& point) {
        std::cout << point.x << '\n';
    }
}

int main() {
    drawing::Point point{7};
    print(point);
}`,
    output: '7\n',
    trace: '1. Point and print are declared inside drawing, not at global scope.\n2. main names drawing::Point explicitly when creating point.\n3. print(point) is unqualified. Because the argument’s type belongs to drawing, ADL considers drawing::print and finds a matching function.\n4. That function reads point.x and prints 7. If the argument were int, drawing would not be associated with it.',
    pitfalls: 'A namespace is a grouping of names, not an object you instantiate. Do not add arbitrary declarations to namespace std. Avoid broad using directives in headers because their effects reach every source file including that header.\n\nADL does not search every namespace, and lookup can be affected by other declarations with the same name. Start with explicit qualification when learning; use customization idioms deliberately rather than assuming an unqualified call can discover any function.',
    practice: 'Change the call to drawing::print(point): the output remains 7 because qualification selects the same function directly. Explain why print(7) would not find this overload through ADL and would not accept an int as a Point.',
    decision: ['Why can the unqualified print(point) find drawing::print?', ['All namespaces are always searched', 'The argument type associates the call with drawing', 'iostream imports every function', 'Namespaces are runtime objects'], 1, 'ADL considers namespaces associated with argument types. It does not search arbitrary namespaces or import all declarations.'],
    check: ['Putting using namespace std in a shared header can affect name lookup in its includers.', true, 'A using directive in a header is seen by source files that include it and can introduce unexpected ambiguities. Prefer explicit names or narrowly scoped declarations.'],
    alternatives: ['drawing::Point', '0', 'It prints nothing because the call is unqualified'],
  },
  14: {
    overview: 'Exceptions transfer control from an operation that cannot finish to a handler. Learn what happens to local objects and distinguish cleanup guarantees from promises about unchanged state.',
    model: 'throw reports a failure with an exception object. A matching catch handles it; code after throw in the interrupted block is skipped. Catch standard exception types by const reference to avoid a copy and preserve derived information. std::exception provides what() for a diagnostic message.\n\nWhen an exception travels to a handler, stack unwinding destroys fully constructed automatic objects in the exited scopes. Resource-owning objects can therefore release files, memory or locks. This is the foundation of RAII; a constructor that fails must rely on already-constructed members to clean up their own resources.\n\nThe basic guarantee preserves invariants and avoids leaks, possibly changing state. The strong guarantee additionally leaves state unchanged on failure. A no-throw guarantee says an operation will not fail by throwing. noexcept specifies that an exception must not escape a function; escaping causes std::terminate, rather than making the operation unable to fail.',
    code: String.raw`#include <iostream>
#include <stdexcept>

struct Guard {
    ~Guard() { std::cout << "cleanup "; }
};

int main() {
    try {
        Guard guard;
        throw std::runtime_error{"invalid input"};
        std::cout << "unreachable ";
    } catch (const std::exception& error) {
        std::cout << error.what() << '\n';
    }
}`,
    output: 'cleanup invalid input\n',
    trace: '1. guard is constructed in the try block.\n2. throw interrupts that block; unreachable is not printed.\n3. Before the matching handler starts, guard is destroyed during unwinding and prints cleanup.\n4. The catch binds a const reference to the exception and prints invalid input. Cleanup and error handling are separate responsibilities.',
    pitfalls: 'A destructor should not let exceptions escape, especially during unwinding. An exception escaping a non-throwing function calls terminate; whether relevant unwinding happens before termination is not universally specified. Do not promise all resources will be cleaned up on that path.\n\nA vector may copy instead of using a potentially throwing move when copying is available, helping preserve its old state. Move-only types can still be moved even if their move may throw; the exception guarantee then depends on the operation and type. noexcept is not a universal prerequisite for movement.',
    practice: 'Move the throw before the Guard declaration: cleanup is no longer printed because guard was never constructed. Explain which already-created objects must be destroyed when the original try block exits through the handler.',
    decision: ['Which guarantee promises that a failed operation leaves the caller-visible state unchanged?', ['Basic guarantee', 'Strong guarantee', 'A noexcept annotation alone', 'No guarantee'], 1, 'The strong guarantee adds unchanged state to valid state and resource safety. noexcept controls escaping exceptions; it does not by itself provide rollback.'],
    check: ['A potentially throwing move constructor prevents std::vector from ever moving that type.', false, 'When copying is unavailable, vector can use a throwing move. Guarantees in that case are weaker or conditional; noexcept helps but is not an absolute movement requirement.'],
    alternatives: ['invalid input cleanup', 'cleanup unreachable invalid input', 'invalid input'],
  },
  15: {
    overview: 'A class defines a type combining state and operations. Learn how objects are constructed, how access control protects their rules, and how member ownership determines copying and destruction.',
    model: 'A class is a type definition; an object is an instance with its own data. A struct and a class have the same capabilities, but their default member and base access differs: public for struct, private for class. Public methods form an interface; private members hide implementation and protect invariants such as a nonnegative balance.\n\nA constructor establishes initial state. Its member initializer list initializes members before its body executes, in the members’ declaration order. A destructor handles end-of-lifetime cleanup; automatic objects are destroyed at scope exit. A const member function cannot modify ordinary members through this, though mutable members and separately pointed-to objects need special care. A static member belongs to the class rather than each instance.\n\nThe compiler normally copies each member using that member’s own copy operation, not by blindly copying bytes. A raw owning pointer therefore needs an explicit ownership policy. The Rule of Three/Five is a design guideline to consider related special members; the Rule of Zero delegates ownership to appropriate standard members.',
    code: String.raw`#include <iostream>

class Counter {
    int value;

public:
    explicit Counter(int initial) : value{initial} {}
    void increment() { ++value; }
    int get() const { return value; }
};

int main() {
    Counter first{2};
    Counter second = first;
    first.increment();
    std::cout << first.get() << ' ' << second.get() << '\n';
}`,
    output: '3 2\n',
    trace: '1. first’s constructor initializes its private value to 2.\n2. The generated copy constructor initializes second.value from first.value, making a separate int with value 2.\n3. first.increment changes only first’s member to 3.\n4. Both get calls observe state without modifying it, producing 3 2.\n5. At scope exit second is destroyed before first. Neither needs custom cleanup because int owns no external resource.',
    pitfalls: 'Do not add setters merely to expose every private field: validate updates through meaningful operations. A const member is initialized during construction, not assigned later in the body. An explicit single-argument constructor avoids unintended implicit conversions.\n\nA class that owns a raw allocation and deletes it must handle or prohibit copying to avoid double deletion. Standard owning members such as string and vector already manage their copies. The supplemental lessons develop constructor variants, nested classes, friends, static members and enum class; friend grants selected access, not ownership or inheritance.',
    practice: 'Make get non-const and try calling it on const Counter fixed{2}: the call should fail to compile. Restore const. Explain why making value private keeps callers from bypassing the class’s intended operations.',
    decision: ['Why do first and second hold independent counts?', ['Private data is shared automatically', 'The generated copy copies the int member into a separate object', 'get resets the counter', 'Constructors disable copying'], 1, 'Memberwise copying creates a separate int value. Some member types deliberately share resources, but int value semantics do not.'],
    check: ['class and struct differ in default access, rather than in whether they can have constructors or methods.', true, 'Both support the same major class features. Default access is private for class and public for struct, including their default base access.'],
    alternatives: ['3 3', '2 2', '2 3'],
  },
  16: {
    overview: 'Compare language models without assuming either language has a fixed speed or storage layout. Focus on C++ value semantics and deterministic resource ownership versus Java references and managed memory.',
    model: 'A C++ object can be stored directly inside another object or container and copied using its type’s copy semantics. If the type’s members are independent values, copying gives independent state. A C++ reference or pointer can instead refer to the same object; the variable’s type determines which relationship you establish.\n\nJava object variables generally hold references. Assigning one such variable to another copies the reference, so both can observe the same object. Java primitive values still have value semantics. JVM optimizations can eliminate or transform allocations, so a language-level comparison is not a guarantee about physical heap locations.\n\nC++ RAII connects a resource’s release to an owning object’s destruction. Java uses garbage collection for managed memory and constructs such as try-with-resources for timely resource closure. GC is not a substitute for closing a file, and deterministic lifetime is not a promise of constant-time cleanup. C++ supports multiple class inheritance; Java has single class inheritance and multiple interface implementation.',
    code: String.raw`#include <iostream>

struct Point { int x; };

int main() {
    Point first{1};
    Point copy = first;
    Point& alias = first;
    alias.x = 9;
    std::cout << first.x << ' ' << copy.x << '\n';
}`,
    output: '9 1\n',
    trace: '1. first contains x=1.\n2. copy contains its own x=1, created by memberwise value copying.\n3. alias is another name for first. Setting alias.x to 9 changes first.x.\n4. copy remains 1, so the output is 9 1.\n\nThe comparable Java assignment Point copy = first would ordinarily create another reference to the same Point object, rather than copying its field into a second object.',
    pitfalls: 'Do not equate all C++ assignment with deep copying: pointers copy addresses, and shared_ptr copies shared ownership. Likewise, not every Java operation involves a heap allocation or a GC pause. Performance depends on representation, implementation and workload.\n\nC++ destructors run at defined lifetime boundaries on normal exit, but their work can allocate, lock or perform I/O. There is no exact-microsecond guarantee. Both languages require explicit reasoning about resource ownership and concurrency.',
    practice: 'Replace Point copy = first with Point& copy = first. Answer: both printed fields become 9 because both names now alias one object. Describe one advantage and one risk of shared mutable identity compared with independent values.',
    decision: ['Which C++ declaration gives another name to the same Point object?', ['Point copy = first;', 'Point& alias = first;', 'Point other{first.x};', 'const int x = first.x;'], 1, 'A reference binds to the existing object. The other declarations initialize separate value objects.'],
    check: ['RAII guarantees that cleanup always takes a fixed amount of time.', false, 'RAII specifies when destruction occurs on normal lifetime paths. The destructor’s runtime cost depends on the cleanup it performs.'],
    alternatives: ['9 9', '1 1', '1 9'],
  },
  17: {
    overview: 'The STL connects storage to generic operations through iterators. Learn the container–range–algorithm workflow before thinking about its implementation efficiency.',
    model: 'A container owns or organizes elements: vector is a resizable sequence, set stores unique keys and map associates keys with values. An iterator identifies a position in a container. begin points to the first element; end is one past the last, and is also begin when the range is empty.\n\nAlgorithms commonly receive a half-open range [first, last): first is included, last is excluded. find reads through that range and returns the matching iterator or last. sort rearranges a range whose iterators support random access. The algorithm does not automatically fit every container: list iterators support traversal but not constant-time jumps, so list has its own sort member.\n\nA callable customizes behavior, such as a comparison or predicate. A lambda defines a small callable at the use site. Its capture list specifies which surrounding values it stores or borrows. The compiler can specialize template algorithms for that callable, but inlining and a particular speedup are optimization choices, not language guarantees.',
    code: String.raw`#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{4, 1, 3};
    std::sort(values.begin(), values.end());
    auto found = std::find(values.begin(), values.end(), 3);
    if (found != values.end()) {
        std::cout << values.front() << ' ' << *found << '\n';
    }
}`,
    output: '1 3\n',
    trace: '1. vector owns the sequence [4, 1, 3].\n2. sort receives its full range and rearranges the elements to [1, 3, 4].\n3. find compares 1, then 3, and returns an iterator to the second element.\n4. The end check establishes that it is safe to dereference found. front is 1 and *found is 3.\n\nSearching for 8 would return end; the body would then be skipped.',
    pitfalls: 'Never dereference end, and never reuse an iterator after an invalidating operation. An iterator’s capabilities matter: random access, bidirectional traversal and forward-only traversal are different contracts.\n\nAlgorithms such as remove rearrange values but cannot change container size on their own. A comparator must consistently define a strict weak ordering; using <= instead of < is not a valid sorting comparator. Topic 27 develops these contracts and captures, while Domain II covers each container.',
    practice: 'Search for a value that is absent and explain why no dereference occurs. Then sort descending with a lambda returning a > b. Answer: values become [4, 3, 1], while find still locates 3.',
    decision: ['What must you check before dereferencing the result of std::find?', ['That the container was sorted', 'That the result is not the supplied end iterator', 'That capacity equals size', 'That the value is positive'], 1, 'find uses the end iterator to signal absence. Sorting is not required for linear find, but the returned iterator must refer to an element before it is dereferenced.'],
    check: ['Every STL algorithm works with every STL container’s iterators.', false, 'Each algorithm has iterator and element requirements. std::sort requires random-access iterators; std::list provides a member sort for its different structure.'],
    alternatives: ['4 3', '1 4', '3 1'],
  },
  18: {
    overview: 'Ownership answers who must release a resource. Learn exclusive ownership first, then shared ownership and weak observation, keeping ownership separate from access and thread safety.',
    model: 'A raw pointer lets you access an object but does not say who must destroy it. std::unique_ptr expresses one owning handle. make_unique constructs an object and returns its owner. The owner deletes its object on destruction, including ordinary early returns and unwinding to a handler. unique_ptr cannot be copied; moving transfers ownership and leaves the source empty.\n\nstd::move does not itself move a resource. It changes an expression’s value category so a suitable move operation can be selected. For unique_ptr that move transfers the pointer. Other types have their own moved-from rules; do not assume every moved-from value is empty.\n\nshared_ptr represents shared ownership, releasing the object when the last strong owner is gone. weak_ptr observes that shared lifetime without increasing the strong count; lock returns a temporary shared owner if the object still exists. Cycles of strong owners can keep objects alive indefinitely. Prefer unique ownership unless the relationship truly requires sharing.',
    code: String.raw`#include <iostream>
#include <memory>
#include <utility>

int main() {
    auto first = std::make_unique<int>(42);
    auto second = std::move(first);
    std::cout << static_cast<bool>(first) << ' '
              << static_cast<bool>(second) << ' ' << *second << '\n';
}`,
    output: '0 1 42\n',
    trace: '1. make_unique creates the int 42 and gives first exclusive ownership.\n2. std::move enables unique_ptr’s move constructor. second becomes the owner and first becomes empty.\n3. The boolean conversions report empty first as 0 and owning second as 1. Only second is dereferenced, yielding 42.\n4. second releases the int on scope exit. The empty first has nothing to release.',
    pitfalls: 'Do not construct two separate shared_ptr control blocks from the same raw pointer; both may try to destroy it. Do not call delete on get(), which only borrows access from the owner. Avoid release() unless ownership is being transferred to an API that will take responsibility.\n\nTypical pointer/control-block layouts and make_shared allocation strategies are implementation details. Reference-count safety does not make the pointed-to object safe for concurrent mutation. RAII cannot promise cleanup after forced termination, and shared ownership cycles still require a weak edge or another design.',
    practice: 'Try auto third = second in a separate compile experiment: copying unique_ptr is rejected. Draw ownership arrows before and after the move. Explain why first cannot safely be dereferenced afterward.',
    decision: ['One component exclusively owns a dynamically allocated object. Which handle states that policy?', ['std::unique_ptr<T>', 'A raw T* with no documented policy', 'std::weak_ptr<T>', 'A reference to a local that already ended'], 0, 'unique_ptr owns and releases the object and prohibits ownership copying. Raw pointers and references do not state ownership; weak_ptr only observes shared ownership.'],
    check: ['std::move by itself transfers a resource to another object.', false, 'It enables move-aware overload resolution. A selected constructor or assignment performs the transfer; merely writing std::move(x) does not transfer anything.'],
    alternatives: ['1 1 42', '1 0 42', '0 1 0'],
  },
  19: {
    overview: 'Sequential containers store values in order. Learn how fixed-size array differs from resizable vector, and distinguish constructed elements from reserved storage. Prerequisites: loops, object lifetime and STL ranges.',
    model: 'std::array<T, N> contains exactly N elements inside the array object; N is part of its type. std::vector<T> owns a contiguous sequence whose length can change at runtime. Both support indexing and random-access iterators. Choose array when the length is fixed and vector for a general growing sequence.\n\nvector::size counts constructed elements. capacity counts how many elements its storage can hold before another allocation is needed. reserve requests capacity of at least a number without creating elements. resize changes size, adding initialized elements or destroying trailing ones. Indexing is valid only for existing elements, even when extra capacity is reserved. at checks bounds and throws on an invalid index.\n\nIf an insertion needs more capacity, vector obtains new storage and moves or copies elements. Reallocation invalidates all existing element pointers, references and iterators. Without reallocation, push_back preserves existing element references but invalidates the old end iterator. Growth factors are implementation choices; amortized constant-time push_back is the useful contract.',
    code: String.raw`#include <iostream>
#include <vector>

int main() {
    std::vector<int> values;
    values.reserve(4);
    std::cout << values.size() << ' ';
    values.push_back(7);
    values.resize(3);
    std::cout << values.size() << ' ' << values.at(0) << ' '
              << values.at(1) << '\n';
}`,
    output: '0 3 7 0\n',
    trace: '1. The empty vector has size zero. reserve(4) provides room for at least four elements but creates none, so the first printed size is 0.\n2. push_back constructs one int with value 7. size is now 1.\n3. resize(3) creates two additional ints initialized to zero. The sequence is [7, 0, 0].\n4. The remaining values print 3 7 0. No exact capacity value is assumed.',
    pitfalls: 'reserve does not make values[0] valid on an empty vector. Use push_back or resize to construct elements. Do not retain element pointers across operations that may reallocate; reacquire them or use an index when appropriate. Middle insertion/erasure shifts elements and has additional invalidation rules.\n\narray has inline elements, but it is not necessarily on a stack: its object can be a member of a dynamically allocated owner. A vector’s contiguous element buffer improves sequential access, but growing it may incur allocation and relocation costs.',
    practice: 'Replace resize(3) with resize(1): the vector keeps only 7, so at(1) would throw. Explain why reserve(100) would still leave an empty vector’s size at zero. Choose array or vector for seven fixed weekdays versus an unknown number of input records.',
    decision: ['You want four existing zero-initialized int elements. Which operation does that on an empty vector?', ['reserve(4)', 'resize(4)', 'Reading capacity()', 'Writing values[3] directly'], 1, 'resize constructs elements and changes size. reserve changes available storage only; indexing before construction is invalid.'],
    check: ['A vector reallocation invalidates existing pointers and references to its elements.', true, 'The elements are relocated to another buffer, so handles into the previous buffer are no longer valid.'],
    alternatives: ['4 3 7 0', '0 4 7 0', '0 3 7 7'],
  },
  20: {
    overview: 'Linked lists connect separate nodes through links. Understand the difference between finding a position and changing links there, rather than assuming every list insertion is fast.',
    model: 'std::list is a doubly linked sequence with forward and backward traversal. std::forward_list stores forward links and supports only forward traversal. Neither offers constant-time indexing: to reach the kth element, traversal must follow preceding links.\n\nInserting or erasing a node at a known list position can be constant time. Finding that position first can take linear time. list iterators remain valid across other node insertions, and erasing a node invalidates handles to that erased node. A vector often traverses faster because its elements are contiguous; list nodes incur extra link storage and allocation overhead. Measure the actual operation mix.\n\nsplice transfers nodes between compatible lists without copying their stored values. Moving a whole list or a single node is constant time; a range transfer between different lists may take linear time to account for element counts. Allocators must meet the operation’s compatibility requirements. forward_list uses before_begin and insert_after/erase_after because it tracks a predecessor rather than a backward link.',
    code: String.raw`#include <iostream>
#include <list>

int main() {
    std::list<int> first{1, 3};
    auto position = first.begin();
    ++position;
    first.insert(position, 2);
    std::list<int> second{4, 5};
    first.splice(first.end(), second);
    for (int value : first) {
        std::cout << value << ' ';
    }
    std::cout << second.size() << '\n';
}`,
    output: '1 2 3 4 5 0\n',
    trace: '1. first initially links 1 to 3. Advancing begin once identifies the node containing 3.\n2. insert adds a new node containing 2 before that node: [1, 2, 3]. The existing iterator to 3 remains valid.\n3. Whole-list splice transfers second’s nodes before first.end. first becomes [1, 2, 3, 4, 5], and second becomes empty.\n4. Traversal prints the five values, then second.size prints 0.',
    pitfalls: 'There is no list[index] operation. std::sort cannot accept list’s bidirectional iterators; use list.sort. Erasing the node currently being visited requires using the returned iterator, not incrementing an erased iterator.\n\nA linked list is not automatically faster for insertions: search, allocation, memory footprint and cache behavior matter. Do not promise every splice overload is constant time or splice lists with incompatible allocators.',
    practice: 'Keep position and print *position after insert: it still reads 3. Explain why the insertion is cheap once the position is known, but finding the middle of a long list still requires traversal. Compare that with vector’s indexing and shifting costs.',
    decision: ['What is the cost of locating an arbitrary kth element in a linked list by traversal?', ['O(1) regardless of k', 'O(k) link steps', 'O(log k) guaranteed', 'No traversal is possible'], 1, 'The list has no constant-time random access. Inserting at a position can be constant time only after the position has been obtained.'],
    check: ['All std::list::splice overloads are constant time for every valid source range.', false, 'Whole-list and single-element transfers are constant time. A range transfer between different lists can be linear in the range length.'],
    alternatives: ['1 3 2 4 5 0', '1 2 3 4 5 2', '4 5 1 2 3 0'],
  },
  21: {
    overview: 'Sets answer membership questions. Choose between ordering and hashing, then decide whether equivalent keys should be unique or allowed more than once.',
    model: 'std::set stores unique keys according to its comparator. It provides ordered iteration and logarithmic lookup, insertion and removal. Implementations commonly use balanced trees, but a particular tree layout is not the contract. Equivalent means neither key compares less than the other; it does not require a separate == operation.\n\nstd::unordered_set uses hashing and equality. Lookup is average constant time but worst-case linear when many candidates share buckets. Iteration order is unspecified and may change after insertions or rehashing. Equal keys must have equal hashes, and a key must not be changed in a way that breaks its stored position.\n\nmultiset and unordered_multiset allow equivalent keys multiple times. count reports their number. For multiset, equal_range supplies their iterator range. erase(key) removes every equivalent key, whereas erase(iterator) removes one element. Choose a multiset when duplicate occurrences matter, a set when only membership matters, and a map when each key needs associated data.',
    code: String.raw`#include <iostream>
#include <set>

int main() {
    std::set<int> unique{3, 1, 3};
    std::multiset<int> repeated{3, 1, 3};
    std::cout << unique.size() << ' ' << repeated.count(3) << ' ';
    auto found = repeated.find(3);
    repeated.erase(found);
    std::cout << repeated.count(3) << '\n';
}`,
    output: '2 2 1\n',
    trace: '1. unique stores only {1, 3}; the second occurrence of 3 does not create another key. Its size is 2.\n2. repeated stores {1, 3, 3}, so count(3) is 2.\n3. find(3) returns one valid matching iterator because this example contains 3. erase(found) removes only that element.\n4. One occurrence of 3 remains, so the final count is 1. Using erase(3) would remove both occurrences.',
    pitfalls: 'Check find against end before erasing or dereferencing in general code. A set comparator must be a strict weak ordering: comp(x, x) must be false and ordering relationships must be consistent.\n\nUnordered does not mean random: it means the interface promises no sorted iteration order. Rehash invalidates iterators, though references and pointers to remaining elements stay valid. Use set when ordered range queries matter and unordered_set when average membership performance fits the requirements.',
    practice: 'Replace repeated.erase(found) with repeated.erase(3). Answer: the final count becomes 0. Explain why set is suitable for unique student IDs but multiset can model several tickets with the same price.',
    decision: ['Which operation removes one matching occurrence from a multiset after a successful find?', ['erase(key)', 'erase(foundIterator)', 'clear()', 'count(key)'], 1, 'Iterator erasure removes one element. Key erasure removes all equivalent keys, clear removes everything, and count only observes.'],
    check: ['unordered_set provides guaranteed constant-time lookup in the worst case.', false, 'Lookup is average O(1), with O(n) worst-case behavior. Poor collision distribution can require examining many candidates.'],
    alternatives: ['3 2 1', '2 2 0', '2 1 0'],
  },
  22: {
    overview: 'Maps associate keys with values. Learn lookup versus insertion and decide whether each key identifies one value or a group of values.',
    model: 'std::map<Key, Value> keeps unique keys ordered by a comparator, providing logarithmic key operations. std::unordered_map uses hash buckets, with average constant-time and worst-case linear key lookup. Neither orders by the mapped value.\n\noperator[] is an updating operation: when a key is absent, it inserts that key with a value-initialized mapped object and returns a reference to it. For int the initial value is zero, which makes ++counts[word] convenient for counting. It is unsuitable for a supposedly read-only existence check because it changes the container. find observes a key without insertion, contains tests membership, and at accesses an existing value or throws.\n\ninsert does not overwrite an existing unique key; insert_or_assign does. try_emplace can avoid constructing the mapped value in place when the key already exists, though argument expressions are still evaluated before the call. multimap and unordered_multimap permit duplicate keys and use equal_range to retrieve a group; they do not provide operator[].',
    code: String.raw`#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> counts{{"apple", 2}};
    bool present = counts.contains("pear");
    std::cout << present << ' ' << counts.size() << ' ';
    int value = counts["pear"];
    std::cout << value << ' ' << counts.size() << '\n';
}`,
    output: '0 1 0 2\n',
    trace: '1. counts initially contains one entry: apple → 2.\n2. contains("pear") returns false without adding anything. The first two observations are 0 and size 1.\n3. counts["pear"] inserts pear → 0 and returns a reference to its mapped int. value receives a copy of 0.\n4. The remaining observations are 0 and size 2. The lookup syntax has changed the map.',
    pitfalls: 'Do not assume an absent map entry and an entry whose value is zero mean the same thing. at on an absent key throws; find returns end. Keys are treated as immutable within the container so its ordering/hash structure remains consistent.\n\nHash collisions are normal and resolved by checking equality among candidates; collisions do not imply equal keys. Specific linked-list bucket layouts and red-black tree implementations are common strategies rather than mandatory layouts.',
    practice: 'Replace counts["pear"] with counts.at("pear") and explain why it throws instead of inserting. Then use ++counts["pear"] twice: the mapped value becomes 2. Choose multimap when one author needs several separate book entries.',
    decision: ['You need to check whether a key exists without changing a map. Which operation fits?', ['operator[]', 'contains(key)', 'insert_or_assign(key, value)', 'clear()'], 1, 'contains observes membership without insertion. operator[] can insert, insert_or_assign updates state, and clear removes entries.'],
    check: ['try_emplace prevents evaluation of expensive argument expressions when the key already exists.', false, 'Arguments are evaluated before the function call. try_emplace can skip constructing the mapped object in the container, but does not make arbitrary argument evaluation lazy.'],
    alternatives: ['0 1 0 1', '1 1 0 2', '0 2 0 2'],
  },
  23: {
    overview: 'A stack exposes last-in, first-out access. Learn its deliberately restricted interface, then use the most recent unmatched item to reason about nested operations.',
    model: 'Imagine a stack of plates: the most recently added plate is the next one removed. std::stack provides push to add, top to observe the latest element, pop to remove it, and empty/size to inspect state. It adapts another container, deque by default, and does not expose general iteration.\n\ntop returns a reference; pop returns nothing. If you need the value after removal, copy it before popping. A reference to the removed element becomes invalid. Calling top or pop on an empty stack violates their precondition.\n\nNested brackets are a useful application. Push each opening bracket. For a closing bracket, require a nonempty stack and check that its top has the matching type, then pop. After processing all input, the stack must be empty. This models nesting rather than merely counting characters: ([)] has equal counts but mismatched order. Each symbol is processed once, giving O(n) time and O(n) worst-case stack space.',
    code: String.raw`#include <iostream>
#include <stack>

int main() {
    std::stack<int> pending;
    pending.push(10);
    pending.push(20);
    int latest = pending.top();
    pending.pop();
    std::cout << latest << ' ' << pending.top() << ' '
              << pending.size() << '\n';
}`,
    output: '20 10 1\n',
    trace: '1. Pushing 10 makes it the top. Pushing 20 places it above 10.\n2. latest copies the top value 20. The stack still contains both elements.\n3. pop removes 20. latest survives because it is an independent int copy.\n4. The remaining top is 10 and the size is 1, so output is 20 10 1. The example knows it is nonempty; general code must establish that before access.',
    pitfalls: 'Do not write int value = stack.pop(): pop returns void. Do not keep a top reference after removing that element. A stack does not support arbitrary index lookup.\n\nSeparating copying from removal can preserve the element if its copy throws. That reasoning depends on the element operation: a throwing move may already have changed the source. Pick a stack for nesting, undo history or depth-first work; choose a queue when oldest work must run first.',
    practice: 'Add another pop after the original one and check empty before accessing top. Answer: the stack then has no elements, and top must not be called. Trace the bracket sequence ([]) and explain why ([)] must fail even though the counts match.',
    decision: ['You need the top value after removing it. What is the usual safe sequence for an int stack known to be nonempty?', ['int value = stack.pop();', 'int value = stack.top(); stack.pop();', 'stack.pop(); int value = stack.top();', 'int& value = stack.top(); stack.pop();'], 1, 'Copy the value before removal. pop returns void, reading afterward accesses the next element, and a reference to the removed element becomes invalid.'],
    check: ['Matching opening and closing bracket counts alone proves correct nesting.', false, 'Order and bracket type must also match. A stack records the latest unmatched opening bracket to check each closing bracket.'],
    alternatives: ['10 20 1', '20 20 2', '20 10 2'],
  },
  24: {
    overview: 'A queue chooses the oldest item; a priority queue chooses the highest-priority item. Learn the different ordering policies before examining deque storage or heap internals.',
    model: 'std::queue is first-in, first-out: push adds at the back, front observes the oldest element, and pop removes that element. Check empty before front or pop. It is appropriate for arrivals, pending tasks and breadth-first traversal.\n\nstd::deque is a double-ended sequence rather than a queue adapter. It supports insertion/removal at both ends and random access, but its elements are not guaranteed to occupy one contiguous buffer. Typical implementations use blocks; their sizes and maps are not portable guarantees.\n\nstd::priority_queue selects by ordering instead of arrival time. For int its default top is the largest value. std::greater<int> makes a min-priority queue. A binary heap maintains a parent/child ordering so its extreme value is accessible, but does not globally sort every internal position. Inspecting top is O(1), while push and pop are O(log n); building a heap from an existing range is O(n).',
    code: String.raw`#include <iostream>
#include <queue>

int main() {
    std::queue<int> arrivals;
    std::priority_queue<int> priorities;
    for (int value : {2, 9, 5}) {
        arrivals.push(value);
        priorities.push(value);
    }
    std::cout << arrivals.front() << ' ' << priorities.top() << ' ';
    arrivals.pop();
    priorities.pop();
    std::cout << arrivals.front() << ' ' << priorities.top() << '\n';
}`,
    output: '2 9 9 5\n',
    trace: '1. Both adapters receive 2, then 9, then 5.\n2. The queue’s front is 2 because it arrived first. The priority queue’s top is 9 because it is largest.\n3. Removing each chosen item leaves the queue [9, 5] and a priority queue whose largest remaining value is 5.\n4. Output is 2 9 9 5. Equal priority does not by itself guarantee first-in ordering.',
    pitfalls: 'A priority queue is not a queue that happens to be sorted by insertion time. Its comparator defines priority, and top/pop select one extreme. Do not assume its internal array is sorted or iterate it as a sorted range.\n\nEnd insertions into deque can invalidate iterators even when references to existing elements remain valid. Distinguish iterator and reference rules. Use a sequence container when arbitrary access is needed rather than trying to bypass an adapter’s interface.',
    practice: 'Use std::priority_queue<int, std::vector<int>, std::greater<int>> and include <functional> and <vector>. Answer: the priority observations become 2 then 5. Choose FIFO for arrival-order service and a min-heap for the earliest scheduled timestamp.',
    decision: ['Which structure selects the oldest arrival independently of its numeric value?', ['Default priority_queue<int>', 'queue<int>', 'set<int>', 'A max-heap'], 1, 'queue preserves FIFO arrival order. A priority queue or set orders by value/comparator instead.'],
    check: ['All positions in a binary heap are globally sorted.', false, 'The heap invariant constrains each parent relative to its children. It guarantees the extreme root, not a fully sorted traversal.'],
    alternatives: ['9 9 5 5', '2 2 9 9', '2 9 5 5'],
  },
  25: {
    overview: 'Trees organize hierarchical relationships. Distinguish the shape of a binary tree from the ordering rule of a binary search tree, and trace traversal before assuming a search bound.',
    model: 'A tree has a root and child relationships, with no cycle and a unique path from root to each node. A binary tree allows at most two children per node. A binary search tree adds an ordering invariant: smaller keys are in the left subtree and larger keys in the right, with an explicit policy for duplicates. Not every binary tree is a BST.\n\nA search compares the target with the current node and chooses one subtree. Its work is O(h), where h is the height. A balanced tree has logarithmic height; inserting sorted keys into an unbalanced BST can create a chain of height n. AVL and red-black trees use balancing rules and rotations to maintain short paths.\n\nPre-order visits root, left, right; in-order visits left, root, right; post-order visits left, right, root. In-order yields sorted keys only when the BST invariant holds. Level-order uses a queue to visit one depth at a time. A full traversal visits n nodes in O(n) time, with O(h) recursive call depth.',
    code: String.raw`#include <iostream>

struct Node {
    int key;
    const Node* left;
    const Node* right;
};

void inOrder(const Node* node) {
    if (node == nullptr) {
        return;
    }
    inOrder(node->left);
    std::cout << node->key << ' ';
    inOrder(node->right);
}

int main() {
    Node left{1, nullptr, nullptr};
    Node right{3, nullptr, nullptr};
    Node root{2, &left, &right};
    inOrder(&root);
    std::cout << '\n';
}`,
    output: '1 2 3 \n',
    trace: '1. root has key 2, with child keys 1 and 3. These automatic nodes all remain alive for traversal; the links borrow them.\n2. inOrder(root) first visits the left child. Its null left link returns, then it prints 1, and its null right link returns.\n3. Control returns to root and prints 2.\n4. The same process on the right child prints 3. The null check is the recursion base case.\n5. Each node is printed once; the order follows traversal rules, not physical memory order.',
    pitfalls: 'Sorted output depends on the BST ordering, not the existence of two child links. Search in an unbalanced tree is not guaranteed O(log n). Very deep recursive traversal or cleanup may exhaust the execution environment’s call stack; use an explicit work structure when necessary.\n\nRaw links in this example are non-owning. A dynamically allocated tree needs an ownership policy to avoid leaks or double deletion; unique_ptr child ownership is one option. Do not delete the automatic nodes in this example.',
    practice: 'Predict pre-order and post-order for this tree. Answers: 2 1 3 and 1 3 2. Then swap the child keys without moving links: in-order becomes 3 2 1, demonstrating that the structure alone does not imply sorted output.',
    decision: ['What determines the worst-case number of comparisons in a basic BST search?', ['The number of left children only', 'The tree’s height', 'Whether keys are int', 'Always exactly log2(n)'], 1, 'Search follows one root-to-leaf path. That path has O(h) length, and h can be n in an unbalanced chain.'],
    check: ['In-order traversal produces sorted keys for every binary tree.', false, 'It produces sorted keys when the tree also satisfies the binary search ordering invariant. Arbitrary binary trees need not have ordered keys.'],
    alternatives: ['2 1 3', '1 3 2', '3 2 1'],
  },
  26: {
    overview: 'Graphs model arbitrary relationships, including cycles and disconnected groups. Learn vertices, edge direction and representation before selecting a traversal or dependency algorithm.',
    model: 'Vertices represent entities and edges represent connections. In a directed graph, u → v does not imply v → u. An undirected edge allows both directions and is normally recorded in both adjacency lists. A path follows edges; a cycle returns to an earlier vertex. A disconnected graph contains vertices that cannot all be reached from one start.\n\nAn adjacency list stores each vertex’s neighbors and uses O(V + E) space. For an undirected graph each edge is usually stored twice, which changes a constant factor, not the bound. An adjacency matrix uses O(V²) space and supports O(1) edge checks; enumerating all possible neighbors costs O(V). Choose representation based on density and required operations.\n\nA DAG is a directed acyclic graph. Its dependencies can be arranged in a topological order where every edge’s source appears before its destination. Undirected acyclic graphs are forests, not automatically DAGs. Weighted graphs attach costs to edges; unweighted BFS does not generally solve shortest paths with arbitrary weights.',
    code: String.raw`#include <iostream>
#include <vector>

int main() {
    std::vector<std::vector<int>> graph(3);
    graph[0].push_back(1);
    graph[1].push_back(2);
    std::cout << graph[0].size() << ' '
              << graph[1].size() << ' '
              << graph[2].size() << '\n';
}`,
    output: '1 1 0\n',
    trace: '1. There are three vertices numbered 0, 1 and 2. Each starts with an empty neighbor list.\n2. Adding 1 to graph[0] records 0 → 1; it does not add 1 → 0.\n3. Adding 2 to graph[1] records 1 → 2. Vertex 2 still has no outgoing edges.\n4. The outgoing neighbor counts are 1, 1 and 0. This directed chain is acyclic, with topological order 0, 1, 2.',
    pitfalls: 'Validate vertex IDs before indexing. Do not accidentally omit reverse adjacency entries when modeling undirected edges. Mark visited vertices in traversals so cycles do not cause repeated processing. Start traversal from every unvisited vertex when all components must be covered.\n\nA graph can be directed yet cyclic; adding 2 → 0 to this example creates a cycle and removes any possible topological order. CSR is a compact alternative for mostly static sparse graphs, but it trades easy mutation for contiguous edge storage.',
    practice: 'Add the reverse entries to model undirected edges 0—1 and 1—2. Answer: degrees become 1, 2, 1. Then explain why adding 2 → 0 to the original directed graph makes the dependencies impossible to linearly order.',
    decision: ['What must normally be stored for an undirected adjacency-list edge between u and v?', ['Only u → v', 'Both u → v and v → u', 'No entry if u < v', 'A topological order instead of edges'], 1, 'Both neighbor relationships are needed to traverse the undirected connection from either endpoint.'],
    check: ['Every directed graph has a topological order.', false, 'A topological order exists exactly for directed acyclic graphs. A directed cycle creates contradictory before/after requirements.'],
    alternatives: ['1 2 1', '0 1 1', '1 1 1'],
  },
  27: {
    overview: 'Algorithms operate on ranges and callables. Learn logical versus physical removal, then make lambda capture and iterator lifetime explicit when customizing work.',
    model: 'An iterator range [begin, end) separates traversal from the container’s interface. std::remove compacts retained values toward the front and returns a new logical end. It does not destroy trailing elements or reduce the container’s size. vector::erase then removes the trailing range. In C++20, std::erase and std::erase_if provide convenient container-aware forms.\n\nA predicate returns true when an element meets a condition; a comparator describes ordering between two elements. A function object is a class with operator(). A lambda creates a callable object with its own type. [limit] stores a value copy, [&limit] borrows the original, and [] captures nothing. A reference capture must not outlive its referent.\n\nstd::function can hold different compatible callable types through a common runtime interface, sometimes with allocation or indirect-call costs. A template or auto parameter can retain the concrete callable type. Choose the interface needed rather than assuming every callable has the same storage and lifetime behavior.',
    code: String.raw`#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{1, 2, 3, 2};
    auto logicalEnd = std::remove(values.begin(), values.end(), 2);
    std::cout << values.size() << ' ';
    values.erase(logicalEnd, values.end());
    for (int value : values) {
        std::cout << value << ' ';
    }
    std::cout << values.size() << '\n';
}`,
    output: '4 1 3 2\n',
    trace: '1. The vector initially has four elements. remove keeps 1 and 3 in the first two positions and returns an iterator just after them.\n2. size is still 4: the trailing elements still exist, but their post-remove values should not be used as the retained result.\n3. erase removes that trailing range and changes size to 2.\n4. Iteration now prints 1 and 3, then the final size prints 2. The output is 4 1 3 2.',
    pitfalls: 'remove does not promise that the discarded tail contains all removed values in their original form. Read only the retained prefix before erase. erase destroys elements but does not necessarily release vector’s capacity.\n\nA lambda capturing a local by reference can dangle if saved for later. [=] copies captured values at creation, not each call, and pointer copies do not own their targets. Do not modify a container in ways that invalidate the range an algorithm is currently processing.',
    practice: 'Replace the remove/erase pair with std::erase(values, 2). The final sequence remains [1, 3]. Create a predicate [limit](int x) { return x > limit; }, change the original limit afterward, and explain why the captured value remains the earlier one.',
    decision: ['After std::remove on a vector, what changes its actual size?', ['Dereferencing the returned iterator', 'Erasing the range from the logical end to end', 'Calling capacity()', 'Changing the predicate’s name'], 1, 'The algorithm compacts values; the container’s erase operation destroys the trailing elements and updates size.'],
    check: ['Capturing a local variable by reference gives a stored lambda ownership of that variable.', false, 'A reference capture borrows. If the variable’s lifetime ends before the callable uses it, that access is invalid.'],
    alternatives: ['2 1 3 2', '4 1 2 3 2 4', '4 1 3 4'],
  },
  28: {
    overview: 'Inheritance creates a base subobject inside a derived object. Learn substitutability, access and construction order before using a hierarchy to reuse implementation.',
    model: 'Public inheritance models an is-a relationship when callers can use the derived object according to the base interface’s contract. A Derived object contains a Base subobject plus its own members. A Derived reference or pointer can be converted to an accessible Base reference or pointer without creating a new object.\n\nPublic base members stay public under public inheritance and protected members stay protected. Private base members remain inaccessible directly to derived code. Protected/private inheritance restricts how the inherited interface is exposed; it does not turn base private data into accessible data. Composition is often better when the relationship is merely uses-a or has-a.\n\nConstruction initializes bases first, then members in declaration order, then the derived constructor body. Destruction reverses those steps. Multilevel inheritance extends that sequence across several layers. Multiple inheritance introduces more than one base; a diamond can produce two common-base subobjects unless virtual inheritance makes that common base shared.',
    code: String.raw`#include <iostream>

struct Base {
    Base() { std::cout << "B "; }
    ~Base() { std::cout << "b "; }
};

struct Derived : Base {
    Derived() { std::cout << "D "; }
    ~Derived() { std::cout << "d "; }
};

int main() {
    {
        Derived object;
    }
    std::cout << '\n';
}`,
    output: 'B D d b \n',
    trace: '1. Creating object first constructs its Base subobject, printing B.\n2. Derived’s constructor body then prints D.\n3. The inner scope ends. Derived’s destructor body prints d.\n4. Base’s destructor runs afterward, printing b. The object was destroyed directly as Derived, not through a Base pointer.\n5. The final newline completes B D d b.',
    pitfalls: 'Inheritance does not automatically mean a correct is-a design: the derived type must honor the behavior callers expect from the base. Do not use it solely to gain access to implementation.\n\nA downcast asks whether a base view refers to a particular derived object. dynamic_cast checks a suitable polymorphic hierarchy and returns nullptr on a failed pointer cast; a failed reference cast throws bad_cast. static_cast does not validate dynamic type and is unsafe when its required relationship does not hold. Pointer offsets and RTTI layouts are implementation details.',
    practice: 'Add a second derived layer and predict construction from base outward and destruction inward. Explain why this example needs no virtual destructor for direct Derived destruction, but a public base interface intended for polymorphic deletion does.',
    decision: ['What is initialized before a derived constructor’s body runs?', ['Only the derived body itself', 'Bases, then members in declaration order', 'Members in initializer-list order, then bases', 'The derived destructor'], 1, 'Bases precede the derived members, and member declaration order controls initialization. The body executes only after those subobjects have been initialized.'],
    check: ['Public inheritance lets derived code directly access private base members.', false, 'Base private members remain private to the base and its friends. Derived code uses the base’s accessible interface.'],
    alternatives: ['D B b d', 'B D b d', 'D B d b'],
  },
  29: {
    overview: 'Polymorphism lets a common interface select behavior from the actual object type. Learn virtual dispatch through references, then understand slicing, abstraction and safe destruction.',
    model: 'A nonvirtual call is selected using the expression’s static type. A virtual call through a base reference or pointer normally selects the override for the object’s dynamic type. override asks the compiler to verify that a derived method really matches a virtual base declaration; a parameter or const mismatch would otherwise create a different function.\n\nA pure virtual method makes the class abstract, preventing direct instantiation until a derived class supplies all required implementations. The interface describes what an operation promises while the concrete class supplies how it works. Overloading chooses among different signatures at compile time; overriding supplies a derived implementation of a virtual method. Templates provide another form of compile-time polymorphism.\n\nPassing a derived value into a Base value parameter creates a separate Base object: derived state and behavior are sliced away. Pass by reference/pointer when preserving dynamic type matters. A base intended for delete through Base* normally needs a public virtual destructor; another design can prohibit such deletion with a protected nonvirtual destructor.',
    code: String.raw`#include <iostream>

struct Animal {
    virtual ~Animal() = default;
    virtual const char* voice() const { return "animal"; }
};

struct Dog : Animal {
    const char* voice() const override { return "dog"; }
};

int main() {
    Dog dog;
    const Animal& reference = dog;
    Animal sliced = dog;
    std::cout << reference.voice() << ' ' << sliced.voice() << '\n';
}`,
    output: 'dog animal\n',
    trace: '1. dog is a Dog object, whose dynamic type remains Dog when viewed through reference.\n2. reference.voice uses virtual dispatch and selects Dog::voice, producing dog.\n3. sliced is a new Animal object copied from dog’s Animal subobject. Its dynamic type is Animal.\n4. sliced.voice therefore produces animal. The difference is object identity/type, not a lost pointer lookup alone.',
    pitfalls: 'Deleting a derived object through a base pointer without the required virtual destructor has undefined behavior; do not describe a particular missing-destructor outcome as guaranteed. Having any virtual function does not universally require a virtual destructor if polymorphic deletion is prevented.\n\nVirtual calls during base construction/destruction do not dispatch into a not-yet-constructed or already-destroyed derived layer. Common ABIs implement dispatch with vtables and object pointers, but no fixed pointer size, offset or table layout is required. An optimizer may devirtualize a call when it can prove the target.',
    practice: 'Change the value declaration to const Animal& unsliced = dog and compare the calls. Answer: both use Dog::voice. Then make voice pure virtual and explain why the original Animal sliced declaration can no longer compile.',
    decision: ['How should a read-only function accept an Animal to preserve a caller’s derived behavior?', ['Animal by value', 'const Animal&', 'A copied voice string only', 'An int containing sizeof(Animal)'], 1, 'A base reference borrows the original object and preserves virtual dispatch. A base value parameter creates a sliced Base object.'],
    check: ['A fixed vptr offset and an eight-byte vptr are guaranteed by the C++ language.', false, 'Vtables and vptr layouts are common implementation techniques. The language specifies dispatch behavior, not those layout details.'],
    alternatives: ['animal animal', 'dog dog', 'animal dog'],
  },
  30: {
    overview: 'Operator overloading gives existing operator syntax meaning for your types. Keep that meaning conventional and learn which operands belong to a member versus a nonmember implementation.',
    model: 'An overloaded operator is a function. For a member operator+, a + b can call a.operator+(b); for a suitable nonmember it can call operator+(a, b). At least one operand must involve a class or enumeration type, and you cannot invent new symbols or change an operator’s precedence, associativity or number of operands.\n\nUse + for value-producing addition-like operations and += for updating the left operand. A conventional + returns a new value without modifying its inputs. A nonmember overload can support symmetric operand conversions, while a member implicitly uses the left object. friend is one way to grant a nonmember access to private state, not a requirement for every nonmember operator.\n\nA stream insertion overload takes std::ostream& on the left and your value on the right, then returns the stream to support chaining. C++20 <=> describes three-way comparison. A defaulted member <=> can also implicitly declare equality when no equality declaration is supplied; a manually written <=> does not automatically supply equality by itself.',
    code: String.raw`#include <iostream>

struct Distance {
    int meters;
};

Distance operator+(Distance left, Distance right) {
    return Distance{left.meters + right.meters};
}

int main() {
    Distance first{2};
    Distance second{3};
    Distance total = first + second;
    std::cout << first.meters << ' ' << second.meters << ' '
              << total.meters << '\n';
}`,
    output: '2 3 5\n',
    trace: '1. first and second hold 2 and 3 meters.\n2. operator+ receives value copies and adds their small integer members. It returns a new Distance with 5 meters.\n3. total stores that result; the originals still contain 2 and 3.\n4. Output is 2 3 5. The existing precedence of + is unchanged by defining this function.',
    pitfalls: 'Do not give + surprising side effects or use an unrelated operation merely because the syntax is convenient. Numeric member operations still need representable results; this example uses small values. A type modeling real distances also needs a units and validation policy.\n\nDo not overload && or || expecting built-in short-circuit behavior. For ordered containers, a custom comparison must be consistent and irreflexive. Floating NaNs can make ordering partial rather than total; choose the comparison category appropriate to the type.',
    practice: 'Implement += returning Distance& and use it to update first. Answer: first changes, whereas + conventionally leaves operands alone. Add a stream operator and explain why returning std::ostream& permits out << first << second.',
    decision: ['What should a conventional value-producing operator+ do?', ['Modify both operands and return void', 'Return a new result while leaving its operands unchanged', 'Change the language’s precedence rules', 'Allocate memory even for a small value'], 1, 'Conventional addition produces a value. Mutation belongs in an operation such as +=; overloading does not alter the language’s grammar.'],
    check: ['A manually written operator<=> always generates operator== automatically.', false, 'Implicit equality is associated with appropriate defaulted <=> declarations. A hand-written three-way comparison needs an equality operation when equality is required.'],
    alternatives: ['5 3 5', '2 5 5', '2 3 23'],
  },
  31: {
    overview: 'Object relationships describe both behavior and lifetime. Learn composition, association and aggregation, then use SOLID as reasoning tools rather than a list of acronyms.',
    model: 'Composition means an object owns parts whose lifetime it controls, such as a Car containing an Engine member. Association is a relationship where one object uses another without necessarily owning it. Aggregation commonly describes a whole/group that refers to independently existing members, such as a Team borrowing Players. These are design terms, not separate C++ keywords; members, references and owning pointers implement the policies.\n\nChoose composition for has-a relationships and public inheritance when a subtype genuinely meets the base contract. Composition can reduce coupling, but adding an abstract interface to every field can also create needless complexity. Encapsulation exposes valid operations rather than writable representation.\n\nSOLID helps evaluate change: single responsibility separates reasons to change; open/closed supports extensions through a stable contract; Liskov requires substitutions to preserve that contract; interface segregation keeps clients dependent on what they need; dependency inversion makes high-level policy depend on useful abstractions rather than concrete details.',
    code: String.raw`#include <iostream>

struct Engine {
    int power{100};
};

struct Car {
    Engine engine;
};

struct Driver {
    const Car& car;
    int availablePower() const { return car.engine.power; }
};

int main() {
    Car car;
    Driver driver{car};
    std::cout << driver.availablePower() << '\n';
}`,
    output: '100\n',
    trace: '1. Constructing car also constructs its Engine member with power 100. Car owns that subobject by composition.\n2. driver binds a reference to the existing car. It borrows rather than owning or copying it.\n3. availablePower reads the borrowed car’s owned engine and returns 100.\n4. driver is destroyed before car because of local declaration order, so its reference remains valid throughout its use.',
    pitfalls: 'A reference member does not extend an arbitrary owner’s lifetime. Returning a Driver referring to a local Car would leave a dangling relationship. Document whether a pointer is owning, shared or borrowing.\n\nThe classic mutable Square-as-Rectangle design can violate substitutability when callers expect width and height setters to operate independently. The problem is the interface contract, not geometry alone. SOLID is a set of design principles; applying it mechanically can add complexity without solving a real change requirement.',
    practice: 'Give Driver its own Car value instead of a reference: it now contains a separate object and its lifetime is independent of the original. Explain which policy fits a driver temporarily using a shared car. Name one change that should affect an Engine implementation without changing a driving policy interface.',
    decision: ['A Team refers to players owned independently elsewhere. Which relationship description fits?', ['Exclusive composition of player lifetimes', 'Aggregation with documented borrowed lifetimes', 'Inheritance from every Player', 'Automatic ownership caused by a raw pointer'], 1, 'Aggregation describes the grouping while players exist independently. C++ references/pointers need a lifetime policy; they do not imply ownership by themselves.'],
    check: ['An is-a name is sufficient proof that public inheritance preserves a base contract.', false, 'Substitutability depends on behavior and invariants expected by callers. A plausible name does not prove those requirements hold.'],
    alternatives: ['0', '200', 'It prints the Car address'],
  },
  32: {
    overview: 'Templates describe operations for multiple suitable types. Learn deduction and requirements before specialization, and separate compile-time selection from runtime virtual dispatch.',
    model: 'A function template uses a type parameter, such as template<typename T> T larger(T a, T b). Calling it with two ints deduces T as int; two doubles deduce double. The template is a pattern, and instantiation checks operations for the selected type. It does not guarantee every type works.\n\nIf both arguments use the same T parameter, passing an int and a double can fail deduction because the deduced types conflict. You can choose a deliberate common type, specify a template argument or design a two-parameter interface with a result policy. Do not assume deduction automatically performs every implicit conversion.\n\nDefinitions usually need to be visible at instantiation, commonly through headers; explicit instantiation supports other arrangements. Nondependent syntax/names are checked at definition, while dependent requirements are resolved for actual types. C++20 concepts express constraints, producing clearer interfaces and diagnostics. Specialization customizes a template for a particular case; virtual dispatch instead selects behavior from an object’s dynamic type at runtime.',
    code: String.raw`#include <concepts>
#include <iostream>

template<std::integral T>
T larger(T left, T right) {
    return left < right ? right : left;
}

int main() {
    std::cout << larger(3, 7) << ' '
              << larger(9L, 4L) << '\n';
}`,
    output: '7 9\n',
    trace: '1. larger(3, 7) deduces T as int, which satisfies std::integral. The comparison selects 7.\n2. larger(9L, 4L) deduces T as long, also integral, and selects 9.\n3. Each call is checked for its type at compile time. There is no base pointer or virtual runtime selection.\n4. The program writes 7 9. A call with doubles would fail the stated constraint.',
    pitfalls: 'A template is not a text macro: the compiler checks types and overloads. Constraint satisfaction does not prove an algorithm is correct for every value; numeric range and other preconditions still matter.\n\nDifferent instantiations may produce different code and increase build time or executable size, but an optimizer can inline, merge or remove code. Do not promise exactly one emitted assembly function per type. Function templates cannot be partially specialized; overload them or use a suitable class-template design.',
    practice: 'Try larger(3, 7L) separately and explain the conflicting deductions. Then call larger<long>(3, 7L): explicitly choosing long permits conversion of 3. Try a double pair and identify the integral constraint diagnostic.',
    decision: ['Why does larger(3, 7L) fail deduction for one shared T parameter?', ['Templates cannot accept long', 'The arguments deduce conflicting T types', 'The result is too large', 'The function must be virtual'], 1, 'One argument deduces int and the other long. A single T parameter must have a consistent deduction; explicit type selection can express the intended conversion policy.'],
    check: ['Template instantiation guarantees exactly one separately emitted machine-code function per type.', false, 'Instantiation is a language-level checking and specialization process. The compiler may inline, merge or remove machine-code functions.'],
    alternatives: ['3 4', '7 4', '3 9'],
  },
  33: {
    overview: 'Threads allow multiple execution flows to share objects. Learn lifetime, joining and synchronization before assuming a parallel program is correct or faster.',
    model: 'A process normally has its own address space; threads in one process share objects and resources. std::thread starts a separate execution flow. join waits for completion and establishes synchronization so completed worker effects can be observed. A joinable std::thread must be joined or detached before destruction, otherwise its destructor calls terminate. C++20 jthread can manage joining automatically and supports cooperative stop requests.\n\nA data race occurs when conflicting accesses to the same memory location, including at least one write, occur without the required synchronization and are not suitably atomic. In C++ a data race is undefined behavior. It is more than occasionally getting the wrong counter.\n\nA mutex provides mutual exclusion for a critical section. Every participating access must follow the same locking protocol. lock_guard or scoped_lock releases locks through RAII on scope exit. Atomic objects support particular individual operations without a mutex, but several separate atomics do not automatically make a multi-step invariant indivisible. Prefer independent per-thread work when possible.',
    code: String.raw`#include <iostream>
#include <mutex>
#include <thread>

int main() {
    int count{};
    std::mutex mutex;
    auto increment = [&] {
        for (int i{0}; i < 1000; ++i) {
            std::lock_guard<std::mutex> lock{mutex};
            ++count;
        }
    };
    std::thread first{increment};
    std::thread second{increment};
    first.join();
    second.join();
    std::cout << count << '\n';
}`,
    output: '2000\n',
    trace: '1. Both workers borrow count and mutex, which remain alive until both joins finish.\n2. Each iteration acquires the same mutex before reading/updating count. Only one worker can execute that protected increment at a time.\n3. Each performs 1000 increments. Scheduling can interleave them differently, but no updates are lost under this protocol.\n4. Both joins complete before the main thread reads count, so it observes the final 2000. Build with -pthread where the compiler requires it.',
    pitfalls: 'volatile does not provide atomicity or thread synchronization. Removing the lock creates undefined behavior, so no alternative counter result is guaranteed. Detach gives up joining, not shared-state lifetime responsibilities; reference captures can then dangle.\n\nUse a consistent lock order or scoped_lock for multiple mutexes to avoid deadlocks. Thread creation, contention and scheduling can outweigh parallel speedup. POSIX fork creates a process, not a C++ thread, and has platform-specific restrictions—especially after multiple threads exist. The supplement separates process fork/wait from a thread fork/join work pattern.',
    practice: 'Explain why moving std::cout before both joins would require synchronization for the read too. Create separate per-worker counters, join, then sum them in main; this avoids a mutex when each worker writes only its own independent int.',
    decision: ['What is needed to protect an ordinary shared counter incremented by two threads?', ['volatile alone', 'A shared synchronization protocol such as one mutex around every increment', 'A longer variable name', 'Only joining after unsynchronized increments'], 1, 'Joining orders completed work with the final reader but does not prevent workers from racing with each other. Their conflicting increments need synchronization or an appropriate atomic operation.'],
    check: ['Joining workers after they finish repairs a data race that occurred between them.', false, 'join synchronizes completion with the joining thread. It does not retroactively make unsynchronized conflicting accesses between workers valid.'],
    alternatives: ['1000', 'An arbitrary count because join alone is used', '0'],
  },
  34: {
    overview: 'Time complexity describes how counted work grows with input size. Learn to identify the input measure, count operations and state a case before using asymptotic notation.',
    model: 'Choose an input measure such as n elements or V vertices and E edges. Count a relevant operation instead of guessing runtime in milliseconds. A loop visiting n elements performs linear work; two complete nested n loops perform quadratic work; repeatedly halving a positive size takes logarithmically many steps. Sequential loops add their costs, not multiply them.\n\nBig-O is an asymptotic upper bound, Omega a lower bound and Theta a tight bound for the function being analyzed. These do not inherently mean worst, best and average cases. You can state a worst-case Theta(n) bound for linear search and a best-case Theta(1) bound for the same algorithm. Specify which case and assumptions you mean.\n\nAmortized analysis bounds the total cost of a sequence, then divides by its operation count; it does not assume random input. Vector append is amortized O(1) though a particular reallocating append may be O(n). Constants and memory access still affect measured performance, so asymptotic bounds alone do not guarantee a latency target.',
    code: String.raw`#include <iostream>

int main() {
    int n{4};
    int steps{};
    for (int i{0}; i < n; ++i) {
        for (int j{0}; j < n; ++j) {
            ++steps;
        }
    }
    std::cout << steps << '\n';
}`,
    output: '16\n',
    trace: '1. The outer loop runs for i=0,1,2,3: four iterations.\n2. For each outer iteration, the inner loop starts again at j=0 and runs four times.\n3. There are 4 × 4 = 16 increments. For general nonnegative n, the count is n².\n4. Under constant-cost increments and representable counts, the loop work is Theta(n²). Doubling n from 4 to 8 makes 64 increments, four times as many.',
    pitfalls: 'Two nested loops are not always quadratic: their bounds and how they advance matter. A two-pointer algorithm whose total pointer movement is n can remain linear. For two independent input lengths n and m, a cross-product loop costs O(nm), not automatically O(n²).\n\nAn upper bound can be loose: linear work is also O(n²), but Theta(n) is more informative. The Master Theorem applies to particular recurrence forms and conditions; first write the recurrence and check its assumptions rather than using it for every recursive program.',
    practice: 'Move the second loop after the first rather than inside it. Answer: there are 2n increments, giving Theta(n), not Theta(n²). Explain why worst-case and upper-bound are different descriptions, and count a loop that halves n until it is at most one.',
    decision: ['Two sequential loops each visit n elements. What is their tight total work bound?', ['Theta(n²)', 'Theta(n)', 'Theta(1)', 'Theta(2^n)'], 1, 'Their counts add to 2n. Constant factors disappear asymptotically; multiplication applies when a complete inner loop repeats for each outer iteration.'],
    check: ['Big-O intrinsically means the worst case, while Omega intrinsically means the best case.', false, 'They are upper and lower bounds for a chosen cost function. Best, worst and average cases must be specified separately.'],
    alternatives: ['8', '4', '64'],
  },
  35: {
    overview: 'Space complexity measures storage that grows with input. Count live auxiliary memory, including call depth and output where appropriate, rather than counting allocations or code lines.',
    model: 'Input storage is the data supplied to an algorithm. Auxiliary space is additional working storage. A returned result may be reported separately, so state your convention. An array of n inputs with a few counters has O(n) input space and O(1) auxiliary space. Copying that array creates O(n) extra storage.\n\nIn-place commonly means modifying the input with constant or small extra workspace; always give the actual bound because terminology varies. A reverse algorithm can swap endpoints using one temporary value and two indices, giving O(1) auxiliary space even though it touches n values.\n\nRecursive calls contribute memory while they are simultaneously active. Recursion of depth d with constant-size per-call state uses O(d) call storage in the usual execution model. Total number of calls and maximum live depth are different: a traversal can make n calls overall but have only logarithmic depth on a balanced tree. Explicit stacks and memo tables are still auxiliary memory even if stored on the heap.',
    code: String.raw`#include <iostream>
#include <utility>
#include <vector>

int main() {
    std::vector<int> values{1, 2, 3, 4};
    std::size_t left{0};
    std::size_t right = values.size();
    while (left < right) {
        --right;
        if (left >= right) {
            break;
        }
        std::swap(values[left], values[right]);
        ++left;
    }
    for (int value : values) {
        std::cout << value << ' ';
    }
    std::cout << '\n';
}`,
    output: '4 3 2 1 \n',
    trace: '1. right starts one past the final element. Decrementing it gives index 3. Swap indices 0 and 3: [4, 2, 3, 1].\n2. Advance left to 1 and decrement right to 2. Swap those positions: [4, 3, 2, 1].\n3. The boundaries meet/cross, so no further swap occurs. The empty-input case also skips the loop safely.\n4. Only indices and a constant-size swap temporary are extra state. Work is O(n), auxiliary space O(1); the input vector itself still occupies O(n).',
    pitfalls: 'Do not omit a recursion stack from auxiliary space, or count freed buffers as simultaneously live. A memoized recursive algorithm may use both O(n) cached entries and O(n) call depth.\n\nAvoid clever XOR swaps: they are hard to read and can corrupt a value if both references alias the same object. A temporary variable still counts as O(1), so normal swap is already constant-space. Replacing recursion with an explicit stack changes storage location, not automatically its asymptotic size.',
    practice: 'Run the reverse reasoning for empty, one-element and odd-length ranges. Explain why the center needs no swap. Then compare with building a reversed copy: it preserves the original but needs O(n) result storage.',
    decision: ['A recursive chain has n active calls, each with constant-size state. What is its usual auxiliary space?', ['O(1) because no vector was allocated', 'O(n) including the active calls', 'O(log n) for all recursion', 'Zero because the compiler always removes calls'], 1, 'Call storage counts. A chain of n active calls has linear depth; tail-call optimization is not a C++ guarantee.'],
    check: ['Using one temporary variable to swap values prevents an algorithm from being O(1) auxiliary space.', false, 'O(1) permits a fixed amount of workspace independent of input size. A temporary value and fixed counters satisfy that bound.'],
    alternatives: ['1 2 3 4', '4 2 3 1', '4 3 1 2'],
  },
  36: {
    overview: 'Algorithmic patterns work because their assumptions let you discard choices safely. Learn the invariant behind each pattern, then select it from the problem’s constraints rather than its name.',
    model: 'Brute force enumerates candidates and provides a useful correctness baseline. Greedy methods commit to a local choice and need a proof that an optimal solution can include it. Divide-and-conquer solves smaller independent pieces and combines them. The right pattern follows constraints, not an interview label.\n\nFor two-sum on a sorted range, start at both ends. If the sum is too small, the left value cannot pair with any remaining smaller right value to reach the target, so discard it. If too large, discard the right value. This invariant eliminates one candidate per step, giving O(n) work and O(1) workspace. Without sortedness the proof fails.\n\nA fixed sliding window updates by removing a departing value and adding an entering one. Variable windows need a monotone condition. Fast/slow pointers detect cycles in successor chains. Sort intervals before merging overlaps; cyclic sort requires values with a defined index mapping; subset backtracking preserves/restores a partial path. Topological order requires a DAG. A size-k min-heap retains the k largest values by discarding its smallest retained item.',
    code: String.raw`#include <iostream>
#include <vector>

bool hasPair(const std::vector<int>& values, long long target) {
    std::size_t left{0};
    std::size_t right = values.size();
    while (right > left + 1) {
        long long sum = static_cast<long long>(values[left]) + values[right - 1];
        if (sum == target) {
            return true;
        }
        if (sum < target) {
            ++left;
        } else {
            --right;
        }
    }
    return false;
}

int main() {
    std::cout << hasPair({1, 2, 4, 7}, 6) << '\n';
}`,
    output: '1\n',
    trace: 'Use distinct indices in this sorted input.\n1. left=0, right-exclusive=4: 1 + 7 = 8, too large. Discard the rightmost candidate.\n2. left=0, right-exclusive=3: 1 + 4 = 5, too small. Discard the leftmost candidate.\n3. left=1, right-exclusive=3: 2 + 4 = 6, so return true.\n\nThe surviving interval still contains every pair not yet ruled out by sortedness. Boundaries stop before using the same element twice; empty and one-element inputs return false.',
    pitfalls: 'Sorting first costs O(n log n) and may change positions; preserve original indices if the answer needs them. A pair-sum promotion avoids int overflow for this int-input example. Variable-window sum arguments often assume nonnegative elements and can fail with negative ones.\n\nDo not use a greedy choice without an exchange or equivalent correctness argument. Cyclic sort’s restricted permutation example is not a general sorting method. Enumerating all subsets requires exponential work because there are 2^n results. The following focused supplements provide separate implementations and traces for the guide’s patterns.',
    practice: 'Trace targets 3 and 20, then empty and one-element inputs. Answers: true for 3 and false for the others. Explain why discarding the left value after a too-small sum is safe only because the remaining values are sorted.',
    decision: ['Why is moving left after a too-small pair sum safe on sorted input?', ['Every input has a pair', 'That left value with any smaller remaining right value is also too small', 'The values are all positive', 'Pointers always move twice'], 1, 'The largest remaining partner already gives too small a sum, so no smaller remaining partner can rescue that left value. Sortedness supplies the elimination proof.'],
    check: ['The same two-pointer elimination proof works on arbitrary unsorted input.', false, 'Without ordering, moving a boundary can discard a valid pair. Sort with appropriate bookkeeping or choose another method such as hashing.'],
    alternatives: ['0', '6', '2 4'],
  },
  37: {
    overview: 'Sorting establishes an order under a comparison rule. Learn a small sorting algorithm by tracing its invariant, then compare the seven required methods and standard-library contracts.',
    model: 'Insertion sort maintains a sorted prefix. Take the next value, shift larger prefix values right, then insert it into the gap. After each outer iteration the prefix is sorted and contains exactly the values originally seen. It is stable when only strictly larger values are shifted. Sorted input needs linear comparisons; reverse input requires quadratic shifts.\n\nSelection sort repeatedly chooses the smallest remaining value. Bubble sort swaps adjacent inversions. Merge sort splits and merges sorted halves using extra storage. Quick sort partitions by a pivot, with average O(n log n) but quadratic worst-case for a basic implementation. Heap sort selects extremes through a heap and provides O(n log n) worst-case work. Bucket sort needs an input mapping and distribution assumptions. The supplement implements all seven with their bounds.\n\nstd::sort requires random-access iterators and a strict weak ordering comparator, gives O(n log n) comparison complexity and does not promise stability. Implementations commonly use introsort-like hybrids, but specific algorithms, pivots and thresholds are not mandated. std::stable_sort preserves equivalent elements’ relative order; its complexity and memory tradeoffs differ.',
    code: String.raw`#include <iostream>
#include <vector>

void insertionSort(std::vector<int>& values) {
    for (std::size_t i{1}; i < values.size(); ++i) {
        int current = values[i];
        std::size_t gap = i;
        while (gap > 0 && values[gap - 1] > current) {
            values[gap] = values[gap - 1];
            --gap;
        }
        values[gap] = current;
    }
}

int main() {
    std::vector<int> values{3, 1, 2};
    insertionSort(values);
    for (int value : values) {
        std::cout << value << ' ';
    }
    std::cout << '\n';
}`,
    output: '1 2 3 \n',
    trace: '1. Before i=1, the prefix [3] is sorted. current=1; shift 3 right and place 1 at index 0. The array becomes [1, 3, 2].\n2. At i=2, the prefix [1, 3] is sorted. current=2; shift 3 right. Since 1 is not larger than 2, stop and place 2 at index 1.\n3. The full range is [1, 2, 3]. Each insertion preserves the sorted-prefix invariant. The gap > 0 check prevents an invalid predecessor index.',
    pitfalls: 'A comparator returning a <= b is invalid because comp(a, a) would be true. When records have equal sort keys, a stable sort keeps their original relative order; sortedness alone does not specify that order.\n\nBucket sort is not automatically linear for arbitrary values or bad distributions. Recursion stack usage matters for quick sort. Constant factors depend on types and hardware, so no sorting method is universally fastest. Use standard algorithms in application code unless an explicit requirement calls for your own implementation.',
    practice: 'Trace [2, 2, 1], an already sorted range, an empty range and a singleton. Explain why strict > shifting preserves equal elements’ relative order. Choose stable_sort when sorting equal-priority records must preserve their earlier order.',
    decision: ['Records with equal keys must retain their original relative order. Which standard operation states that requirement?', ['std::sort', 'std::stable_sort', 'std::find', 'std::reverse'], 1, 'stable_sort guarantees stability for equivalent elements. sort guarantees ordering but not preservation of their prior relative order.'],
    check: ['C++ requires every std::sort implementation to use the same introsort pivot and threshold.', false, 'The standard specifies iterator/comparison requirements and behavior/complexity. Implementations choose their own compliant algorithms and tuning.'],
    alternatives: ['3 1 2', '1 3 2', '3 2 1'],
  },
  38: {
    overview: 'Searching eliminates candidate positions or traverses relationships. Learn binary-search bounds precisely and distinguish its ordering assumption from BFS/DFS graph traversal.',
    model: 'Linear search checks values in sequence and works without sortedness in O(n) worst-case time. Binary search on a sorted random-access range repeatedly halves the candidate interval, giving O(log n) comparisons and index steps. A halved range does not mean logarithmic iterator movement on a linked list.\n\nA half-open binary search can find the first value not less than the target. Maintain [low, high) as the candidate interval. If values[mid] is too small, low=mid+1; otherwise high=mid. On termination low==high is the insertion position, possibly the end. Only then check whether that position actually contains the target. lower_bound and upper_bound express first >= and first > under ascending order; together they delimit equivalent values.\n\nBFS follows edges by layers using a queue and finds minimum edge-count paths in unweighted graphs. DFS explores one branch deeply before returning and can support components/cycle analysis with appropriate state. Tree pre/in/post-order describe when the root is visited relative to its subtrees. These traversal orders are not substitutes for binary-search sortedness.',
    code: String.raw`#include <iostream>
#include <vector>

std::size_t lowerPosition(const std::vector<int>& values, int target) {
    std::size_t low{0};
    std::size_t high = values.size();
    while (low < high) {
        std::size_t mid = low + (high - low) / 2;
        if (values[mid] < target) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}

int main() {
    std::vector<int> values{1, 3, 3, 7};
    std::cout << lowerPosition(values, 3) << ' '
              << lowerPosition(values, 8) << '\n';
}`,
    output: '1 4\n',
    trace: 'For target 3:\n1. [low, high)=[0,4), mid=2. values[2]=3 is not smaller, so high becomes 2.\n2. [0,2), mid=1. The value is again 3, so high becomes 1.\n3. [0,1), mid=0. The value 1 is smaller, so low becomes 1. Boundaries meet at the first 3.\nFor target 8, every value is smaller, and the returned position is 4, the one-past endpoint. It must not be used for element access.',
    pitfalls: 'An insertion position is not proof a target exists. Check index < size and values[index] == target. Binary search requires the appropriate ordering/partition precondition; on arbitrary input its result is not a valid membership proof.\n\nGraph traversal must track visited state and cover disconnected starts when needed. Marking a BFS vertex when enqueuing avoids duplicate pending work. BFS minimum-edge paths are not minimum-weight paths for arbitrary weighted edges. Avoid fixed inclusive-bound arithmetic that can underflow unsigned indices.',
    practice: 'Trace targets 0, 4 and 7. Answers: insertion positions 0, 3 and 3. Only 7 is present at its returned position. Explain why the same index 3 can mean an absent 4 or a present 7.',
    decision: ['lower_bound returns end. What does that establish for an ascending sorted range?', ['It is safe to dereference end', 'All elements are smaller than the target, or the range is empty', 'The target is at index zero', 'The range is necessarily invalid'], 1, 'No element is at least the target. end is a valid position/sentinel, not a dereferenceable element.'],
    check: ['BFS finds a minimum-weight path for arbitrary weighted graphs.', false, 'Ordinary BFS minimizes the number of edges in an unweighted graph. Different edge weights require an appropriate weighted-path algorithm.'],
    alternatives: ['2 4', '1 3', '0 4'],
  },
  39: {
    overview: 'Recursion expresses a solution in terms of smaller instances. Learn base cases, progress and return-value propagation, then compare repeated work and live call depth.',
    model: 'A recursive function needs a base case that directly answers a small instance and a recursive step that moves toward it. Define the valid input domain so progress is clear: sumTo(n) below expects nonnegative n and decreases by one until zero. Each call has its own parameters and local state, and remains active while waiting for its child’s result.\n\nReturning from the deepest call does not return from all calls at once. Each caller resumes, combines the returned result and returns its own result. An iterative loop can accumulate the same computation with fixed workspace. Some recursive algorithms need an explicit stack to translate their pending work faithfully.\n\nNaive Fibonacci repeats overlapping subproblems. Memoization saves each result so it is computed once; for bounded integer indices, a vector can provide direct lookup. It reduces repeated work but still needs cache storage and often linear recursion depth. Backtracking passes a partial result down, explores a choice, then restores that partial result before another branch.',
    code: String.raw`#include <iostream>

int sumTo(int n) {
    if (n == 0) {
        return 0;
    }
    int smaller = sumTo(n - 1);
    return n + smaller;
}

int main() {
    std::cout << sumTo(3) << '\n';
}`,
    output: '6\n',
    trace: 'Calls descend: sumTo(3) waits for sumTo(2), which waits for sumTo(1), which waits for sumTo(0).\nReturns ascend:\n1. sumTo(0) returns 0 directly.\n2. sumTo(1) receives smaller=0 and returns 1.\n3. sumTo(2) receives smaller=1 and returns 3.\n4. sumTo(3) receives smaller=3 and returns 6.\nThere are four active calls at maximum depth. For general valid n with representable results, time and usual call storage are O(n).',
    pitfalls: 'A base case is not enough if some inputs move away from it: negative n in this version keeps decreasing rather than reaching zero. Validate inputs and result range. Large n can exhaust call storage even when arithmetic is safe. Neither a fixed frame size nor tail-call elimination is guaranteed by C++.\n\nMemoization does not make every recursive algorithm linear; count the number of distinct states and the work per state. An explicit stack avoids reliance on recursive call depth but still consumes memory and can exhaust it. Prefer a loop for this simple sum when depth grows with input.',
    practice: 'Write an iterative sum with a running total and compare its O(1) workspace with recursive O(n) call storage. Trace sumTo(0) and explain why negative input must be rejected or assigned a separate meaning. For subset backtracking, explain why each pushed choice must be popped before exploring another branch.',
    decision: ['What must accompany a recursion base case to guarantee termination for the valid input domain?', ['A larger local variable', 'A recursive step that progresses toward the base case', 'A virtual destructor', 'A compiler promise to remove recursion'], 1, 'Every recursive path must reduce a suitable measure toward a base case. Merely including a base-case branch does not ensure that all inputs reach it.'],
    check: ['Memoizing a linear-depth recursive computation automatically reduces its call storage to O(1).', false, 'Caching can reduce repeated work while the active call chain still has linear depth. Time, cache storage and call storage must be analyzed separately.'],
    alternatives: ['3', '0', '9'],
  },
};

export function withBeginnerLessons(units: Unit[]): Unit[] {
  return units.map(unit => {
    const lesson = lessons[unit.weekNumber];
    if (!lesson) throw new Error(`Missing teaching content for ${unit.id}`);
    const decision = lesson.decision;
    const check = lesson.check;
    const predictionOptions = [...lesson.alternatives];
    const predictionIndex = unit.weekNumber % 4;
    predictionOptions.splice(predictionIndex, 0, lesson.output.trim());
    const questions: Unit['quiz']['questions'] = [
      {
        id: `q-t${unit.weekNumber}-1`, type: 'code_output',
        question: 'Trace the program. What does it write to standard output?',
        codeSnippet: lesson.code,
        options: predictionOptions,
        correctAnswerIndex: predictionIndex, explanation: lesson.trace,
      },
      {
        id: `q-t${unit.weekNumber}-2`, type: 'mcq', question: decision[0],
        options: decision[1], correctAnswerIndex: decision[2], explanation: decision[3],
      },
      {
        id: `q-t${unit.weekNumber}-3`, type: 'true_false', question: check[0],
        options: ['True', 'False'], correctAnswerIndex: check[1] ? 0 : 1, explanation: check[2],
      },
    ];
    return {
      ...unit,
      deepDive: teachingDeepDive(unit.weekNumber),
      codeExamples: withExampleTeachingNotes(unit.weekNumber, unit.codeExamples),
      theory: {
        overview: lesson.overview,
        sections: [
          { title: '1. Build the mental model', content: lesson.model },
          { title: '2. Work through a complete example', content: lesson.trace,
            codeSnippets: [{ title: 'Read, predict, then run (C++20)', code: lesson.code,
              explanation: `Expected standard output:\n${lesson.output.trimEnd()}` }] },
          { title: '3. Common mistakes, limits and choices', content: lesson.pitfalls },
          { title: '4. Check your understanding', content: lesson.practice,
            callout: { type: 'info', text: 'Predict the result before running the code. Explain which rule produces it, then change one assumption and check whether your reasoning still holds.' } },
        ],
      },
      exercises: {
        ...unit.exercises,
        trueFalse: [{ id: `tf-t${unit.weekNumber}-1`, statement: check[0], isTrue: check[1], explanation: check[2] }],
        mcqs: [{ id: `mcq-t${unit.weekNumber}-1`, question: decision[0], options: decision[1], correctAnswer: decision[2], explanation: decision[3] }],
        whyThisWorks: [{ id: `wtw-t${unit.weekNumber}-1`, title: 'Explain the worked example',
          code: lesson.code, question: 'Explain each state change and why this program is valid under its stated assumptions.',
          stepByStep: lesson.trace.split('\n').filter(Boolean), coreConcept: lesson.overview }],
      },
      quiz: { ...unit.quiz, title: `${unit.title} — Understanding Check`, questions },
    };
  });
}
