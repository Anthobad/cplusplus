import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User 
} from "firebase/auth";
import { 
  getFirestore, 
  doc,
  collection, 
  getDocs, 
  getDocFromServer
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { UserProgress, ExamAttempt } from "../types";
import { trustedRequest } from "./authenticatedFetch";
import { migrateUserProgress } from "../data/curriculumSummary";

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use named database if specified in config
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection check as mandated by Firebase skill
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firebase offline notice (using local storage cache)");
    }
  }
}
testFirebaseConnection();

export const DEFAULT_PROGRESS: UserProgress = {
  userId: "guest",
  unlockedUnits: ["topic-1"],
  completedUnits: [],
  completedUnitIds: [],
  unitQuizScores: {},
  quizScores: {},
  examAttempts: {},
  currentUnitId: "topic-1",
  currentWeekNumber: 1,
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split("T")[0],
  lastActiveTimestamp: Date.now(),
  studySessionsCount: 1,
  studentName: "Guest Student",
  studentLevel: "Beginner",
  totalCodingChallengesSolved: 0,
};

export function getCleanGuestProgress(): UserProgress {
  return {
    ...DEFAULT_PROGRESS,
    userId: "guest",
    unlockedUnits: ["topic-1"],
    completedUnits: [],
    completedUnitIds: [],
    unitQuizScores: {},
    quizScores: {},
    examAttempts: {},
    currentUnitId: "topic-1",
    currentWeekNumber: 1,
    studentName: "Guest Student",
    lastActiveDate: new Date().toISOString().split("T")[0],
    lastActiveTimestamp: Date.now(),
    studySessionsCount: 1,
    streakDays: 1,
    totalCodingChallengesSolved: 0
  };
}

const LOCAL_STORAGE_PROGRESS_PREFIX = "cpp_prep_user_progress_";
const LOCAL_STORAGE_EXAMS_PREFIX = "cpp_prep_user_exams_";

function getProgressKey(uid: string) {
  return `${LOCAL_STORAGE_PROGRESS_PREFIX}${uid || "guest"}`;
}

function getExamsKey(uid: string) {
  return `${LOCAL_STORAGE_EXAMS_PREFIX}${uid || "guest"}`;
}

// ----------------- Authentication Helpers -----------------

// Sign in with Google Popup
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const credential = await signInWithPopup(auth, provider);
  return credential.user;
}

// Sign in with Email and Password
export async function logInWithEmail(email: string, pass: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  return credential.user;
}

// Sign up with Email, Password and Display Name
export async function registerWithEmail(email: string, pass: string, displayName: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }
  return credential.user;
}

// Sign in as Guest / Anonymous
export async function continueAsGuest(): Promise<User> {
  const credential = await signInAnonymously(auth);
  return credential.user;
}

// Sign Out
export async function logOut(): Promise<void> {
  await signOut(auth);
}

// Track Auth State changes
export function subscribeToAuth(onUser: (user: User | null) => void) {
  return onAuthStateChanged(auth, onUser);
}

// Check Initial Auth State without forcing anonymous sign-in on logout
export async function initializeUserAuth(onUserReady?: (user: User) => void): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user && onUserReady) onUserReady(user);
      resolve(user);
    });
  });
}

// ----------------- Progress Persistence -----------------

// Load Student Progress
export async function loadUserProgress(userId?: string): Promise<UserProgress> {
  const result = await loadUserProgressRaw(userId);
  return migrateUserProgress(result);
}

export function cacheTrustedProgress(progress: UserProgress, userId?: string): UserProgress {
  const uid = userId || (auth.currentUser?.isAnonymous ? "guest" : auth.currentUser?.uid) || "guest";
  const value = { ...progress, userId: uid };
  const key = getProgressKey(uid);
  try {
    const old = localStorage.getItem(key);
    if (old && !localStorage.getItem(`${key}_legacy_archive`)) localStorage.setItem(`${key}_legacy_archive`, old);
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* The server result remains authoritative when local storage is unavailable. */ }
  return value;
}

