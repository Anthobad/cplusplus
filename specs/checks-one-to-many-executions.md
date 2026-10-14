The Vercel Sandbox JavaScript quickstart succeeded.

Now extend the existing `sandbox-quickstart` project to verify C++20 execution.

1. Reuse the existing Vercel project, authentication, and sandbox configuration.
2. Check whether `g++` is installed. If not, investigate how to make a C++20 compiler available.
3. Create a C++ program that reads two integers from stdin and prints their sum.
4. Compile the program exactly once using `g++ -std=c++20`.
5. Execute the compiled binary in three independent processes with inputs:
   - `2 3` → `5`
   - `10 20` → `30`
   - `-4 9` → `5`
6. Capture stdout, stderr, exit codes, and execution times for each test.
7. Verify that a syntax error is classified as a compilation failure.
8. Verify that `int main() { return 1; }` is classified as a runtime failure.
9. Preserve `networkPolicy: 'deny-all'` and stop the sandbox when finished.
10. Report actual results, compilation time, total execution time, and any errors.

Do not modify my C++ learning website yet. Do not add paid services or enable billing.

Execute the tests rather than only writing code. If anything prevents execution, report the exact blocker.