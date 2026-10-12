import { CppDocItem } from "../../types";

export const CCTYPE_DOCS: CppDocItem[] = [
  {
    name: "std::isalpha",
    category: "cctype",
    header: "<cctype>",
    synopsis: "int isalpha(int ch);",
    timeComplexity: "O(1) table lookup or branch",
    description: "Checks if the given character is an alphabetic character according to the current C locale. In the default 'C' locale, returns non-zero for uppercase ('A'-'Z') and lowercase ('a'-'z') letters.",
    example: `#include <cctype>
#include <iostream>

int main() {
    unsigned char c1 = 'A';
    unsigned char c2 = '9';
    std::cout << "isalpha('A'): " << (std::isalpha(c1) ? "true" : "false") << "\\n";
    std::cout << "isalpha('9'): " << (std::isalpha(c2) ? "true" : "false") << "\\n";
    return 0;
}`,
    commonPitfalls: "UB on negative char: You MUST cast signed char to unsigned char before passing to isalpha! E.g. std::isalpha(static_cast<unsigned char>(c)). Passing a negative signed char is undefined behavior because it indexes negative bounds in lookup tables."
  },
  {
    name: "std::isdigit",
    category: "cctype",
    header: "<cctype>",
    synopsis: "int isdigit(int ch);",
    timeComplexity: "O(1) constant time",
    description: "Checks if the given character is a decimal digit ('0' through '9').",
    example: `#include <cctype>
#include <iostream>
#include <string>

bool isAllDigits(const std::string& str) {
    for (char c : str) {
        if (!std::isdigit(static_cast<unsigned char>(c))) return false;
    }
    return !str.empty();
}

int main() {
    std::cout << isAllDigits("12345") << "\\n"; // 1
    std::cout << isAllDigits("12a45") << "\\n"; // 0
    return 0;
}`,
    commonPitfalls: "Returns non-zero (not strictly 1) on match. Do not compare with `== 1`; compare with `!= 0` or use in boolean conditions."
  },
  {
    name: "std::isalnum",
    category: "cctype",
    header: "<cctype>",
    synopsis: "int isalnum(int ch);",
    timeComplexity: "O(1) constant time",
    description: "Checks if the given character is alphanumeric: either a decimal digit ('0'-'9') or an uppercase/lowercase letter ('A'-'Z', 'a'-'z'). Essential for string tokenization and valid identifier checks.",
    example: `#include <cctype>
#include <iostream>
#include <string>

std::string cleanIdentifier(const std::string& raw) {
    std::string out;
    for (char c : raw) {
        if (std::isalnum(static_cast<unsigned char>(c)) || c == '_') {
            out += c;
        }
    }
    return out;
}

int main() {
    std::cout << cleanIdentifier("int main() { ... }") << "\\n"; // intmain
    return 0;
}`,
    commonPitfalls: "Requires casting to unsigned char when scanning raw UTF-8 or extended ASCII text."
  },
  {
    name: "std::isspace",
    category: "cctype",
    header: "<cctype>",
    synopsis: "int isspace(int ch);",
    timeComplexity: "O(1) constant time",
    description: "Checks if the given character is a whitespace character: space (' '), form feed ('\\f'), newline ('\\n'), carriage return ('\\r'), horizontal tab ('\\t'), or vertical tab ('\\v'). Used in string trimming algorithms.",
    example: `#include <cctype>
#include <string>
#include <algorithm>
#include <iostream>

std::string trim(std::string s) {
    // Trim from left
    s.erase(s.begin(), std::find_if(s.begin(), s.end(), [](unsigned char ch) {
        return !std::isspace(ch);
    }));
    // Trim from right
    s.erase(std::find_if(s.rbegin(), s.rend(), [](unsigned char ch) {
        return !std::isspace(ch);
    }).base(), s.end());
    return s;
}

int main() {
    std::cout << "[" << trim("   hello C++ systems   ") << "]\\n";
    return 0;
}`,
    commonPitfalls: "Whitespace definition depends on current C locale. In default 'C' locale, only standard ASCII whitespace is recognized (not Unicode non-breaking space U+00A0)."
  },
  {
    name: "std::isblank",
    category: "cctype",
    header: "<cctype>",
    synopsis: "int isblank(int ch); (C++11)",
    timeComplexity: "O(1) constant time",
    description: "Checks if the given character is a blank character used to separate words on the same line: standard space (' ') or horizontal tab ('\\t'). Unlike isspace, does not match newline or carriage return.",
    example: `#include <cctype>
#include <iostream>

int main() {
    std::cout << "isblank(' '): " << std::isblank(' ') << "\\n";   // non-zero
    std::cout << "isblank('\\t'): " << std::isblank('\\t') << "\\n"; // non-zero
    std::cout << "isblank('\\n'): " << std::isblank('\\n') << "\\n"; // 0
    return 0;
}`,
    commonPitfalls: "Introduced in C++11. For multi-line whitespace detection, use std::isspace instead."
  },
  {
    name: "std::isxdigit",
    category: "cctype",
    header: "<cctype>",
    synopsis: "int isxdigit(int ch);",
    timeComplexity: "O(1) constant time",
    description: "Checks if the given character is a valid hexadecimal digit: '0' through '9', 'a' through 'f', or 'A' through 'F'. Crucial for parsing hex colors, memory addresses, and network payloads.",
    example: `#include <cctype>
#include <iostream>

int hexToInt(char c) {
    if (!std::isxdigit(static_cast<unsigned char>(c))) return -1;
    if (std::isdigit(static_cast<unsigned char>(c))) return c - '0';
    return std::tolower(static_cast<unsigned char>(c)) - 'a' + 10;
}

int main() {
    std::cout << "Hex 'F' = " << hexToInt('F') << "\\n"; // 15
    return 0;
}`,
    commonPitfalls: "Does not parse prefixes like '0x' or '0X'; tests single character only."
  },
  {
    name: "std::toupper & std::tolower",
    category: "cctype",
    header: "<cctype>",
    synopsis: "int toupper(int ch); int tolower(int ch);",
    timeComplexity: "O(1) constant time",
    description: "Converts the given character to uppercase or lowercase according to the character conversion rules defined by the current C locale. If no conversion exists, returns the character unmodified.",
    example: `#include <cctype>
#include <string>
#include <algorithm>
#include <iostream>

int main() {
    std::string text = "Modern C++ Systems 2026";
    std::transform(text.begin(), text.end(), text.begin(), [](unsigned char c) {
        return std::toupper(c);
    });
    std::cout << text << "\\n"; // MODERN C++ SYSTEMS 2026
    return 0;
}`,
    commonPitfalls: "Passing a signed char directly into std::transform with std::toupper can invoke UB. Lambda taking `unsigned char` and returning `unsigned char` avoids the trap."
  },
  {
    name: "std::ispunct & std::isprint",
    category: "cctype",
    header: "<cctype>",
    synopsis: "int ispunct(int ch); int isprint(int ch);",
    timeComplexity: "O(1) constant time",
    description: "ispunct checks if a character is a punctuation or symbol character (excluding alphanumeric and space). isprint checks if character produces a visible glyph or is a space (ASCII 0x20 through 0x7E).",
    example: `#include <cctype>
#include <iostream>

int main() {
    std::cout << "ispunct(';'): " << (std::ispunct(';') ? "yes" : "no") << "\\n";
    std::cout << "isprint('\\n'): " << (std::isprint('\\n') ? "yes" : "no") << "\\n"; // no
    return 0;
}`,
    commonPitfalls: "isprint includes space (' '); isgraph excludes space but includes all other printable characters."
  }
];
