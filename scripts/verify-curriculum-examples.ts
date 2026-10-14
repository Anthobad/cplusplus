/** Compile/run only trusted examples authored in curriculum data, never student submissions. */
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ALL_UNITS } from '../src/data/curriculum';

const examples = ALL_UNITS.flatMap(unit => {
  const worked = unit.theory.sections[1].codeSnippets![0];
  return [
    { id: `teaching-${unit.weekNumber}`, code: worked.code,
      output: worked.explanation.split('Expected standard output:\n')[1] },
    ...unit.codeExamples.filter(example => example.id.startsWith('guide-'))
      .map(example => ({ id: example.id, code: example.code, output: example.output! })),
  ];
});

const directory = mkdtempSync(join(tmpdir(), 'cplusplus-teaching-'));
let failures = 0;
try {
  for (const example of examples) {
    const source = join(directory, `${example.id}.cpp`);
    const executable = join(directory, example.id);
    writeFileSync(source, example.code);
    const build = spawnSync('g++', ['-std=c++20', '-Wall', '-Wextra', '-pthread', source, '-o', executable],
      { encoding: 'utf8', timeout: 20_000 });
    if (build.error || build.status !== 0) {
      console.error(`${example.id}: compilation failed\n${build.error || build.stderr}`);
      failures++;
      continue;
    }
    const run = spawnSync(executable, [], { encoding: 'utf8', timeout: 5_000 });
    if (run.error || run.status !== 0 || run.stderr || run.stdout.trimEnd() !== example.output.trimEnd()) {
      console.error(`${example.id}: execution/output failed`, {
        error: run.error, status: run.status, stderr: run.stderr,
        expected: example.output, actual: run.stdout,
      });
      failures++;
    }
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}
console.log(`${examples.length - failures}/${examples.length} authored C++20 examples passed.`);
if (failures) process.exitCode = 1;
