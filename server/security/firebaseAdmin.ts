import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import config from '../../firebase-applet-config.json' with { type: 'json' };
import type { TrustedStore, Principal } from './store.js';
import { HttpError } from './store.js';

function services() {
  if (process.env.VERCEL && (process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST)) {
    throw new Error('Emulator configuration is prohibited in production.');
  }
  let app = getApps().find(app => app.name === 'trusted-assessment');
  if (!app) {
    const supplied = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const account = supplied ? JSON.parse(supplied) : undefined;
    if (account && account.project_id !== config.projectId) throw new Error('Firebase project mismatch.');
    app = initializeApp({ projectId: config.projectId,
      credential: account ? cert(account) : applicationDefault() }, 'trusted-assessment');
  }
  return { auth: getAuth(app), db: getFirestore(app, config.firestoreDatabaseId || '(default)') };
}

export async function verifyFirebaseToken(token: string): Promise<Principal> {
  let auth: ReturnType<typeof getAuth>;
  try { auth = services().auth; } catch { throw new HttpError(503, 'Authentication service is unavailable.'); }
  try {
    const decoded = await auth.verifyIdToken(token, true);
    if (!decoded.uid || decoded.uid.includes('/') || decoded.uid === '.' || decoded.uid === '..') throw new Error('Invalid UID');
    return { uid: decoded.uid, anonymous: decoded.firebase.sign_in_provider === 'anonymous', name: decoded.name, email: decoded.email };
  } catch (error: any) {
    if (['auth/id-token-expired', 'auth/id-token-revoked', 'auth/invalid-id-token', 'auth/argument-error', 'auth/user-disabled', 'auth/user-not-found'].includes(error?.code)) {
      throw new HttpError(401, 'Sign in again before submitting.');
    }
    throw new HttpError(503, 'Authentication service is unavailable.');
  }
}

export function createFirestoreStore(getDatabase: () => ReturnType<typeof getFirestore>): TrustedStore {
  const clean = (value: any): any => {
    if (Array.isArray(value)) return value.map(entry => entry === undefined ? null : clean(entry));
    if (value && Object.getPrototypeOf(value) === Object.prototype) {
      return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined).map(([key, entry]) => [key, clean(entry)]));
    }
    return value; // Preserve Firestore Timestamp/GeoPoint/Reference and Date instances in legacy history.
  };
  return {
    async read(path) { return (await getDatabase().doc(path).get()).data(); },
    async transact(paths, update) {
      const db = getDatabase();
      return db.runTransaction(async transaction => {
        const refs = paths.map(path => db.doc(path));
        const snapshots = await transaction.getAll(...refs);
        const documents = Object.fromEntries(snapshots.map((snapshot, index) => [paths[index], snapshot.data()]));
        const result = update(documents);
        for (const [path, value] of Object.entries(result.writes || {})) {
          if (!paths.includes(path)) throw new Error('Transaction write was not declared.');
          transaction.set(db.doc(path), clean(value));
        }
        return result.value;
      });
    },
  };
}

export const firestoreStore = createFirestoreStore(() => services().db);
export const getTrustedDatabase = () => services().db;
