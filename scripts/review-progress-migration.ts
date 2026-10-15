/** Read-only production preflight. Never called by builds, tests or deployment hooks. */
import { FieldPath } from 'firebase-admin/firestore';
import { getTrustedDatabase } from '../server/security/firebaseAdmin.js';
import { getUnitById } from '../src/data/curriculum.js';

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error('Configure explicit server credentials before running the read-only migration review.');
}
async function review() {
const db = getTrustedDatabase();
const report = { mode: 'read-only', users: 0, legacyVerifiedLists: 0, legacyExamMaps: 0,
  malformedProgress: 0, unknownCurrentTopics: 0, largeDocuments: 0 };
let last: FirebaseFirestore.QueryDocumentSnapshot | undefined;
for (;;) {
  let query = db.collection('users').orderBy(FieldPath.documentId()).limit(100);
  if (last) query = query.startAfter(last);
  const page = await query.get();
  if (page.empty) break;
  for (const snapshot of page.docs) {
    const record = snapshot.data();
    report.users++;
    if (Array.isArray(record.verifiedCodingPassed) && record.verifiedCodingPassed.length) report.legacyVerifiedLists++;
    if (record.examAttempts && Object.keys(record.examAttempts).length) report.legacyExamMaps++;
    const badArrays = ['completedUnitIds', 'completedUnits', 'unlockedUnits'].some(key => record[key] != null &&
      (!Array.isArray(record[key]) || record[key].some((id: unknown) => typeof id !== 'string')));
    const badMaps = ['quizScores', 'unitQuizScores', 'examAttempts', 'codingChallengeResults'].some(key => record[key] != null &&
      (typeof record[key] !== 'object' || Array.isArray(record[key])));
    if (badArrays || badMaps) report.malformedProgress++;
    if (record.currentUnitId && (typeof record.currentUnitId !== 'string' || !getUnitById(record.currentUnitId))) report.unknownCurrentTopics++;
    if (Buffer.byteLength(JSON.stringify(record)) > 700_000) report.largeDocuments++;
  }
  last = page.docs.at(-1);
}
// Aggregate counts only; never print learner data or credential/provider errors.
console.log(JSON.stringify(report, null, 2));
if (report.malformedProgress || report.largeDocuments || report.unknownCurrentTopics) process.exitCode = 1;

}
review().catch(() => { console.error("Read-only migration review failed. Check server credentials, database access, and document shapes. No data was written."); process.exitCode = 1; });
