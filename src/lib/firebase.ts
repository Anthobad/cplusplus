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
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy,
  getDocFromServer
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { UserProgress, ExamAttempt } from "../types";
import { migrateUserProgress } from "../data/curriculum";

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

async function loadUserProgressRaw(userId?: string): Promise<UserProgress> {
  const isGuest = !userId || userId === "guest" || (!auth.currentUser && (!userId || userId === "guest"));
  const uid = isGuest ? "guest" : (userId || auth.currentUser?.uid || "guest");
  const storageKey = getProgressKey(uid);
  
  if (uid === "guest") {
    // Guest progress is isolated to guest localStorage key
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...getCleanGuestProgress(),
          ...parsed,
          userId: "guest",
          unlockedUnits: Array.from(new Set(["topic-1", ...(parsed.unlockedUnits || [])]))
        };
      }
    } catch (e) {
      console.error("Failed to read guest progress from localStorage", e);
    }
    return getCleanGuestProgress();
  }

  // Try local storage first for instant response for registered user
  let cached: UserProgress = { ...DEFAULT_PROGRESS, userId: uid };
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      cached = { ...DEFAULT_PROGRESS, ...JSON.parse(raw), userId: uid };
      // Sanitize examAttempts to guarantee that any attempt with score < 50 can NEVER be marked as passed
      if (cached.examAttempts) {
        for (const [eId, att] of Object.entries(cached.examAttempts)) {
          if (att && (typeof att.score !== "number" || att.score < 50)) {
            cached.examAttempts[eId] = { ...att, passed: false };
          }
        }
      }
    }
  } catch (e) {
    console.error("Failed to read progress from localStorage", e);
  }

  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    return cached;
  }

  try {
    const docRef = doc(db, "users", uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<UserProgress>;
      const merged: UserProgress = {
        ...DEFAULT_PROGRESS,
        ...cached,
        ...data,
        userId: uid,
        unlockedUnits: Array.from(new Set(["topic-1", ...(data.unlockedUnits || cached.unlockedUnits || [])])),
      };
      // Sanitize examAttempts to guarantee that any attempt with score < 50 can NEVER be marked as passed
      if (merged.examAttempts) {
        for (const [eId, att] of Object.entries(merged.examAttempts)) {
          if (att && (typeof att.score !== "number" || att.score < 50)) {
            merged.examAttempts[eId] = { ...att, passed: false };
          }
        }
      }
      localStorage.setItem(storageKey, JSON.stringify(merged));
      return merged;
    } else {
      // Initialize remote user profile
      const initial = {
        ...cached,
        studentEmail: auth.currentUser.email || "",
        studentName: auth.currentUser.displayName || cached.studentName || "C++ Explorer",
      };
      await setDoc(docRef, initial, { merge: true });
      return initial;
    }
  } catch (err) {
    console.warn("Could not fetch remote Firestore progress, using local cache:", err);
    return cached;
  }
}

// Save Student Progress
export async function saveUserProgress(progress: UserProgress, userId?: string): Promise<void> {
  const uid = userId || auth.currentUser?.uid || progress.userId || "guest";
  const storageKey = getProgressKey(uid);

  try {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  } catch (e) {
    console.error("Failed to cache progress to localStorage", e);
  }

  if (!auth.currentUser || uid === "guest") return;

  try {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, progress, { merge: true });
  } catch (err) {
    console.warn("Could not save progress to Firestore:", err);
  }
}

