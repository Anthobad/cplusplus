/** Explicit administrative maintenance; never called by builds or deployment hooks. */
import { getTrustedDatabase } from '../server/security/firebaseAdmin.js';
import { cleanupExpiredSessions } from '../server/security/sessionCleanup.js';

async function run() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--delete')) throw new Error('Unsupported cleanup option.');
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('Explicit administrative credentials are required.');
  }
  const report = await cleanupExpiredSessions(getTrustedDatabase(), { cutoff: Date.now(), apply: args.includes('--delete') });
  console.log(JSON.stringify(report)); // Counts only; no learner data or credentials.
}
run().catch(() => {
  console.error('Session cleanup failed. Check credentials and database access. Some earlier batches may have completed; rerun the dry-run to inspect remaining counts.');
  process.exitCode = 1;
});
