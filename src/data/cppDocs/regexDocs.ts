import { CppDocItem } from "../../types";

export const REGEX_DOCS: CppDocItem[] = [
  {
    name: "std::regex & Syntax Flags",
    category: "regex",
    header: "<regex>",
    synopsis: "template<class CharT, class Traits = regex_traits<CharT>> class basic_regex; using regex = basic_regex<char>;",
    timeComplexity: "Construction/compilation is O(2^M) worst-case; matching is O(N) to O(N^2) or exponential depending on regex grammar.",
    description: "Represents a compiled regular expression. Supported syntax options include ECMAScript (default), basic, extended, awk, grep, egrep, as well as flags like `std::regex_constants::icase` (case-insensitive) and `optimize`.",
    example: `#include <regex>
#include <iostream>

int main() {
    // Compile regex once (expensive!) with case-insensitive flag
    static const std::regex emailRegex(
        R"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})",
        std::regex_constants::ECMAScript | std::regex_constants::icase
    );

    std::string test = "developer@cppsystems.org";
    std::cout << "Matches: " << std::regex_match(test, emailRegex) << "\\n";
    return 0;
}`,
    commonPitfalls: "std::regex compilation is EXTREMELY EXPENSIVE! Never construct a `std::regex` inside an inner loop. Store it as a `static const` or member variable. Beware of ReDoS (Regular Expression Denial of Service) with nested quantifiers like `(a+)+$`."
  },
  {
    name: "std::regex_match",
    category: "regex",
    header: "<regex>",
    synopsis: "template<class BidirIt, class Alloc, class CharT, class Traits> bool regex_match(BidirIt first, BidirIt last, match_results<BidirIt, Alloc>& m, const basic_regex<CharT, Traits>& e);",
    timeComplexity: "O(N) typical; can be exponential on adversarial pathological patterns.",
    description: "Determines whether the ENTIRE target character sequence matches the regular expression. If even a single character at the start or end does not conform, regex_match returns false.",
    example: `#include <regex>
#include <string>
#include <iostream>

int main() {
    std::string ip = "192.168.1.100";
    std::smatch matches;
    std::regex ipPattern(R"((\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3}))");

    if (std::regex_match(ip, matches, ipPattern)) {
        std::cout << "Valid IP! First octet: " << matches[1].str() 
                  << ", Second octet: " << matches[2].str() << "\\n";
    }
    return 0;
}`,
    commonPitfalls: "Confusing std::regex_match with std::regex_search: `regex_match` requires the WHOLE string to match; if you want to find a regex pattern contained anywhere inside a string, use `std::regex_search`."
  },
  {
    name: "std::regex_search",
    category: "regex",
    header: "<regex>",
    synopsis: "bool regex_search(const string& s, smatch& m, const regex& e);",
    timeComplexity: "O(N * M) typical search",
    description: "Searches for a match of the regular expression anywhere within the target sequence. Populates the match_results object with capture groups if provided.",
    example: `#include <regex>
#include <string>
#include <iostream>

int main() {
    std::string logLine = "[ERROR 2026-09-08 14:22:01] Connection refused on port 5432";
    std::smatch match;
    std::regex portPattern(R"(port\\s+(\\d+))");

    if (std::regex_search(logLine, match, portPattern)) {
        std::cout << "Full match: " << match[0] << "\\n"; // "port 5432"
        std::cout << "Port number: " << match[1] << "\\n"; // "5432"
    }
    return 0;
}`,
    commonPitfalls: "matches[0] always represents the entire matched pattern. matches[1], matches[2], etc. represent sub-match capture groups `()`."
  },
  {
    name: "std::regex_replace",
    category: "regex",
    header: "<regex>",
    synopsis: "string regex_replace(const string& s, const regex& e, const string& fmt);",
    timeComplexity: "O(N) linear time construction of resulting string",
    description: "Constructs a new string where all matches of regular expression e in string s are replaced by the formatted text fmt. Supports substitution specifiers: $1, $2 for capture groups, $& for full match, $` for prefix, $' for suffix.",
    example: `#include <regex>
#include <string>
#include <iostream>

int main() {
    std::string text = "Contact support at help@company.com or sales@company.com";
    std::regex emailPattern(R"(([a-zA-Z0-9._%+-]+)@company\\.com)");

    // Mask the username with [CONFIDENTIAL]
    std::string masked = std::regex_replace(text, emailPattern, "[CONFIDENTIAL]@company.com");
    std::cout << masked << "\\n";

    // Rearrange format: $2, $1
    std::string name = "Torvalds, Linus";
    std::regex namePattern(R"((\\w+),\\s*(\\w+))");
    std::string inverted = std::regex_replace(name, namePattern, "$2 $1");
    std::cout << inverted << "\\n"; // "Linus Torvalds"
    return 0;
}`,
    commonPitfalls: "In substitution string, `$` is a special escape character! If you want a literal `$` in the replacement text, escape it with `$$`."
  },
  {
    name: "std::smatch & Sub-matches",
    category: "regex",
    header: "<regex>",
    synopsis: "using smatch = match_results<string::const_iterator>; using cmatch = match_results<const char*>;",
    timeComplexity: "O(1) indexing operator[]; O(K) where K is number of capture groups",
    description: "Sequential container holding the results of a regular expression match. Index 0 corresponds to the whole matched target; subsequent indices correspond to parenthesized capture sub-expressions. Provides .prefix() and .suffix().",
    example: `#include <regex>
#include <string>
#include <iostream>

int main() {
    std::string s = "Weight: 84kg";
    std::smatch m;
    std::regex r(R"((\\d+)(kg|lbs))");

    if (std::regex_search(s, m, r)) {
        std::cout << "Prefix: '" << m.prefix().str() << "'\\n"; // "Weight: "
        std::cout << "Value:  " << m[1].str() << "\\n";          // "84"
        std::cout << "Unit:   " << m[2].str() << "\\n";          // "kg"
        std::cout << "Suffix: '" << m.suffix().str() << "'\\n"; // ""
    }
    return 0;
}`,
    commonPitfalls: "Lifetime issue: `std::smatch` stores iterators pointing into the target string! If the target string is destroyed or modified, all `sub_match` references inside `smatch` become dangling pointers."
  },
  {
    name: "std::sregex_iterator & std::sregex_token_iterator",
    category: "regex",
    header: "<regex>",
    synopsis: "using sregex_iterator = regex_iterator<string::const_iterator>; using sregex_token_iterator = regex_token_iterator<string::const_iterator>;",
    timeComplexity: "O(N) across entire text scan",
    description: "Iterators for extracting all occurrences of a pattern or splitting strings. Passing -1 as the token index to sregex_token_iterator splits the string using the regex as a delimiter.",
    example: `#include <regex>
#include <string>
#include <iostream>

int main() {
    std::string csv = "alpha; beta, gamma; delta,epsilon";
    std::regex delimiter(R"([;,]\\s*)");

    // -1 token index produces the substrings BETWEEN delimiters!
    std::sregex_token_iterator it(csv.begin(), csv.end(), delimiter, -1);
    std::sregex_token_iterator end;

    while (it != end) {
        std::cout << "Token: [" << *it++ << "]\\n";
    }
    return 0;
}`,
    commonPitfalls: "Do not pass a temporary `std::regex` or temporary `std::string` rvalue into the iterator constructor, as the iterator holds references to both."
  }
];