// Save Exam Attempt and update UserProgress
export async function saveExamAttempt(attempt: ExamAttempt, userId?: string): Promise<UserProgress> {
  const uid = userId || auth.currentUser?.uid || "guest";
  const storageKey = getExamsKey(uid);

  // STRICT RULE: An attempt is ONLY passed if score >= 50 AND passed is true.
  // 20/100 or anything below 50 is strictly false!
  const isStrictlyPassed = Boolean(attempt.score >= 50 && attempt.passed);
  const normalizedAttempt: ExamAttempt = {
    ...attempt,
    passed: isStrictlyPassed
  };

  try {
    const raw = localStorage.getItem(storageKey);
    const existing: ExamAttempt[] = raw ? JSON.parse(raw) : [];
    existing.unshift(normalizedAttempt);
    localStorage.setItem(storageKey, JSON.stringify(existing));
  } catch (e) {
    console.error("Failed to save exam to localStorage", e);
  }

  // Update UserProgress with this normalized attempt so Roadmap and progression reflect it immediately
  const currentProgress = await loadUserProgress(uid);
  const updatedProgress: UserProgress = {
    ...currentProgress,
    examAttempts: {
      ...currentProgress.examAttempts,
      [attempt.examId]: {
        ...normalizedAttempt,
        score: normalizedAttempt.score,
        passed: isStrictlyPassed,
        timestamp: Date.now()
      }
    },
    lastActiveTimestamp: Date.now()
  };

  await saveUserProgress(updatedProgress, uid);

  if (auth.currentUser && uid !== "guest") {
    try {
      const attemptId = attempt.id || `attempt_${Date.now()}`;
      const docRef = doc(db, "users", uid, "exams", attemptId);
      await setDoc(docRef, { ...normalizedAttempt, id: attemptId });
    } catch (err) {
      console.warn("Failed to persist exam attempt to Firestore:", err);
    }
  }

  return updatedProgress;
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
    const q = query(colRef, orderBy("completedAt", "desc"));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const remoteExams: ExamAttempt[] = [];
      snap.forEach((d) => remoteExams.push(d.data() as ExamAttempt));
      localStorage.setItem(storageKey, JSON.stringify(remoteExams));
      return remoteExams;
    }
  } catch (err) {
    console.warn("Could not fetch exam history from Firestore:", err);
  }

  return localExams;
}

// Aliases for progressive learning interface
export const getUserProgress = loadUserProgress;

export async function saveQuizScore(
  userId: string,
  quizId: string,
  score: number,
  passed: boolean
): Promise<UserProgress> {
  const current = await loadUserProgress(userId);
  const updated: UserProgress = {
    ...current,
    quizScores: {
      ...current.quizScores,
      [quizId]: {
        score,
        passed,
        attempts: (current.quizScores?.[quizId]?.attempts || 0) + 1,
        timestamp: Date.now()
      }
    },
    unitQuizScores: {
      ...current.unitQuizScores,
      [quizId]: {
        score,
        passed,
        attempts: (current.unitQuizScores?.[quizId]?.attempts || 0) + 1,
        timestamp: new Date().toISOString()
      }
    },
    lastActiveDate: new Date().toISOString().split("T")[0],
    lastActiveTimestamp: Date.now()
  };

  await saveUserProgress(updated, userId);
  return updated;
}

// Reset Student Progress across local storage and Firestore
export async function resetUserProgress(userId?: string): Promise<UserProgress> {
  const uid = userId || auth.currentUser?.uid || "guest";
  const reset: UserProgress = {
    ...DEFAULT_PROGRESS,
    userId: uid,
    studentName: auth.currentUser?.displayName || "C++ Explorer",
    lastActiveTimestamp: Date.now(),
    lastActiveDate: new Date().toISOString().split("T")[0],
  };

  const storageKey = getProgressKey(uid);
  const examsKey = getExamsKey(uid);
  try {
    localStorage.setItem(storageKey, JSON.stringify(reset));
    localStorage.removeItem(examsKey);
  } catch (e) {
    console.error("Failed to reset localStorage progress", e);
  }

  if (auth.currentUser && uid !== "guest") {
    try {
      const docRef = doc(db, "users", uid);
      await setDoc(docRef, reset);
    } catch (err) {
      console.warn("Could not reset Firestore progress:", err);
    }
  }

  return reset;
}
