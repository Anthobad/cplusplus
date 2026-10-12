import { Unit } from "../types";

/**
 * Domain III: Object-Oriented Programming & Systems Architecture (Topics 28–33)
 * Progressive ramp: Inheritance -> Polymorphism & Virtual Tables -> Operator Overloading -> Composition & SOLID -> Templates & Generic Programming -> Multi-Threading & Concurrency Synchronization.
 */
export const DOMAIN_3_UNITS: Unit[] = [
  {
    "id": "topic-28",
    "weekNumber": 28,
    "phaseId": "phase-3",
    "title": "Inheritance Hierarchies & Access Control",
    "subtitle": "IS-A Relationships, public/protected/private Inheritance, Upcasting & dynamic_cast",
    "goals": "Master derived class mechanics, constructor initialization order, access specifiers in inheritance, and casting across hierarchies.",
    "topics": [
      "Inheritance Modes",
      "public vs protected vs private",
      "Constructor / Destructor Order",
      "Upcasting",
      "dynamic_cast"
    ],
    "theory": {
      "overview": "Inheritance models IS-A relationships. A derived class inherits base class members. C++ supports three inheritance modes (public, protected, private) and multiple inheritance.",
      "sections": [
        {
          "title": "1. Inheritance Access Modes",
          "content": "• `class Derived : public Base`: Public members remain public; protected remain protected.\n• `class Derived : protected Base`: Public and protected members become protected.\n• `class Derived : private Base`: Public and protected members become private in Derived."
        },
        {
          "title": "2. Construction & Destruction Order",
          "content": "1. Base class constructor executes first.\n2. Derived class member variables are constructed.\n3. Derived class constructor body executes.\nDestructors execute in exact reverse order (Derived destructor first, then Base destructor)."
        }
      ]
    },
    "deepDive": {
      "topic": "dynamic_cast vs static_cast in Hierarchies",
      "breakdown": [
        "`static_cast<Derived*>(basePtr)`: Fast compile-time downcast without runtime checks. If basePtr is not actually a Derived, dereferencing causes undefined behavior!",
        "`dynamic_cast<Derived*>(basePtr)`: Uses Run-Time Type Information (RTTI) via the vtable. Returns `nullptr` if basePtr is not of type Derived."
      ],
      "interviewQuestion": "What is the order of constructor and destructor calls in an inheritance hierarchy?",
      "idealAnswer": "Construction proceeds base-to-derived: the base class constructor executes first, followed by member variables of the derived class in declaration order, and finally the derived class constructor body. Destruction proceeds in exact reverse order: derived destructor body first, then derived members, and finally the base class destructor."
    },
    "codeExamples": [
      {
        "id": "ex-t28-1",
        "title": "Public Inheritance & Upcasting",
        "code": "#include <iostream>\n#include <string>\n\nclass Animal {\npublic:\n    void speak() const { std::cout << \"Animal sound\\n\"; }\n};\n\nclass Dog : public Animal {\npublic:\n    void bark() const { std::cout << \"Woof!\\n\"; }\n};\n\nint main() {\n    Dog d;\n    d.bark();\n    // Implicit upcasting: Dog IS-A Animal\n    Animal& a = d;\n    a.speak();\n    return 0;\n}",
        "explanation": "Demonstrates derived class inheritance and safe implicit upcasting.",
        "output": "Woof!\nAnimal sound",
        "keyTakeaways": [
          "Base constructs before Derived",
          "Upcasting is implicit and safe"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t28-1",
          "statement": "When an object of a derived class is destroyed, the base class destructor executes before the derived destructor.",
          "isTrue": false,
          "explanation": "Destructors execute in reverse order: Derived class destructor runs first, followed by Base class destructor."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t28-1",
          "question": "What does dynamic_cast return when casting an invalid pointer down a polymorphic hierarchy?",
          "options": [
            "Throws std::bad_cast",
            "nullptr (null pointer)",
            "Undefined behavior",
            "Returns the base pointer unchanged"
          ],
          "correctAnswer": 1,
          "explanation": "For pointers, dynamic_cast returns nullptr on failed downcasts (it throws std::bad_cast only for references)."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t28-1",
          "title": "Safe Upcasting",
          "code": "Dog myDog;\nAnimal* p = &myDog; // Upcast",
          "question": "Why does the compiler permit this without explicit casting?",
          "stepByStep": [
            "Dog publicly inherits from Animal (Dog IS-A Animal).",
            "In memory, the Animal subobject sits at the very beginning of the Dog object layout.",
            "The compiler can directly treat the Dog address as a valid Animal address."
          ],
          "coreConcept": "Public inheritance enables safe implicit upcasting."
        }
      ],
      "codingChallenge": {
        "id": "cc-t30",
        "title": "Derived Employee Payroll",
        "difficulty": "Easy",
        "initialCode": "class Person {\npublic:\n    int id;\n    Person(int i) : id(i) {}\n};\n\nclass Employee : public Person {\npublic:\n    int salary;\n    // Implement constructor Employee(int id, int salary)\n};",
        "solutionCode": "class Person {\npublic:\n    int id;\n    Person(int i) : id(i) {}\n};\n\nclass Employee : public Person {\npublic:\n    int salary;\n    Employee(int i, int s) : Person(i), salary(s) {}\n};",
        "expectedBehavior": "Construct Employee properly forwarding id to base Person constructor.",
        "hints": [
          "Use member initializer list: Employee(int i, int s) : Person(i), salary(s) {}"
        ],
        "testCases": [
          {
            "input": "101 75000",
            "expectedOutput": "101: 75000"
          },
          {
            "input": "202 90000",
            "expectedOutput": "202: 90000"
          }
        ],
        "driverCode": "#include <iostream>\nint main() {\n    int id, sal;\n    if (std::cin >> id >> sal) {\n        Employee e(id, sal);\n        std::cout << e.id << \": \" << e.salary << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t28",
      "title": "Inheritance Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t28-1",
          "type": "mcq",
          "question": "Which members of a base class are accessible inside a derived class with public inheritance?",
          "options": [
            "Only public members",
            "Public and protected members",
            "All members including private",
            "None"
          ],
          "correctAnswerIndex": 1,
          "explanation": "Protected and public members are accessible to derived classes; private members are not."
        }
      ]
    }
  },
  {
    "id": "topic-29",
    "weekNumber": 29,
    "phaseId": "phase-3",
    "title": "Polymorphism, Virtual Vtables & Dynamic Dispatch",
    "subtitle": "Virtual Methods, vptr/vtable Mechanics, Virtual Destructors & the Diamond Problem",
    "goals": "Master dynamic polymorphism, virtual function tables (vtables), virtual destructors, and virtual inheritance.",
    "topics": [
      "virtual Keyword",
      "Pure Virtual (= 0)",
      "vptr & vtable Layout",
      "Virtual Destructors",
      "Diamond Problem",
      "virtual Inheritance"
    ],
    "theory": {
      "overview": "Polymorphism allows treating derived objects uniformly through base pointers. Dynamic dispatch is achieved via a compiler-generated Virtual Method Table (vtable) and an implicit virtual table pointer (`vptr`) placed inside each polymorphic object.",
      "sections": [
        {
          "title": "1. How vptr and vtable Work Under the Hood",
          "content": "• In typical 64-bit implementations, any class declaring or inheriting a `virtual` function contains an implicit hidden pointer: the `vptr` (typically 8 bytes) at offset 0.\n• The `vptr` points to the class's `vtable` (an array of function pointers stored in read-only `.rodata`).\n• Calling `ptr->draw()` compiles to: `(*ptr->vptr[index])(ptr)`.\n\n```\n  Object in Memory (e.g. Circle)\n┌─────────────────────────────────────────┐\n│ vptr (typically 8 bytes on 64-bit)      │ ────►  vtable for Circle (in .rodata)\n├─────────────────────────────────────────┤       ┌──────────────────────────────┐\n│ Circle member data...                   │       │ [0] &Circle::draw()          │\n└─────────────────────────────────────────┘       │ [1] &Circle::~Circle()       │\n                                                  └──────────────────────────────┘\n```"
        },
        {
          "title": "2. The Mandatory Virtual Destructor Rule",
          "content": "If a class has ANY virtual function, its destructor MUST be virtual: `virtual ~Base() = default;`.\nIf you delete a derived object through a base pointer `Base* b = new Derived(); delete b;` and `~Base()` is not virtual, the derived destructor NEVER runs, causing memory leaks and undefined behavior!"
        },
        {
          "title": "3. The Diamond Problem & Virtual Inheritance",
          "content": "When class D inherits from B and C, both inheriting from A, D contains two duplicate copies of A. Solution: Virtual inheritance (`class B : virtual public A`) ensures only a single shared instance of A exists in D."
        }
      ]
    },
    "deepDive": {
      "topic": "Object Slicing",
      "breakdown": [
        "Object slicing occurs when a derived object is assigned to a base object by value: `Base b = derivedObj;`.",
        "The compiler copies only the Base slice of data, slicing off derived member variables and resetting the vptr to Base!",
        "Always pass polymorphic objects by reference (`const Base&`) or pointer (`Base*`)."
      ],
      "interviewQuestion": "Why MUST base class destructors be declared virtual when deleting derived objects through base pointers?",
      "idealAnswer": "If a base class destructor is not declared virtual, the compiler resolves the destructor call statically based on the pointer type. Deleting a derived object through a base pointer `delete basePtr` will only execute the base class destructor; the derived class destructor will never run. This leaks resources allocated by the derived class and triggers undefined behavior under the C++ standard."
    },
    "codeExamples": [
      {
        "id": "ex-t29-1",
        "title": "Dynamic Dispatch & Virtual Destructors",
        "code": "#include <iostream>\n#include <memory>\n\nclass Shape {\npublic:\n    virtual ~Shape() { std::cout << \"~Shape()\\n\"; }\n    virtual void draw() const = 0; // Pure virtual\n};\n\nclass Circle : public Shape {\npublic:\n    ~Circle() override { std::cout << \"~Circle()\\n\"; }\n    void draw() const override { std::cout << \"Drawing Circle\\n\"; }\n};\n\nint main() {\n    std::unique_ptr<Shape> s = std::make_unique<Circle>();\n    s->draw(); // Dynamic dispatch via vtable -> Circle::draw\n    // Destruction invokes ~Circle() then ~Shape() safely!\n    return 0;\n}",
        "explanation": "Pure virtual makes Shape abstract; virtual destructor ensures clean polymorphic deletion.",
        "output": "Drawing Circle\n~Circle()\n~Shape()",
        "keyTakeaways": [
          "Virtual destructor is mandatory on base classes",
          "override keyword catches typo bugs at compile-time"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t29-1",
          "statement": "Calling a virtual function through a base pointer is resolved statically at compile time.",
          "isTrue": false,
          "explanation": "Virtual functions are dispatched dynamically at runtime by looking up the function address in the object's vtable."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t29-1",
          "question": "How does C++ solve the Diamond Problem in multiple inheritance?",
          "options": [
            "By forbidding multiple inheritance",
            "Virtual inheritance: `class B : virtual public A`",
            "Using static_cast",
            "With friend classes"
          ],
          "correctAnswer": 1,
          "explanation": "Virtual base classes ensure only a single shared instance of the root base class exists in the derived object."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t29-1",
          "title": "Vtable Dispatch Indirection",
          "code": "ptr->virtualMethod();",
          "question": "How does the machine code resolve which function to call?",
          "stepByStep": [
            "CPU dereferences ptr to access the object's hidden vptr at offset 0.",
            "vptr points to the class's vtable in read-only memory.",
            "CPU indexes the vtable to fetch the target function address: call [vptr + offset].",
            "The concrete derived implementation executes."
          ],
          "coreConcept": "Dynamic dispatch adds a single pointer indirection step at runtime."
        }
      ],
      "codingChallenge": {
        "id": "cc-t31",
        "title": "Polymorphic Area Calculator",
        "difficulty": "Easy",
        "initialCode": "#include <iostream>\n\nclass IShape {\npublic:\n    virtual ~IShape() = default;\n    virtual int getArea() const = 0;\n};\n\nclass Square : public IShape {\n    int side;\npublic:\n    Square(int s) : side(s) {}\n    // Implement getArea()\n    int getArea() const override { return 0; }\n};",
        "solutionCode": "#include <iostream>\n\nclass IShape {\npublic:\n    virtual ~IShape() = default;\n    virtual int getArea() const = 0;\n};\n\nclass Square : public IShape {\n    int side;\npublic:\n    Square(int s) : side(s) {}\n    int getArea() const override { return side * side; }\n};",
        "expectedBehavior": "Implement polymorphic Square::getArea returning side*side.",
        "hints": [
          "Return side * side in override getArea"
        ],
        "testCases": [
          {
            "input": "5",
            "expectedOutput": "25"
          },
          {
            "input": "10",
            "expectedOutput": "100"
          }
        ],
        "driverCode": "#include <iostream>\nint main() {\n    int s;\n    if (std::cin >> s) {\n        Square sq(s);\n        IShape* shape = &sq;\n        std::cout << shape->getArea() << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t29",
      "title": "Polymorphism Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t29-1",
          "type": "mcq",
          "question": "What makes a C++ class an abstract class that cannot be directly instantiated?",
          "options": [
            "Marking the class with the abstract keyword",
            "Declaring at least one pure virtual function (`= 0`)",
            "Making the constructor private",
            "Having no member variables"
          ],
          "correctAnswerIndex": 1,
          "explanation": "In C++, a class with at least one pure virtual function (= 0) is an abstract class."
        }
      ]
    }
  },
  {
    "id": "topic-30",
    "weekNumber": 30,
    "phaseId": "phase-3",
    "title": "Operator Overloading & Spaceship Operator (<=>)",
    "subtitle": "Member vs Non-Member Operators, Symmetric Conversions & C++20 Three-Way Comparison",
    "goals": "Master operator overloading rules, symmetric friend operators, operator<< stream formatting, and the C++20 <=> spaceship operator.",
    "topics": [
      "Operator Overloading",
      "Member vs Non-member",
      "Friend Operators",
      "operator<< and >>",
      "Spaceship Operator <=> (C++20)"
    ],
    "theory": {
      "overview": "Operator overloading allows user-defined types to behave like primitive types with standard operators (`+`, `==`, `<<`). Binary arithmetic operators should be non-member friend functions to support symmetric implicit conversions on both left and right operands.",
      "sections": [
        {
          "title": "1. Member vs Non-Member Operators",
          "content": "If `operator+` is a member: `a + b` compiles as `a.operator+(b)`. If `a` is an `int` and `b` is a `Complex`, `2 + c` FAILS to compile! By implementing `operator+` as a non-member friend function, implicit conversions apply symmetrically to both sides."
        },
        {
          "title": "2. The C++20 Spaceship Operator (<=>)",
          "content": "C++20 introduces the three-way comparison operator `<=>`. Implementing `auto operator<=>(const T&) const = default;` automatically generates all 6 comparison operators (`<`, `<=`, `>`, `>=`, `==`, `!=`)!"
        }
      ]
    },
    "deepDive": {
      "topic": "Overloading operator<< for Streams",
      "breakdown": [
        "`operator<<` cannot be a member function because the left operand is `std::ostream&`, not your class.",
        "Always implement as a non-member function: `std::ostream& operator<<(std::ostream& os, const MyClass& obj);` and return `os`."
      ],
      "interviewQuestion": "Why should binary arithmetic operators (+, -, *) generally be implemented as non-member friend functions?",
      "idealAnswer": "When an operator is declared as a member function, the left operand is implicitly bound to the `this` pointer and cannot undergo implicit type conversion. For example, `Complex + 5` would compile via `Complex::operator+(5)`, but `5 + Complex` would fail. Implementing arithmetic operators as non-member functions allows the compiler to apply implicit conversions symmetrically to both the left and right operands."
    },
    "codeExamples": [
      {
        "id": "ex-t30-1",
        "title": "Overloading operator+ and operator<<",
        "code": "#include <iostream>\n\nclass Point {\n    int x, y;\npublic:\n    Point(int x = 0, int y = 0) : x(x), y(y) {}\n\n    // Non-member friend for symmetric addition\n    friend Point operator+(const Point& a, const Point& b) {\n        return Point(a.x + b.x, a.y + b.y);\n    }\n\n    // Stream output operator\n    friend std::ostream& operator<<(std::ostream& os, const Point& p) {\n        return os << \"(\" << p.x << \", \" << p.y << \")\";\n    }\n};\n\nint main() {\n    Point p1(2, 3);\n    Point p2(4, 5);\n    Point p3 = p1 + p2;\n    std::cout << \"Sum point: \" << p3 << \"\\n\"; // (6, 8)\n    return 0;\n}",
        "explanation": "Non-member friend operator+ and operator<< format output cleanly.",
        "output": "Sum point: (6, 8)",
        "keyTakeaways": [
          "Stream operators must be non-members",
          "Return ostream reference for chaining"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t30-1",
          "statement": "operator<< for std::cout can be implemented as a member function of your class.",
          "isTrue": false,
          "explanation": "In std::cout << obj, the left operand is std::ostream, so operator<< must be a non-member function."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t30-1",
          "question": "Which C++20 operator generates all six relational comparison operators automatically when defaulted?",
          "options": [
            "operator==",
            "operator!=",
            "Three-way comparison (spaceship) operator <=>",
            "operator~="
          ],
          "correctAnswer": 2,
          "explanation": "The spaceship operator <=> in C++20 automatically synthesizes <, <=, >, >=, ==, and !=."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t30-1",
          "title": "Stream Chaining",
          "code": "std::cout << p1 << \" and \" << p2;",
          "question": "Why does returning std::ostream& enable chaining multiple outputs in one line?",
          "stepByStep": [
            "std::cout << p1 evaluates operator<<(std::cout, p1) and returns a reference to std::cout.",
            "The returned std::cout reference immediately becomes the left operand for << ' and '.",
            "This left-to-right associative chaining continues until the end of the statement."
          ],
          "coreConcept": "Returning stream references enables fluent operator chaining."
        }
      ],
      "codingChallenge": {
        "id": "cc-t32",
        "title": "2D Vector Equality Operator",
        "difficulty": "Easy",
        "initialCode": "struct Vec2 {\n    int x, y;\n    // Implement operator== and operator!=\n};",
        "solutionCode": "struct Vec2 {\n    int x, y;\n    bool operator==(const Vec2& other) const {\n        return x == other.x && y == other.y;\n    }\n    bool operator!=(const Vec2& other) const {\n        return !(*this == other);\n    }\n};",
        "expectedBehavior": "Implement equality operators for Vec2.",
        "hints": [
          "Compare x == other.x && y == other.y"
        ],
        "testCases": [
          {
            "input": "1 2 1 2",
            "expectedOutput": "equal"
          },
          {
            "input": "1 2 2 1",
            "expectedOutput": "not_equal"
          }
        ],
        "driverCode": "#include <iostream>\nint main() {\n    int x1, y1, x2, y2;\n    if (std::cin >> x1 >> y1 >> x2 >> y2) {\n        Vec2 a{x1, y1}, b{x2, y2};\n        std::cout << (a == b ? \"equal\" : \"not_equal\") << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t30",
      "title": "Operator Overloading Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t30-1",
          "type": "mcq",
          "question": "Which of the following operators CANNOT be overloaded in C++?",
          "options": [
            "operator+",
            "operator[]",
            "Scope resolution operator `::`",
            "operator()"
          ],
          "correctAnswerIndex": 2,
          "explanation": "The scope resolution operator ::, member access ., and sizeof cannot be overloaded in C++."
        }
      ]
    }
  },
  {
    "id": "topic-31",
    "weekNumber": 31,
    "phaseId": "phase-3",
    "title": "Further OOP Principles, Composition & SOLID",
    "subtitle": "Composition vs Inheritance, Encapsulation, Association & the 5 SOLID Principles",
    "goals": "Master architectural software design: Composition over Inheritance, data encapsulation, and the SOLID principles in C++.",
    "topics": [
      "Composition vs Inheritance",
      "Association & Aggregation",
      "Encapsulation",
      "SOLID Principles",
      "Dependency Injection"
    ],
    "theory": {
      "overview": "Object-oriented systems design balances code reuse and architectural coupling. Modern C++ heavily favors 'Composition over Inheritance' to prevent fragile base class problems and enforces the 5 SOLID principles.",
      "sections": [
        {
          "title": "1. Composition over Inheritance",
          "content": "Inheritance creates tight compile-time coupling ('white-box reuse'). Composition embeds objects as member fields ('black-box reuse', HAS-A relationship), allowing interchangeable components and easier unit testing."
        },
        {
          "title": "2. The SOLID Principles in C++",
          "content": "• **S - Single Responsibility**: A class should have only one reason to change.\n• **O - Open/Closed**: Open for extension (via abstract interfaces), closed for modification.\n• **L - Liskov Substitution**: Subtypes must be substitutable for their base types without altering correctness.\n• **I - Interface Segregation**: Clients should not be forced to depend upon interfaces they do not use.\n• **D - Dependency Inversion**: Depend upon abstractions (abstract classes/concepts), not concrete classes."
        }
      ]
    },
    "deepDive": {
      "topic": "Liskov Substitution Principle Violation Example",
      "breakdown": [
        "Classic violation: Square inheriting from Rectangle.",
        "Rectangle allows independently setting width and height (`r.setWidth(5); r.setHeight(10); assert(r.area() == 50)`).",
        "If Square overrides setWidth to set both width and height, passing Square to code expecting Rectangle breaks invariants and violates LSP!"
      ],
      "interviewQuestion": "What is the Liskov Substitution Principle (LSP), and how is it commonly violated in C++?",
      "idealAnswer": "The Liskov Substitution Principle states that if S is a subtype of T, objects of type T may be replaced with objects of type S without altering the correctness or invariants of the program. A classic violation is making `Square` inherit from `Rectangle`. In code that expects a `Rectangle`, a developer expects `setWidth` and `setHeight` to be independent. Modifying a `Square`'s width mutates its height, breaking caller assumptions and violating LSP."
    },
    "codeExamples": [
      {
        "id": "ex-t31-1",
        "title": "Composition & Dependency Injection",
        "code": "#include <iostream>\n#include <memory>\n\nclass ILogger {\npublic:\n    virtual ~ILogger() = default;\n    virtual void log(const std::string& msg) = 0;\n};\n\nclass ConsoleLogger : public ILogger {\npublic:\n    void log(const std::string& msg) override {\n        std::cout << \"[LOG]: \" << msg << \"\\n\";\n    }\n};\n\n// Dependency Inversion & Composition: OrderProcessor depends on ILogger interface\nclass OrderProcessor {\n    std::shared_ptr<ILogger> logger;\npublic:\n    OrderProcessor(std::shared_ptr<ILogger> l) : logger(l) {}\n    void processOrder(int id) {\n        logger->log(\"Processing order #\" + std::to_string(id));\n    }\n};\n\nint main() {\n    auto logger = std::make_shared<ConsoleLogger>();\n    OrderProcessor processor(logger);\n    processor.processOrder(42);\n    return 0;\n}",
        "explanation": "Demonstrates Dependency Inversion and Composition instead of concrete inheritance coupling.",
        "output": "[LOG]: Processing order #42",
        "keyTakeaways": [
          "Favor composition over inheritance",
          "Depend on abstractions, not concrete classes"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t31-1",
          "statement": "The Open/Closed Principle means you should constantly modify existing tested classes whenever adding features.",
          "isTrue": false,
          "explanation": "Open/Closed means software entities should be open for extension (via interfaces) but closed for modification."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t31-1",
          "question": "Which SOLID principle is violated when an interface forces a class to implement dummy methods it does not need?",
          "options": [
            "Single Responsibility Principle",
            "Interface Segregation Principle",
            "Liskov Substitution Principle",
            "Open/Closed Principle"
          ],
          "correctAnswer": 1,
          "explanation": "The Interface Segregation Principle states that clients should not be forced to depend on methods they do not use."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t31-1",
          "title": "Composition Decoupling",
          "code": "class Engine { public: void start(); };\nclass Car { Engine engine; public: void start() { engine.start(); } };",
          "question": "Why is HAS-A (composition) better than IS-A (Car inheriting Engine)?",
          "stepByStep": [
            "A Car is not an Engine; it possesses an Engine.",
            "Inheritance would expose all internal implementation methods of Engine to Car callers.",
            "Composition encapsulates the engine as an internal component, allowing easy replacement or mocking."
          ],
          "coreConcept": "Composition provides clean encapsulation and eliminates fragile base classes."
        }
      ],
      "codingChallenge": {
        "id": "cc-t33",
        "title": "Composed Computer System",
        "difficulty": "Easy",
        "initialCode": "class CPU {\n    int cores;\npublic:\n    CPU(int c) : cores(c) {}\n    int getCores() const { return cores; }\n};\n\nclass Computer {\n    CPU cpu;\npublic:\n    // Implement Computer(int cores) using composition\n    Computer(int cores) : cpu(cores) {}\n    int getTotalCores() const { return 0; }\n};",
        "solutionCode": "class CPU {\n    int cores;\npublic:\n    CPU(int c) : cores(c) {}\n    int getCores() const { return cores; }\n};\n\nclass Computer {\n    CPU cpu;\npublic:\n    Computer(int cores) : cpu(cores) {}\n    int getTotalCores() const { return cpu.getCores(); }\n};",
        "expectedBehavior": "Delegate getTotalCores() to composed CPU member.",
        "hints": [
          "Return cpu.getCores() in getTotalCores()"
        ],
        "testCases": [
          {
            "input": "8",
            "expectedOutput": "8"
          },
          {
            "input": "16",
            "expectedOutput": "16"
          }
        ],
        "driverCode": "#include <iostream>\nint main() {\n    int c;\n    if (std::cin >> c) {\n        Computer comp(c);\n        std::cout << comp.getTotalCores() << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t31",
      "title": "OOP Principles Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t31-1",
          "type": "mcq",
          "question": "What relationship does object composition model?",
          "options": [
            "IS-A relationship",
            "HAS-A relationship",
            "EXTENDS relationship",
            "IMPLEMENTS relationship"
          ],
          "correctAnswerIndex": 1,
          "explanation": "Composition models a HAS-A relationship (e.g. Car HAS-A Engine)."
        }
      ]
    }
  },
  {
    "id": "topic-32",
    "weekNumber": 32,
    "phaseId": "phase-3",
    "title": "Templates & Generic Programming",
    "subtitle": "Function Templates, Class Templates, Full Specialization & Two-Phase Lookup",
    "goals": "Master compile-time generic code generation, template specialization, and two-phase name lookup.",
    "topics": [
      "Function Templates",
      "Class Templates",
      "Template Specialization",
      "Two-Phase Lookup",
      "Compile-Time Code Generation"
    ],
    "theory": {
      "overview": "Templates enable parametric polymorphism: writing type-agnostic blueprints. During compilation, the compiler generates a specialized instance of the function or class for each unique set of template type arguments (instantiation).",
      "sections": [
        {
          "title": "1. Template Instantiation Mechanics",
          "content": "Templates are not compiled into machine code until instantiated. If `template<typename T> T max(T a, T b)` is called with `int` and `double`, the compiler generates two distinct assembly functions: `max<int>` and `max<double>`. Because of this, template definitions must usually reside in header files."
        },
        {
          "title": "2. Full Template Specialization",
          "content": "Allows customizing implementation for a specific type:\n```cpp\ntemplate<typename T> struct Formatter { /* generic */ };\ntemplate<> struct Formatter<bool> { /* specialized for bool */ };\n```"
        }
      ]
    },
    "deepDive": {
      "topic": "Two-Phase Name Lookup",
      "breakdown": [
        "Phase 1 (Template Definition): Compiler parses non-dependent names (names that do not depend on template parameters T) and syntax.",
        "Phase 2 (Template Instantiation): Compiler resolves dependent names (names that depend on T) using Argument-Dependent Lookup (ADL) based on the concrete type."
      ],
      "interviewQuestion": "Why must C++ template implementations typically be placed in header files rather than .cpp files?",
      "idealAnswer": "C++ uses a separate compilation model where each .cpp file is compiled into an isolated object file without knowledge of other translation units. When a template function is called in `main.cpp`, the compiler must see the full template implementation at that call site to instantiate the concrete machine code for that type. If only the declaration is in the header and the body is in another .cpp file, the linker fails with an undefined reference error."
    },
    "codeExamples": [
      {
        "id": "ex-t32-1",
        "title": "Function Template with Multiple Types",
        "code": "#include <iostream>\n\ntemplate<typename T, typename U>\nauto multiply(T a, U b) -> decltype(a * b) {\n    return a * b;\n}\n\nint main() {\n    std::cout << multiply(5, 2.5) << \"\\n\"; // 12.5 (int * double)\n    std::cout << multiply(4, 3) << \"\\n\";   // 12 (int * int)\n    return 0;\n}",
        "explanation": "Compiler deduces T=int, U=double, generating specialized multiplication functions.",
        "output": "12.5\n12",
        "keyTakeaways": [
          "Templates generate specialized code per type",
          "Header placement is required for instantiation"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t32-1",
          "statement": "Templates incur runtime virtual table overhead similar to polymorphism.",
          "isTrue": false,
          "explanation": "Templates are purely compile-time abstractions; they generate direct static machine instructions with zero vtable overhead."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t32-1",
          "question": "When are template functions instantiated into concrete machine code?",
          "options": [
            "At runtime during startup",
            "During compilation at call sites",
            "By the linker",
            "When the library is installed"
          ],
          "correctAnswer": 1,
          "explanation": "The compiler instantiates concrete machine code at compile time when it encounters template calls."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t32-1",
          "title": "Compile-Time Code Generation",
          "code": "template<typename T>\nT square(T x) { return x * x; }\nauto a = square(5);\nauto b = square(2.5);",
          "question": "How many functions are generated in the binary?",
          "stepByStep": [
            "square(5) calls square with T=int.",
            "square(2.5) calls square with T=double.",
            "The compiler generates two distinct assembly functions: square<int> and square<double>."
          ],
          "coreConcept": "Templates generate specialized code for each concrete type."
        }
      ],
      "codingChallenge": {
        "id": "cc-t14",
        "title": "Generic Maximum Element Finder",
        "difficulty": "Easy",
        "initialCode": "#include <iostream>\n\n// Return maximum of three generic values\ntemplate<typename T>\nT findMaxOfThree(T a, T b, T c) {\n    // Write your code here\n    return a;\n}",
        "solutionCode": "#include <iostream>\n\ntemplate<typename T>\nT findMaxOfThree(T a, T b, T c) {\n    T maxVal = a;\n    if (b > maxVal) maxVal = b;\n    if (c > maxVal) maxVal = c;\n    return maxVal;\n}",
        "expectedBehavior": "Return the maximum of three values using templates.",
        "hints": [
          "Compare a, b, c and return the highest"
        ],
        "testCases": [
          {
            "input": "10 25 15",
            "expectedOutput": "25"
          },
          {
            "input": "30 20 10",
            "expectedOutput": "30"
          }
        ],
        "driverCode": "#include <iostream>\nint main() {\n    int a, b, c;\n    if (std::cin >> a >> b >> c) {\n        std::cout << findMaxOfThree(a, b, c) << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t32",
      "title": "Templates Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t32-1",
          "type": "mcq",
          "question": "What is template specialization?",
          "options": [
            "An optimization that deletes unused templates",
            "Providing a custom implementation of a template for a specific concrete type",
            "A syntax for dynamically loading shared libraries",
            "Converting templates to macros"
          ],
          "correctAnswerIndex": 1,
          "explanation": "Template specialization provides custom implementation logic for specific types."
        }
      ]
    }
  },
  {
    "id": "topic-33",
    "weekNumber": 33,
    "phaseId": "phase-3",
    "title": "Multi-Threading Basics & Synchronization",
    "subtitle": "Process vs Thread Memory, std::thread, join/detach, std::mutex, std::lock_guard & Data Races",
    "goals": "Master basic thread lifecycle, mutex synchronization, RAII lock_guard, and data race prevention.",
    "topics": [
      "std::thread",
      "join() and detach()",
      "std::mutex",
      "std::lock_guard",
      "Data Races",
      "RAII Locks"
    ],
    "theory": {
      "overview": "C++11 introduced standardized multi-threading. Threads within the same process share heap memory, global variables, and open files, but possess private call stacks. Concurrent access without synchronization causes Undefined Behavior data races.",
      "sections": [
        {
          "title": "1. Thread Lifecycle: join() vs detach()",
          "content": "Every `std::thread` must be either `join()`ed (parent waits for thread completion) or `detach()`ed (thread runs in background) before its destructor runs. If a `std::thread` is destroyed while still joinable, its destructor invokes `std::terminate()`, crashing the entire application!"
        },
        {
          "title": "2. Mutexes & RAII std::lock_guard",
          "content": "Never call `.lock()` and `.unlock()` manually on a `std::mutex`—if an exception is thrown before unlock, the mutex is permanently deadlocked. Always use RAII wrappers: `std::lock_guard<std::mutex> lock(mtx);` or `std::scoped_lock`."
        }
      ]
    },
    "deepDive": {
      "topic": "What is a Data Race in C++?",
      "breakdown": [
        "A Data Race occurs when: 1) Two or more threads concurrently access the same memory location, 2) At least one access is a write, and 3) There is no synchronization.",
        "Under the C++ Memory Model, a data race is Undefined Behavior! It is NOT just a stale read—the compiler may reorder instructions, tear memory words, or eliminate code."
      ],
      "interviewQuestion": "What is a data race in C++, and why does RAII std::lock_guard prevent deadlocks?",
      "idealAnswer": "A data race occurs when two or more threads concurrently access the same memory location without synchronization and at least one access is a write. In the C++ standard, data races result in undefined behavior. `std::lock_guard` prevents deadlocks caused by early returns or exceptions because its destructor deterministically releases the acquired mutex during stack unwinding."
    },
    "codeExamples": [
      {
        "id": "ex-t33-1",
        "title": "Thread-Safe Counter with lock_guard",
        "code": "#include <iostream>\n#include <thread>\n#include <mutex>\n#include <vector>\n\nint counter = 0;\nstd::mutex counterMtx;\n\nvoid increment() {\n    for (int i = 0; i < 1000; ++i) {\n        std::lock_guard<std::mutex> lock(counterMtx);\n        counter++;\n    }\n}\n\nint main() {\n    std::thread t1(increment);\n    std::thread t2(increment);\n    t1.join();\n    t2.join();\n    std::cout << \"Final counter: \" << counter << \"\\n\"; // 2000\n    return 0;\n}",
        "explanation": "std::lock_guard serializes access to counter, preventing data races.",
        "output": "Final counter: 2000",
        "keyTakeaways": [
          "Always join() or detach() threads",
          "Use lock_guard to protect shared state"
        ]
      }
    ],
    "exercises": {
      "trueFalse": [
        {
          "id": "tf-t33-1",
          "statement": "If a joinable std::thread object is destroyed, the thread continues running silently in the background.",
          "isTrue": false,
          "explanation": "Destroying a joinable thread calls std::terminate(), immediately crashing the program."
        }
      ],
      "mcqs": [
        {
          "id": "mcq-t33-1",
          "question": "What happens if code throws an exception while holding a raw mutex locked via `mtx.lock()`?",
          "options": [
            "The mutex is automatically unlocked by the runtime",
            "The mutex remains locked permanently, causing deadlocks",
            "The thread aborts with SIGSEGV",
            "The exception is converted to a deadlock error"
          ],
          "correctAnswer": 1,
          "explanation": "Raw mutexes do not unlock automatically on exceptions, which is why RAII std::lock_guard is mandatory."
        }
      ],
      "whyThisWorks": [
        {
          "id": "wtw-t33-1",
          "title": "RAII Mutex Release",
          "code": "void process() {\n    std::lock_guard<std::mutex> lock(mtx);\n    if (hasError()) throw std::runtime_error(\"error\");\n}",
          "question": "Why is mtx guaranteed to be unlocked even when an exception is thrown?",
          "stepByStep": [
            "lock_guard is allocated on the stack.",
            "When the exception is thrown, stack unwinding begins.",
            "lock_guard's destructor is invoked deterministically, calling mtx.unlock()."
          ],
          "coreConcept": "RAII guarantees lock release during stack unwinding."
        }
      ],
      "codingChallenge": {
        "id": "cc-t13",
        "title": "Thread-Safe Accumulator Function",
        "difficulty": "Easy",
        "initialCode": "#include <mutex>\n\nint globalAccumulator = 0;\nstd::mutex accMtx;\n\n// Add val to globalAccumulator in a thread-safe manner using std::lock_guard\nvoid safeAddToAccumulator(int val) {\n    // Write your code here\n}\n",
        "solutionCode": "#include <mutex>\n\nint globalAccumulator = 0;\nstd::mutex accMtx;\n\nvoid safeAddToAccumulator(int val) {\n    std::lock_guard<std::mutex> lock(accMtx);\n    globalAccumulator += val;\n}",
        "expectedBehavior": "Safely add val to globalAccumulator protected by accMtx.",
        "hints": [
          "Acquire std::lock_guard<std::mutex> lock(accMtx); then globalAccumulator += val;"
        ],
        "testCases": [
          {
            "input": "10",
            "expectedOutput": "10"
          },
          {
            "input": "25",
            "expectedOutput": "35"
          }
        ],
        "driverCode": "#include <iostream>\nint main() {\n    int v;\n    while (std::cin >> v) {\n        safeAddToAccumulator(v);\n        std::cout << globalAccumulator << \"\\n\";\n    }\n    return 0;\n}"
      }
    },
    "quiz": {
      "id": "quiz-t33",
      "title": "Multi-Threading Quiz",
      "passingScorePercentage": 70,
      "questions": [
        {
          "id": "q-t33-1",
          "type": "mcq",
          "question": "What memory is private to each thread in a multi-threaded C++ program?",
          "options": [
            "The heap",
            "Global variables",
            "The thread's call stack",
            "Static variables"
          ],
          "correctAnswerIndex": 2,
          "explanation": "Each thread has its own dedicated call stack; heap and global memory are shared."
        }
      ]
    }
  }
];
