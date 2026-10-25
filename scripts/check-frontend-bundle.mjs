import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

for (const asset of ['../dist/server.cjs', '../dist/server.cjs.map', '../dist/server-build']) {
  assert(!existsSync(new URL(asset, import.meta.url)), 'Backend code must stay outside public frontend output.');
}

const manifest = JSON.parse(readFileSync(new URL('../dist/.vite/manifest.json', import.meta.url), 'utf8'));
const entry = Object.keys(manifest).find(key => manifest[key].isEntry);
assert(entry, 'A frontend entry must exist.');
const initial = new Set();
function visit(key) {
  if (initial.has(key)) return;
  initial.add(key);
  for (const dependency of manifest[key].imports || []) visit(dependency);
}
visit(entry);
for (const suffix of [
  'domain-1.json', 'domain-2.json', 'domain-3.json', 'domain-4.json',
  'DomainUnitView.tsx', 'ExamScreen.tsx', 'CppDocsModal.tsx',
  'AiMentorDrawer.tsx', 'MockInterviewView.tsx', 'ReadinessDashboard.tsx', 'InterviewPracticeView.tsx',
]) {
  const key = Object.keys(manifest).find(item => item.endsWith(suffix));
  assert(key, `Expected a separate chunk for ${suffix}.`);
  assert(!initial.has(key), `${suffix} must not be an initial dependency.`);
}
let bytes = 0, gzipBytes = 0;
for (const key of initial) {
  const file = manifest[key].file;
  if (!file.endsWith('.js')) continue;
  const code = readFileSync(new URL(`../dist/${file}`, import.meta.url));
  bytes += code.length;
  gzipBytes += gzipSync(code).length;
}
// The measured pre-change entry was 530.48 kB gzip. Guard against undoing the split.
assert(gzipBytes < 350_000, `Initial JavaScript exceeds the 350 kB gzip regression budget (${gzipBytes} bytes).`);
console.log(`Initial JavaScript: ${(bytes / 1000).toFixed(2)} kB; ${(gzipBytes / 1000).toFixed(2)} kB gzip. Domain and supporting views are deferred.`);
