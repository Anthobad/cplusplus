import { RunnerTestCase, Comparator } from "./codeRunner.js";

export interface ServerCodingChallenge {
  id: string;
  title: string;
  driverCode?: string;
  comparator?: Comparator;
  publicTests: RunnerTestCase[];
  hiddenTests: RunnerTestCase[];
}

export const SERVER_CHALLENGE_REGISTRY: Record<string, ServerCodingChallenge> = {
  "cc-t1": {
    "id": "cc-t1",
    "title": "Standard Console Output",
    "comparator": "trimmed",
    "driverCode": "",
    "publicTests": [
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
    "hiddenTests": [
      {
        "input": "abc",
        "expectedOutput": "Hello, modern C++!",
        "isHidden": true
      },
      {
        "input": "123",
        "expectedOutput": "Hello, modern C++!",
        "isHidden": true
      }
    ]
  },
  "cc-t2": {
    "id": "cc-t2",
    "title": "Calculate Total Bill",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int q;\n    double p, s;\n    if (std::cin >> q >> p >> s) {\n        std::cout << calculateTotal(q, p, s) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
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
    "hiddenTests": [
      {
        "input": "1 100.0 15.0",
        "expectedOutput": "115",
        "isHidden": true
      },
      {
        "input": "0 50.0 10.0",
        "expectedOutput": "10",
        "isHidden": true
      }
    ]
  },
  "cc-t3": {
    "id": "cc-t3",
    "title": "Safe Fixed-Point Temperature Converter",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    double c;\n    if (std::cin >> c) {\n        std::cout << celsiusToFahrenheitInt(c) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
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
    "hiddenTests": [
      {
        "input": "-40",
        "expectedOutput": "-40",
        "isHidden": true
      },
      {
        "input": "37.7",
        "expectedOutput": "99",
        "isHidden": true
      }
    ]
  },
  "cc-t4": {
    "id": "cc-t4",
    "title": "Is Bit Set With Precedence",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int n, b;\n    if (std::cin >> n >> b) {\n        std::cout << isBitSet(n, b) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
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
    "hiddenTests": [
      {
        "input": "0 0",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "15 3",
        "expectedOutput": "1",
        "isHidden": true
      }
    ]
  },
  "cc-t5": {
    "id": "cc-t5",
    "title": "Safe Midpoint Calculation",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int a, b;\n    if (std::cin >> a >> b) {\n        std::cout << safeMidpoint(a, b) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
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
    "hiddenTests": [
      {
        "input": "-20 -10",
        "expectedOutput": "-15",
        "isHidden": true
      },
      {
        "input": "100 101",
        "expectedOutput": "100",
        "isHidden": true
      }
    ]
  },
  "cc-t6": {
    "id": "cc-t6",
    "title": "Fast Number Inverter",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    long long x;\n    if (std::cin >> x) {\n        std::cout << invertNumber(x) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "42",
        "expectedOutput": "-42"
      },
      {
        "input": "-100",
        "expectedOutput": "100"
      }
    ],
    "hiddenTests": [
      {
        "input": "0",
        "expectedOutput": "0",
        "isHidden": true
      }
    ]
  },
  "cc-t7": {
    "id": "cc-t7",
    "title": "Status Code Classifier",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int c;\n    if (std::cin >> c) {\n        std::cout << classifyHttpCode(c) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
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
    "hiddenTests": [
      {
        "input": "301",
        "expectedOutput": "OTHER",
        "isHidden": true
      },
      {
        "input": "500",
        "expectedOutput": "SERVER_ERROR",
        "isHidden": true
      }
    ]
  },
  "cc-t8": {
    "id": "cc-t8",
    "title": "Sum of Odd Integers",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> v(n);\n        for (int i = 0; i < n; ++i) std::cin >> v[i];\n        std::cout << sumOddNumbers(v) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5 1 2 3 4 5",
        "expectedOutput": "9"
      },
      {
        "input": "4 2 4 6 8",
        "expectedOutput": "0"
      }
    ],
    "hiddenTests": [
      {
        "input": "3 -1 0 1",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "1 7",
        "expectedOutput": "7",
        "isHidden": true
      }
    ]
  },
  "cc-t9": {
    "id": "cc-t9",
    "title": "In-Place Swap with References",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int x, y;\n    if (std::cin >> x >> y) {\n        swapValues(x, y);\n        std::cout << x << \" \" << y << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "10 20",
        "expectedOutput": "20 10"
      },
      {
        "input": "0 5",
        "expectedOutput": "5 0"
      }
    ],
    "hiddenTests": [
      {
        "input": "-99 99",
        "expectedOutput": "99 -99",
        "isHidden": true
      }
    ]
  },
  "cc-t10": {
    "id": "cc-t10",
    "title": "Extract Domain from Email",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <string>\nint main() {\n    std::string s;\n    if (std::cin >> s) {\n        std::cout << extractDomain(s) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "user@example.com",
        "expectedOutput": "example.com"
      },
      {
        "input": "dev@cpp.org",
        "expectedOutput": "cpp.org"
      }
    ],
    "hiddenTests": [
      {
        "input": "invalidemail",
        "expectedOutput": "",
        "isHidden": true
      },
      {
        "input": "admin@systems.internal.net",
        "expectedOutput": "systems.internal.net",
        "isHidden": true
      }
    ]
  },
  "cc-t11": {
    "id": "cc-t11",
    "title": "Reverse an Array In-Place with Two Pointers",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> a(n);\n        for (int i = 0; i < n; ++i) std::cin >> a[i];\n        reverseArray(a.data(), n);\n        std::cout << \"[\";\n        for (int i = 0; i < n; ++i) {\n            std::cout << a[i] << (i + 1 < n ? \", \" : \"\");\n        }\n        std::cout << \"]\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5 1 2 3 4 5",
        "expectedOutput": "[5, 4, 3, 2, 1]"
      },
      {
        "input": "2 10 20",
        "expectedOutput": "[20, 10]"
      }
    ],
    "hiddenTests": [
      {
        "input": "1 42",
        "expectedOutput": "[42]",
        "isHidden": true
      }
    ]
  },
  "cc-t12": {
    "id": "cc-t12",
    "title": "Evaluate Exit Code from Status",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <string>\nint main() {\n    std::string s;\n    if (std::cin >> s) {\n        std::cout << parseExitCode(s) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
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
    "hiddenTests": [
      {
        "input": "SUCCESS",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "CRITICAL_FAILURE",
        "expectedOutput": "2",
        "isHidden": true
      }
    ]
  },
  "cc-t13": {
    "id": "cc-t13",
    "title": "Scoped Namespace Calculator",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int x, y;\n    if (std::cin >> x >> y) {\n        std::cout << MathOps::add(x, y) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "10 20",
        "expectedOutput": "30"
      },
      {
        "input": "-5 5",
        "expectedOutput": "0"
      }
    ],
    "hiddenTests": [
      {
        "input": "100 250",
        "expectedOutput": "350",
        "isHidden": true
      }
    ]
  },
  "cc-t14": {
    "id": "cc-t14",
    "title": "Safe String to Integer Parser",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <string>\nint main() {\n    std::string s;\n    if (std::cin >> s) {\n        std::cout << safeStringToInt(s) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
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
    "hiddenTests": [
      {
        "input": "-42",
        "expectedOutput": "-42",
        "isHidden": true
      }
    ]
  },
  "cc-t15": {
    "id": "cc-t15",
    "title": "Rectangle Area & Perimeter Class",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int w, h;\n    if (std::cin >> w >> h) {\n        Rectangle r(w, h);\n        std::cout << r.area() << \" \" << r.perimeter() << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5 10",
        "expectedOutput": "50 30"
      },
      {
        "input": "4 4",
        "expectedOutput": "16 16"
      }
    ],
    "hiddenTests": [
      {
        "input": "1 1",
        "expectedOutput": "1 4",
        "isHidden": true
      }
    ]
  },
  "cc-t16": {
    "id": "cc-t16",
    "title": "Compute Memory Footprint of Struct Array",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    size_t n;\n    if (std::cin >> n) {\n        std::cout << computeArrayFootprint(n) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "10",
        "expectedOutput": "160"
      },
      {
        "input": "100",
        "expectedOutput": "1600"
      }
    ],
    "hiddenTests": [
      {
        "input": "0",
        "expectedOutput": "0",
        "isHidden": true
      }
    ]
  },
  "cc-t17": {
    "id": "cc-t17",
    "title": "Count Occurrences with STL",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> v(n);\n        for (int i = 0; i < n; ++i) std::cin >> v[i];\n        int target;\n        std::cin >> target;\n        std::cout << countOccurrences(v, target) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5 1 2 2 3 2 2",
        "expectedOutput": "3"
      },
      {
        "input": "4 10 20 30 40 50",
        "expectedOutput": "0"
      }
    ],
    "hiddenTests": [
      {
        "input": "3 7 7 7 7",
        "expectedOutput": "3",
        "isHidden": true
      }
    ]
  },
  "cc-t18": {
    "id": "cc-t18",
    "title": "Create and Move unique_ptr",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <memory>\nint main() {\n    int v;\n    if (std::cin >> v) {\n        auto ptr = allocateUniqueInt(v);\n        if (ptr) {\n            std::cout << *ptr << \"\\n\";\n        }\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "42",
        "expectedOutput": "42"
      },
      {
        "input": "-10",
        "expectedOutput": "-10"
      }
    ],
    "hiddenTests": [
      {
        "input": "0",
        "expectedOutput": "0",
        "isHidden": true
      }
    ]
  },
  "cc-t19": {
    "id": "cc-t19",
    "title": "Prefix Sum Array",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> v(n);\n        for (int i = 0; i < n; ++i) std::cin >> v[i];\n        auto res = computePrefixSums(v);\n        for (size_t i = 0; i < res.size(); ++i) {\n            std::cout << res[i] << (i + 1 < res.size() ? \" \" : \"\");\n        }\n        std::cout << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "4 1 2 3 4",
        "expectedOutput": "1 3 6 10"
      },
      {
        "input": "3 5 -2 7",
        "expectedOutput": "5 3 10"
      }
    ],
    "hiddenTests": [
      {
        "input": "1 42",
        "expectedOutput": "42",
        "isHidden": true
      }
    ]
  },
  "cc-t20": {
    "id": "cc-t20",
    "title": "Remove Even Elements from List",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <list>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::list<int> l;\n        for (int i = 0; i < n; ++i) {\n            int v; std::cin >> v; l.push_back(v);\n        }\n        removeEvens(l);\n        for (auto it = l.begin(); it != l.end(); ++it) {\n            std::cout << *it << (std::next(it) != l.end() ? \" \" : \"\");\n        }\n        std::cout << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5 1 2 3 4 5",
        "expectedOutput": "1 3 5"
      },
      {
        "input": "4 2 4 6 8",
        "expectedOutput": ""
      }
    ],
    "hiddenTests": [
      {
        "input": "3 1 3 5",
        "expectedOutput": "1 3 5",
        "isHidden": true
      }
    ]
  },
  "cc-t21": {
    "id": "cc-t21",
    "title": "Distinct Elements Counter",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> v(n);\n        for (int i = 0; i < n; ++i) std::cin >> v[i];\n        std::cout << countDistinct(v) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "6 1 2 2 3 4 4",
        "expectedOutput": "4"
      },
      {
        "input": "3 5 5 5",
        "expectedOutput": "1"
      }
    ],
    "hiddenTests": [
      {
        "input": "5 10 20 30 40 50",
        "expectedOutput": "5",
        "isHidden": true
      }
    ]
  },
  "cc-t22": {
    "id": "cc-t22",
    "title": "Word Frequency Counter",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\n#include <string>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<std::string> words(n);\n        for (int i = 0; i < n; ++i) std::cin >> words[i];\n        std::cout << maxFrequency(words) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5 apple banana apple cherry apple",
        "expectedOutput": "3"
      },
      {
        "input": "3 a b c",
        "expectedOutput": "1"
      }
    ],
    "hiddenTests": [
      {
        "input": "4 test test test test",
        "expectedOutput": "4",
        "isHidden": true
      }
    ]
  },
  "cc-t23": {
    "id": "cc-t23",
    "title": "Reverse String with Stack",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <string>\nint main() {\n    std::string s;\n    if (std::cin >> s) {\n        std::cout << reverseStringWithStack(s) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "hello",
        "expectedOutput": "olleh"
      },
      {
        "input": "cpp",
        "expectedOutput": "ppc"
      }
    ],
    "hiddenTests": [
      {
        "input": "systems",
        "expectedOutput": "smetsys",
        "isHidden": true
      }
    ]
  },
  "cc-t24": {
    "id": "cc-t24",
    "title": "Kth Smallest Element Using Min-Heap",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> nums(n);\n        for (int i = 0; i < n; ++i) std::cin >> nums[i];\n        int k; std::cin >> k;\n        std::cout << findKthSmallest(nums, k) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "6 7 10 4 3 20 15 3",
        "expectedOutput": "7"
      },
      {
        "input": "5 1 2 3 4 5 1",
        "expectedOutput": "1"
      }
    ],
    "hiddenTests": [
      {
        "input": "4 100 50 25 75 4",
        "expectedOutput": "100",
        "isHidden": true
      }
    ]
  },
  "cc-t25": {
    "id": "cc-t25",
    "title": "Compute Max Depth of Binary Tree",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nstruct Node { int val; Node* left = nullptr; Node* right = nullptr; };\nint main() {\n    int count;\n    if (std::cin >> count) {\n        if (count == 0) { std::cout << \"0\\n\"; return 0; }\n        Node* root = new Node{1};\n        if (count > 1) root->left = new Node{2};\n        if (count > 2) root->right = new Node{3};\n        std::cout << maxDepth(root) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "3",
        "expectedOutput": "2"
      },
      {
        "input": "1",
        "expectedOutput": "1"
      }
    ],
    "hiddenTests": [
      {
        "input": "0",
        "expectedOutput": "0",
        "isHidden": true
      }
    ]
  },
  "cc-t26": {
    "id": "cc-t26",
    "title": "Count Undirected Edges in Adjacency List",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int v;\n    if (std::cin >> v) {\n        std::vector<std::vector<int>> adj(v);\n        for (int i = 0; i < v; ++i) {\n            int deg; std::cin >> deg;\n            adj[i].resize(deg);\n            for (int j = 0; j < deg; ++j) std::cin >> adj[i][j];\n        }\n        std::cout << countEdges(adj) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "3 2 1 2 2 0 2 2 0 1",
        "expectedOutput": "3"
      },
      {
        "input": "2 1 1 1 0",
        "expectedOutput": "1"
      }
    ],
    "hiddenTests": [
      {
        "input": "1 0",
        "expectedOutput": "0",
        "isHidden": true
      }
    ]
  },
  "cc-t27": {
    "id": "cc-t27",
    "title": "Remove Negative Values with Erase-Remove",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> v(n);\n        for (int i = 0; i < n; ++i) std::cin >> v[i];\n        removeNegatives(v);\n        for (size_t i = 0; i < v.size(); ++i) {\n            std::cout << v[i] << (i + 1 < v.size() ? \" \" : \"\");\n        }\n        std::cout << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "6 5 -2 10 -8 0 7",
        "expectedOutput": "5 10 0 7"
      },
      {
        "input": "3 -1 -2 -3",
        "expectedOutput": ""
      }
    ],
    "hiddenTests": [
      {
        "input": "4 1 2 3 4",
        "expectedOutput": "1 2 3 4",
        "isHidden": true
      }
    ]
  },
  "cc-t28": {
    "id": "cc-t28",
    "title": "Derived Employee Payroll",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int id, sal;\n    if (std::cin >> id >> sal) {\n        Employee e(id, sal);\n        std::cout << e.id << \": \" << e.salary << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "101 75000",
        "expectedOutput": "101: 75000"
      },
      {
        "input": "202 90000",
        "expectedOutput": "202: 90000"
      }
    ],
    "hiddenTests": [
      {
        "input": "1 5000",
        "expectedOutput": "1: 5000",
        "isHidden": true
      }
    ]
  },
  "cc-t29": {
    "id": "cc-t29",
    "title": "Polymorphic Area Calculator",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int s;\n    if (std::cin >> s) {\n        Square sq(s);\n        IShape* shape = &sq;\n        std::cout << shape->getArea() << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5",
        "expectedOutput": "25"
      },
      {
        "input": "10",
        "expectedOutput": "100"
      }
    ],
    "hiddenTests": [
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": true
      }
    ]
  },
  "cc-t30": {
    "id": "cc-t30",
    "title": "2D Vector Equality Operator",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int x1, y1, x2, y2;\n    if (std::cin >> x1 >> y1 >> x2 >> y2) {\n        Vec2 a{x1, y1}, b{x2, y2};\n        std::cout << (a == b ? \"equal\" : \"not_equal\") << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "1 2 1 2",
        "expectedOutput": "equal"
      },
      {
        "input": "1 2 2 1",
        "expectedOutput": "not_equal"
      }
    ],
    "hiddenTests": [
      {
        "input": "0 0 0 0",
        "expectedOutput": "equal",
        "isHidden": true
      }
    ]
  },
  "cc-t31": {
    "id": "cc-t31",
    "title": "Composed Computer System",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int c;\n    if (std::cin >> c) {\n        Computer comp(c);\n        std::cout << comp.getTotalCores() << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "8",
        "expectedOutput": "8"
      },
      {
        "input": "16",
        "expectedOutput": "16"
      }
    ],
    "hiddenTests": [
      {
        "input": "4",
        "expectedOutput": "4",
        "isHidden": true
      }
    ]
  },
  "cc-t32": {
    "id": "cc-t32",
    "title": "Generic Maximum Element Finder",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int a, b, c;\n    if (std::cin >> a >> b >> c) {\n        std::cout << findMaxOfThree(a, b, c) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "10 25 15",
        "expectedOutput": "25"
      },
      {
        "input": "30 20 10",
        "expectedOutput": "30"
      }
    ],
    "hiddenTests": [
      {
        "input": "-5 -1 -10",
        "expectedOutput": "-1",
        "isHidden": true
      }
    ]
  },
  "cc-t33": {
    "id": "cc-t33",
    "title": "Thread-Safe Accumulator Function",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int v;\n    while (std::cin >> v) {\n        safeAddToAccumulator(v);\n        std::cout << globalAccumulator << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "10",
        "expectedOutput": "10"
      },
      {
        "input": "25",
        "expectedOutput": "35"
      }
    ],
    "hiddenTests": [
      {
        "input": "-15",
        "expectedOutput": "20",
        "isHidden": true
      }
    ]
  },
  "cc-t34": {
    "id": "cc-t34",
    "title": "Count Division Steps (Log2)",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    long long n;\n    if (std::cin >> n) {\n        std::cout << countHalvingSteps(n) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "16",
        "expectedOutput": "4"
      },
      {
        "input": "1024",
        "expectedOutput": "10"
      }
    ],
    "hiddenTests": [
      {
        "input": "1",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "1000000",
        "expectedOutput": "19",
        "isHidden": true
      }
    ]
  },
  "cc-t35": {
    "id": "cc-t35",
    "title": "In-Place Move Zeroes to End",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> nums(n);\n        for (int i = 0; i < n; ++i) std::cin >> nums[i];\n        moveZeroes(nums);\n        for (size_t i = 0; i < nums.size(); ++i) {\n            std::cout << nums[i] << (i + 1 < nums.size() ? \" \" : \"\");\n        }\n        std::cout << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5 0 1 0 3 12",
        "expectedOutput": "1 3 12 0 0"
      },
      {
        "input": "2 0 0",
        "expectedOutput": "0 0"
      }
    ],
    "hiddenTests": [
      {
        "input": "3 1 2 3",
        "expectedOutput": "1 2 3",
        "isHidden": true
      }
    ]
  },
  "cc-t36": {
    "id": "cc-t36",
    "title": "Two Sum on Sorted Range",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> nums(n);\n        for (int i = 0; i < n; ++i) std::cin >> nums[i];\n        int target; std::cin >> target;\n        std::cout << hasPairWithSum(nums, target) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "4 2 7 11 15 9",
        "expectedOutput": "1"
      },
      {
        "input": "3 1 2 3 10",
        "expectedOutput": "0"
      }
    ],
    "hiddenTests": [
      {
        "input": "5 -5 0 2 4 8 3",
        "expectedOutput": "0"
      },
      {
        "input": "2 5 5 10",
        "expectedOutput": "1",
        "isHidden": true
      }
    ]
  },
  "cc-t37": {
    "id": "cc-t37",
    "title": "Sort In-Place Descending",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> nums(n);\n        for (int i = 0; i < n; ++i) std::cin >> nums[i];\n        sortDescending(nums);\n        for (size_t i = 0; i < nums.size(); ++i) {\n            std::cout << nums[i] << (i + 1 < nums.size() ? \" \" : \"\");\n        }\n        std::cout << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5 3 1 4 1 5",
        "expectedOutput": "5 4 3 1 1"
      },
      {
        "input": "3 10 20 30",
        "expectedOutput": "30 20 10"
      }
    ],
    "hiddenTests": [
      {
        "input": "1 42",
        "expectedOutput": "42",
        "isHidden": true
      }
    ]
  },
  "cc-t38": {
    "id": "cc-t38",
    "title": "Standard Binary Search",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> nums(n);\n        for (int i = 0; i < n; ++i) std::cin >> nums[i];\n        int target; std::cin >> target;\n        std::cout << binarySearch(nums, target) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5 10 20 30 40 50 30",
        "expectedOutput": "2"
      },
      {
        "input": "4 1 3 5 7 2",
        "expectedOutput": "-1"
      }
    ],
    "hiddenTests": [
      {
        "input": "1 100 100",
        "expectedOutput": "0",
        "isHidden": true
      }
    ]
  },
  "cc-t39": {
    "id": "cc-t39",
    "title": "Recursive Greatest Common Divisor (GCD)",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    long long a, b;\n    if (std::cin >> a >> b) {\n        std::cout << gcd(a, b) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "48 18",
        "expectedOutput": "6"
      },
      {
        "input": "100 25",
        "expectedOutput": "25"
      }
    ],
    "hiddenTests": [
      {
        "input": "17 13",
        "expectedOutput": "1",
        "isHidden": true
      }
    ]
  },
  "cc-w1": {
    "id": "cc-t1",
    "title": "Standard Console Output",
    "comparator": "trimmed",
    "driverCode": "",
    "publicTests": [
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
    "hiddenTests": [
      {
        "input": "abc",
        "expectedOutput": "Hello, modern C++!",
        "isHidden": true
      },
      {
        "input": "123",
        "expectedOutput": "Hello, modern C++!",
        "isHidden": true
      }
    ]
  },
  "cc-w2": {
    "id": "cc-t2",
    "title": "Calculate Total Bill",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int q;\n    double p, s;\n    if (std::cin >> q >> p >> s) {\n        std::cout << calculateTotal(q, p, s) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
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
    "hiddenTests": [
      {
        "input": "1 100.0 15.0",
        "expectedOutput": "115",
        "isHidden": true
      },
      {
        "input": "0 50.0 10.0",
        "expectedOutput": "10",
        "isHidden": true
      }
    ]
  },
  "cc-w3": {
    "id": "cc-t3",
    "title": "Safe Fixed-Point Temperature Converter",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    double c;\n    if (std::cin >> c) {\n        std::cout << celsiusToFahrenheitInt(c) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
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
    "hiddenTests": [
      {
        "input": "-40",
        "expectedOutput": "-40",
        "isHidden": true
      },
      {
        "input": "37.7",
        "expectedOutput": "99",
        "isHidden": true
      }
    ]
  },
  "cc-w4": {
    "id": "cc-t4",
    "title": "Is Bit Set With Precedence",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int n, b;\n    if (std::cin >> n >> b) {\n        std::cout << isBitSet(n, b) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
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
    "hiddenTests": [
      {
        "input": "0 0",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "15 3",
        "expectedOutput": "1",
        "isHidden": true
      }
    ]
  },
  "cc-w5": {
    "id": "cc-t5",
    "title": "Safe Midpoint Calculation",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int a, b;\n    if (std::cin >> a >> b) {\n        std::cout << safeMidpoint(a, b) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
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
    "hiddenTests": [
      {
        "input": "-20 -10",
        "expectedOutput": "-15",
        "isHidden": true
      },
      {
        "input": "100 101",
        "expectedOutput": "100",
        "isHidden": true
      }
    ]
  },
  "cc-w6": {
    "id": "cc-t6",
    "title": "Fast Number Inverter",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    long long x;\n    if (std::cin >> x) {\n        std::cout << invertNumber(x) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "42",
        "expectedOutput": "-42"
      },
      {
        "input": "-100",
        "expectedOutput": "100"
      }
    ],
    "hiddenTests": [
      {
        "input": "0",
        "expectedOutput": "0",
        "isHidden": true
      }
    ]
  },
  "cc-w7": {
    "id": "cc-t7",
    "title": "Status Code Classifier",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int c;\n    if (std::cin >> c) {\n        std::cout << classifyHttpCode(c) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
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
    "hiddenTests": [
      {
        "input": "301",
        "expectedOutput": "OTHER",
        "isHidden": true
      },
      {
        "input": "500",
        "expectedOutput": "SERVER_ERROR",
        "isHidden": true
      }
    ]
  },
  "cc-w8": {
    "id": "cc-t8",
    "title": "Sum of Odd Integers",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> v(n);\n        for (int i = 0; i < n; ++i) std::cin >> v[i];\n        std::cout << sumOddNumbers(v) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5 1 2 3 4 5",
        "expectedOutput": "9"
      },
      {
        "input": "4 2 4 6 8",
        "expectedOutput": "0"
      }
    ],
    "hiddenTests": [
      {
        "input": "3 -1 0 1",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "1 7",
        "expectedOutput": "7",
        "isHidden": true
      }
    ]
  },
  "cc-w9": {
    "id": "cc-t9",
    "title": "In-Place Swap with References",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int x, y;\n    if (std::cin >> x >> y) {\n        swapValues(x, y);\n        std::cout << x << \" \" << y << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "10 20",
        "expectedOutput": "20 10"
      },
      {
        "input": "0 5",
        "expectedOutput": "5 0"
      }
    ],
    "hiddenTests": [
      {
        "input": "-99 99",
        "expectedOutput": "99 -99",
        "isHidden": true
      }
    ]
  },
  "cc-w10": {
    "id": "cc-t10",
    "title": "Extract Domain from Email",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <string>\nint main() {\n    std::string s;\n    if (std::cin >> s) {\n        std::cout << extractDomain(s) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "user@example.com",
        "expectedOutput": "example.com"
      },
      {
        "input": "dev@cpp.org",
        "expectedOutput": "cpp.org"
      }
    ],
    "hiddenTests": [
      {
        "input": "invalidemail",
        "expectedOutput": "",
        "isHidden": true
      },
      {
        "input": "admin@systems.internal.net",
        "expectedOutput": "systems.internal.net",
        "isHidden": true
      }
    ]
  },
  "cc-w11": {
    "id": "cc-t11",
    "title": "Reverse an Array In-Place with Two Pointers",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> a(n);\n        for (int i = 0; i < n; ++i) std::cin >> a[i];\n        reverseArray(a.data(), n);\n        std::cout << \"[\";\n        for (int i = 0; i < n; ++i) {\n            std::cout << a[i] << (i + 1 < n ? \", \" : \"\");\n        }\n        std::cout << \"]\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5 1 2 3 4 5",
        "expectedOutput": "[5, 4, 3, 2, 1]"
      },
      {
        "input": "2 10 20",
        "expectedOutput": "[20, 10]"
      }
    ],
    "hiddenTests": [
      {
        "input": "1 42",
        "expectedOutput": "[42]",
        "isHidden": true
      }
    ]
  },
  "cc-w12": {
    "id": "cc-t12",
    "title": "Evaluate Exit Code from Status",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <string>\nint main() {\n    std::string s;\n    if (std::cin >> s) {\n        std::cout << parseExitCode(s) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
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
    "hiddenTests": [
      {
        "input": "SUCCESS",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "CRITICAL_FAILURE",
        "expectedOutput": "2",
        "isHidden": true
      }
    ]
  },
  "cc-w13": {
    "id": "cc-t13",
    "title": "Scoped Namespace Calculator",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int x, y;\n    if (std::cin >> x >> y) {\n        std::cout << MathOps::add(x, y) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "10 20",
        "expectedOutput": "30"
      },
      {
        "input": "-5 5",
        "expectedOutput": "0"
      }
    ],
    "hiddenTests": [
      {
        "input": "100 250",
        "expectedOutput": "350",
        "isHidden": true
      }
    ]
  },
  "cc-w14": {
    "id": "cc-t14",
    "title": "Safe String to Integer Parser",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <string>\nint main() {\n    std::string s;\n    if (std::cin >> s) {\n        std::cout << safeStringToInt(s) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
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
    "hiddenTests": [
      {
        "input": "-42",
        "expectedOutput": "-42",
        "isHidden": true
      }
    ]
  },
  "cc-w15": {
    "id": "cc-t15",
    "title": "Rectangle Area & Perimeter Class",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int w, h;\n    if (std::cin >> w >> h) {\n        Rectangle r(w, h);\n        std::cout << r.area() << \" \" << r.perimeter() << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5 10",
        "expectedOutput": "50 30"
      },
      {
        "input": "4 4",
        "expectedOutput": "16 16"
      }
    ],
    "hiddenTests": [
      {
        "input": "1 1",
        "expectedOutput": "1 4",
        "isHidden": true
      }
    ]
  },
  "cc-w16": {
    "id": "cc-t16",
    "title": "Compute Memory Footprint of Struct Array",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    size_t n;\n    if (std::cin >> n) {\n        std::cout << computeArrayFootprint(n) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "10",
        "expectedOutput": "160"
      },
      {
        "input": "100",
        "expectedOutput": "1600"
      }
    ],
    "hiddenTests": [
      {
        "input": "0",
        "expectedOutput": "0",
        "isHidden": true
      }
    ]
  },
  "cc-w17": {
    "id": "cc-t17",
    "title": "Count Occurrences with STL",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> v(n);\n        for (int i = 0; i < n; ++i) std::cin >> v[i];\n        int target;\n        std::cin >> target;\n        std::cout << countOccurrences(v, target) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5 1 2 2 3 2 2",
        "expectedOutput": "3"
      },
      {
        "input": "4 10 20 30 40 50",
        "expectedOutput": "0"
      }
    ],
    "hiddenTests": [
      {
        "input": "3 7 7 7 7",
        "expectedOutput": "3",
        "isHidden": true
      }
    ]
  },
  "cc-w18": {
    "id": "cc-t18",
    "title": "Create and Move unique_ptr",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <memory>\nint main() {\n    int v;\n    if (std::cin >> v) {\n        auto ptr = allocateUniqueInt(v);\n        if (ptr) {\n            std::cout << *ptr << \"\\n\";\n        }\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "42",
        "expectedOutput": "42"
      },
      {
        "input": "-10",
        "expectedOutput": "-10"
      }
    ],
    "hiddenTests": [
      {
        "input": "0",
        "expectedOutput": "0",
        "isHidden": true
      }
    ]
  },
  "cc-w19": {
    "id": "cc-t19",
    "title": "Prefix Sum Array",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> v(n);\n        for (int i = 0; i < n; ++i) std::cin >> v[i];\n        auto res = computePrefixSums(v);\n        for (size_t i = 0; i < res.size(); ++i) {\n            std::cout << res[i] << (i + 1 < res.size() ? \" \" : \"\");\n        }\n        std::cout << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "4 1 2 3 4",
        "expectedOutput": "1 3 6 10"
      },
      {
        "input": "3 5 -2 7",
        "expectedOutput": "5 3 10"
      }
    ],
    "hiddenTests": [
      {
        "input": "1 42",
        "expectedOutput": "42",
        "isHidden": true
      }
    ]
  },
  "cc-w20": {
    "id": "cc-t20",
    "title": "Remove Even Elements from List",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <list>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::list<int> l;\n        for (int i = 0; i < n; ++i) {\n            int v; std::cin >> v; l.push_back(v);\n        }\n        removeEvens(l);\n        for (auto it = l.begin(); it != l.end(); ++it) {\n            std::cout << *it << (std::next(it) != l.end() ? \" \" : \"\");\n        }\n        std::cout << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5 1 2 3 4 5",
        "expectedOutput": "1 3 5"
      },
      {
        "input": "4 2 4 6 8",
        "expectedOutput": ""
      }
    ],
    "hiddenTests": [
      {
        "input": "3 1 3 5",
        "expectedOutput": "1 3 5",
        "isHidden": true
      }
    ]
  },
  "cc-w21": {
    "id": "cc-t21",
    "title": "Distinct Elements Counter",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> v(n);\n        for (int i = 0; i < n; ++i) std::cin >> v[i];\n        std::cout << countDistinct(v) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "6 1 2 2 3 4 4",
        "expectedOutput": "4"
      },
      {
        "input": "3 5 5 5",
        "expectedOutput": "1"
      }
    ],
    "hiddenTests": [
      {
        "input": "5 10 20 30 40 50",
        "expectedOutput": "5",
        "isHidden": true
      }
    ]
  },
  "cc-w22": {
    "id": "cc-t22",
    "title": "Word Frequency Counter",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\n#include <string>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<std::string> words(n);\n        for (int i = 0; i < n; ++i) std::cin >> words[i];\n        std::cout << maxFrequency(words) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5 apple banana apple cherry apple",
        "expectedOutput": "3"
      },
      {
        "input": "3 a b c",
        "expectedOutput": "1"
      }
    ],
    "hiddenTests": [
      {
        "input": "4 test test test test",
        "expectedOutput": "4",
        "isHidden": true
      }
    ]
  },
  "cc-w23": {
    "id": "cc-t23",
    "title": "Reverse String with Stack",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <string>\nint main() {\n    std::string s;\n    if (std::cin >> s) {\n        std::cout << reverseStringWithStack(s) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "hello",
        "expectedOutput": "olleh"
      },
      {
        "input": "cpp",
        "expectedOutput": "ppc"
      }
    ],
    "hiddenTests": [
      {
        "input": "systems",
        "expectedOutput": "smetsys",
        "isHidden": true
      }
    ]
  },
  "cc-w24": {
    "id": "cc-t24",
    "title": "Kth Smallest Element Using Min-Heap",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> nums(n);\n        for (int i = 0; i < n; ++i) std::cin >> nums[i];\n        int k; std::cin >> k;\n        std::cout << findKthSmallest(nums, k) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "6 7 10 4 3 20 15 3",
        "expectedOutput": "7"
      },
      {
        "input": "5 1 2 3 4 5 1",
        "expectedOutput": "1"
      }
    ],
    "hiddenTests": [
      {
        "input": "4 100 50 25 75 4",
        "expectedOutput": "100",
        "isHidden": true
      }
    ]
  },
  "cc-w25": {
    "id": "cc-t25",
    "title": "Compute Max Depth of Binary Tree",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nstruct Node { int val; Node* left = nullptr; Node* right = nullptr; };\nint main() {\n    int count;\n    if (std::cin >> count) {\n        if (count == 0) { std::cout << \"0\\n\"; return 0; }\n        Node* root = new Node{1};\n        if (count > 1) root->left = new Node{2};\n        if (count > 2) root->right = new Node{3};\n        std::cout << maxDepth(root) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "3",
        "expectedOutput": "2"
      },
      {
        "input": "1",
        "expectedOutput": "1"
      }
    ],
    "hiddenTests": [
      {
        "input": "0",
        "expectedOutput": "0",
        "isHidden": true
      }
    ]
  },
  "cc-w26": {
    "id": "cc-t26",
    "title": "Count Undirected Edges in Adjacency List",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int v;\n    if (std::cin >> v) {\n        std::vector<std::vector<int>> adj(v);\n        for (int i = 0; i < v; ++i) {\n            int deg; std::cin >> deg;\n            adj[i].resize(deg);\n            for (int j = 0; j < deg; ++j) std::cin >> adj[i][j];\n        }\n        std::cout << countEdges(adj) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "3 2 1 2 2 0 2 2 0 1",
        "expectedOutput": "3"
      },
      {
        "input": "2 1 1 1 0",
        "expectedOutput": "1"
      }
    ],
    "hiddenTests": [
      {
        "input": "1 0",
        "expectedOutput": "0",
        "isHidden": true
      }
    ]
  },
  "cc-w27": {
    "id": "cc-t27",
    "title": "Remove Negative Values with Erase-Remove",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> v(n);\n        for (int i = 0; i < n; ++i) std::cin >> v[i];\n        removeNegatives(v);\n        for (size_t i = 0; i < v.size(); ++i) {\n            std::cout << v[i] << (i + 1 < v.size() ? \" \" : \"\");\n        }\n        std::cout << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "6 5 -2 10 -8 0 7",
        "expectedOutput": "5 10 0 7"
      },
      {
        "input": "3 -1 -2 -3",
        "expectedOutput": ""
      }
    ],
    "hiddenTests": [
      {
        "input": "4 1 2 3 4",
        "expectedOutput": "1 2 3 4",
        "isHidden": true
      }
    ]
  },
  "cc-w28": {
    "id": "cc-t28",
    "title": "Derived Employee Payroll",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int id, sal;\n    if (std::cin >> id >> sal) {\n        Employee e(id, sal);\n        std::cout << e.id << \": \" << e.salary << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "101 75000",
        "expectedOutput": "101: 75000"
      },
      {
        "input": "202 90000",
        "expectedOutput": "202: 90000"
      }
    ],
    "hiddenTests": [
      {
        "input": "1 5000",
        "expectedOutput": "1: 5000",
        "isHidden": true
      }
    ]
  },
  "cc-w29": {
    "id": "cc-t29",
    "title": "Polymorphic Area Calculator",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int s;\n    if (std::cin >> s) {\n        Square sq(s);\n        IShape* shape = &sq;\n        std::cout << shape->getArea() << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5",
        "expectedOutput": "25"
      },
      {
        "input": "10",
        "expectedOutput": "100"
      }
    ],
    "hiddenTests": [
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": true
      }
    ]
  },
  "cc-w30": {
    "id": "cc-t30",
    "title": "2D Vector Equality Operator",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int x1, y1, x2, y2;\n    if (std::cin >> x1 >> y1 >> x2 >> y2) {\n        Vec2 a{x1, y1}, b{x2, y2};\n        std::cout << (a == b ? \"equal\" : \"not_equal\") << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "1 2 1 2",
        "expectedOutput": "equal"
      },
      {
        "input": "1 2 2 1",
        "expectedOutput": "not_equal"
      }
    ],
    "hiddenTests": [
      {
        "input": "0 0 0 0",
        "expectedOutput": "equal",
        "isHidden": true
      }
    ]
  },
  "cc-w31": {
    "id": "cc-t31",
    "title": "Composed Computer System",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int c;\n    if (std::cin >> c) {\n        Computer comp(c);\n        std::cout << comp.getTotalCores() << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "8",
        "expectedOutput": "8"
      },
      {
        "input": "16",
        "expectedOutput": "16"
      }
    ],
    "hiddenTests": [
      {
        "input": "4",
        "expectedOutput": "4",
        "isHidden": true
      }
    ]
  },
  "cc-w32": {
    "id": "cc-t32",
    "title": "Generic Maximum Element Finder",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int a, b, c;\n    if (std::cin >> a >> b >> c) {\n        std::cout << findMaxOfThree(a, b, c) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "10 25 15",
        "expectedOutput": "25"
      },
      {
        "input": "30 20 10",
        "expectedOutput": "30"
      }
    ],
    "hiddenTests": [
      {
        "input": "-5 -1 -10",
        "expectedOutput": "-1",
        "isHidden": true
      }
    ]
  },
  "cc-w33": {
    "id": "cc-t33",
    "title": "Thread-Safe Accumulator Function",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    int v;\n    while (std::cin >> v) {\n        safeAddToAccumulator(v);\n        std::cout << globalAccumulator << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "10",
        "expectedOutput": "10"
      },
      {
        "input": "25",
        "expectedOutput": "35"
      }
    ],
    "hiddenTests": [
      {
        "input": "-15",
        "expectedOutput": "20",
        "isHidden": true
      }
    ]
  },
  "cc-w34": {
    "id": "cc-t34",
    "title": "Count Division Steps (Log2)",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    long long n;\n    if (std::cin >> n) {\n        std::cout << countHalvingSteps(n) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "16",
        "expectedOutput": "4"
      },
      {
        "input": "1024",
        "expectedOutput": "10"
      }
    ],
    "hiddenTests": [
      {
        "input": "1",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "1000000",
        "expectedOutput": "19",
        "isHidden": true
      }
    ]
  },
  "cc-w35": {
    "id": "cc-t35",
    "title": "In-Place Move Zeroes to End",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> nums(n);\n        for (int i = 0; i < n; ++i) std::cin >> nums[i];\n        moveZeroes(nums);\n        for (size_t i = 0; i < nums.size(); ++i) {\n            std::cout << nums[i] << (i + 1 < nums.size() ? \" \" : \"\");\n        }\n        std::cout << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5 0 1 0 3 12",
        "expectedOutput": "1 3 12 0 0"
      },
      {
        "input": "2 0 0",
        "expectedOutput": "0 0"
      }
    ],
    "hiddenTests": [
      {
        "input": "3 1 2 3",
        "expectedOutput": "1 2 3",
        "isHidden": true
      }
    ]
  },
  "cc-w36": {
    "id": "cc-t36",
    "title": "Two Sum on Sorted Range",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> nums(n);\n        for (int i = 0; i < n; ++i) std::cin >> nums[i];\n        int target; std::cin >> target;\n        std::cout << hasPairWithSum(nums, target) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "4 2 7 11 15 9",
        "expectedOutput": "1"
      },
      {
        "input": "3 1 2 3 10",
        "expectedOutput": "0"
      }
    ],
    "hiddenTests": [
      {
        "input": "5 -5 0 2 4 8 3",
        "expectedOutput": "0"
      },
      {
        "input": "2 5 5 10",
        "expectedOutput": "1",
        "isHidden": true
      }
    ]
  },
  "cc-w37": {
    "id": "cc-t37",
    "title": "Sort In-Place Descending",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> nums(n);\n        for (int i = 0; i < n; ++i) std::cin >> nums[i];\n        sortDescending(nums);\n        for (size_t i = 0; i < nums.size(); ++i) {\n            std::cout << nums[i] << (i + 1 < nums.size() ? \" \" : \"\");\n        }\n        std::cout << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5 3 1 4 1 5",
        "expectedOutput": "5 4 3 1 1"
      },
      {
        "input": "3 10 20 30",
        "expectedOutput": "30 20 10"
      }
    ],
    "hiddenTests": [
      {
        "input": "1 42",
        "expectedOutput": "42",
        "isHidden": true
      }
    ]
  },
  "cc-w38": {
    "id": "cc-t38",
    "title": "Standard Binary Search",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\n#include <vector>\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> nums(n);\n        for (int i = 0; i < n; ++i) std::cin >> nums[i];\n        int target; std::cin >> target;\n        std::cout << binarySearch(nums, target) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "5 10 20 30 40 50 30",
        "expectedOutput": "2"
      },
      {
        "input": "4 1 3 5 7 2",
        "expectedOutput": "-1"
      }
    ],
    "hiddenTests": [
      {
        "input": "1 100 100",
        "expectedOutput": "0",
        "isHidden": true
      }
    ]
  },
  "cc-w39": {
    "id": "cc-t39",
    "title": "Recursive Greatest Common Divisor (GCD)",
    "comparator": "trimmed",
    "driverCode": "#include <iostream>\nint main() {\n    long long a, b;\n    if (std::cin >> a >> b) {\n        std::cout << gcd(a, b) << \"\\n\";\n    }\n    return 0;\n}",
    "publicTests": [
      {
        "input": "48 18",
        "expectedOutput": "6"
      },
      {
        "input": "100 25",
        "expectedOutput": "25"
      }
    ],
    "hiddenTests": [
      {
        "input": "17 13",
        "expectedOutput": "1",
        "isHidden": true
      }
    ]
  }
};

export function getTrustedChallenge(challengeId: string): ServerCodingChallenge | undefined {
  return SERVER_CHALLENGE_REGISTRY[challengeId];
}
