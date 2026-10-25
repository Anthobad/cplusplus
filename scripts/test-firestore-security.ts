import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, setLogLevel } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { createFirestoreStore } from '../server/security/firebaseAdmin.js';
import { createAccess } from '../server/security/access.js';
import { createProgressService } from '../server/security/progress.js';

const host = process.env.FIRESTORE_EMULATOR_HOST;
assert(host && /^127\.0\.0\.1:\d+$/.test(host), 'Use a loopback Firestore emulator, never a production project.');
const projectId = 'demo-cplusplus-security';
setLogLevel('silent');
const environment = await initializeTestEnvironment({ projectId, firestore: {
  host: '127.0.0.1', port: Number(host.split(':')[1]), rules: readFileSync('firestore.rules', 'utf8'),
} });
const admin = initializeApp({ projectId }, 'security-emulator-tests');
try {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'users/alice'), { verifiedCodingPassed: ['cc-t1'], completedUnitIds: ['topic-1'] });
    await setDoc(doc(context.firestore(), 'users/alice/exams/historical'), { score: 80, passed: true });
    await setDoc(doc(context.firestore(), 'exams/exam-final'), { title: 'Trusted exam' });
  });
  let denied = 0;
  for (const context of [environment.unauthenticatedContext(), environment.authenticatedContext('alice'),
    environment.authenticatedContext('bob'), environment.authenticatedContext('alice', { admin: true })]) {
    const db = context.firestore();
    for (const operation of [
      () => setDoc(doc(db, 'users/alice'), { verifiedCodingPassed: ['cc-t39'] }),
      () => updateDoc(doc(db, 'users/alice'), { 'examAttempts.exam-final': { score: 100, passed: true } }),
      () => deleteDoc(doc(db, 'users/alice')),
      () => setDoc(doc(db, 'users/alice/exams/forged'), { score: 100, passed: true }),
      () => setDoc(doc(db, 'users/alice/progress/forged'), { verifiedCodingPassed: ['cc-t39'] }),
      () => setDoc(doc(db, 'exams/exam-final'), { title: 'Forged exam' }),
      () => updateDoc(doc(db, 'exams/exam-final'), { title: 'Modified exam' }),
      () => deleteDoc(doc(db, 'exams/exam-final')),
      () => setDoc(doc(db, '_security/global-execution'), { leases: {}, dayCount: 0 }),
      () => setDoc(doc(db, '_securityUsers/forged'), { dayCount: 0 }),
      () => setDoc(doc(db, '_assessmentSessions/forged'), { uid: 'alice', outcome: { passed: true } }),
      () => getDoc(doc(db, '_security/global-execution')),
      () => getDoc(doc(db, '_assessmentSessions/forged')),
      () => setDoc(doc(db, '_integrity/forged'), { version: 2 }),
      () => getDoc(doc(db, '_integrity/forged')),
    ]) { await assertFails(operation()); denied++; }
  }
  const alice = environment.authenticatedContext('alice').firestore();
  await assertSucceeds(getDoc(doc(alice, 'users/alice')));
  await assertSucceeds(getDoc(doc(alice, 'users/alice/exams/historical')));
  await assertFails(getDoc(doc(environment.authenticatedContext('bob').firestore(), 'users/alice'))); denied++;
  await assertSucceeds(getDoc(doc(alice, 'exams/exam-final')));

  // Exercise the actual Admin SDK transaction adapter across independent instances.
  const database = getFirestore(admin);
  const storeA = createFirestoreStore(() => database), storeB = createFirestoreStore(() => database);
  const legacyTimestamp = Timestamp.fromMillis(1000);
  await database.doc('users/alice').update({ createdAt: legacyTimestamp });
  await createProgressService(storeA).read({ uid: 'alice', anonymous: false });
  const archived = (await database.doc('users/alice/legacySnapshots/pre-hardening').get()).data()!;
  assert.equal(archived.createdAt.toMillis(), legacyTimestamp.toMillis());
  const accessA = createAccess(storeA, async () => { throw new Error('unused'); });
  const accessB = createAccess(storeB, async () => { throw new Error('unused'); });
  const principal = { uid: 'alice', anonymous: false };
  const attempts = await Promise.allSettled([
    accessA.reserve(principal, 'execution'), accessB.reserve(principal, 'execution'),
  ]);
  assert.equal(attempts.filter(attempt => attempt.status === 'fulfilled').length, 1);
  assert.equal(attempts.filter(attempt => attempt.status === 'rejected' && attempt.reason.status === 429).length, 1);
  for (const attempt of attempts) if (attempt.status === 'fulfilled') await attempt.value();
  await (await accessB.reserve(principal, 'execution'))();
  console.log(`${denied} negative Firestore rule checks passed; owner history reads preserved; real cross-instance transactional concurrency enforced.`);
} finally {
  await environment.cleanup();
  await deleteApp(admin);
}
