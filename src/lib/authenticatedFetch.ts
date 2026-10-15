import { getAuth, signInAnonymously } from 'firebase/auth';

let signingIn: ReturnType<typeof signInAnonymously> | undefined;
export const authenticatedFetch: typeof fetch = async (input, init) => {
  if (typeof input !== 'string' || !input.startsWith('/api/')) throw new Error('Only same-origin API requests are supported.');
  const auth = getAuth();
  await auth.authStateReady();
  if (!auth.currentUser) {
    signingIn ||= signInAnonymously(auth).finally(() => { signingIn = undefined; });
    await signingIn;
  }
  const uid = auth.currentUser!.uid;
  const token = await auth.currentUser!.getIdToken();
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(input, { ...init, headers });
  if (auth.currentUser?.uid !== uid) throw new Error('Your signed-in account changed. Retry from the current account.');
  return response;
};

export async function trustedRequest<T>(path: string, body?: unknown): Promise<T> {
  const response = await authenticatedFetch(path, body === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!response.ok) {
    const message = await response.json().catch(() => ({}));
    throw new Error(message.error || 'Trusted assessment service is unavailable. Your attempt was not finalized.');
  }
  return response.json();
}
