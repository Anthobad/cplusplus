import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

function run(cmd, args = [], input) {
  const started = process.hrtime.bigint();
  const result = spawnSync(cmd, args, { input, encoding: 'utf8', timeout: 30000 });
  return {
    stdout: result.stdout ?? '', stderr: result.stderr ?? '',
    exitCode: result.status, signal: result.signal,
    executionTimeMs: Number(process.hrtime.bigint() - started) / 1e6,
    error: result.error?.message ?? null,
  };
}

const report = { compiler: run('g++', ['--version']), compilation: null, tests: [], syntaxError: null, runtimeFailure: null, totalExecutionTimeMs: 0, errors: [] };
try {
  if (report.compiler.exitCode !== 0) throw new Error('g++ is unavailable');
  writeFileSync('/vercel/sum.cpp', '#include <iostream>\nint main() { int a, b; if (!(std::cin >> a >> b)) return 2; std::cout << a + b << "\\n"; }\n');
  // Compile the sum program once, then reuse its binary in three processes.
  report.compilation = run('g++', ['-std=c++20', '/vercel/sum.cpp', '-o', '/vercel/sum']);
  if (report.compilation.exitCode !== 0) throw new Error('Sum program compilation failed');
  for (const [input, expected] of [['2 3\n', '5\n'], ['10 20\n', '30\n'], ['-4 9\n', '5\n']]) {
    const result = run('/vercel/sum', [], input);
    const passed = result.exitCode === 0 && result.stdout === expected && !result.error;
    report.tests.push({ input, expected, ...result, passed });
    report.totalExecutionTimeMs += result.executionTimeMs;
    if (!passed) report.errors.push(`Sum test failed for ${input.trim()}`);
  }
  writeFileSync('/vercel/syntax-error.cpp', 'int main() { this is invalid C++; }\n');
  const syntax = run('g++', ['-std=c++20', '/vercel/syntax-error.cpp', '-o', '/vercel/syntax-error']);
  report.syntaxError = { ...syntax, classification: syntax.exitCode !== null && syntax.exitCode !== 0 ? 'compilation failure' : 'unexpected result' };
  if (report.syntaxError.classification !== 'compilation failure') report.errors.push('Syntax error was not classified as a compilation failure');
  writeFileSync('/vercel/runtime-failure.cpp', 'int main() { return 1; }\n');
  const compile = run('g++', ['-std=c++20', '/vercel/runtime-failure.cpp', '-o', '/vercel/runtime-failure']);
  if (compile.exitCode !== 0) throw new Error('Runtime failure fixture did not compile');
  const execution = run('/vercel/runtime-failure');
  report.totalExecutionTimeMs += execution.executionTimeMs;
  report.runtimeFailure = { compilation: compile, ...execution, classification: execution.exitCode === 1 ? 'runtime failure' : 'unexpected result' };
  if (report.runtimeFailure.classification !== 'runtime failure') report.errors.push('Return 1 was not classified as a runtime failure');
} catch (error) {
  report.errors.push(error.message);
}
console.log(JSON.stringify(report, null, 2));
if (report.errors.length) process.exitCode = 1;
