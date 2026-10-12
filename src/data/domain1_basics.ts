import { Unit } from "../types";

/**
 * Domain I: Language Basics & Systems Foundations (Topics 1–18)
 * Progressive pedagogical ramp: Program Structure -> Types -> Memory Sizes & Casting -> Operators -> Math -> I/O -> Conditionals -> Loops -> Functions & References -> Strings -> Pointers & Memory -> Compilation -> Namespaces -> Exceptions -> Classes & Object Lifecycle -> Systems Comparison -> STL Architecture -> Smart Pointers & RAII.
 */
export const DOMAIN_1_UNITS: Unit[] = [
  {
    "id": "topic-1",
    "weekNumber": 1,
    "phaseId": "phase-1",
    "title": "C++ Program Structure & Standards",
    "subtitle": "main(), #include <iostream>, Compilation Basics & the Zero-Overhead Principle",
    "goals": "Understand how a C++ program is structured, how code executes starting from main(), how std::cout works, and the Zero-Overhead Principle.",
    "topics": [
      "Basic Program Structure",
      "main() Entry Point",
      "#include <iostream>",
      "std::cout & Semicolons",
      "Preview: Program Flow & Return Values",
      "Zero-Overhead Principle"
    ],
    "theory": {
      "overview": "Every C++ program begins execution at the main() function. Unlike interpreted languages (Python) or bytecode-virtual-machine languages (Java), C++ compiles directly into native machine code executed by the CPU. Its guiding philosophy is Bjarne Stroustrup's Zero-Overhead Principle: 'What you don't use, you don't pay for. And what you do use, you couldn't hand-code any better.'",
      "sections": [
        {
          "title": "1. Anatomy of a First C++ Program",
          "content": "A minimal standard C++ program consists of an include directive, the main() entry point, statements ending in semicolons, and a return code indicating success to the operating system:",
          "codeSnippets": [
            {
              "title": "Hello, World! in Standard C++",
              "code": "#include <iostream>\n\n// Entry point: execution starts here\nint main() {\n    // std::cout sends text to the standard console output\n    std::cout << \"Hello, modern C++!\\n\";\n    return 0; // 0 signals successful execution to the operating system\n}",
              "explanation": "#include <iostream> gives access to std::cout. Every statement ends with a semicolon. Returning 0 signals success."
            }
          ]
        },
        {
          "title": "2. Preview: Program Flow & Return Values",
          "content": "In C++, code is organized into structured blocks and statements. Values can be evaluated and returned back to the caller. (Note: This preview contains a function and conditional. Don't worry about their full syntax yet—we will learn them properly in dedicated later lessons: Conditionals in Topic 7, Functions in Topic 9!):",
          "codeSnippets": [
            {
              "title": "Basic Function with Conditional Return",
              "code": "// Takes an integer value and clamps it between low and high\nint clampValue(int value, int low, int high) {\n    if (value < low) {\n        return low;\n    }\n    if (value > high) {\n        return high;\n    }\n    return value;\n}",
              "explanation": "Preview: Functions return results using the return statement. We will study functions and conditionals in depth later."
            }
          ]
        }
      ]
    },
    "deepDive": {
      "topic": "Zero-Overhead Principle & Compilers",
      "breakdown": [
        "C++ compiles directly into CPU instructions without mandatory garbage collection pauses or runtime interpreters.",
        "Simple functions like clampValue inline directly into calling code with zero function call overhead.",
        "You never pay for language features you do not use in your code."
      ],
      "interviewQuestion": "What is the Zero-Overhead Principle in C++, and how does it differentiate C++ from languages like Java or Python?",
      "idealAnswer": "The Zero-Overhead Principle asserts that: 1) What you do not use, you do not pay for (no mandatory garbage collector pauses, no forced object headers, no runtime interpreter tax); and 2) What you do use, you could not hand-code any better. C++ gives software engineers direct, deterministic hardware control with zero hidden runtime overhead."
    },
    "codeExamples": [
      {
        "id": "ex-t1-1",
        "title": "First C++ Program with Functions",
        "code": "#include <iostream>\n\nint clampValue(int val, int low, int high) {\n    if (val < low) return low;\n    if (val > high) return high;\n    return val;\n}\n\nint main() {\n    int inputVal = 25;\n    int clamped = clampValue(inputVal, 10, 20);\n    std::cout << \"Clamped result: \" << clamped << \"\\n\";\n    return 0;\n}",
        "explanation": "Demonstrates standard includes, a preview of function syntax, and formatted output with std::cout.",
        "output": "Clamped result: 20",
        "keyTakeaways": [
          "Every C++ program starts in main()",
          "Output uses std::cout and the << operator",
          "Preview: Statements and return values pass results back to the caller (detailed in later topics)"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t1-1",
          "statement": "The Zero-Overhead Principle means that using C++ features never incurs compile-time overhead.",
          "isTrue": false,
          "explanation": "The Zero-Overhead Principle applies strictly to runtime efficiency. Heavy compile-time optimizations can still increase compilation duration."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t1-1",
          "question": "Where does program execution begin in every standard C++ executable?",
          "options": [
            "At the first line of the source file",
            "In the main() function",
            "Inside the <iostream> header",
            "In the operating system kernel"
          ],
          "correctAnswer": 1,
          "explanation": "Every standard C++ executable program begins execution at the main() function."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t1-1",
          "title": "Compiler Function Inlining",
          "code": "int doubleValue(int n) {\n    return n * 2;\n}\n\nint x = doubleValue(21);",
          "question": "Why can the call to doubleValue(21) execute with zero runtime function-call overhead in C++?",
          "stepByStep": [
            "The compiler analyzes the small, straightforward function definition.",
            "During optimization, it inlines the expression (21 * 2) directly into the call site.",
            "Constant folding evaluates 21 * 2 to 42 at compile time, eliminating any runtime CPU call instructions."
          ],
          "coreConcept": "The Zero-Overhead Principle means simple abstractions can be inlined directly by the compiler with zero runtime penalty."
        }
      ],
      "codingChallenge": {
        "id": "cc-t1",
        "title": "Standard Console Output",
        "difficulty": "Easy",
        "initialCode": "#include <iostream>\n\nint main() {\n    // Print \"Hello, modern C++!\" to standard console output\n    // Write your code here\n    \n    return 0;\n}",
        "solutionCode": "#include <iostream>\n\nint main() {\n    std::cout << \"Hello, modern C++!\\n\";\n    return 0;\n}",
        "expectedBehavior": "Print \"Hello, modern C++!\" to standard output and return 0.",
        "hints": [
          "Include <iostream> for access to std::cout",
          "Use std::cout << \"Hello, modern C++!\\n\"; to output text",
          "Return 0 to signal successful execution to the operating system"
        ],
        "testCases": [
          {
            "input": "",
            "expectedOutput": "Hello, modern C++!"
          },
          {
            "input": "run",
            "expectedOutput": "Hello, modern C++!"
          },
          {
            "input": "test",
            "expectedOutput": "Hello, modern C++!"
          }
        ],
        "driverCode": ""
      }
    },
    "quiz": {
      "id": "quiz-t1",
      "title": "C++ Evolution Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t1-1",
          "type": "mcq",
          "question": "Who designed and created C++ at Bell Labs?",
          "options": [
            "Dennis Ritchie",
            "Bjarne Stroustrup",
            "Ken Thompson",
            "James Gosling"
          ],
          "correctAnswerIndex": 1,
          "explanation": "Bjarne Stroustrup created C++ starting in 1979."
        },
        {
          "id": "q-t1-2",
          "type": "mcq",
          "question": "What is the primary implication of the Zero-Overhead Principle?",
          "options": [
            "All functions must be marked inline",
            "You only pay for features you actually use, with no hidden mandatory runtime tax",
            "Garbage collection is always disabled",
            "The compiler uses zero memory during compilation"
          ],
          "correctAnswerIndex": 1,
          "explanation": "The principle guarantees you only pay runtime costs for features you opt into."
        }
      ]
    }
  },
  {
    "id": "topic-2",
    "weekNumber": 2,
    "phaseId": "phase-1",
    "title": "Fundamental Types & Variables",
    "subtitle": "Primitive Types, Modern Uniform Initialization, Scope & Basic String Processing",
    "goals": "Master C++ primitive types (int, double, char, bool), variable declarations, uniform brace initialization, variable scope, and basic string tokenization.",
    "topics": [
      "Primitive Types (int, double, char, bool)",
      "Variable Declaration & Initialization",
      "Uniform Brace Initialization",
      "Variable Scope & Lifetime",
      "std::string Basics",
      "Token Parsing"
    ],
    "theory": {
      "overview": "Variables in C++ are named memory locations with strict static types. Unlike dynamically-typed languages, the C++ compiler must know the exact type and byte size of every variable at compile time to allocate stack space and generate optimal CPU instructions.",
      "sections": [
        {
          "title": "1. Core Primitive Types",
          "content": "Standard C++ provides built-in types for different kinds of values:\n• **int**: Standard signed integer (typically 32-bit / 4 bytes).\n• **double**: Double-precision floating-point number (64-bit / 8 bytes).\n• **float**: Single-precision floating-point (32-bit / 4 bytes).\n• **char**: Single character / ASCII code byte (1 byte, e.g. 'A').\n• **bool**: Boolean truth value (true or false, 1 byte).\n• **std::string**: Standard Library type representing dynamic character text.",
          "codeSnippets": [
            {
              "title": "Declaring and Initializing Core Types",
              "code": "#include <iostream>\n#include <string>\n\nint main() {\n    int age = 25;                  // integer\n    double salary = 85000.50;      // floating-point\n    char tier = 'A';               // single character\n    bool isActive = true;          // boolean\n    std::string role = \"Engineer\"; // text string\n\n    std::cout << role << \" is active: \" << isActive << \"\\n\";\n    return 0;\n}",
              "explanation": "Variables should always be initialized upon declaration to avoid holding indeterminate garbage data from the stack."
            }
          ]
        },
        {
          "title": "2. Modern Uniform Initialization & auto",
          "content": "C++11 introduced uniform/brace initialization using curly braces `{}`. This syntax prevents accidental narrowing conversions (e.g. implicitly truncating a floating-point number into an integer) and ensures deterministic zero-initialization:",
          "codeSnippets": [
            {
              "title": "Brace Initialization vs Narrowing",
              "code": "int count{10};      // Clean, unambiguous initialization\nint defaultVal{};   // Guaranteed zero-initialization (defaultVal is 0)\n\n// int bad{3.14};   // COMPILE ERROR: narrowing conversion from double to int rejected!\n\nauto items = 42;    // 'auto' instructs the compiler to deduce the type (int)",
              "explanation": "Brace initialization {} catches type conversion bugs at compile-time that old C-style syntax silently accepted."
            }
          ]
        }
      ]
    },
    "deepDive": {
      "topic": "Uninitialized Memory & Scope Lifecycles",
      "breakdown": [
        "In C++, local variables on the stack are NOT automatically zeroed by default if declared without an initializer (e.g. 'int x;').",
        "Reading an uninitialized local variable invokes Undefined Behavior (UB), reading whatever residual bits previously occupied that stack memory.",
        "Always use brace initialization 'int x{};' or an explicit value 'int x = 0;' to guarantee valid initial state.",
        "A variable's lifetime is bounded by its enclosing block scope { ... }; when execution reaches the closing brace, its memory is automatically reclaimed."
      ],
      "interviewQuestion": "What is Undefined Behavior in C++, and why is reading an uninitialized variable an example of it?",
      "idealAnswer": "Undefined Behavior (UB) means the C++ standard places no constraints on what the compiled program may do: it may appear to work, crash with a segmentation fault, output corrupted data, or be completely optimized away by compiler transformations. Reading an uninitialized variable is UB because the memory contains indeterminate residual bits, making program state non-deterministic."
    },
    "codeExamples": [
      {
        "id": "ex-t2-1",
        "title": "Fundamental Types, Uniform Initialization & Block Scope",
        "code": "#include <iostream>\n#include <string>\n\nint main() {\n    // 1. Core primitive types with uniform brace initialization\n    int quantity{5};\n    double unitPrice{19.99};\n    char grade{'A'};\n    bool inStock{true};\n    std::string itemName = \"Mechanical Keyboard\";\n\n    // 2. Calculations using fundamental arithmetic\n    double subtotal = quantity * unitPrice;\n    double taxRate = 0.08;\n    double totalCost = subtotal + (subtotal * taxRate);\n\n    // 3. Block scope demonstrating variable lifetime\n    {\n        double discount = 5.00;\n        totalCost -= discount;\n        std::cout << \"Item: \" << itemName << \" | Total after discount: $\" << totalCost << \"\\n\";\n    } // 'discount' leaves scope and is destroyed here!\n\n    std::cout << \"Grade: \" << grade << \" | In Stock: \" << inStock << \"\\n\";\n    return 0;\n}",
        "explanation": "Demonstrates primitive types (int, double, char, bool, std::string), uniform brace initialization, basic numeric expressions, and block-scoped variable lifetime.",
        "output": "Item: Mechanical Keyboard | Total after discount: $102.946\nGrade: A | In Stock: 1",
        "keyTakeaways": [
          "Primitive types allocate directly on the stack with deterministic sizes",
          "Uniform brace initialization {} prevents narrowing conversions",
          "Variables declared in an inner block are destroyed when that block scope ends"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t2-1",
          "statement": "In C++, local variables declared without an initializer are automatically initialized to zero.",
          "isTrue": false,
          "explanation": "Local stack variables in C++ contain indeterminate garbage memory unless explicitly initialized."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t2-1",
          "question": "Which initialization syntax prevents accidental narrowing conversions (e.g. assigning 3.14 to an int)?",
          "options": [
            "int x = 3.14;",
            "int x(3.14);",
            "int x{3.14};",
            "auto x = (int)3.14;"
          ],
          "correctAnswer": 2,
          "explanation": "Uniform brace initialization int x{3.14}; produces a compiler error when a narrowing conversion occurs."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t2-1",
          "title": "Brace Initialization Narrowing Guard",
          "code": "int a = 3.14; // Compiles, silently truncates to 3\n// int b{3.14}; // COMPILE ERROR: narrowing conversion",
          "question": "Why does modern C++ brace initialization reject 'int b{3.14};' at compile time?",
          "stepByStep": [
            "Traditional C-style assignment int a = 3.14 silently truncates the decimal part, potentially causing subtle bugs.",
            "Modern C++ uniform brace initialization {} enforces strict type safety during variable initialization.",
            "The compiler detects that converting 3.14 (a double) to int loses precision and produces a compile error."
          ],
          "coreConcept": "Uniform brace initialization prevents unintentional narrowing conversions and data loss at compile time."
        }
      ],
      "codingChallenge": {
        "id": "cc-t2",
        "title": "Calculate Total Bill",
        "difficulty": "Easy",
        "initialCode": "#include <iostream>\n\n// Calculate total: (quantity * unitPrice) + shippingFee\n// All calculations use fundamental types (int and double) passed by value\ndouble calculateTotal(int quantity, double unitPrice, double shippingFee) {\n    // Write your code here\n    return 0.0;\n}",
        "solutionCode": "#include <iostream>\n\ndouble calculateTotal(int quantity, double unitPrice, double shippingFee) {\n    return (quantity * unitPrice) + shippingFee;\n}",
        "expectedBehavior": "Return (quantity * unitPrice) + shippingFee.",
        "hints": [
          "Multiply quantity by unitPrice to get the subtotal",
          "Add shippingFee to the subtotal and return the result"
        ],
        "testCases": [
          {
            "input": "5 10.0 5.0",
            "expectedOutput": "55"
          },
          {
            "input": "2 15.5 4.0",
            "expectedOutput": "35"
          },
          {
            "input": "10 2.5 0.0",
            "expectedOutput": "25"
          }
        ],
        "driverCode": "#include <iostream>\nint main() {\n    int q;\n    double p, s;\n    if (std::cin >> q >> p >> s) {\n        std::cout << calculateTotal(q, p, s) << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t2",
      "title": "Fundamental Types & Variables Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t2-1",
          "type": "mcq",
          "question": "What happens if you read a local variable declared simply as 'int x;' without assigning a value?",
          "options": [
            "It always returns 0",
            "The compiler raises a runtime exception",
            "It invokes Undefined Behavior because it reads uninitialized stack memory",
            "The program automatically sets it to null"
          ],
          "correctAnswerIndex": 2,
          "explanation": "Reading an uninitialized local variable is Undefined Behavior in standard C++."
        }
      ]
    }
  },
  {
    "id": "topic-3",
    "weekNumber": 3,
    "phaseId": "phase-1",
    "title": "Variables, Memory Lifecycles & Casting",
    "subtitle": "Memory Sizes, Byte Layout, const Immutability & Safe static_cast",
    "goals": "Understand how types occupy physical memory (sizeof), stack memory lifecycles, const immutability, and safe numeric conversions with static_cast.",
    "topics": [
      "Memory Layout of Variables",
      "sizeof Operator",
      "Stack Storage Duration",
      "const Immutability",
      "static_cast vs C-Style Casts",
      "Temperature Conversion"
    ],
    "theory": {
      "overview": "Every variable in C++ occupies a contiguous block of bytes in memory. The byte size, memory alignment, and valid values are strictly governed by its type. Understanding physical memory layout and explicit type conversion is essential for writing bug-free systems code.",
      "sections": [
        {
          "title": "1. Physical Memory Size & The sizeof Operator",
          "content": "You can query the exact byte footprint of any type or variable at compile-time using `sizeof`:\n• `sizeof(char)`: Guaranteed by standard to be exactly 1 byte.\n• `sizeof(int)`: Typically 4 bytes (32 bits, range approx -2 billion to +2 billion).\n• `sizeof(double)`: Typically 8 bytes (64-bit IEEE 754 floating-point).\n\nWhen a local variable is defined, the compiler reserves that number of bytes on the current function's call stack frame.",
          "codeSnippets": [
            {
              "title": "Checking Memory Footprint",
              "code": "#include <iostream>\n\nint main() {\n    int count = 100;\n    std::cout << \"int size: \" << sizeof(int) << \" bytes\\n\";\n    std::cout << \"variable size: \" << sizeof(count) << \" bytes\\n\";\n    return 0;\n}",
              "explanation": "sizeof returns the size in bytes (as a std::size_t) evaluated entirely at compile time."
            }
          ]
        },
        {
          "title": "2. const Correctness & Safe static_cast",
          "content": "Marking variables `const` guarantees they cannot be mutated after initialization. When converting between numeric types, always prefer `static_cast<Type>(value)` over old C-style casts `(Type)value` to ensure compile-time validation:",
          "codeSnippets": [
            {
              "title": "Explicit Casting with static_cast",
              "code": "const double pi = 3.14159;\n// int truncated = pi; // Warning: implicit conversion can lose precision\n\nint safeInt = static_cast<int>(pi); // Explicit, safe, readable intent (becomes 3)\n\nint celsius = 25;\n// Fixed-point temperature conversion: (celsius * 9) / 5 + 32\nint fahrenheit = static_cast<int>((celsius * 9.0) / 5.0 + 32.0);",
              "explanation": "static_cast tells the compiler and code reviewers that the type conversion is deliberate and intentional."
            }
          ]
        }
      ]
    },
    "deepDive": {
      "topic": "const vs constexpr vs consteval",
      "breakdown": [
        "const: Runtime or compile-time read-only variable (immutable once initialized).",
        "constexpr: Guaranteed to be evaluatable at compile time if inputs are known, but can also run at runtime.",
        "consteval (C++20): Immediate function — MUST execute at compile-time, compiler error otherwise."
      ],
      "interviewQuestion": "Why should you prefer static_cast over C-style casts `(Type)val` in Modern C++?",
      "idealAnswer": "C-style casts `(Type)val` are dangerous because they silently perform any combination of static_cast, const_cast, and reinterpret_cast without compiler validation. `static_cast` enforces compile-time safety and prevents accidental dangerous conversions (like casting unrelated pointer types or silently stripping constness). It is also searchable in codebases."
    },
    "codeExamples": [
      {
        "id": "ex-t3-1",
        "title": "Uniform Initialization & static_cast",
        "code": "#include <iostream>\n\nint main() {\n    // Uniform/brace initialization prevents narrowing conversions\n    int x{42};\n    double pi{3.14159};\n\n    // Explicit type conversion\n    int truncatedPi = static_cast<int>(pi);\n    std::cout << \"x: \" << x << \", truncated: \" << truncatedPi << \"\\n\";\n    return 0;\n}",
        "explanation": "Brace initialization int x{3.14} would produce a compile error for narrowing, preventing silent precision loss.",
        "output": "x: 42, truncated: 3",
        "keyTakeaways": [
          "Prefer uniform initialization {}",
          "static_cast makes truncation deliberate and explicit"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t3-1",
          "statement": "In C++, a variable declared with the const qualifier can be assigned a new value later in the same function.",
          "isTrue": false,
          "explanation": "The const qualifier guarantees immutability; once initialized, a const variable cannot be modified."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t3-1",
          "question": "Which keyword guarantees that a variable or function calculation is completed during compilation?",
          "options": [
            "volatile",
            "constexpr",
            "inline",
            "extern"
          ],
          "correctAnswer": 1,
          "explanation": "constexpr guarantees that the value can be computed at compile-time."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t3-1",
          "title": "Explicit Casting with static_cast",
          "code": "double temperature = 98.6;\nint rounded = static_cast<int>(temperature);",
          "question": "Why is 'static_cast<int>(temperature)' preferred over an implicit conversion or C-style '(int)temperature'?",
          "stepByStep": [
            "Converting a floating-point number to an integer drops the fractional digits, resulting in 98.",
            "An implicit conversion may happen accidentally or trigger compiler warnings.",
            "static_cast explicitly signals developer intent to both the compiler and code reviewers, preventing accidental unsafe conversions."
          ],
          "coreConcept": "static_cast explicitly documents and validates type conversions at compile time."
        }
      ],
      "codingChallenge": {
        "id": "cc-t4",
        "title": "Safe Fixed-Point Temperature Converter",
        "difficulty": "Easy",
        "initialCode": "#include <iostream>\n\n// Convert Celsius float to Fahrenheit integer rounded down using static_cast\nint celsiusToFahrenheitInt(double celsius) {\n    // F = (C * 9.0 / 5.0) + 32.0\n    return 0;\n}",
        "solutionCode": "#include <iostream>\n\nint celsiusToFahrenheitInt(double celsius) {\n    double f = (celsius * 9.0 / 5.0) + 32.0;\n    return static_cast<int>(f);\n}",
        "expectedBehavior": "Return Fahrenheit temperature truncated to integer.",
        "hints": [
          "Calculate in double, then static_cast<int>"
        ],
        "testCases": [
          {
            "input": "0",
            "expectedOutput": "32"
          },
          {
            "input": "100",
            "expectedOutput": "212"
          },
          {
            "input": "25.5",
            "expectedOutput": "77"
          }
        ],
        "driverCode": "#include <iostream>\nint main() {\n    double c;\n    if (std::cin >> c) {\n        std::cout << celsiusToFahrenheitInt(c) << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t3",
      "title": "Variables & Memory Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t3-1",
          "type": "mcq",
          "question": "Where are local non-static variables allocated?",
          "options": [
            "BSS segment",
            "Call stack",
            "Heap",
            "Text segment"
          ],
          "correctAnswerIndex": 1,
          "explanation": "Local variables with automatic storage duration are allocated on the call stack."
        }
      ]
    }
  },
  {
    "id": "topic-4",
    "weekNumber": 4,
    "phaseId": "phase-1",
    "title": "Operator Precedence & Short-Circuit Evaluation",
    "subtitle": "Associativity, Bitwise vs Equality Traps & Short-Circuit && / ||",
    "goals": "Understand operator precedence hierarchies, parenthesization defensive rules, and short-circuit evaluation guarantees.",
    "topics": [
      "Precedence Hierarchy",
      "Associativity",
      "Bitwise vs Equality Traps",
      "Short-Circuit && and ||"
    ],
    "theory": {
      "overview": "Operator precedence determines grouping of operands with operators in expressions. Equality `==` has higher precedence than bitwise AND `&`, making `a & mask == 0` a classic production bug. Short-circuit evaluation guarantees left-to-right order.",
      "sections": [
        {
          "title": "1. The Bitwise vs Equality Precedence Trap",
          "content": "In C++, `==` has higher precedence than `&`. Therefore:\n`if (flags & MASK == 0)`\nis evaluated by the compiler as:\n`if (flags & (MASK == 0))`\nAlways parenthesize bitwise operations: `if ((flags & MASK) == 0)`."
        },
        {
          "title": "2. Short-Circuit Evaluation",
          "content": "• `A && B`: If `A` evaluates to `false`, `B` is NEVER evaluated.\n• `A || B`: If `A` evaluates to `true`, `B` is NEVER evaluated.\nThis allows safe guard checks: `if (count > 0 && (total / count) >= 10)`."
        }
      ]
    },
    "deepDive": {
      "topic": "Safe Guard Conditions via Short-Circuiting",
      "breakdown": [
        "In `divisor != 0 && (total / divisor) > 0`, the right division is only executed if divisor is non-zero.",
        "Short-circuit evaluation is guaranteed for built-in logical operators && and || from left to right."
      ],
      "interviewQuestion": "What is short-circuit evaluation in C++, and why is it important?",
      "idealAnswer": "Short-circuit evaluation guarantees that in logical AND (&&) expressions, if the left operand evaluates to false, the right operand is never evaluated. Similarly in logical OR (||), if the left operand is true, the right operand is skipped. This is crucial for writing safe guard expressions, such as verifying a divisor is non-zero before dividing."
    },
    "codeExamples": [
      {
        "id": "ex-t4-1",
        "title": "Short-Circuit Evaluation & Bitmask Checks",
        "code": "#include <iostream>\n\nint main() {\n    int divisor = 0;\n    int total = 100;\n\n    // Safe short circuit: divisor != 0 is false, so (total / divisor) is NEVER evaluated!\n    if (divisor != 0 && (total / divisor) > 5) {\n        std::cout << \"Quotient is large\\n\";\n    } else {\n        std::cout << \"Safe: bypassed division by zero\\n\";\n    }\n\n    int flags = 0b00000100;\n    int mask = 0b00000100;\n    // Proper parenthesization: == has higher precedence than &\n    if ((flags & mask) != 0) {\n        std::cout << \"Flag bit is SET\\n\";\n    }\n    return 0;\n}",
        "explanation": "Short-circuit prevents division by zero; explicit parentheses guarantee bitwise AND precedes comparison.",
        "output": "Safe: bypassed division by zero\nFlag bit is SET",
        "keyTakeaways": [
          "Short circuit guards arithmetic operations",
          "Always parenthesize bitwise operations before equality"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t4-1",
          "statement": "In C++, if the left operand of an && expression evaluates to false, the right operand is still evaluated.",
          "isTrue": false,
          "explanation": "C++ guarantees short-circuit evaluation: if the left operand of && is false, the right operand is never evaluated."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t4-1",
          "question": "How does the compiler evaluate the expression `x & 1 == 0`?",
          "options": [
            "`(x & 1) == 0`",
            "`x & (1 == 0)`",
            "Compile error: ambiguous precedence",
            "`(x & (1 == 0)) & 0`"
          ],
          "correctAnswer": 1,
          "explanation": "Equality (==) binds tighter than bitwise AND (&), so it evaluates as `x & (1 == 0)`."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t4-1",
          "title": "Safe Division Guard via Short-Circuiting",
          "code": "int count = 0;\nint total = 50;\nif (count > 0 && (total / count) > 5) {\n    std::cout << \"Valid\\n\";\n}",
          "question": "Why is this guaranteed not to cause a divide-by-zero crash when count is 0?",
          "stepByStep": [
            "The left operand 'count > 0' evaluates to false when count is 0.",
            "The && operator guarantees short-circuit evaluation: the right operand '(total / count) > 5' is skipped completely.",
            "Execution safely skips the if block with zero runtime division errors."
          ],
          "coreConcept": "Logical AND guarantees left-to-right short-circuit execution, preventing unsafe second operands from executing."
        }
      ],
      "codingChallenge": {
        "id": "cc-t6",
        "title": "Is Bit Set With Precedence",
        "difficulty": "Easy",
        "initialCode": "#include <iostream>\n\n// Return true if the bit at (0-indexed) position 'bitIndex' is 1\nbool isBitSet(int num, int bitIndex) {\n    // Write your code here using (num & (1 << bitIndex)) != 0\n    return false;\n}",
        "solutionCode": "#include <iostream>\n\nbool isBitSet(int num, int bitIndex) {\n    return (num & (1 << bitIndex)) != 0;\n}",
        "expectedBehavior": "Return 1 (true) if bit is set, else 0 (false).",
        "hints": [
          "Bit shift 1 by bitIndex, then bitwise AND with num, parenthesized properly"
        ],
        "testCases": [
          {
            "input": "8 3",
            "expectedOutput": "1"
          },
          {
            "input": "8 2",
            "expectedOutput": "0"
          },
          {
            "input": "7 0",
            "expectedOutput": "1"
          }
        ],
        "driverCode": "#include <iostream>\nint main() {\n    int n, b;\n    if (std::cin >> n >> b) {\n        std::cout << isBitSet(n, b) << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t4",
      "title": "Operator Precedence Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t4-1",
          "type": "mcq",
          "question": "Which operator has higher precedence: `==` or `&`?",
          "options": [
            "& has higher precedence",
            "== has higher precedence",
            "They have equal precedence",
            "It depends on compiler flags"
          ],
          "correctAnswerIndex": 1,
          "explanation": "== has higher precedence than &, creating common precedence bugs without parentheses."
        }
      ]
    }
  },
  {
    "id": "topic-5",
    "weekNumber": 5,
    "phaseId": "phase-1",
    "title": "Math Operations & Numeric Safety",
    "subtitle": "Integer Overflow UB, Division Truncation, IEEE 754 & Epsilon Comparisons",
    "goals": "Master signed integer overflow undefined behavior, division by zero, and IEEE 754 floating-point epsilon comparisons.",
    "topics": [
      "Signed Overflow UB",
      "Unsigned Wrap-around",
      "Division Truncation",
      "IEEE 754",
      "std::numeric_limits",
      "Floating Point Epsilon"
    ],
    "theory": {
      "overview": "In C++, signed integer overflow is Undefined Behavior (UB), allowing compilers to optimize away overflow checks! Unsigned integers wrap modulo $2^N$. Floating-point numbers follow IEEE 754 and must NEVER be compared with `==` due to rounding errors.",
      "sections": [
        {
          "title": "1. Signed Overflow vs Unsigned Wrap-around",
          "content": "• **Signed integers (`int`, `int64_t`)**: Overflow is explicitly Undefined Behavior under the C++ standard. Compilers like GCC/Clang assume signed integers never overflow, optimizing out loops or condition checks.\n• **Unsigned integers (`uint32_t`, `size_t`)**: Defined modulo arithmetic: `UINT_MAX + 1 == 0`."
        },
        {
          "title": "2. Safe Floating Point Comparisons",
          "content": "Never use `a == b` for floating point (`float`, `double`). Rounding errors mean $0.1 + 0.2 \\neq 0.3$. Always compare with an epsilon tolerance:\n`std::abs(a - b) <= std::numeric_limits<double>::epsilon() * std::max(std::abs(a), std::abs(b))`."
        }
      ]
    },
    "deepDive": {
      "topic": "Compiler Optimization of Signed Overflow UB",
      "breakdown": [
        "In `if (x + 1 > x)`, since signed overflow is UB, the compiler assumes `x + 1` never overflows and optimizes the entire branch to `true`!",
        "Use safe arithmetic functions or check preconditions before adding: `if (a > INT_MAX - b)`."
      ],
      "interviewQuestion": "Why is signed integer overflow undefined behavior in C++, and what are the consequences?",
      "idealAnswer": "Signed integer overflow is UB so compilers can assume loop counters never wrap, enabling aggressive loop vectorization and unrolling. However, if code triggers signed overflow, the compiler may delete bounds checks or security validations, leading to severe vulnerabilities."
    },
    "codeExamples": [
      {
        "id": "ex-t5-1",
        "title": "Epsilon Floating-Point Comparison",
        "code": "#include <iostream>\n#include <cmath>\n#include <limits>\n\nbool almostEqual(double a, double b, double epsilon = 1e-9) {\n    return std::abs(a - b) < epsilon;\n}\n\nint main() {\n    double a = 0.1 + 0.2;\n    double b = 0.3;\n\n    std::cout << \"Direct equality (a == b): \" << (a == b ? \"true\" : \"false\") << \"\\n\";\n    std::cout << \"Epsilon equality: \" << (almostEqual(a, b) ? \"true\" : \"false\") << \"\\n\";\n    return 0;\n}",
        "explanation": "Direct == fails due to IEEE 754 binary floating point representation; epsilon comparison succeeds.",
        "output": "Direct equality (a == b): false\nEpsilon equality: true",
        "keyTakeaways": [
          "Never compare floats with ==",
          "Use std::abs(a - b) < epsilon"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t5-1",
          "statement": "Unsigned integer overflow in C++ is undefined behavior.",
          "isTrue": false,
          "explanation": "Unsigned overflow is well-defined as modular arithmetic (wrap-around modulo 2^N). Only signed overflow is undefined behavior."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t5-1",
          "question": "What is the result of integer division `7 / 2` in C++?",
          "options": [
            "3.5",
            "3",
            "4",
            "Undefined behavior"
          ],
          "correctAnswer": 1,
          "explanation": "Integer division truncates toward zero, resulting in 3."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t5-1",
          "title": "Safe Midpoint Calculation",
          "code": "int mid = lo + (hi - lo) / 2;",
          "question": "Why should you use this instead of (lo + hi) / 2?",
          "stepByStep": [
            "If lo and hi are both large (e.g. 1.5 billion), lo + hi exceeds 2.147 billion (INT_MAX).",
            "This triggers signed integer overflow undefined behavior, turning the result negative.",
            "lo + (hi - lo) / 2 computes the subtraction first, avoiding integer overflow entirely."
          ],
          "coreConcept": "Prevent overflow by avoiding direct summation of large integers."
        }
      ],
      "codingChallenge": {
        "id": "cc-t7",
        "title": "Safe Midpoint Calculation",
        "difficulty": "Easy",
        "initialCode": "#include <iostream>\n\n// Return the midpoint without triggering integer overflow\nint safeMidpoint(int lo, int hi) {\n    // Write your code here\n    return 0;\n}",
        "solutionCode": "#include <iostream>\n\nint safeMidpoint(int lo, int hi) {\n    return lo + (hi - lo) / 2;\n}",
        "expectedBehavior": "Calculate and return the midpoint safely.",
        "hints": [
          "Compute lo + (hi - lo) / 2"
        ],
        "testCases": [
          {
            "input": "0 10",
            "expectedOutput": "5"
          },
          {
            "input": "10 20",
            "expectedOutput": "15"
          },
          {
            "input": "1000000000 2000000000",
            "expectedOutput": "1500000000"
          }
        ],
        "driverCode": "#include <iostream>\nint main() {\n    int a, b;\n    if (std::cin >> a >> b) {\n        std::cout << safeMidpoint(a, b) << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t5",
      "title": "Math Operations Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t5-1",
          "type": "mcq",
          "question": "What happens when a signed integer overflows in C++?",
          "options": [
            "It raises a HardwareArithmeticException",
            "It wraps around to INT_MIN",
            "It is Undefined Behavior (UB)",
            "It sets an errno flag"
          ],
          "correctAnswerIndex": 2,
          "explanation": "Signed integer overflow is undefined behavior in ISO C++."
        }
      ]
    }
  },
  {
    "id": "topic-6",
    "weekNumber": 6,
    "phaseId": "phase-1",
    "title": "I/O Streams & High-Throughput I/O",
    "subtitle": "std::cin, std::cout, unbuffered std::cerr vs buffered std::clog & Fast I/O",
    "goals": "Master stream buffers, stream synchronization pitfalls with C stdio, and competitive fast I/O idioms.",
    "topics": [
      "std::cin / std::cout",
      "unbuffered std::cerr",
      "buffered std::clog",
      "sync_with_stdio(false)",
      "cin.tie(nullptr)"
    ],
    "theory": {
      "overview": "C++ I/O streams (`<iostream>`) are type-safe object abstractions layered over stream buffers (`std::streambuf`). By default, C++ streams synchronize with C `stdio` (`printf`/`scanf`), introducing severe performance overhead.",
      "sections": [
        {
          "title": "1. The Standard Streams & Buffering",
          "content": "• `std::cin`: Buffered standard input stream (tied to `std::cout` by default).\n• `std::cout`: Line-buffered or block-buffered standard output.\n• `std::cerr`: Unbuffered standard error. Flushes immediately on every write for crash diagnostics.\n• `std::clog`: Fully buffered standard logging stream."
        },
        {
          "title": "2. Fast I/O Optimization Pattern",
          "content": "```cpp\nstd::ios_base::sync_with_stdio(false);\nstd::cin.tie(nullptr);\n```\n• `sync_with_stdio(false)` disables synchronization between C++ iostreams and C `FILE*` buffers, allowing independent buffering.\n• `cin.tie(nullptr)` unties `cin` from `cout`, preventing automatic `cout` flushing before every `cin` read operation."
        }
      ]
    },
    "deepDive": {
      "topic": "std::endl vs '\\n'",
      "breakdown": [
        "`std::endl` writes a newline AND explicitly flushes the underlying OS stream buffer!",
        "Flushing triggers an expensive user-to-kernel context switch syscall.",
        "In tight loops, using `std::endl` instead of `'\\n'` can slow execution down by 10x–50x!"
      ],
      "interviewQuestion": "Why is 'std::endl' considered an anti-pattern in high-throughput C++ systems?",
      "idealAnswer": "In C++, `std::endl` outputs a newline character `\\n` and explicitly calls `.flush()` on the stream buffer. Flushing forces the OS to immediately write the userspace buffer to the terminal or disk file via a synchronous kernel syscall. In high-throughput logging or loops, this degrades performance by orders of magnitude compared to writing `'\\n'` and letting the buffer flush naturally."
    },
    "codeExamples": [
      {
        "id": "ex-t6-1",
        "title": "Fast I/O and Stream Formatting",
        "code": "#include <iostream>\n#include <iomanip>\n\nint main() {\n    // Fast I/O setup\n    std::ios_base::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n\n    double value = 123.456789;\n    std::cout << std::fixed << std::setprecision(2);\n    std::cout << \"Formatted: $\" << value << \"\\n\"; // $123.46\n    return 0;\n}",
        "explanation": "Disabling stdio sync and stream manipulators format floating numbers with precision.",
        "output": "Formatted: $123.46",
        "keyTakeaways": [
          "Use '\\n' instead of std::endl",
          "cin.tie(nullptr) prevents premature flushes"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t6-1",
          "statement": "std::cerr buffers output until the application terminates or flush is called.",
          "isTrue": false,
          "explanation": "std::cerr is explicitly unbuffered to ensure diagnostic messages are printed even if the program crashes immediately."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t6-1",
          "question": "What does `std::cin.tie(nullptr)` accomplish?",
          "options": [
            "Closes standard input",
            "Unties cin from cout, preventing automatic flushing of cout before input reads",
            "Enables thread safety on cin",
            "Converts cin to read binary data"
          ],
          "correctAnswer": 1,
          "explanation": "Untying cin prevents cout from being automatically flushed prior to every cin read operation."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t6-1",
          "title": "Stream Flushing Overhead",
          "code": "for (int i = 0; i < 10000; ++i) std::cout << i << '\\n';",
          "question": "Why is this much faster than using std::endl inside the loop?",
          "stepByStep": [
            "'\\n' simply writes a character byte into the user-space output buffer.",
            "std::endl writes '\\n' and invokes .flush(), forcing a synchronous write() syscall on every iteration.",
            "Batching output in userspace minimizes kernel context transitions."
          ],
          "coreConcept": "Explicit buffer flushing causes severe system call overhead."
        }
      ],
      "codingChallenge": {
        "id": "cc-t11",
        "title": "Fast Number Inverter",
        "difficulty": "Easy",
        "initialCode": "#include <iostream>\n\n// Return negative of number\nlong long invertNumber(long long n) {\n    // Write your code here\n    return 0;\n}",
        "solutionCode": "#include <iostream>\n\nlong long invertNumber(long long n) {\n    return -n;\n}",
        "expectedBehavior": "Return the negated integer value.",
        "hints": [
          "Return -n"
        ],
        "testCases": [
          {
            "input": "42",
            "expectedOutput": "-42"
          },
          {
            "input": "-100",
            "expectedOutput": "100"
          }
        ],
        "driverCode": "#include <iostream>\nint main() {\n    long long x;\n    if (std::cin >> x) {\n        std::cout << invertNumber(x) << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t6",
      "title": "I/O Streams Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t6-1",
          "type": "mcq",
          "question": "Which stream is buffered standard error logging in C++?",
          "options": [
            "std::cin",
            "std::cout",
            "std::cerr",
            "std::clog"
          ],
          "correctAnswerIndex": 3,
          "explanation": "std::clog is the buffered counterpart to unbuffered std::cerr."
        }
      ]
    }
  },
  {
    "id": "topic-7",
    "weekNumber": 7,
    "phaseId": "phase-1",
    "title": "Conditionals, if-init & Switch Jump Tables",
    "subtitle": "if Statements, C++17 if(init; condition), Switch Jump Tables & [[fallthrough]]",
    "goals": "Master modern conditional syntax, branch prediction considerations, switch jump tables, and [[fallthrough]].",
    "topics": [
      "if-init (C++17)",
      "Switch Jump Tables",
      "[[fallthrough]]",
      "Branch Prediction",
      "[[likely]] / [[unlikely]]"
    ],
    "theory": {
      "overview": "C++17 introduced `if (init; condition)` to tightly limit variable scopes. Switch statements compile into branch chains or jump tables depending on case density.",
      "sections": [
        {
          "title": "1. Conditionals: if, else if, else & C++17 if-init",
          "content": "C++ supports standard conditional branching using `if`, `else if`, and `else`:\n```cpp\nint score = 85;\nif (score >= 90) {\n    std::cout << \"Grade: A\\n\";\n} else if (score >= 80) {\n    std::cout << \"Grade: B\\n\";\n} else {\n    std::cout << \"Grade: C\\n\";\n}\n```\nC++17 introduced `if (init; condition)` to declare a variable whose scope is strictly restricted to the conditional block:\n```cpp\nif (int code = 200; code == 200) {\n    std::cout << \"Request succeeded\\n\";\n} else {\n    std::cout << \"Failed with error: \" << code << \"\\n\";\n} // 'code' is destroyed here and cannot leak into outer scope!\n```"
        },
        {
          "title": "2. Switch Jump Tables & [[fallthrough]]",
          "content": "When cases are dense integers, compilers generate an O(1) jump table (array of code addresses) rather than linear O(N) comparisons. Fallthrough between cases without a `break` generates a warning unless annotated with `[[fallthrough]];`."
        }
      ]
    },
    "deepDive": {
      "topic": "Branch Prediction & Branchless Code",
      "breakdown": [
        "Modern CPU pipelines speculatively execute instructions ahead of time.",
        "A branch misprediction flushes the CPU pipeline (10–20 clock cycles penalty).",
        "C++20 introduces `[[likely]]` and `[[unlikely]]` attributes to guide compiler branch layout."
      ],
      "interviewQuestion": "What is an if-statement with initializer in C++17, and why is it beneficial?",
      "idealAnswer": "Introduced in C++17, `if (init; condition)` allows declaring and initializing a variable whose scope is strictly restricted to the if/else block. It prevents polluting the outer scope, prevents accidental reuse of variables (like iterators or mutex locks), and guarantees prompt destruction of resources upon branch exit."
    },
    "codeExamples": [
      {
        "id": "ex-t7-1",
        "title": "C++17 if-init & Switch [[fallthrough]]",
        "code": "#include <iostream>\n\nenum class LogLevel { Info, Warning, Error };\n\nvoid handleLog(LogLevel level) {\n    switch (level) {\n        case LogLevel::Error:\n            std::cout << \"[SEND_ALERT] \";\n            [[fallthrough]]; // Explicitly documents intentional fallthrough\n        case LogLevel::Warning:\n            std::cout << \"[FLUSH_BUFFER] \";\n            [[fallthrough]];\n        case LogLevel::Info:\n            std::cout << \"[LOG_MESSAGE]\\n\";\n            break;\n    }\n}\n\nint main() {\n    handleLog(LogLevel::Error);\n    return 0;\n}",
        "explanation": "Demonstrates intentional [[fallthrough]] executing cascaded actions.",
        "output": "[SEND_ALERT] [FLUSH_BUFFER] [LOG_MESSAGE]",
        "keyTakeaways": [
          "if-init restricts scope",
          "[[fallthrough]] suppresses compiler warnings"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t7-1",
          "statement": "In C++17 if-init, the initialized variable remains in scope after the else block finishes.",
          "isTrue": false,
          "explanation": "The variable declared in the init-statement is destroyed as soon as the if/else construct finishes."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t7-1",
          "question": "What optimization structure do compilers generate for dense switch statements?",
          "options": [
            "Linked list",
            "O(1) Jump Table",
            "Hash map",
            "Binary search tree"
          ],
          "correctAnswer": 1,
          "explanation": "Compilers generate an array of code jump addresses (jump table) for dense switch cases, executing in O(1)."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t7-1",
          "title": "Scope Restriction via C++17 if-init",
          "code": "if (int code = 200; code == 200) {\n    std::cout << \"OK\\n\";\n} else {\n    std::cout << \"Error\\n\";\n}\n// 'code' cannot be accessed here",
          "question": "Why is declaring 'code' inside the if-initializer safer than declaring it before the if-statement?",
          "stepByStep": [
            "The variable 'code' is initialized directly in the header of the if statement.",
            "Its scope is strictly restricted to the if and else body branches.",
            "As soon as the if/else block finishes, 'code' leaves scope, preventing accidental reuse of stale status codes later."
          ],
          "coreConcept": "Restricting variable lifetime to conditional branches prevents accidental variable reuse and scope pollution."
        }
      ],
      "codingChallenge": {
        "id": "cc-t9",
        "title": "Status Code Classifier",
        "difficulty": "Easy",
        "initialCode": "#include <iostream>\n#include <string>\n\n// Return \"SUCCESS\" for 200, \"CLIENT_ERROR\" for 400-499, \"SERVER_ERROR\" for 500-599, \"OTHER\" otherwise\nstd::string classifyHttpCode(int code) {\n    // Write your code here\n    return \"\";\n}",
        "solutionCode": "#include <iostream>\n#include <string>\n\nstd::string classifyHttpCode(int code) {\n    if (code == 200) return \"SUCCESS\";\n    if (code >= 400 && code <= 499) return \"CLIENT_ERROR\";\n    if (code >= 500 && code <= 599) return \"SERVER_ERROR\";\n    return \"OTHER\";\n}",
        "expectedBehavior": "Classify HTTP status codes into appropriate categories.",
        "hints": [
          "Use ranged if comparisons"
        ],
        "testCases": [
          {
            "input": "200",
            "expectedOutput": "SUCCESS"
          },
          {
            "input": "404",
            "expectedOutput": "CLIENT_ERROR"
          },
          {
            "input": "503",
            "expectedOutput": "SERVER_ERROR"
          }
        ],
        "driverCode": "#include <iostream>\nint main() {\n    int c;\n    if (std::cin >> c) {\n        std::cout << classifyHttpCode(c) << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t7",
      "title": "Conditionals Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t7-1",
          "type": "mcq",
          "question": "Which C++ attribute explicitly informs the compiler that a switch fallthrough is intentional?",
          "options": [
            "[[nodiscard]]",
            "[[fallthrough]]",
            "[[maybe_unused]]",
            "[[noreturn]]"
          ],
          "correctAnswerIndex": 1,
          "explanation": "[[fallthrough]] suppresses compiler warnings about missing break statements in switch cases."
        }
      ]
    }
  },
  {
    "id": "topic-8",
    "weekNumber": 8,
    "phaseId": "phase-1",
    "title": "Loops, Range-For & Tail Calls",
    "subtitle": "For, Range-For, While, Do-While & Tail Call Optimization",
    "goals": "Master iteration constructs, range-based for loops, iterator invalidation hazards, and Tail Call Optimization (TCO).",
    "topics": [
      "for Loop",
      "Range-based for",
      "while / do-while",
      "Iterator Invalidation",
      "Tail Call Optimization (TCO)"
    ],
    "theory": {
      "overview": "C++ provides traditional index-controlled for loops, condition-controlled loops (while, do-while), and modern range-based for loops. Flow control within loops is governed by break and continue.",
      "sections": [
        {
          "title": "1. Core Loop Constructs: for, while, and do-while",
          "content": "• **for (init; condition; update)**: Best when the number of iterations or index progression is known in advance.\n• **while (condition)**: Evaluates the condition first; executes zero or more times.\n• **do { ... } while (condition);**: Evaluates the condition at the end; guaranteed to execute at least once!"
        },
        {
          "title": "2. Loop Control: break & continue",
          "content": "• **break**: Halts and exits the loop immediately, jumping to the code directly following the loop.\n• **continue**: Skips the rest of the current iteration body and jumps directly to the update/condition evaluation for the next iteration.\n\n*Preview Note*: Modern C++ also provides range-based for loops (`for (const auto& x : collection)`), which simplify iterating over items without manual counters. We will use range-for extensively when we study vectors and data structures in Domain II!"
        }
      ]
    },
    "deepDive": {
      "topic": "Choosing the Right Loop & Off-by-One Prevention",
      "breakdown": [
        "Use 'for' when the number of iterations or index step is predetermined.",
        "Use 'while' for state-driven loops where termination depends on runtime events or stream input.",
        "Use 'do-while' when an action must run at least once before validating condition (e.g. interactive input).",
        "Standard 0-indexed loops run from 0 to N - 1: 'for (int i = 0; i < N; ++i)' runs exactly N times."
      ],
      "interviewQuestion": "What is the difference between a while loop and a do-while loop in C++, and when should you use each?",
      "idealAnswer": "A while loop tests its condition at the entry point; if the condition is initially false, the loop body never executes (zero iterations). A do-while loop evaluates its condition at the exit point after executing the body, guaranteeing at least one execution. You should prefer while for general event loops and do-while when an initial action (such as reading user input or initializing state) must precede validation."
    },
    "codeExamples": [
      {
        "id": "ex-t8-1",
        "title": "For, While, and Loop Flow Control",
        "code": "#include <iostream>\n\nint main() {\n    // 1. Counting with for loop\n    int sum = 0;\n    for (int i = 1; i <= 5; ++i) {\n        sum += i;\n    }\n    std::cout << \"Sum 1 to 5: \" << sum << \"\\n\";\n\n    // 2. Condition-controlled while loop\n    int count = 4;\n    while (count > 0) {\n        std::cout << count << \" \";\n        --count;\n    }\n    std::cout << \"\\n\";\n\n    // 3. Early termination with break and continue\n    for (int i = 0; i < 10; ++i) {\n        if (i % 2 == 0) continue; // Skip even numbers\n        if (i > 5) break;        // Stop when exceeding 5\n        std::cout << \"Odd: \" << i << \"\\n\";\n    }\n    return 0;\n}",
        "explanation": "Demonstrates index for loop accumulation, while loop countdown, and break/continue flow control.",
        "output": "Sum 1 to 5: 15\n4 3 2 1 \nOdd: 1\nOdd: 3\nOdd: 5",
        "keyTakeaways": [
          "for is ideal for known bounds",
          "continue skips to next step",
          "break exits loop immediately"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t8-1",
          "statement": "A do-while loop in C++ is guaranteed to execute its body at least once, even if the condition is initially false.",
          "isTrue": true,
          "explanation": "Because a do-while loop checks its condition at the bottom after the loop body runs, the body always executes at least once."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t8-1",
          "question": "Which keyword halts the current iteration of a loop and immediately jumps to the next iteration step?",
          "options": [
            "break",
            "continue",
            "return",
            "pass"
          ],
          "correctAnswer": 1,
          "explanation": "The continue statement immediately ends the current iteration and evaluates the next loop update/condition."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t8-1",
          "title": "0-Indexed Loop Bounds",
          "code": "int total = 0;\nfor (int i = 0; i < 5; ++i) {\n    total += 1;\n}",
          "question": "Why does this loop execute exactly 5 times (for i = 0, 1, 2, 3, 4)?",
          "stepByStep": [
            "The loop counter 'i' starts at 0.",
            "Before each iteration, 'i < 5' is checked; this succeeds for i = 0, 1, 2, 3, and 4.",
            "After the 5th iteration, '++i' increments i to 5; '5 < 5' evaluates to false, terminating the loop."
          ],
          "coreConcept": "A 0-indexed loop with condition 'i < N' executes its body exactly N times."
        }
      ],
      "codingChallenge": {
        "id": "cc-t10",
        "title": "Sum of Odd Integers",
        "difficulty": "Easy",
        "initialCode": "#include <vector>\n\n// Return sum of all odd numbers in vector\nint sumOddNumbers(const std::vector<int>& numbers) {\n    int sum = 0;\n    // Iterate over numbers using range-for: for (const auto& n : numbers)\n    // If n is odd (n % 2 != 0), add it to sum\n    return sum;\n}",
        "solutionCode": "#include <vector>\n\nint sumOddNumbers(const std::vector<int>& numbers) {\n    int sum = 0;\n    for (const auto& n : numbers) {\n        if (n % 2 != 0) {\n            sum += n;\n        }\n    }\n    return sum;\n}",
        "expectedBehavior": "Sum and return all odd numbers in the provided vector.",
        "hints": [
          "Use a range-for loop: for (const auto& n : numbers) { ... }",
          "Check if n is odd using modulo: if (n % 2 != 0) sum += n;",
          "Return the total sum."
        ],
        "testCases": [
          {
            "input": "5 1 2 3 4 5",
            "expectedOutput": "9"
          },
          {
            "input": "4 2 4 6 8",
            "expectedOutput": "0"
          }
        ],
        "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> v(n);\n        for (int i = 0; i < n; ++i) std::cin >> v[i];\n        std::cout << sumOddNumbers(v) << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t8",
      "title": "Loops & Iteration Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t8-1",
          "type": "mcq",
          "question": "Which loop construct guarantees execution of its body at least once?",
          "options": [
            "for loop",
            "while loop",
            "do-while loop",
            "range-for loop"
          ],
          "correctAnswerIndex": 2,
          "explanation": "do-while evaluates its condition at the end of the loop, guaranteeing at least one execution."
        }
      ]
    }
  },
  {
    "id": "topic-9",
    "weekNumber": 9,
    "phaseId": "phase-1",
    "title": "Methods & Parameter Passing Semantics",
    "subtitle": "Pass by Value, Reference Aliases (T&), const References (const T&) & In-Place Mutation",
    "goals": "Master function call conventions, pass-by-value copies, reference aliases, and in-place mutation without pointer syntax.",
    "topics": [
      "Function Signatures",
      "Pass by Value",
      "References (T&)",
      "In-Place Modification",
      "const References (const T&)",
      "swap Idiom"
    ],
    "theory": {
      "overview": "In C++, understanding the difference between a value and a reference is one of the most critical concepts in the language. Passing by value creates an independent duplicate copy, whereas passing by reference provides an alias to the caller's existing variable.",
      "sections": [
        {
          "title": "1. What is a Reference? (The Alias Model)",
          "content": "A reference (`T&`) is an alternative name (an alias) for an already existing variable. It does not occupy separate visible storage from the caller's perspective; every operation performed on the reference directly affects the original variable:",
          "codeSnippets": [
            {
              "title": "The Reference Alias Walkthrough",
              "code": "#include <iostream>\n\nint main() {\n    int x = 10;\n    int& ref = x; // ref is an alias for x\n\n    ref = 20;     // mutating ref directly mutates x!\n\n    std::cout << \"Value of x: \" << x << \"\\n\"; // Prints 20!\n    return 0;\n}",
              "explanation": "What does x contain? It contains 20. Why? Because 'ref' does not have its own independent storage; it is literally an alias for 'x'."
            }
          ]
        },
        {
          "title": "2. Pass-by-Value vs Pass-by-Reference",
          "content": "• `void f(int x)`: Pass-by-value. The function receives a private copy of the argument. Changing `x` inside `f` has zero effect on caller state.\n• `void f(int& x)`: Pass-by-reference. The function directly operates on the caller's original variable.\n• `void f(const std::string& x)`: const reference. Avoids making expensive copies of large data while preventing accidental mutation."
        }
      ]
    },
    "deepDive": {
      "topic": "Passing Large Objects: Value vs const Reference",
      "breakdown": [
        "Passing std::vector<std::string> by value causes a dynamic heap allocation and deep element copy on every call!",
        "Passing by const reference (`const std::vector<std::string>&`) passes an 8-byte pointer under the hood, completely bypassing the heap.",
        "Rule of Thumb: Pass cheap-to-copy types by value, pass expensive-to-copy types by const reference."
      ],
      "interviewQuestion": "What is the difference between passing an object by value vs const reference in C++?",
      "idealAnswer": "Passing by value invokes the object's copy constructor, allocating new memory and copying all member data. Passing by const reference passes the address of the existing object (zero-copy), while the const qualifier guarantees that the callee cannot mutate the caller's state."
    },
    "codeExamples": [
      {
        "id": "ex-t9-1",
        "title": "Pass by Value vs Const Reference",
        "code": "#include <iostream>\n#include <string>\n\nvoid printByConstRef(const std::string& str) {\n    std::cout << \"Read-only: \" << str << \"\\n\"; // Zero allocations\n}\n\nvoid mutateByRef(int& counter) {\n    counter += 10;\n}\n\nint main() {\n    std::string text = \"High Performance C++\";\n    printByConstRef(text);\n    int c = 5;\n    mutateByRef(c);\n    std::cout << \"Mutated: \" << c << \"\\n\"; // 15\n    return 0;\n}",
        "explanation": "Demonstrates zero-copy const reference parameter binding and in-place reference mutation.",
        "output": "Read-only: High Performance C++\nMutated: 15",
        "keyTakeaways": [
          "const T& prevents copies",
          "T& allows in-place mutation"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t9-1",
          "statement": "A static member method has access to the implicit 'this' pointer.",
          "isTrue": false,
          "explanation": "Static member methods are class-level and have no 'this' pointer."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t9-1",
          "question": "Which signature avoids copying a large std::vector while ensuring it cannot be modified?",
          "options": [
            "void process(std::vector<int> v)",
            "void process(std::vector<int>& v)",
            "void process(const std::vector<int>& v)",
            "void process(std::vector<int>&& v)"
          ],
          "correctAnswer": 2,
          "explanation": "const std::vector<int>& binds by reference without copying and prohibits mutation."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t9-1",
          "title": "Temporary Binding to const Reference",
          "code": "void log(const std::string& s);\nlog(\"literal\");",
          "question": "Why does passing a raw string literal to const std::string& succeed?",
          "stepByStep": [
            "Compiler constructs a temporary std::string object from 'literal'.",
            "C++ language rules allow const lvalue references to bind to rvalue temporaries.",
            "The temporary's lifetime is extended for the duration of the function call."
          ],
          "coreConcept": "const references can bind directly to temporary objects, extending their lifetime."
        }
      ],
      "codingChallenge": {
        "id": "cc-t5",
        "title": "In-Place Swap with References",
        "difficulty": "Easy",
        "initialCode": "#include <iostream>\n\n// Swap two integers in-place using references\nvoid swapValues(int& a, int& b) {\n    // Write your code here\n}\n",
        "solutionCode": "#include <iostream>\n\nvoid swapValues(int& a, int& b) {\n    int temp = a;\n    a = b;\n    b = temp;\n}",
        "expectedBehavior": "Swap the values of a and b directly in-place.",
        "hints": [
          "Use a temporary variable to hold one value"
        ],
        "testCases": [
          {
            "input": "10 20",
            "expectedOutput": "20 10"
          },
          {
            "input": "0 5",
            "expectedOutput": "5 0"
          }
        ],
        "driverCode": "#include <iostream>\nint main() {\n    int x, y;\n    if (std::cin >> x >> y) {\n        swapValues(x, y);\n        std::cout << x << \" \" << y << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t9",
      "title": "Methods & Passing Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t9-1",
          "type": "mcq",
          "question": "What is the primary advantage of passing an object by const reference ('const Type&') instead of by value ('Type')?",
          "options": [
            "It copies the object to guarantee thread isolation",
            "It avoids copying the object while preventing the function from modifying the original",
            "It forces the object to be dynamically allocated on the heap",
            "It converts the parameter into a nullable raw pointer"
          ],
          "correctAnswerIndex": 1,
          "explanation": "Passing by const reference ('const Type&') passes an alias to the caller's existing object without incurring the runtime and memory cost of copying, while const guarantees the function cannot mutate it."
        }
      ]
    }
  },
  {
    "id": "topic-10",
    "weekNumber": 10,
    "phaseId": "phase-1",
    "title": "String Manipulation, SSO & std::string_view",
    "subtitle": "C-Strings, std::string, Small String Optimization (SSO) & Zero-Copy std::string_view",
    "goals": "Master C-string pitfalls, std::string memory architecture, Small String Optimization (SSO), and zero-copy string slicing with std::string_view.",
    "topics": [
      "C-Strings (char*)",
      "std::string",
      "Small String Optimization (SSO)",
      "std::string_view",
      "Null Termination"
    ],
    "theory": {
      "overview": "C++ provides two primary string abstractions: dynamically-sized, owning `std::string` (with Short String Optimization) and C++17 non-owning `std::string_view` (pointer + length). Understanding everyday string manipulation before memory optimizations is key to writing clean and performant code.",
      "sections": [
        {
          "title": "1. Core std::string Operations: Construction, Concatenation, Searching & Slicing",
          "content": "Before inspecting low-level memory layouts, master everyday `std::string` operations:\n• **Construction & Inspection**: `std::string s = \"Hello\";`, `s.size()` (or `s.length()`), and `s.empty()`.\n• **Concatenation & Mutation**: `s += \" World!\";` appends text efficiently. Individual characters can be read or modified via index `s[0]` or checked access `s.at(0)`.\n• **Searching**: `size_t pos = s.find(\"World\");` returns the 0-indexed position of the match, or the sentinel value `std::string::npos` if the substring is not found.\n• **Substring Slicing**: `std::string sub = s.substr(pos, 5);` extracts 5 characters starting at index `pos` into a new string."
        },
        {
          "title": "2. Small String Optimization (SSO)",
          "content": "Under standard C++, `std::string` manages dynamic memory. However, dynamic heap allocation incurs noticeable overhead. Major standard library implementations (libstdc++, libc++, MSVC) implement **Small String Optimization**:\n• Short strings (typically up to 15 or 22 characters, depending on the library) are stored directly inside an internal buffer in the `std::string` object on the stack without allocating heap memory.\n• When the string exceeds this internal buffer capacity, it allocates a dynamic heap buffer.\n• *Note*: SSO is a widely used implementation optimization, not an ISO standard-mandated byte layout."
        },
        {
          "title": "3. std::string_view (C++17): Non-Owning Read-Only Slice",
          "content": "When functions only need to read character data, `std::string_view` avoids copying:\n• **Typical Implementation**: Stores a `const char*` pointer to character data and a `size_t` length (2 words, typically 16 bytes on 64-bit architectures).\n• **Zero Allocations**: Operations like `sv.substr(...)` run in O(1) time by merely adjusting the pointer and length, without allocating or copying.\n• **Lifetime Warning**: `std::string_view` is non-owning. If the underlying string or literal is destroyed, the view becomes a dangling pointer!"
        }
      ]
    },
    "deepDive": {
      "topic": "string_view Dangling Pointer Hazard",
      "breakdown": [
        "A string_view is a non-owning pointer into an external buffer.",
        "If a string_view points to a temporary std::string that is destroyed, the string_view becomes a dangling reference.",
        "Never return a string_view to a local temporary string!"
      ],
      "interviewQuestion": "What is Small String Optimization (SSO), and how does std::string_view improve performance?",
      "idealAnswer": "SSO is an optimization where small strings (under 15–22 bytes) are stored directly inside an internal buffer in the string object on the stack, bypassing heap allocation entirely. `std::string_view` (C++17) represents a non-owning slice (pointer + length), enabling zero-copy string passing and sub-stringing without allocating any memory or copying bytes."
    },
    "codeExamples": [
      {
        "id": "ex-t10-1",
        "title": "Zero-Copy Slicing with std::string_view",
        "code": "#include <iostream>\n#include <string>\n#include <string_view>\n\nvoid printPrefix(std::string_view sv, size_t n) {\n    // Slicing produces a new string_view in O(1) with ZERO allocations\n    std::string_view prefix = sv.substr(0, n);\n    std::cout << \"Prefix: \" << prefix << \" (length \" << prefix.size() << \")\\n\";\n}\n\nint main() {\n    std::string text = \"HighPerformanceSystems\";\n    printPrefix(text, 4); // \"High\"\n    printPrefix(\"StringLiteral\", 6); // \"String\"\n    return 0;\n}",
        "explanation": "std::string_view binds seamlessly to both std::string and string literals without copying data.",
        "output": "Prefix: High (length 4)\nPrefix: String (length 6)",
        "keyTakeaways": [
          "Use string_view for read-only parameters",
          "Zero heap allocations on substr()"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t10-1",
          "statement": "std::string_view is guaranteed to be null-terminated.",
          "isTrue": false,
          "explanation": "std::string_view is a pointer and length; substrings within a buffer are not null-terminated."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t10-1",
          "question": "What is the time complexity of `sv.substr(0, 5)` on a `std::string_view`?",
          "options": [
            "O(N)",
            "O(1)",
            "O(log N)",
            "O(N^2)"
          ],
          "correctAnswer": 1,
          "explanation": "Substrings on std::string_view only adjust the pointer and length, running in O(1) time without copying bytes."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t10-1",
          "title": "Small String Optimization (SSO)",
          "code": "std::string s = \"hello\"; // <= 15 chars",
          "question": "Why does constructing this string not perform a heap allocation?",
          "stepByStep": [
            "sizeof(std::string) is typically 24 or 32 bytes on 64-bit systems.",
            "The object structure contains an internal union buffer for short strings.",
            "Since 'hello' fits inside the union, it is stored directly on the stack, bypassing operator new."
          ],
          "coreConcept": "SSO avoids expensive dynamic heap allocation for short strings."
        }
      ],
      "codingChallenge": {
        "id": "cc-t8",
        "title": "Extract Domain from Email",
        "difficulty": "Easy",
        "initialCode": "#include <string>\n#include <string_view>\n\n// Return domain part of email after '@' using string_view\nstd::string extractDomain(std::string_view email) {\n    // Write your solution here\n    return \"\";\n}",
        "solutionCode": "#include <string>\n#include <string_view>\n\nstd::string extractDomain(std::string_view email) {\n    size_t atPos = email.find('@');\n    if (atPos == std::string_view::npos) return \"\";\n    return std::string(email.substr(atPos + 1));\n}",
        "expectedBehavior": "Extract and return the domain substring following the '@' character.",
        "hints": [
          "Use email.find('@') and email.substr(atPos + 1)"
        ],
        "testCases": [
          {
            "input": "user@example.com",
            "expectedOutput": "example.com"
          },
          {
            "input": "dev@cpp.org",
            "expectedOutput": "cpp.org"
          }
        ],
        "driverCode": "#include <iostream>\n#include <string>\nint main() {\n    std::string s;\n    if (std::cin >> s) {\n        std::cout << extractDomain(s) << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t10",
      "title": "String Manipulation Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t10-1",
          "type": "mcq",
          "question": "What comprises a std::string_view under typical implementations?",
          "options": [
            "A pointer to heap memory and reference count",
            "A const char* pointer and a size_t length (typically 2 words)",
            "A copy of the string on the stack",
            "A linked list of characters"
          ],
          "correctAnswerIndex": 1,
          "explanation": "In typical standard library implementations on 64-bit systems, std::string_view stores a pointer to character data and a size_t length (2 words, typically 16 bytes)."
        }
      ]
    }
  },
  {
    "id": "topic-11",
    "weekNumber": 11,
    "phaseId": "phase-1",
    "title": "Pointers & Physical Memory Fundamentals",
    "subtitle": "Memory Addresses, Stack vs Heap, References vs Pointers & Pointer Arithmetic",
    "goals": "Master memory addressing, pointer dereferencing, stack vs heap allocation lifecycles, and pointer arithmetic scaling.",
    "topics": [
      "Memory Addresses (&)",
      "Dereferencing (*)",
      "Stack vs Heap",
      "References vs Pointers",
      "Pointer Arithmetic",
      "sizeof(T) Scaling"
    ],
    "theory": {
      "overview": "A pointer is a variable holding a raw physical or virtual memory address. Understanding pointer indirection, nullability, pointer arithmetic, and heap allocation via `new`/`delete` is essential to modern systems programming.",
      "sections": [
        {
          "title": "1. The Mental Model: Values, Addresses & Pointers",
          "content": "Every variable in C++ lives at a physical memory address. Consider:\n```cpp\nint x = 42;\nint* p = &x;\n```\n• `x`: The variable containing the value `42`.\n• `&x`: The memory address where `x` is stored (e.g. `0x7ffee4b28a10`).\n• `p`: A pointer variable holding `&x` as its value.\n• `*p`: Dereferencing `p` to read or write the value stored at that address (`42`).\n\n```\n   x (int, typically 4 bytes)\n ┌─────────────────┐\n │       42        │   Address: 0x7ffee4b28a10\n └─────────────────┘\n          ▲\n          │\n          p (int*, typically 8 bytes on 64-bit) holding 0x7ffee4b28a10\n```",
          "codeSnippets": [
            {
              "title": "Address-of and Dereferencing Walkthrough",
              "code": "#include <iostream>\n\nint main() {\n    int x = 42;\n    int* p = &x; // p stores the address of x\n\n    std::cout << \"Value of x: \" << x << \"\\n\";\n    std::cout << \"Address of x (&x): \" << &x << \"\\n\";\n    std::cout << \"Value stored in p: \" << p << \"\\n\";\n    std::cout << \"Dereferencing *p: \" << *p << \"\\n\";\n\n    *p = 99; // Mutates x through the pointer!\n    std::cout << \"New value of x: \" << x << \"\\n\"; // Prints 99\n    return 0;\n}",
              "explanation": "Dereferencing *p accesses the memory location pointed to, allowing read and write operations."
            }
          ]
        },
        {
          "title": "2. References vs Pointers & Pointer Arithmetic",
          "content": "• **Pointer (`T*`)**: Can be `nullptr`, can be reseated (reassigned to point to different objects), requires explicit dereferencing `*ptr` or `->`.\n• **Reference (`T&`)**: Must be bound upon initialization, cannot be null, cannot be reseated, syntax is an alias.\n• **Pointer Arithmetic**: Adding `1` to a pointer `ptr + 1` advances by `sizeof(T)` bytes (e.g. 4 bytes for `int*`). This guarantees that `ptr[i] == *(ptr + i)`."
        }
      ]
    },
    "deepDive": {
      "topic": "Stack vs Heap Allocation Mechanics",
      "breakdown": [
        "Stack: Allocation simply decrements the CPU stack pointer register (RSP); zero cost, limited size (typically 1–8 MB), automatic LIFO destruction.",
        "Heap: Allocation invokes OS memory manager (`malloc`/`brk`/`mmap`), searches free lists, risks fragmentation, and requires explicit deallocation."
      ],
      "interviewQuestion": "What is the difference between a pointer and a reference in C++, and how does pointer arithmetic scale?",
      "idealAnswer": "A pointer holds a memory address, can be null, and can be reseated to point to different memory addresses. A reference is an immutable alias bound to a valid object upon initialization and cannot be null or reseated. Pointer arithmetic scales automatically by `sizeof(T)`: incrementing a `T*` moves forward by the byte width of type `T`, ensuring `*(ptr + i)` corresponds exactly to element `ptr[i]`."
    },
    "codeExamples": [
      {
        "id": "ex-t11-1",
        "title": "Pointer Arithmetic & References",
        "code": "#include <iostream>\n\nint main() {\n    int arr[3] = {100, 200, 300};\n    int* ptr = arr; // Points to arr[0]\n\n    std::cout << \"First: \" << *ptr << \"\\n\";\n    std::cout << \"Second via arithmetic: \" << *(ptr + 1) << \"\\n\";\n    std::cout << \"Address delta in bytes: \" << (uintptr_t)(ptr + 1) - (uintptr_t)ptr << \"\\n\"; // 4\n    return 0;\n}",
        "explanation": "ptr + 1 advances by sizeof(int) (4 bytes) to access the next array element.",
        "output": "First: 100\nSecond via arithmetic: 200\nAddress delta in bytes: 4",
        "keyTakeaways": [
          "Pointer arithmetic scales by sizeof(T)",
          "arr[i] is syntactically equivalent to *(arr + i)"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t11-1",
          "statement": "A C++ reference can be rebound to reference a different object after initialization.",
          "isTrue": false,
          "explanation": "References are immutable aliases established at initialization; assigning to a reference mutates the referred object."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t11-1",
          "question": "If `double* p` points to address 0x1000, what address does `p + 2` point to on 64-bit systems?",
          "options": [
            "0x1002",
            "0x1008",
            "0x1010 (0x1000 + 16 bytes)",
            "0x1004"
          ],
          "correctAnswer": 2,
          "explanation": "sizeof(double) is 8 bytes; advancing by 2 moves 16 bytes (0x10 in hex), giving 0x1010."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t11-1",
          "title": "Array-Pointer Duality",
          "code": "int arr[5];\nint x = 2[arr]; // Valid C++!",
          "question": "Why does the expression 2[arr] compile and yield the exact same value as arr[2]?",
          "stepByStep": [
            "In C++, array subscripting a[b] is defined by the standard as *(a + b).",
            "Addition is commutative: *(arr + 2) is identical to *(2 + arr).",
            "Therefore, 2[arr] is identical to arr[2]."
          ],
          "coreConcept": "Array indexing is pure syntactic sugar for pointer arithmetic."
        }
      ],
      "codingChallenge": {
        "id": "cc-t29",
        "title": "Reverse Array In-Place with Two Pointers",
        "difficulty": "Easy",
        "initialCode": "#include <iostream>\n\n// Reverse array of size n in-place using two raw pointers\nvoid reverseArray(int* arr, int n) {\n    // Write your two-pointer code here\n}",
        "solutionCode": "#include <iostream>\n\nvoid reverseArray(int* arr, int n) {\n    int* left = arr;\n    int* right = arr + n - 1;\n    while (left < right) {\n        int temp = *left;\n        *left = *right;\n        *right = temp;\n        left++;\n        right--;\n    }\n}",
        "expectedBehavior": "Reverse array elements in-place using pointer arithmetic.",
        "hints": [
          "Initialize left at arr, right at arr + n - 1; swap while left < right"
        ],
        "testCases": [
          {
            "input": "5 1 2 3 4 5",
            "expectedOutput": "[5, 4, 3, 2, 1]"
          },
          {
            "input": "2 10 20",
            "expectedOutput": "[20, 10]"
          }
        ],
        "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> a(n);\n        for (int i = 0; i < n; ++i) std::cin >> a[i];\n        reverseArray(a.data(), n);\n        std::cout << \"[\";\n        for (int i = 0; i < n; ++i) {\n            std::cout << a[i] << (i + 1 < n ? \", \" : \"\");\n        }\n        std::cout << \"]\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t11",
      "title": "Pointers Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t11-1",
          "type": "mcq",
          "question": "What operator retrieves the memory address of an existing variable?",
          "options": [
            "*",
            "&",
            "->",
            "%"
          ],
          "correctAnswerIndex": 1,
          "explanation": "The address-of operator & returns the memory address of an lvalue."
        }
      ]
    }
  },
  {
    "id": "topic-12",
    "weekNumber": 12,
    "phaseId": "phase-1",
    "title": "Running C++ Code & Runtime Lifecycle",
    "subtitle": "main() Signatures, argc/argv, Exit Codes & Runtime Initialization",
    "goals": "Understand program startup, runtime initialization before main(), argument parsing, and return code conventions.",
    "topics": [
      "main()",
      "argc and argv",
      "Exit Codes",
      "CRT Startup",
      "Static Initialization Order Fiasco"
    ],
    "theory": {
      "overview": "Every hosted C++ program begins execution at the global entry point `main()`. Before `main()` executes, the C Runtime (CRT) configures the execution environment: initializing the heap, standard I/O streams, and global static objects.",
      "sections": [
        {
          "title": "1. Legal Signatures of main()",
          "content": "The C++ standard allows two canonical signatures for `main()`:\n1. `int main()`\n2. `int main(int argc, char* argv[])`\n\nReturning 0 indicates success (`EXIT_SUCCESS`), while non-zero values indicate errors (`EXIT_FAILURE`). If execution reaches the end of `main()` without a `return` statement, the compiler implicitly generates `return 0;`."
        },
        {
          "title": "2. Lifecycle Before and After main()",
          "content": "1. **Before main()**: Operating system loads binary into memory, allocates stack and data segments, and invokes CRT entry (`_start`). CRT constructs global and namespace-scope static objects.\n2. **During main()**: User logic executes.\n3. **After main()**: Static and global object destructors execute in reverse order of construction, open file buffers flush, and process terminates via `exit()` syscall."
        }
      ]
    },
    "deepDive": {
      "topic": "The Static Initialization Order Fiasco",
      "breakdown": [
        "Within a single TU, static objects are initialized in declaration order.",
        "Across different TUs, the initialization order of global/static variables is undefined!",
        "If a global object in TU A accesses a global object in TU B during construction, it may read uninitialized memory.",
        "Solution: The Construct-On-First-Use idiom (Meyer's Singleton) wrapping static objects inside functions."
      ],
      "interviewQuestion": "What is the Static Initialization Order Fiasco, and how does Modern C++ prevent it?",
      "idealAnswer": "The Static Initialization Order Fiasco occurs because the C++ standard does not define the initialization order of static objects across distinct translation units. If global object A in file1.cpp accesses global object B in file2.cpp during initialization, B might not yet be constructed. We prevent this using Meyer's Singleton: placing the static instance inside a function ('static Object& get() { static Object instance; return instance; }'). C++11 guarantees thread-safe, lazy construction on first call."
    },
    "codeExamples": [
      {
        "id": "ex-t12-1",
        "title": "CommandLine Argument Parsing",
        "code": "#include <iostream>\n\nint main(int argc, char* argv[]) {\n    std::cout << \"Program name: \" << argv[0] << \"\\n\";\n    std::cout << \"Arg count: \" << argc << \"\\n\";\n    for (int i = 1; i < argc; ++i) {\n        std::cout << \"Arg[\" << i << \"]: \" << argv[i] << \"\\n\";\n    }\n    return 0;\n}",
        "explanation": "argv[0] is the binary executable invocation name; argv[argc] is guaranteed to be a null pointer by the standard.",
        "keyTakeaways": [
          "argc is the number of arguments",
          "argv is an array of null-terminated C-strings"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t12-1",
          "statement": "Omitting 'return 0;' at the end of main() causes undefined behavior in standard C++.",
          "isTrue": false,
          "explanation": "In C++, falling off the end of main() implicitly returns 0 (unlike any other function with a non-void return type)."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t12-1",
          "question": "What is the guaranteed value of argv[argc] in C++?",
          "options": [
            "Undefined",
            "Empty string \"\"",
            "nullptr (0)",
            "-1"
          ],
          "correctAnswer": 2,
          "explanation": "The ISO C++ standard guarantees that argv[argc] is always a null pointer."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t12-1",
          "title": "Meyer's Singleton",
          "code": "Logger& getLogger() {\n    static Logger instance; // Thread-safe in C++11\n    return instance;\n}",
          "question": "Why does this eliminate the static initialization order fiasco?",
          "stepByStep": [
            "The static object is not constructed at program startup.",
            "It is constructed lazily the very first time getLogger() is invoked.",
            "C++11 guarantees the runtime uses internal mutex locks to ensure thread-safe single initialization."
          ],
          "coreConcept": "Function-local static initialization guarantees deterministic order on first use."
        }
      ],
      "codingChallenge": {
        "id": "cc-t3",
        "title": "Evaluate Exit Code from Status",
        "difficulty": "Easy",
        "initialCode": "#include <iostream>\n\n// Return 0 if status is \"OK\" or \"SUCCESS\", 1 if \"WARNING\", 2 otherwise\nint parseExitCode(const std::string& status) {\n    // Write your solution\n    return -1;\n}",
        "solutionCode": "#include <iostream>\n#include <string>\n\nint parseExitCode(const std::string& status) {\n    if (status == \"OK\" || status == \"SUCCESS\") return 0;\n    if (status == \"WARNING\") return 1;\n    return 2;\n}",
        "expectedBehavior": "Return standard POSIX style exit code based on status string.",
        "hints": [
          "Use string comparison with if / else if"
        ],
        "testCases": [
          {
            "input": "OK",
            "expectedOutput": "0"
          },
          {
            "input": "WARNING",
            "expectedOutput": "1"
          },
          {
            "input": "ERROR",
            "expectedOutput": "2"
          }
        ],
        "driverCode": "#include <iostream>\n#include <string>\nint main() {\n    std::string s;\n    if (std::cin >> s) {\n        std::cout << parseExitCode(s) << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t12",
      "title": "Running C++ Code Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t12-1",
          "type": "mcq",
          "question": "Which of the following executes before main() begins?",
          "options": [
            "Destructors of local variables",
            "Constructors of global and static objects",
            "Dynamic heap allocations via malloc",
            "Signal handlers"
          ],
          "correctAnswerIndex": 1,
          "explanation": "Global and static variables are constructed by the runtime before main() starts."
        }
      ]
    }
  },
  {
    "id": "topic-13",
    "weekNumber": 13,
    "phaseId": "phase-1",
    "title": "Namespaces & Argument-Dependent Lookup (ADL)",
    "subtitle": "Declarations, Scope Resolution ::, Anonymous Namespaces & ADL / Koenig Lookup",
    "goals": "Master scope isolation, C++17 nested namespaces, internal linkage via anonymous namespaces, and ADL.",
    "topics": [
      "Namespaces",
      "Scope Resolution ::",
      "Nested Namespaces (C++17)",
      "Anonymous Namespaces",
      "ADL (Koenig Lookup)"
    ],
    "theory": {
      "overview": "Namespaces prevent symbol name collisions in large codebases. Anonymous namespaces provide internal linkage (restricting symbols to the current translation unit). Argument-Dependent Lookup (ADL) allows unqualified function calls based on argument types.",
      "sections": [
        {
          "title": "1. Anonymous Namespaces vs static",
          "content": "```cpp\nnamespace {\n    int internalHelper() { return 42; }\n}\n```\nSymbols defined in an anonymous namespace have internal linkage unique to that translation unit. In Modern C++, anonymous namespaces are preferred over the C-style `static` function specifier."
        },
        {
          "title": "2. Argument-Dependent Lookup (ADL)",
          "content": "When calling an unqualified function `swap(a, b)`, the compiler searches not only the current scope, but also the namespaces of the argument types `a` and `b`! This is how custom `swap` functions and overloaded operators work seamlessly."
        }
      ]
    },
    "deepDive": {
      "topic": "The 'using namespace std;' Pitfall",
      "breakdown": [
        "Dumping all `std` symbols into global scope creates ambiguous symbol conflicts (e.g. `std::distance`, `std::count`).",
        "Never put `using namespace` in header files—it pollutes every file that includes the header!"
      ],
      "interviewQuestion": "What is Argument-Dependent Lookup (ADL / Koenig Lookup), and why is it important?",
      "idealAnswer": "ADL is a C++ lookup rule: when a function call is unqualified, the compiler looks inside the namespaces of the types of the arguments passed to that function. ADL is essential because it allows operator overloading (like `std::cout << obj` finding `operator<<` in `obj`'s namespace) and standard idioms like `using std::swap; swap(a, b);` to find type-specific optimized swap overloads."
    },
    "codeExamples": [
      {
        "id": "ex-t13-1",
        "title": "Namespaces & ADL Swap Pattern",
        "code": "#include <iostream>\n#include <utility>\n\nnamespace Graphics {\n    struct Color { int r, g, b; };\n    // Custom swap found via ADL\n    void swap(Color& a, Color& b) {\n        std::cout << \"[ADL custom swap executed]\\n\";\n        std::swap(a.r, b.r);\n        std::swap(a.g, b.g);\n        std::swap(a.b, b.b);\n    }\n}\n\nint main() {\n    Graphics::Color c1{255, 0, 0};\n    Graphics::Color c2{0, 255, 0};\n\n    using std::swap;\n    swap(c1, c2); // ADL finds Graphics::swap!\n    return 0;\n}",
        "explanation": "using std::swap with unqualified swap() enables ADL to select the specialized swap overload.",
        "output": "[ADL custom swap executed]",
        "keyTakeaways": [
          "ADL searches argument namespaces",
          "Never put using namespace in headers"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t13-1",
          "statement": "Placing 'using namespace std;' inside a header file is recommended best practice in modern C++.",
          "isTrue": false,
          "explanation": "Putting 'using namespace' in headers pollutes global namespace for all translation units that include it."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t13-1",
          "question": "What linkage do variables declared inside an anonymous namespace have?",
          "options": [
            "External linkage",
            "Internal linkage (translation unit local)",
            "Dynamic linkage",
            "Thread-local linkage"
          ],
          "correctAnswer": 1,
          "explanation": "Anonymous namespaces give their declared identifiers internal linkage, restricting visibility to that TU."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t13-1",
          "title": "Two-Step ADL Swap Idiom",
          "code": "using std::swap;\nswap(x, y);",
          "question": "Why is this the canonical way to swap objects in generic C++ code?",
          "stepByStep": [
            "'using std::swap;' brings the fallback generic swap into scope.",
            "Unqualified 'swap(x, y);' allows ADL to search x and y's namespace first for a custom optimized swap.",
            "If no custom swap exists, it safely falls back to std::swap."
          ],
          "coreConcept": "Two-step swap maximizes performance by prioritizing ADL specialized overloads."
        }
      ],
      "codingChallenge": {
        "id": "cc-t17",
        "title": "Scoped Namespace Calculator",
        "difficulty": "Easy",
        "initialCode": "namespace MathOps {\n    // Return a + b\n    int add(int a, int b) {\n        // Write your code here\n        return 0;\n    }\n}",
        "solutionCode": "namespace MathOps {\n    int add(int a, int b) {\n        return a + b;\n    }\n}",
        "expectedBehavior": "Implement add function inside MathOps namespace.",
        "hints": [
          "Return a + b inside namespace MathOps"
        ],
        "testCases": [
          {
            "input": "10 20",
            "expectedOutput": "30"
          },
          {
            "input": "-5 5",
            "expectedOutput": "0"
          }
        ],
        "driverCode": "#include <iostream>\nint main() {\n    int x, y;\n    if (std::cin >> x >> y) {\n        std::cout << MathOps::add(x, y) << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t13",
      "title": "Namespaces Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t13-1",
          "type": "mcq",
          "question": "What does ADL stand for in C++?",
          "options": [
            "Asynchronous Data Loading",
            "Argument-Dependent Lookup (Koenig Lookup)",
            "Automatic Destructor Lifetime",
            "Abstract Definition Layer"
          ],
          "correctAnswerIndex": 1,
          "explanation": "ADL stands for Argument-Dependent Lookup, also known as Koenig Lookup."
        }
      ]
    }
  },
  {
    "id": "topic-14",
    "weekNumber": 14,
    "phaseId": "phase-1",
    "title": "Exceptions & Exception Safety Guarantees",
    "subtitle": "try/catch/throw, <stdexcept> Hierarchy, Stack Unwinding & noexcept Specifier",
    "goals": "Master exception mechanics, stack unwinding, RAII exception safety, and the 4 exception safety guarantees.",
    "topics": [
      "try/catch/throw",
      "std::exception Hierarchy",
      "Stack Unwinding",
      "noexcept Specifier",
      "Exception Safety Guarantees"
    ],
    "theory": {
      "overview": "C++ exceptions provide error propagation separate from normal control flow. When an exception is thrown, the runtime performs stack unwinding, deterministically invoking destructors for all automatic objects in scope.",
      "sections": [
        {
          "title": "1. The 4 Exception Safety Guarantees",
          "content": "1. **Nothrow (noexcept)**: Operation is guaranteed never to throw (move constructors, destructors, swap).\n2. **Strong Guarantee (Commit-or-Rollback)**: If an exception occurs, program state remains identical to before the call (e.g. `vector::push_back`).\n3. **Basic Guarantee**: Invariants are preserved and no resources are leaked, but state may change.\n4. **No Guarantee**: Memory leaks, corrupted state, undefined behavior."
        },
        {
          "title": "2. The noexcept Specifier",
          "content": "Marking functions `noexcept` informs the compiler that no exception can escape. If an exception does escape, `std::terminate()` is called immediately without unwinding. STL containers (`vector`) will only move elements instead of copying them if the type's move constructor is marked `noexcept`!"
        }
      ]
    },
    "deepDive": {
      "topic": "Destructors MUST Never Throw",
      "breakdown": [
        "In C++, destructors are implicitly `noexcept(true)`.",
        "If a destructor throws while another exception is already unwinding the stack, the runtime cannot handle two simultaneous active exceptions.",
        "The runtime immediately aborts execution by invoking `std::terminate()`!"
      ],
      "interviewQuestion": "Why does std::vector require move constructors to be marked noexcept to use them during reallocation?",
      "idealAnswer": "When `std::vector` reallocates its internal buffer, it must provide the Strong Exception Safety Guarantee. If moving an element throws midway through reallocation, the original elements in the old buffer have already been partially moved-from, making rollback impossible. Therefore, `std::vector` checks `std::is_nothrow_move_constructible<T>`. If the move constructor is NOT marked `noexcept`, it falls back to copying elements."
    },
    "codeExamples": [
      {
        "id": "ex-t14-1",
        "title": "Standard Exception Handling",
        "code": "#include <iostream>\n#include <stdexcept>\n\ndouble divide(double a, double b) {\n    if (b == 0.0) {\n        throw std::invalid_argument(\"Division by zero error!\");\n    }\n    return a / b;\n}\n\nint main() {\n    try {\n        std::cout << divide(10.0, 0.0) << \"\\n\";\n    } catch (const std::exception& e) {\n        std::cout << \"Caught: \" << e.what() << \"\\n\";\n    }\n    return 0;\n}",
        "explanation": "Catching by const reference `const std::exception&` prevents object slicing.",
        "output": "Caught: Division by zero error!",
        "keyTakeaways": [
          "Always catch exceptions by const reference",
          "Mark move constructors noexcept"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t14-1",
          "statement": "Destructors in C++11 and later are implicitly marked noexcept.",
          "isTrue": true,
          "explanation": "In C++11, destructors are implicitly noexcept(true) to prevent crashes during stack unwinding."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t14-1",
          "question": "What happens if an exception escapes from a function declared with `noexcept`?",
          "options": [
            "The exception is ignored",
            "std::terminate() is called immediately, aborting the process",
            "It converts to a runtime warning",
            "The function returns a default value"
          ],
          "correctAnswer": 1,
          "explanation": "Escaping an exception from a noexcept function triggers immediate invocation of std::terminate()."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t14-1",
          "title": "Catching by const Reference",
          "code": "try { throw std::runtime_error(\"failed\"); }\ncatch (const std::exception& e) { std::cout << e.what(); }",
          "question": "Why must you catch by const std::exception& instead of std::exception value?",
          "stepByStep": [
            "Catching by value slices the derived std::runtime_error object into a base std::exception object.",
            "Slicing strips derived members and breaks polymorphic virtual e.what() lookup.",
            "Catching by const reference preserves the exact derived type and avoids copying."
          ],
          "coreConcept": "Catch by const reference prevents object slicing and preserves polymorphic what()."
        }
      ],
      "codingChallenge": {
        "id": "cc-t12",
        "title": "Safe String to Integer Parser",
        "difficulty": "Easy",
        "initialCode": "#include <string>\n#include <stdexcept>\n\n// Convert string to int using std::stoi. If it throws std::invalid_argument or std::out_of_range, return -1\nint safeStringToInt(const std::string& str) {\n    // Write your code with try/catch here\n    return 0;\n}",
        "solutionCode": "#include <string>\n#include <stdexcept>\n\nint safeStringToInt(const std::string& str) {\n    try {\n        return std::stoi(str);\n    } catch (...) {\n        return -1;\n    }\n}",
        "expectedBehavior": "Safely parse string to integer, returning -1 on any exception.",
        "hints": [
          "Use try { return std::stoi(str); } catch (...) { return -1; }"
        ],
        "testCases": [
          {
            "input": "123",
            "expectedOutput": "123"
          },
          {
            "input": "abc",
            "expectedOutput": "-1"
          },
          {
            "input": "99999999999999999999",
            "expectedOutput": "-1"
          }
        ],
        "driverCode": "#include <iostream>\n#include <string>\nint main() {\n    std::string s;\n    if (std::cin >> s) {\n        std::cout << safeStringToInt(s) << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t14",
      "title": "Exceptions Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t14-1",
          "type": "mcq",
          "question": "Which exception safety guarantee promises that if an operation throws, program state is rolled back completely?",
          "options": [
            "No guarantee",
            "Basic guarantee",
            "Strong guarantee (commit-or-rollback)",
            "Nothrow guarantee"
          ],
          "correctAnswerIndex": 2,
          "explanation": "The Strong Guarantee guarantees that on failure, program state remains unchanged (atomic rollback)."
        }
      ]
    }
  },
  {
    "id": "topic-15",
    "weekNumber": 15,
    "phaseId": "phase-1",
    "title": "Classes, Structs & Object Lifecycle",
    "subtitle": "Class vs Struct, Constructors, Destructors, Accessors, Static/Const & Rule of Three",
    "goals": "Master class definitions, access modifiers, constructors/destructors, member functions, and the Rule of Three/Five/Zero.",
    "topics": [
      "Class vs Struct",
      "Constructors & Destructors",
      "Access Modifiers",
      "Const Member Functions",
      "friend",
      "Rule of Three/Five/Zero"
    ],
    "theory": {
      "overview": "Classes are user-defined types encapsulating state and behavior. In C++, `class` and `struct` are identical with one exception: default access and inheritance is `private` for `class`, and `public` for `struct`.",
      "sections": [
        {
          "title": "1. The Rule of Three / Five / Zero",
          "content": "• **Rule of Three (C++98)**: If a class defines a Destructor, Copy Constructor, or Copy Assignment Operator, it must explicitly define all three to prevent double-free shallow copy bugs.\n• **Rule of Five (C++11)**: Extends to Move Constructor and Move Assignment Operator.\n• **Rule of Zero (Modern C++)**: Design classes so they manage no raw resources directly; use standard smart pointers and containers, letting the compiler generate all special members."
        },
        {
          "title": "2. Const Member Functions & mutable",
          "content": "`void display() const;` guarantees that the function will not modify any non-static member variables of the object. Members marked `mutable` can be modified even inside const member functions (e.g. internal mutexes, cached calculations)."
        }
      ]
    },
    "deepDive": {
      "topic": "Deep Copy vs Shallow Copy Pitfalls",
      "breakdown": [
        "Default compiler-generated copy constructor performs a shallow memberwise copy.",
        "If a class holds a raw pointer `int* ptr = new int[10];`, shallow copying copies the pointer address, not the buffer.",
        "When both objects destruct, `delete[] ptr` is executed twice on the same memory address: double-free undefined behavior!"
      ],
      "interviewQuestion": "What is the Rule of Three in C++, and why does violating it cause undefined behavior?",
      "idealAnswer": "The Rule of Three states that if a class defines a custom destructor, copy constructor, or copy assignment operator, it almost certainly needs to define all three. If a class manages a raw heap resource and relies on compiler-generated copy members, the compiler performs a shallow member-wise copy. When both the original and copied objects go out of scope, both destructors attempt to free the same heap address, triggering a fatal double-free crash."
    },
    "codeExamples": [
      {
        "id": "ex-t15-1",
        "title": "Rule of Three Implementation",
        "code": "#include <iostream>\n#include <algorithm>\n\nclass IntBuffer {\n    int* data;\n    size_t size;\npublic:\n    IntBuffer(size_t s) : size(s), data(new int[s]{}) {}\n\n    // Destructor\n    ~IntBuffer() { delete[] data; }\n\n    // Copy Constructor (Deep Copy)\n    IntBuffer(const IntBuffer& other) : size(other.size), data(new int[other.size]) {\n        std::copy(other.data, other.data + size, data);\n    }\n\n    // Copy Assignment Operator (Copy-and-Swap)\n    IntBuffer& operator=(IntBuffer other) {\n        std::swap(data, other.data);\n        std::swap(size, other.size);\n        return *this;\n    }\n};\n\nint main() {\n    IntBuffer buf1(5);\n    IntBuffer buf2 = buf1; // Invokes deep copy constructor\n    std::cout << \"Safe deep copy executed successfully.\\n\";\n    return 0;\n}",
        "explanation": "Rule of Three correctly manages resource copying without double-free errors.",
        "output": "Safe deep copy executed successfully.",
        "keyTakeaways": [
          "Always implement deep copies for raw pointers",
          "Copy-and-swap idiom provides strong exception safety"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t15-1",
          "statement": "In C++, struct members are private by default.",
          "isTrue": false,
          "explanation": "In C++, struct members are public by default; class members are private by default."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t15-1",
          "question": "Which keyword allows an external function or class to access private members of a class?",
          "options": [
            "protected",
            "virtual",
            "friend",
            "extern"
          ],
          "correctAnswer": 2,
          "explanation": "The friend keyword grants non-member functions or other classes access to private/protected members."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t15-1",
          "title": "Copy-and-Swap Idiom",
          "code": "IntBuffer& operator=(IntBuffer other) {\n    std::swap(data, other.data);\n    return *this;\n}",
          "question": "Why does passing 'other' by value guarantee strong exception safety?",
          "stepByStep": [
            "Passing 'other' by value invokes the copy constructor before entering the operator.",
            "If copy construction fails and throws an exception, our existing object is completely untouched.",
            "std::swap only swaps non-throwing primitive pointers, guaranteeing no-throw assignment."
          ],
          "coreConcept": "Copy-and-swap leverages pass-by-value for automatic strong exception safety."
        }
      ],
      "codingChallenge": {
        "id": "cc-t28",
        "title": "Rectangle Area & Perimeter Class",
        "difficulty": "Easy",
        "initialCode": "class Rectangle {\n    int width;\n    int height;\npublic:\n    Rectangle(int w, int h) : width(w), height(h) {}\n    // Implement area() and perimeter()\n    int area() const { return 0; }\n    int perimeter() const { return 0; }\n};",
        "solutionCode": "class Rectangle {\n    int width;\n    int height;\npublic:\n    Rectangle(int w, int h) : width(w), height(h) {}\n    int area() const { return width * height; }\n    int perimeter() const { return 2 * (width + height); }\n};",
        "expectedBehavior": "Compute area (w*h) and perimeter (2*(w+h)) of Rectangle.",
        "hints": [
          "area = width * height",
          "perimeter = 2 * (width + height)"
        ],
        "testCases": [
          {
            "input": "5 10",
            "expectedOutput": "50 30"
          },
          {
            "input": "4 4",
            "expectedOutput": "16 16"
          }
        ],
        "driverCode": "#include <iostream>\nint main() {\n    int w, h;\n    if (std::cin >> w >> h) {\n        Rectangle r(w, h);\n        std::cout << r.area() << \" \" << r.perimeter() << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t15",
      "title": "Classes & Objects Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t15-1",
          "type": "mcq",
          "question": "What is the only syntactic difference between class and struct in C++?",
          "options": [
            "struct cannot have methods",
            "Default access modifier and default inheritance mode (private for class, public for struct)",
            "struct is allocated on the stack; class is allocated on the heap",
            "struct cannot be templated"
          ],
          "correctAnswerIndex": 1,
          "explanation": "In C++, the only difference is default access and inheritance (private vs public)."
        }
      ]
    }
  },
  {
    "id": "topic-16",
    "weekNumber": 16,
    "phaseId": "phase-1",
    "title": "C++ vs Java: Systems Architecture Comparison",
    "subtitle": "Deterministic RAII vs Garbage Collection, Native Machine Code vs JVM & Value Semantics",
    "goals": "Understand fundamental architectural differences between C++ and Java for systems engineering interviews.",
    "topics": [
      "RAII vs Garbage Collection",
      "Native Code vs JVM Bytecode",
      "Multiple Inheritance",
      "Value Semantics vs Reference Semantics"
    ],
    "theory": {
      "overview": "While C++ and Java share syntactic lineage, their architectural foundations are diametrically opposed: C++ compiles directly to native hardware machine code with deterministic memory management (RAII), whereas Java compiles to bytecode managed by a JVM with a non-deterministic Garbage Collector.",
      "sections": [
        {
          "title": "1. Core Architectural Comparison Matrix",
          "content": "• **Memory**: C++ uses deterministic stack allocation and RAII (destructors run immediately at scope exit). Java allocates all objects on the heap, destroyed asynchronously by the Garbage Collector.\n• **Execution**: C++ compiles directly to target ISA machine code. Java compiles to bytecode executed/JIT-compiled by the Java Virtual Machine.\n• **Semantics**: C++ has full value semantics (objects can live on the stack or inside structs). Java uses reference semantics for all objects.\n• **Inheritance**: C++ supports multiple inheritance and virtual base classes. Java allows single class inheritance and multiple interface implementation."
        }
      ]
    },
    "deepDive": {
      "topic": "Deterministic Destruction vs Garbage Collection Pauses",
      "breakdown": [
        "In C++, releasing a file handle, socket, or mutex is bound to object lifetime via RAII: when scope exits, destructor runs immediately.",
        "In Java, GC runs nondeterministically, creating stop-the-world latency pauses unacceptable in low-latency systems (trading, game engines, aerospace)."
      ],
      "interviewQuestion": "Compare deterministic destruction in C++ with garbage collection in Java. Why is C++ preferred for low-latency systems?",
      "idealAnswer": "C++ uses RAII: resource cleanup and memory deallocation occur deterministically the exact microsecond an object leaves scope. In contrast, Java relies on garbage collection, where dead objects linger on the heap until the GC triggers a collection cycle, introducing non-deterministic 'stop-the-world' pauses and high cache churn. Low-latency systems (HFT, robotics, kernel drivers) cannot tolerate unpredictable latency spikes, making C++'s deterministic execution mandatory."
    },
    "codeExamples": [
      {
        "id": "ex-t16-1",
        "title": "Deterministic Scope-Bound Destruction",
        "code": "#include <iostream>\n\nstruct ScopedTimer {\n    ~ScopedTimer() {\n        std::cout << \"[Destructor]: Resource released immediately!\\n\";\n    }\n};\n\nint main() {\n    std::cout << \"Entering scope\\n\";\n    {\n        ScopedTimer timer;\n    } // Destructor runs right here deterministically!\n    std::cout << \"Exited scope\\n\";\n    return 0;\n}",
        "explanation": "Demonstrates C++ deterministic destructor timing upon scope exit.",
        "output": "Entering scope\n[Destructor]: Resource released immediately!\nExited scope",
        "keyTakeaways": [
          "C++ destructors run immediately at scope exit",
          "No GC pauses or non-deterministic finalizers"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t16-1",
          "statement": "Java objects can be allocated directly on the stack without references.",
          "isTrue": false,
          "explanation": "In Java, all user-defined objects are allocated on the heap and manipulated via references."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t16-1",
          "question": "Which mechanism guarantees deterministic resource cleanup in C++ upon scope exit?",
          "options": [
            "Finalizers",
            "Garbage Collection",
            "RAII (Resource Acquisition Is Initialization)",
            "Virtual machine reference counting"
          ],
          "correctAnswer": 2,
          "explanation": "RAII guarantees deterministic cleanup via object destructors when leaving scope."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t16-1",
          "title": "Stack Allocation & Locality",
          "code": "struct Point { int x, y; };\nPoint pts[1000]; // Contiguous 8000 bytes on stack",
          "question": "Why is this vastly more cache-efficient than in Java (Point[] pts = new Point[1000])?",
          "stepByStep": [
            "In C++, Point pts[1000] is a single contiguous block of 8000 bytes in memory.",
            "In Java, Point[] is an array of 1000 pointers pointing to 1000 scattered objects on the heap.",
            "Contiguous memory enables hardware CPU cache lines and prefetching, running orders of magnitude faster."
          ],
          "coreConcept": "Value semantics eliminate pointer chasing and maximize CPU cache line locality."
        }
      ],
      "codingChallenge": {
        "id": "cc-t15",
        "title": "Compute Memory Footprint of Struct Array",
        "difficulty": "Easy",
        "initialCode": "#include <cstddef>\n\nstruct SensorReading {\n    int id;\n    double value;\n};\n\n// Return total byte size of an array of N SensorReading elements\nsize_t computeArrayFootprint(size_t n) {\n    // Write your code here\n    return 0;\n}",
        "solutionCode": "#include <cstddef>\n\nstruct SensorReading {\n    int id;\n    double value;\n};\n\nsize_t computeArrayFootprint(size_t n) {\n    return n * sizeof(SensorReading);\n}",
        "expectedBehavior": "Compute and return total contiguous bytes for N structs.",
        "hints": [
          "Multiply n by sizeof(SensorReading)"
        ],
        "testCases": [
          {
            "input": "10",
            "expectedOutput": "160"
          },
          {
            "input": "100",
            "expectedOutput": "1600"
          }
        ],
        "driverCode": "#include <iostream>\nint main() {\n    size_t n;\n    if (std::cin >> n) {\n        std::cout << computeArrayFootprint(n) << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t16",
      "title": "C++ vs Java Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t16-1",
          "type": "mcq",
          "question": "Does standard C++ have a built-in mandatory garbage collector?",
          "options": [
            "Yes, since C++11",
            "No, C++ uses deterministic lifetime and RAII",
            "Only when using smart pointers",
            "Only in debug builds"
          ],
          "correctAnswerIndex": 1,
          "explanation": "C++ has no mandatory garbage collector; memory is managed via deterministic RAII."
        }
      ]
    }
  },
  {
    "id": "topic-17",
    "weekNumber": 17,
    "phaseId": "phase-1",
    "title": "Standard Template Library (STL) Architecture",
    "subtitle": "Containers, Iterators, Algorithms, Functors & Lambda Integration",
    "goals": "Master the 4 pillars of Alexander Stepanov's STL architecture and how iterators decouple algorithms from containers.",
    "topics": [
      "STL Architecture",
      "Containers",
      "Iterators",
      "Algorithms",
      "Functors",
      "Lambda Expressions"
    ],
    "theory": {
      "overview": "The C++ Standard Template Library (STL) provides robust, battle-tested data structures and algorithms. Designed around generic programming principles, it decouples algorithms from containers through iterators, making standard C++ expressive and high-performance.",
      "sections": [
        {
          "title": "1. Everyday STL Usage: Containers, Ranges & Common Algorithms",
          "content": "Before exploring architectural internals, master common everyday STL workflows:\n• **Containers**: Sequence containers like `std::vector<T>` manage dynamic memory automatically. Initialize with `std::vector<int> v = {4, 1, 8, 3};` and append with `v.push_back(5)`.\n• **Iterators as Ranges**: Containers define `.begin()` (first element) and `.end()` (one-past-the-last element), forming standard half-open ranges `[begin, end)`.\n• **Standard Algorithms (`<algorithm>`)**: Free functions execute operations without manual indexing:\n  - `std::sort(v.begin(), v.end())`: Sorts elements in-place.\n  - `std::find(v.begin(), v.end(), target)`: Searches for a value, returning an iterator to it or `v.end()` if not found.\n  - `std::count(v.begin(), v.end(), target)`: Returns the number of occurrences of `target`."
        },
        {
          "title": "2. The Orthogonal Architecture of the STL",
          "content": "Designed by Alexander Stepanov, the STL is built on 4 decoupled orthogonal pillars: Containers (data storage), Iterators (traversal abstractions), Algorithms (processing logic), and Functors/Lambdas (customization). Instead of implementing container-specific search or sort methods ($N \\times M$ combinations), a single generic algorithm operates on any container providing matching iterator categories. This reduces complexity to $O(N + M)$."
        }
      ]
    },
    "deepDive": {
      "topic": "Lambdas as Zero-Overhead Functors",
      "breakdown": [
        "In C++, a lambda expression `[capture](params) { body }` generates an anonymous struct with an overloaded `operator()`.",
        "Captures are stored as member variables inside the struct.",
        "Because the lambda has a unique compile-time type, calls are inlined directly by the compiler with ZERO function pointer indirection!"
      ],
      "interviewQuestion": "How does the STL achieve orthogonality, and why are algorithms decoupled from containers?",
      "idealAnswer": "The STL achieves orthogonality by using iterators as an abstraction layer between containers and algorithms. Algorithms like `std::find` or `std::sort` know nothing about the underlying container (whether array, vector, or deque); they operate exclusively on iterator pairs `[first, last)`. This decouples $N$ algorithms from $M$ containers, requiring only $N + M$ implementations instead of $N \\times M$."
    },
    "codeExamples": [
      {
        "id": "ex-t17-1",
        "title": "STL Algorithm with Lambda",
        "code": "#include <iostream>\n#include <vector>\n#include <algorithm>\n\nint main() {\n    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8};\n\n    // Count even numbers using STL algorithm and lambda\n    int evens = std::count_if(numbers.begin(), numbers.end(), [](int n) {\n        return n % 2 == 0;\n    });\n\n    std::cout << \"Even count: \" << evens << \"\\n\"; // 4\n    return 0;\n}",
        "explanation": "std::count_if traverses iterators while lambda provides the predicate, inlined by compiler.",
        "output": "Even count: 4",
        "keyTakeaways": [
          "Algorithms operate on iterators",
          "Lambdas compile to inline functors"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t17-1",
          "statement": "STL algorithms such as std::sort are member functions of std::vector.",
          "isTrue": false,
          "explanation": "std::sort is a free function template in <algorithm> that operates on iterator ranges."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t17-1",
          "question": "What connects STL algorithms to STL containers?",
          "options": [
            "Virtual tables",
            "Iterators",
            "Pointers to functions",
            "Template inheritance"
          ],
          "correctAnswer": 1,
          "explanation": "Iterators serve as the decoupling interface between containers and algorithms."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t17-1",
          "title": "Lambda Inlining",
          "code": "std::sort(v.begin(), v.end(), [](int a, int b) { return a > b; });",
          "question": "Why is passing a lambda to std::sort faster than passing a C function pointer to qsort()?",
          "stepByStep": [
            "A lambda creates a unique anonymous type with a non-virtual operator().",
            "The compiler instantiates std::sort with this specific type, allowing it to inline the comparison directly into the loop.",
            "qsort() receives a raw function pointer, forcing an indirect call that defeats branch prediction and inlining."
          ],
          "coreConcept": "C++ lambdas inline comparisons directly into sorting loops with zero call overhead."
        }
      ],
      "codingChallenge": {
        "id": "cc-t16",
        "title": "Count Occurrences with STL",
        "difficulty": "Easy",
        "initialCode": "#include <vector>\n#include <algorithm>\n\n// Count how many times target appears in vector using std::count\nint countOccurrences(const std::vector<int>& vec, int target) {\n    // Write your code here\n    return 0;\n}",
        "solutionCode": "#include <vector>\n#include <algorithm>\n\nint countOccurrences(const std::vector<int>& vec, int target) {\n    return std::count(vec.begin(), vec.end(), target);\n}",
        "expectedBehavior": "Return occurrences count using std::count.",
        "hints": [
          "Call std::count(vec.begin(), vec.end(), target)"
        ],
        "testCases": [
          {
            "input": "5 1 2 2 3 2 2",
            "expectedOutput": "3"
          },
          {
            "input": "4 10 20 30 40 50",
            "expectedOutput": "0"
          }
        ],
        "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> v(n);\n        for (int i = 0; i < n; ++i) std::cin >> v[i];\n        int target;\n        std::cin >> target;\n        std::cout << countOccurrences(v, target) << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t17",
      "title": "STL Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t17-1",
          "type": "mcq",
          "question": "Who was the primary architect and designer of the C++ STL?",
          "options": [
            "Bjarne Stroustrup",
            "Alexander Stepanov",
            "Herb Sutter",
            "Scott Meyers"
          ],
          "correctAnswerIndex": 1,
          "explanation": "Alexander Stepanov designed the STL based on generic programming principles."
        }
      ]
    }
  },
  {
    "id": "topic-18",
    "weekNumber": 18,
    "phaseId": "phase-1",
    "title": "Smart Pointers & Explicit Ownership Semantics",
    "subtitle": "std::unique_ptr, std::shared_ptr, std::weak_ptr, Control Blocks & Cyclic References",
    "goals": "Master explicit pointer ownership models, unique_ptr with stateless deleters, atomic control blocks in shared_ptr, and cycle breaking with weak_ptr.",
    "topics": [
      "std::unique_ptr",
      "std::shared_ptr",
      "std::weak_ptr",
      "make_unique vs make_shared",
      "Control Blocks",
      "Circular References"
    ],
    "theory": {
      "overview": "Managing dynamic heap memory manually with raw new and delete is notoriously error-prone. Smart pointers in modern C++ solve this via RAII (Resource Acquisition Is Initialization), making ownership explicit, deterministic, and safe against exceptions and early returns.",
      "sections": [
        {
          "title": "1. The Manual Ownership Problem & Why RAII Exists",
          "content": "Consider the classic manual allocation pattern:\n```cpp\nResource* r = new Resource();\ndoSomething(); // If this throws an exception or returns early...\ndelete r;      // ...this line is skipped -> MEMORY LEAK!\n```\nIf execution exits early or throws an exception, `delete` is never executed. RAII binds the resource lifetime to a stack-allocated object: the constructor acquires the resource, and the destructor automatically frees it when the object goes out of scope, guaranteed by the compiler.",
          "codeSnippets": [
            {
              "title": "The Problem vs RAII Solution",
              "code": "// Problematic manual ownership:\nvoid risky() {\n    int* p = new int(42);\n    if (rand() % 2 == 0) return; // Leaks p!\n    delete p;\n}\n\n// Clean RAII ownership:\nvoid safe() {\n    auto p = std::make_unique<int>(42);\n    if (rand() % 2 == 0) return; // Destructor automatically runs here! No leak!\n}",
              "explanation": "std::unique_ptr guarantees that delete is called when exiting the scope, regardless of how the function returns."
            }
          ]
        },
        {
          "title": "2. std::unique_ptr: Exclusive Ownership",
          "content": "• **Single Owner**: Exactly one `std::unique_ptr` owns the managed object at any given moment.\n• **Move-Only**: Cannot be copied (`u2 = u1` is a compile error); ownership can only be transferred using `std::move`.\n• **Zero Size Overhead with Default Deleter**: When using the stateless default deleter, `sizeof(std::unique_ptr<T>)` matches a raw pointer (typically 8 bytes on 64-bit systems) due to Empty Base Optimization (EBO). Note that stateful custom deleters (e.g., function pointers) store additional state and increase its size.",
          "codeSnippets": [
            {
              "title": "Creating and Moving unique_ptr",
              "code": "#include <memory>\n#include <iostream>\n\nint main() {\n    // std::make_unique is the modern preferred allocation\n    auto u1 = std::make_unique<int>(100);\n\n    // auto u2 = u1; // COMPILE ERROR: cannot copy unique ownership!\n    auto u2 = std::move(u1); // Ownership transferred from u1 to u2\n\n    if (!u1) {\n        std::cout << \"u1 is now empty (nullptr)\\n\";\n    }\n    std::cout << \"u2 owns value: \" << *u2 << \"\\n\";\n    return 0;\n}",
              "explanation": "Moving transfers the internal raw pointer to the destination and sets the source pointer to nullptr."
            }
          ]
        },
        {
          "title": "3. Shared Ownership (shared_ptr) & Breaking Cycles (weak_ptr)",
          "content": "• **std::shared_ptr**: Multiple owners share a resource via an atomic reference count stored in a heap-allocated Control Block. The resource is destroyed when the last owner (`use_count == 0`) dies.\n• **std::weak_ptr**: Non-owning observer of a `shared_ptr`. It does not increment `use_count`, preventing circular reference memory leaks. It must be locked with `.lock()` to be accessed."
        }
      ]
    },
    "deepDive": {
      "topic": "std::make_shared vs std::make_unique",
      "breakdown": [
        "std::make_shared performs a SINGLE heap allocation for both the control block and object data, improving cache locality.",
        "However, the control block memory is not freed until `weak_count` ALSO reaches 0!",
        "Always prefer make_unique and make_shared to guarantee exception safety during argument evaluation."
      ],
      "interviewQuestion": "What is the internal overhead of std::unique_ptr versus std::shared_ptr on a 64-bit system?",
      "idealAnswer": "When using the default stateless deleter, std::unique_ptr incurs no space overhead beyond the managed raw pointer (typically 8 bytes on 64-bit systems via Empty Base Optimization) and compiles to the same machine instructions as manual delete. (A stateful deleter, however, adds storage for the deleter object). In contrast, std::shared_ptr typically requires 2 words (typically 16 bytes on 64-bit systems): one pointer to the managed object and one pointer to a heap-allocated control block containing atomic reference counts."
    },
    "codeExamples": [
      {
        "id": "ex-t18-1",
        "title": "unique_ptr Ownership Transfer & weak_ptr",
        "code": "#include <iostream>\n#include <memory>\n\nstruct Resource {\n    int id;\n    Resource(int i) : id(i) { std::cout << \"Created \" << id << \"\\n\"; }\n    ~Resource() { std::cout << \"Destroyed \" << id << \"\\n\"; }\n};\n\nint main() {\n    // Unique ownership\n    auto u1 = std::make_unique<Resource>(1);\n    // auto u2 = u1; // COMPILE ERROR: cannot copy unique_ptr!\n    auto u2 = std::move(u1); // Ownership transferred\n\n    // Shared & Weak ownership\n    auto sp = std::make_shared<Resource>(2);\n    std::weak_ptr<Resource> wp = sp;\n\n    if (auto locked = wp.lock()) {\n        std::cout << \"Accessed locked resource: \" << locked->id << \"\\n\";\n    }\n    return 0;\n}",
        "explanation": "Demonstrates move-only unique_ptr semantics and safe lock() on weak_ptr.",
        "output": "Created 1\nCreated 2\nAccessed locked resource: 2\nDestroyed 2\nDestroyed 1",
        "keyTakeaways": [
          "unique_ptr is move-only",
          "shared_ptr uses control blocks",
          "weak_ptr.lock() verifies object validity"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t18-1",
          "statement": "std::unique_ptr can be copied to share ownership across functions.",
          "isTrue": false,
          "explanation": "std::unique_ptr's copy constructor is explicitly deleted; it can only be moved."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t18-1",
          "question": "How do you safely break a circular reference memory leak between two shared_ptr objects?",
          "options": [
            "Call delete on both pointers",
            "Use std::weak_ptr for one of the back-references",
            "Cast one pointer to void*",
            "Use raw pointers with manual free"
          ],
          "correctAnswer": 1,
          "explanation": "std::weak_ptr does not increment the reference count, breaking reference cycles and preventing leaks."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t18-1",
          "title": "Empty Base Optimization (EBO) in unique_ptr",
          "code": "std::unique_ptr<int> p = std::make_unique<int>(10);\nstatic_assert(sizeof(p) == sizeof(int*));",
          "question": "Why does sizeof(std::unique_ptr) equal sizeof(raw pointer) when using the default deleter?",
          "stepByStep": [
            "The default deleter is a stateless empty struct: struct default_delete { void operator()(T* p) { delete p; } };",
            "C++ applies Empty Base Optimization (EBO), occupying 0 bytes when inherited or stored as a stateless subobject.",
            "Therefore, unique_ptr with the default deleter stores only the single raw pointer (typically 8 bytes on 64-bit platforms), incurring no space overhead compared to a raw pointer unless a stateful deleter is used."
          ],
          "coreConcept": "Zero size overhead for stateless deleters via Empty Base Optimization."
        }
      ],
      "codingChallenge": {
        "id": "cc-t18",
        "title": "Create and Move unique_ptr",
        "difficulty": "Easy",
        "initialCode": "#include <memory>\n\n// Allocate an int with value val using std::make_unique and return it\nstd::unique_ptr<int> allocateUniqueInt(int val) {\n    // Write your code here\n    return nullptr;\n}",
        "solutionCode": "#include <memory>\n\nstd::unique_ptr<int> allocateUniqueInt(int val) {\n    return std::make_unique<int>(val);\n}",
        "expectedBehavior": "Return a std::unique_ptr<int> managing heap value val.",
        "hints": [
          "Use std::make_unique<int>(val)"
        ],
        "testCases": [
          {
            "input": "42",
            "expectedOutput": "42"
          },
          {
            "input": "-10",
            "expectedOutput": "-10"
          }
        ],
        "driverCode": "#include <iostream>\n#include <memory>\nint main() {\n    int v;\n    if (std::cin >> v) {\n        auto ptr = allocateUniqueInt(v);\n        if (ptr) {\n            std::cout << *ptr << \"\\n\";\n        }\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t18",
      "title": "Smart Pointers Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t18-1",
          "type": "mcq",
          "question": "What is the typical memory size of std::shared_ptr on a 64-bit architecture?",
          "options": [
            "Typically 8 bytes",
            "Typically 16 bytes (pointer to object + pointer to control block)",
            "24 bytes",
            "32 bytes"
          ],
          "correctAnswerIndex": 1,
          "explanation": "On typical 64-bit implementations, std::shared_ptr stores two pointers: one to the managed object and one to the heap control block, typically totaling 16 bytes."
        }
      ]
    }
  }
];
