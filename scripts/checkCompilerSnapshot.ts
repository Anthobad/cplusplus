import { compilerSnapshot } from '../server/sandbox/compilerSnapshot.js';
import { compilerVersion } from '../server/sandbox/compilerEnvironment.js';

const stale = compilerSnapshot.version !== compilerVersion;
const report = { event: 'compiler_snapshot_build_check', snapshotId: compilerSnapshot.snapshotId,
  expirationPolicy: 'never', stale };
if (stale) {
  console.warn(JSON.stringify(report));
  console.warn('Compiler snapshot is stale: submissions will provision GCC each time. Run scripts/provisionCompilerSnapshot.ts and deploy its refreshed pointer after approval.');
} else console.info(JSON.stringify(report));