export function cacheTrustedExam(attempt: ExamAttempt, progress: UserProgress, userId?: string) {
  const uid = userId || (auth.currentUser?.isAnonymous ? 'guest' : auth.currentUser?.uid) || 'guest';
  try {
    const key = getExamsKey(uid);
    const history: ExamAttempt[] = JSON.parse(localStorage.getItem(key) || '[]');
    if (!history.some(entry => entry.id && entry.id === attempt.id)) history.unshift(attempt);
    localStorage.setItem(key, JSON.stringify(history));
  } catch { /* Cloud history is already committed; never fabricate a failed grade. */ }
  return cacheTrustedProgress(progress, uid);
}

async function loadUserProgressRaw(userId?: string): Promise<UserProgress> {
  const uid = userId || "guest";
  if (auth.currentUser && (uid === "guest" ? auth.currentUser.isAnonymous : auth.currentUser.uid === uid)) {
    try { return cacheTrustedProgress(await trustedRequest<UserProgress>("/api/progress"), uid); }
    catch (error) { console.warn("Trusted progress unavailable; cached history is display-only."); }
  }
  try {
    const cached = localStorage.getItem(getProgressKey(uid));
    if (cached) return { ...getCleanGuestProgress(), ...JSON.parse(cached), userId: uid };
  } catch {}
  return { ...getCleanGuestProgress(), userId: uid };
}

// Profile-only compatibility helper. Assessment fields never leave the browser here.
export async function saveUserProgress(progress: UserProgress, userId?: string): Promise<void> {
  const result = await trustedRequest<UserProgress>("/api/progress/profile", {
    studentName: progress.studentName, studentLevel: progress.studentLevel,
  });
  cacheTrustedProgress(result, userId);
}

export async function completeUnit(unitId: string, userId?: string): Promise<UserProgress> {
  return cacheTrustedProgress(await trustedRequest<UserProgress>("/api/progress/complete", { unitId }), userId);
}

export async function submitQuiz(quizId: string, answers: Record<string, number>) {
  const result = await trustedRequest<{ score: number; passed: boolean; progress: UserProgress }>("/api/progress/quiz", { quizId, answers });
  cacheTrustedProgress(result.progress);
  return result;
}

// Client-computed exam totals must never be persisted as authoritative results.
export async function saveExamAttempt(_attempt: ExamAttempt, _userId?: string): Promise<UserProgress> {
  throw new Error("Submit answers through a server-issued exam session instead.");
}

// Load Exam History
export async function loadExamHistory(userId?: string): Promise<ExamAttempt[]> {
  const uid = userId || auth.currentUser?.uid || "guest";
  const storageKey = getExamsKey(uid);

  let localExams: ExamAttempt[] = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) localExams = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse local exams", e);
  }

  if (!auth.currentUser || uid === "guest") return localExams;

  try {
    const colRef = collection(db, "users", uid, "exams");
    // Older saved attempts may have no completedAt field; ordering by it omits them.
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const remoteExams: ExamAttempt[] = [];
      snap.forEach((d) => remoteExams.push({ ...d.data(), id: d.id } as ExamAttempt));
      const identity = (attempt: ExamAttempt) => attempt.id || `${attempt.examId}:${attempt.timestamp}:${attempt.score}`;
      const merged = new Map(localExams.map(attempt => [identity(attempt), attempt]));
      for (const attempt of remoteExams) merged.set(identity(attempt), attempt);
      const history = [...merged.values()].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      localStorage.setItem(storageKey, JSON.stringify(history));
      return history;
    }
  } catch (err) {
    console.warn("Could not fetch exam history from Firestore:", err);
  }

  return localExams;
}

// Aliases for progressive learning interface
export const getUserProgress = loadUserProgress;

export async function saveQuizScore(_userId: string, _quizId: string, _score: number, _passed: boolean): Promise<UserProgress> {
  throw new Error("Quiz answers must be graded by the trusted server.");
}

export async function resetUserProgress(userId?: string): Promise<UserProgress> {
  const result = await trustedRequest<UserProgress>("/api/progress/reset", {});
  const uid = userId || "guest";
  localStorage.removeItem(getExamsKey(uid));
  return cacheTrustedProgress(result, uid);
}
