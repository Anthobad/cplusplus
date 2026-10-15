import { afterEach, describe, expect, it, vi } from 'vitest';
const sdk = vi.hoisted(() => ({ verifyIdToken: vi.fn(), initializeApp: vi.fn(() => ({ name: 'trusted-assessment' })) }));
vi.mock('firebase-admin/app', () => ({ applicationDefault: () => ({}), cert: () => ({}), getApps: () => [], initializeApp: sdk.initializeApp }));
vi.mock('firebase-admin/auth', () => ({ getAuth: () => ({ verifyIdToken: sdk.verifyIdToken }) }));
vi.mock('firebase-admin/firestore', () => ({ getFirestore: () => ({}) }));
import { verifyFirebaseToken } from '../server/security/firebaseAdmin';

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe('Firebase authentication boundary', () => {
  it('delegates signature/audience/issuer validation to Admin SDK with revocation checks enabled', async () => {
    sdk.verifyIdToken.mockResolvedValue({ uid: 'real-owner', firebase: { sign_in_provider: 'password' } });
    expect((await verifyFirebaseToken('signed-token')).uid).toBe('real-owner');
    expect(sdk.verifyIdToken).toHaveBeenCalledWith('signed-token', true);
  });
  it.each(['auth/id-token-expired', 'auth/id-token-revoked', 'auth/user-disabled', 'auth/invalid-id-token'])('rejects %s', async code => {
    sdk.verifyIdToken.mockRejectedValue({ code });
    await expect(verifyFirebaseToken('bad-token')).rejects.toMatchObject({ status: 401 });
  });
  it('fails closed on a certificate/auth infrastructure failure', async () => {
    sdk.verifyIdToken.mockRejectedValue(new Error('certificate fetch failed'));
    await expect(verifyFirebaseToken('token')).rejects.toMatchObject({ status: 503 });
  });
  it('rejects emulator trust shortcuts in a Vercel runtime', async () => {
    vi.stubEnv('VERCEL', '1'); vi.stubEnv('FIREBASE_AUTH_EMULATOR_HOST', '127.0.0.1:9099');
    await expect(verifyFirebaseToken('unsigned-emulator-token')).rejects.toMatchObject({ status: 503 });
    expect(sdk.verifyIdToken).not.toHaveBeenCalled();
  });
});
