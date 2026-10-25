import { compilerSnapshot } from '../server/sandbox/compilerSnapshot.js';
import { compilerVersion, snapshotMaxAgeMs } from '../server/sandbox/compilerEnvironment.js';

const stale = compilerSnapshot.version !== compilerVersion || Date.now() - compilerSnapshot.createdAt >= snapshotMaxAgeMs;
const report = { event: 'compiler_snapshot_build_check', snapshotId: compilerSnapshot.snapshotId,
  refreshBefore: new Date(compilerSnapshot.createdAt + snapshotMaxAgeMs).toISOString(), stale };
if (stale) {
  console.warn(JSON.stringify(report));
  console.warn('Compiler snapshot is stale: submissions will provision GCC each time. Run scripts/provisionCompilerSnapshot.ts and deploy its refreshed pointer after approval.');
} else console.info(JSON.stringify(report));
