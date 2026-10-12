import { CppDocItem } from "../../types";

export const CMATH_DOCS: CppDocItem[] = [
  {
    name: "std::sqrt & std::cbrt",
    category: "cmath",
    header: "<cmath>",
    synopsis: "double sqrt(double arg); float sqrt(float arg); double cbrt(double arg);",
    timeComplexity: "Hardware FPU instruction (e.g. SQRTSD on x86, ~10-14 CPU cycles)",
    description: "Computes the square root (or cubic root) of a number. Supports IEEE-754 hardware floating-point acceleration. std::cbrt correctly computes real cube roots of negative numbers.",
    example: `#include <cmath>
#include <iostream>

int main() {
    double val = 64.0;
    std::cout << "sqrt(64.0) = " << std::sqrt(val) << "\\n";   // 8.0
    std::cout << "cbrt(-27.0) = " << std::cbrt(-27.0) << "\\n"; // -3.0
    return 0;
}`,
    commonPitfalls: "Passing a negative number to std::sqrt produces NaN (Not-a-Number) and sets domain error (EDOM). Always guard with `if (val >= 0.0)` or check with `std::isnan()`."
  },
  {
    name: "std::hypot",
    category: "cmath",
    header: "<cmath>",
    synopsis: "double hypot(double x, double y); double hypot(double x, double y, double z); (C++17)",
    timeComplexity: "O(1) floating-point computation",
    description: "Computes the Euclidean distance hypotenuse: sqrt(x*x + y*y) (or 3D in C++17: sqrt(x*x + y*y + z*z)) without intermediate overflow or underflow even when individual terms squared would exceed maximum float limits.",
    example: `#include <cmath>
#include <iostream>

int main() {
    double dx = 3.0, dy = 4.0;
    std::cout << "2D Distance: " << std::hypot(dx, dy) << "\\n"; // 5.0

    // C++17 3D Hypotenuse
    std::cout << "3D Distance: " << std::hypot(1.0, 2.0, 2.0) << "\\n"; // 3.0
    return 0;
}`,
    commonPitfalls: "Do not manually calculate `sqrt(x*x + y*y)` when x or y could be large (e.g., 1e200), as `x*x` will overflow to infinity. std::hypot scales internally to prevent overflow."
  },
  {
    name: "std::pow",
    category: "cmath",
    header: "<cmath>",
    synopsis: "double pow(double base, double exp);",
    timeComplexity: "O(1) transcendental FPU computation",
    description: "Computes base raised to the power of exp (base^exp). Supports fractional and negative exponents.",
    example: `#include <cmath>
#include <iostream>

int main() {
    std::cout << "2^10 = " << std::pow(2.0, 10.0) << "\\n"; // 1024
    std::cout << "9^0.5 = " << std::pow(9.0, 0.5) << "\\n"; // 3
    return 0;
}`,
    commonPitfalls: "If base is finite negative and exp is finite non-integer, domain error occurs and NaN is returned. std::pow is slower than repeated multiplication for small integer powers like `x*x` or `x*x*x`."
  },
  {
    name: "std::sin, std::cos, std::tan, std::atan2",
    category: "cmath",
    header: "<cmath>",
    synopsis: "double sin(double arg); double cos(double arg); double atan2(double y, double x);",
    timeComplexity: "O(1) FPU trigonometric instructions",
    description: "Trigonometric and inverse trigonometric functions. Angles are measured in RADIANS (not degrees). std::atan2 computes the arc tangent of y/x using the signs of both arguments to determine the correct quadrant in [-pi, pi].",
    example: `#include <cmath>
#include <iostream>

int main() {
    constexpr double PI = 3.14159265358979323846;
    double rad = PI / 2.0;
    std::cout << "sin(pi/2) = " << std::sin(rad) << "\\n"; // 1.0

    // atan2 handles zero x gracefully and determines correct quadrant
    double angle = std::atan2(1.0, -1.0); // 3*pi/4 (135 degrees)
    std::cout << "Angle radians: " << angle << "\\n";
    return 0;
}`,
    commonPitfalls: "Input must be in radians, not degrees! Multiply degrees by (pi / 180.0). Always prefer std::atan2(y, x) over std::atan(y / x) to avoid division by zero."
  },
  {
    name: "std::log, std::log2, std::log10",
    category: "cmath",
    header: "<cmath>",
    synopsis: "double log(double arg); double log2(double arg); double log10(double arg);",
    timeComplexity: "O(1) constant time",
    description: "Computes natural logarithm ln(x) (base e), binary logarithm log2(x), and common logarithm log10(x). Critical for algorithm complexity modeling, entropy calculations, and graphics.",
    example: `#include <cmath>
#include <iostream>

int main() {
    std::cout << "log2(1024) = " << std::log2(1024.0) << "\\n"; // 10
    std::cout << "log10(1000) = " << std::log10(1000.0) << "\\n"; // 3
    std::cout << "ln(e) = " << std::log(std::exp(1.0)) << "\\n"; // 1
    return 0;
}`,
    commonPitfalls: "If argument is 0.0, returns -infinity and triggers pole error. If argument < 0, returns NaN and triggers domain error."
  },
  {
    name: "std::floor, std::ceil, std::round, std::trunc",
    category: "cmath",
    header: "<cmath>",
    synopsis: "double floor(double arg); double ceil(double arg); double round(double arg); double trunc(double arg);",
    timeComplexity: "O(1) rounding FPU instruction",
    description: "Floating-point rounding modes: floor rounds DOWN to largest integer <= arg; ceil rounds UP to smallest integer >= arg; trunc rounds TOWARD ZERO; round rounds to nearest integer (halfway cases round away from zero).",
    example: `#include <cmath>
#include <iostream>

int main() {
    double val = -2.7;
    std::cout << "floor(-2.7) = " << std::floor(val) << "\\n"; // -3.0
    std::cout << "ceil(-2.7) = "  << std::ceil(val)  << "\\n"; // -2.0
    std::cout << "trunc(-2.7) = " << std::trunc(val) << "\\n"; // -2.0
    std::cout << "round(2.5) = "  << std::round(2.5)  << "\\n"; // 3.0
    return 0;
}`,
    commonPitfalls: "Return types are floating-point (`double`), not `int`. To convert to integer safely without overflow, use `static_cast<int>(std::round(x))` with range checks."
  },
  {
    name: "std::fmod & std::remainder",
    category: "cmath",
    header: "<cmath>",
    synopsis: "double fmod(double numer, double denom); double remainder(double x, double y);",
    timeComplexity: "O(1) constant time",
    description: "Computes the floating-point remainder of division numer/denom. std::fmod has the same sign as the numerator. std::remainder computes IEEE-754 remainder rounded to nearest integer quotient.",
    example: `#include <cmath>
#include <iostream>

int main() {
    std::cout << "fmod(5.3, 2.0) = " << std::fmod(5.3, 2.0) << "\\n"; // 1.3
    std::cout << "fmod(-5.3, 2.0) = " << std::fmod(-5.3, 2.0) << "\\n"; // -1.3
    return 0;
}`,
    commonPitfalls: "If denom is 0.0, domain error occurs and NaN is returned. Unlike integer modulo operator `%`, which does not compile for floats, fmod is designed specifically for floating-point values."
  },
  {
    name: "std::isnan, std::isinf, std::isfinite",
    category: "cmath",
    header: "<cmath>",
    synopsis: "bool isnan(float/double/long double arg); bool isinf(...); bool isfinite(...);",
    timeComplexity: "O(1) bitwise floating-point exponent check",
    description: "IEEE 754 classification predicates: isnan checks if value is Not-a-Number (e.g. 0.0 / 0.0 or sqrt(-1)); isinf checks for positive/negative infinity; isfinite returns true if number is neither NaN nor infinite.",
    example: `#include <cmath>
#include <iostream>

int main() {
    double nanVal = std::sqrt(-1.0);
    double infVal = 1.0 / 0.0;

    std::cout << "isnan(sqrt(-1)): " << std::isnan(nanVal) << "\\n"; // 1
    std::cout << "isinf(1/0): " << std::isinf(infVal) << "\\n"; // 1
    std::cout << "isfinite(42.0): " << std::isfinite(42.0) << "\\n"; // 1

    // Critical: NaN != NaN according to IEEE-754!
    std::cout << "nan == nan? " << (nanVal == nanVal ? "true" : "false") << "\\n"; // false
    return 0;
}`,
    commonPitfalls: "Never test NaN using `x == x` or `x != x` directly if `-ffast-math` compiler flags are enabled, because fast-math assumes no NaNs exist and optimizes the comparison away! Always use `std::isnan()`."
  },
  {
    name: "std::lerp & std::midpoint",
    category: "cmath",
    header: "<cmath>",
    synopsis: "constexpr double lerp(double a, double b, double t) noexcept; (C++20)",
    timeComplexity: "O(1) floating-point FMA (Fused Multiply-Add)",
    description: "Computes linear interpolation between a and b: a + t*(b - a) with exact boundary guarantees: lerp(a, b, 0.0) == a and lerp(a, b, 1.0) == b without precision loss or catastrophic cancellation.",
    example: `#include <cmath>
#include <numeric>
#include <iostream>

int main() {
    double start = 10.0, end = 20.0;
    std::cout << "25% blend: " << std::lerp(start, end, 0.25) << "\\n"; // 12.5
    std::cout << "Midpoint: " << std::midpoint(10, 20) << "\\n";        // 15
    return 0;
}`,
    commonPitfalls: "Classic `a + t*(b - a)` fails boundary equality due to floating-point rounding. std::lerp guarantees exactness."
  }
];
