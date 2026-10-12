import { CppDocItem } from "../../types";

export const STRING_DOCS: CppDocItem[] = [
  {
    name: "std::string Architecture & Small String Optimization (SSO)",
    category: "string",
    header: "<string>",
    synopsis: "using string = std::basic_string<char>;",
    timeComplexity: "O(1) size, capacity, index operator[]; O(N) allocation when exceeding SSO buffer (~15 to 22 bytes).",
    description: "Contiguous dynamic character sequence. Modern C++ standard libraries (libstdc++, libc++, MSVC) implement Small String Optimization (SSO): small strings (typically <= 15 or 22 characters) are stored directly inside the string object on the stack with zero dynamic heap allocation.",
    example: `#include <string>
#include <iostream>

int main() {
    std::string s1 = "small"; // Fits in SSO stack buffer! Zero heap allocation.
    std::string s2(100, 'A'); // Exceeds SSO: dynamically allocated on the heap.

    std::cout << "s1 capacity: " << s1.capacity() << "\\n"; // e.g. 15
    std::cout << "s2 capacity: " << s2.capacity() << "\\n"; // >= 100
    return 0;
}`,
    commonPitfalls: "Copy-on-write (COW) strings were banned in C++11 due to multi-threading overhead and strict iterator invalidation guarantees. std::string is always an owned copy or move."
  },
  {
    name: "std::string::substr",
    category: "string",
    header: "<string>",
    synopsis: "string substr(size_type pos = 0, size_type count = npos) const;",
    timeComplexity: "O(count) linear in the length of the extracted substring; allocates new memory.",
    description: "Returns a newly constructed string object with its value initialized to a copy of a substring of this object. If count exceeds string bounds or equals std::string::npos, extracts until the end of the string.",
    example: `#include <string>
#include <iostream>

int main() {
    std::string path = "/usr/local/bin/clang++";
    std::string dir = path.substr(0, 10); // "/usr/local"
    std::string file = path.substr(15);   // "clang++"

    std::cout << "Directory: " << dir << "\\n";
    std::cout << "File: " << file << "\\n";
    return 0;
}`,
    commonPitfalls: "Throws `std::out_of_range` if `pos > str.size()`. substr creates a NEW string copy; for zero-copy read-only slices, use `std::string_view::substr` instead!"
  },
  {
    name: "std::string::find, rfind, find_first_of, find_first_not_of",
    category: "string",
    header: "<string>",
    synopsis: "size_type find(const string& str, size_type pos = 0) const noexcept; static const size_type npos = -1;",
    timeComplexity: "O(N * M) worst case; optimized with SIMD and memchr",
    description: "Finds the first (or last with rfind) occurrence of a substring or character. If not found, returns the sentinel value `std::string::npos`.",
    example: `#include <string>
#include <iostream>

int main() {
    std::string url = "https://cplusplus.com/reference/string/";

    auto protoEnd = url.find("://");
    if (protoEnd != std::string::npos) {
        std::cout << "Protocol: " << url.substr(0, protoEnd) << "\\n"; // https
    }

    auto lastSlash = url.rfind('/');
    std::cout << "Last slash index: " << lastSlash << "\\n";
    return 0;
}`,
    commonPitfalls: "Comparing against -1 directly: `std::string::npos` is `static_cast<size_type>(-1)` (an unsigned integer, typically 18446744073709551615 on 64-bit systems). Always compare with `std::string::npos`."
  },
  {
    name: "std::string::replace, insert, erase",
    category: "string",
    header: "<string>",
    synopsis: "string& replace(size_type pos, size_type count, const string& str); string& insert(size_type pos, const string& str); string& erase(size_type pos = 0, size_type count = npos);",
    timeComplexity: "O(N) linear time; shifts trailing characters in buffer",
    description: "Mutates string contents in-place. erase removes characters; insert pushes characters at specified index; replace substitutes a substring range.",
    example: `#include <string>
#include <iostream>

int main() {
    std::string s = "Hello C world";
    s.replace(6, 1, "C++"); // "Hello C++ world"
    s.insert(15, " 2026");   // "Hello C++ world 2026"
    s.erase(0, 6);           // "C++ world 2026"

    std::cout << s << "\\n";
    return 0;
}`,
    commonPitfalls: "Inserting or replacing with a string longer than remaining capacity triggers reallocation, invalidating all pointers, references, and iterators to the string."
  },
  {
    name: "std::string::c_str & std::string::data",
    category: "string",
    header: "<string>",
    synopsis: "const char* c_str() const noexcept; char* data() noexcept; (C++17)",
    timeComplexity: "O(1) direct pointer return",
    description: "Returns a pointer to a null-terminated character array. In C++11 and later, std::string is guaranteed to be null-terminated and stored in contiguous memory. In C++17, non-const `data()` allows direct modification of the buffer.",
    example: `#include <string>
#include <cstdio>
#include <cstring>
#include <iostream>

int main() {
    std::string filename = "server.log";
    // Pass to C API expecting const char*
    std::FILE* f = std::fopen(filename.c_str(), "r");

    std::cout << "Length: " << std::strlen(filename.c_str()) << "\\n";
    if (f) std::fclose(f);
    return 0;
}`,
    commonPitfalls: "Dangling pointer: The pointer returned by `.c_str()` is only valid as long as the string exists and is not modified! Modifying or reallocating the string invalidates the c_str pointer."
  },
  {
    name: "std::stoi, std::stol, std::stoll, std::stof, std::stod",
    category: "string",
    header: "<string>",
    synopsis: "int stoi(const string& str, size_t* pos = nullptr, int base = 10); double stod(const string& str, size_t* pos = nullptr);",
    timeComplexity: "O(N) linear in string length",
    description: "Parses numeric values from string. Skips leading whitespace. If pos is provided, receives the index of the first unconverted character.",
    example: `#include <string>
#include <iostream>

int main() {
    try {
        std::string s1 = "  -1024 bytes";
        std::size_t processed = 0;
        int val = std::stoi(s1, &processed, 10);

        std::cout << "Parsed int: " << val << ", Unconverted remainder: '" 
                  << s1.substr(processed) << "'\\n";

        double pi = std::stod("3.14159265");
        std::cout << "Parsed double: " << pi << "\\n";
    } catch (const std::invalid_argument& e) {
        std::cerr << "Invalid argument: " << e.what() << "\\n";
    } catch (const std::out_of_range& e) {
        std::cerr << "Out of range: " << e.what() << "\\n";
    }
    return 0;
}`,
    commonPitfalls: "Throws `std::invalid_argument` if no conversion could be performed (e.g. `std::stoi(\"abc\")`), and `std::out_of_range` if value exceeds target integer range. In performance-critical code, prefer `std::from_chars` (from `<charconv>`)."
  },
  {
    name: "std::to_string",
    category: "string",
    header: "<string>",
    synopsis: "string to_string(int val); string to_string(long val); string to_string(double val);",
    timeComplexity: "O(log10(N)) for integers; sprintf formatting for floats",
    description: "Converts numerical values into std::string representations.",
    example: `#include <string>
#include <iostream>

int main() {
    int port = 8080;
    std::string url = "http://localhost:" + std::to_string(port) + "/api";
    std::cout << url << "\\n";
    return 0;
}`,
    commonPitfalls: "Floating-point precision: `std::to_string(float/double)` uses fixed `%f` format with default 6 decimal places, which can truncate high-precision scientific floats or pad trailing zeros. In C++20, prefer `std::format`."
  },
  {
    name: "std::string::starts_with, ends_with, contains",
    category: "string",
    header: "<string>",
    synopsis: "bool starts_with(string_view sv) const noexcept; (C++20) bool ends_with(string_view sv) const noexcept; (C++20) bool contains(string_view sv) const noexcept; (C++23)",
    timeComplexity: "O(M) where M is prefix/suffix length",
    description: "Modern boolean tests for string contents. Replaces awkward and error-prone `str.rfind(suffix) == str.length() - suffix.length()` idioms.",
    example: `#include <string>
#include <iostream>

int main() {
    std::string path = "/var/log/kernel.log";

    std::cout << "Starts with /var: " << path.starts_with("/var") << "\\n"; // true
    std::cout << "Ends with .log: "   << path.ends_with(".log")   << "\\n"; // true
    return 0;
}`,
    commonPitfalls: "starts_with and ends_with are C++20; contains is C++23. For older standards, use `str.find() != std::string::npos`."
  },
  {
    name: "std::getline",
    category: "string",
    header: "<string>",
    synopsis: "istream& getline(istream& is, string& str, char delim = '\\n');",
    timeComplexity: "O(N) linear in characters read",
    description: "Reads characters from an input stream into a string until the delimiter character (default newline '\\n') is found. The delimiter is extracted and discarded.",
    example: `#include <string>
#include <sstream>
#include <iostream>

int main() {
    std::string csv = "alice,bob,charlie,david";
    std::istringstream stream(csv);
    std::string token;

    while (std::getline(stream, token, ',')) {
        std::cout << "Token: " << token << "\\n";
    }
    return 0;
}`,
    commonPitfalls: "Mixing `std::cin >> val` with `std::getline`: operator `>>` leaves the newline '\\n' in the input buffer, causing the subsequent `std::getline` to immediately return an empty string! Call `std::cin.ignore()` between them."
  }
];
