import type { Firestore } from 'firebase-admin/firestore';

/** Only temporary session documents are eligible. Saved exam history is never touched. */
export async function cleanupExpiredSessions(db: Firestore, options: {
  cutoff: number; apply: boolean; maxDocuments?: number;
}) {
  const maxDocuments = options.maxDocuments ?? 500;
  if (!Number.isSafeInteger(options.cutoff) || !Number.isSafeInteger(maxDocuments) || maxDocuments < 1 || maxDocuments > 5000) {
    throw new Error('Invalid session cleanup bounds.');
  }
  const report = { mode: options.apply ? 'delete' : 'dry-run', eligible: 0, deleted: 0, bounded: false };
  // One indexed, bounded query. Numeric expiresAt is retained for existing sessions.
  const page = await db.collection('_assessmentSessions').where('expiresAt', '<=', options.cutoff)
    .limit(maxDocuments).get();
  report.eligible = page.size;
  report.bounded = page.size === maxDocuments;
  if (!options.apply) return report;
  for (let offset = 0; offset < page.docs.length; offset += 100) {
    const batch = db.batch();
    const documents = page.docs.slice(offset, offset + 100);
    for (const document of documents) {
      // Do not delete a record changed since the query. A conflict aborts this batch.
      batch.delete(document.ref, { lastUpdateTime: document.updateTime });
    }
    await batch.commit();
    report.deleted += documents.length;
  }
  return report;
}
