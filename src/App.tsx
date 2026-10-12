import React, { useState, useEffect } from "react";
import { UserProgress, Unit, Exam, MockInterviewReport } from "./types";
import { ALL_UNITS, getUnitById, checkExamPrerequisites, getUnitLockReason } from "./data/curriculum";
import { CURRICULUM_EXAMS } from "./data/exams";
import { 
  getUserProgress, 
  saveUserProgress, 
  saveQuizScore, 
  resetUserProgress,
  DEFAULT_PROGRESS,
  getCleanGuestProgress,
  subscribeToAuth,
  initializeUserAuth,
  logOut
} from "./lib/firebase";
import { Navbar } from "./components/Navbar";
import { RoadmapView } from "./components/RoadmapView";
import { UnitView } from "./components/UnitView";
import { ExamView } from "./components/ExamView";
import { MockInterviewView } from "./components/MockInterviewView";
import { ReadinessDashboard } from "./components/ReadinessDashboard";
import { CppDocsModal } from "./components/CppDocsModal";
import { AiMentorDrawer } from "./components/AiMentorDrawer";
import { AuthModal } from "./components/AuthModal";
import { ResetProgressModal } from "./components/ResetProgressModal";
import { CheckCircle2, Lock, Shield } from "lucide-react";
import { type User } from "firebase/auth";
import { AssessmentProvider, useAssessment } from "./lib/AssessmentContext";

function AppContent() {
  // Navigation views
  const [currentView, setCurrentView] = useState<"roadmap" | "unit" | "exam" | "mock-interview" | "readiness">("roadmap");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("topic-1");
  const [selectedExamId, setSelectedExamId] = useState<string>("exam-foundations");

  // Modals & Drawers
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Student progress state - default to guest mode to ensure signed-out state is cleanly reflected
  const [userId, setUserId] = useState<string>("guest");
  const [progress, setProgress] = useState<UserProgress>(getCleanGuestProgress());

  // Assessment Context
  const { assessmentMode, canUseAiMentor, isAssessmentActive } = useAssessment();

  // Subscribe to Firebase Auth changes
  useEffect(() => {
    initializeUserAuth();

    const unsubscribe = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user && !user.isAnonymous) {
        setUserId(user.uid);
        localStorage.setItem("cpp_student_user_id", user.uid);
        try {
          const userProg = await getUserProgress(user.uid);
          if (userProg) {
            setProgress(userProg);
          }
        } catch (e) {
          console.warn("Could not load user progress:", e);
        }
      } else {
        setUserId("guest");
        localStorage.removeItem("cpp_student_user_id");
        try {
          const guestProg = await getUserProgress("guest");
          setProgress(guestProg);
        } catch (e) {
          console.warn("Could not load guest progress:", e);
          setProgress(getCleanGuestProgress());
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Load progress when userId changes
  useEffect(() => {
    async function loadProgress() {
      try {
        const cloudProgress = await getUserProgress(userId);
        if (cloudProgress) {
          setProgress(cloudProgress);
        }
      } catch (err) {
        console.warn("Using offline progress:", err);
      }
    }
    loadProgress();
  }, [userId]);

  // Safety check: if in guest mode and currently viewed unit is locked, return to roadmap
  useEffect(() => {
    if (userId === "guest" && currentView === "unit") {
      const lock = getUnitLockReason(selectedUnitId, progress);
      if (lock.isLocked) {
        setCurrentView("roadmap");
        setSelectedUnitId("topic-1");
      }
    }
  }, [userId, progress, currentView, selectedUnitId]);

  const activeUnit = getUnitById(selectedUnitId) || ALL_UNITS[0];
  const activeExam = CURRICULUM_EXAMS.find(e => e.id === selectedExamId) || CURRICULUM_EXAMS[0];

  // Automatically close AI chat if entering an assessment
  useEffect(() => {
    if (!canUseAiMentor && isAiChatOpen) {
      setIsAiChatOpen(false);
    }
  }, [canUseAiMentor, isAiChatOpen]);

  // Handlers for progression with strict exam gating enforcement
  const handleSelectUnit = (unitId: string) => {
    const lock = getUnitLockReason(unitId, progress);
    if (lock.isLocked) {
      if (lock.reason === "milestone_exam" && lock.requiredExam) {
        const unit = getUnitById(unitId);
        setToastMessage(
          `Milestone Exam Required: You must pass ${lock.requiredExam.title} (min score ${lock.requiredExam.minScore}%) to unlock Topic ${unit?.weekNumber || unitId}.`
        );
        setTimeout(() => setToastMessage(null), 5000);
        handleSelectExam(lock.requiredExam.id);
        return;
      }
      if (lock.reason === "prev_unit" && lock.requiredUnit) {
        setToastMessage(
          `Topic Locked: Please complete Topic ${lock.requiredUnit.weekNumber} (${lock.requiredUnit.title}) first.`
        );
        setTimeout(() => setToastMessage(null), 4000);
        return;
      }
      setToastMessage("This unit is currently locked. Complete prerequisite units and exams first.");
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    setSelectedUnitId(unitId);
    setCurrentView("unit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectExam = (examId: string) => {
    const exam = CURRICULUM_EXAMS.find(e => e.id === examId);
    if (exam) {
      const prereq = checkExamPrerequisites(exam, progress);
      if (!prereq.isUnlocked) {
        setToastMessage(
          `Exam Locked: Please complete all ${prereq.totalRequired} prerequisite units first (${prereq.completedCount}/${prereq.totalRequired} completed).`
        );
        setTimeout(() => setToastMessage(null), 4000);
        return;
      }
    }
    setSelectedExamId(examId);
    setCurrentView("exam");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCompleteUnit = async (unitId: string) => {
    if (!progress.completedUnitIds.includes(unitId)) {
      const updatedCompleted = [...progress.completedUnitIds, unitId];
      const nextUnitIndex = ALL_UNITS.findIndex(u => u.id === unitId) + 1;
      const nextWeekNum = nextUnitIndex < ALL_UNITS.length
        ? ALL_UNITS[nextUnitIndex].weekNumber
        : (ALL_UNITS[ALL_UNITS.length - 1]?.weekNumber || 39);

      const updatedProgress: UserProgress = {
        ...progress,
        completedUnitIds: updatedCompleted,
        currentWeekNumber: nextWeekNum,
        lastActiveTimestamp: Date.now()
      };

      setProgress(updatedProgress);
      await saveUserProgress(updatedProgress, userId);
    }
  };

  const handleSaveQuizScore = async (quizId: string, score: number, passed: boolean) => {
    const updatedProgress = await saveQuizScore(userId, quizId, score, passed);
    setProgress(updatedProgress);
  };

  const handleSaveCodingResult = async (
    challengeId: string,
    result: { passed: boolean; score: number; verified: boolean; wasAssisted: boolean }
  ) => {
    const currentResults = progress.codingChallengeResults || {};
    const updatedResults = {
      ...currentResults,
      [challengeId]: {
        passed: result.passed,
        score: result.score,
        testsPassed: result.passed ? 1 : 0,
        totalTests: 1,
        timestamp: Date.now(),
        verified: result.verified,
        wasAssisted: result.wasAssisted,
      },
    };

    const verifiedPassed = result.verified && result.passed
      ? Array.from(new Set([...(progress.verifiedCodingPassed || []), challengeId]))
      : (progress.verifiedCodingPassed || []);

    const updatedProgress: UserProgress = {
      ...progress,
      codingChallengeResults: updatedResults,
      verifiedCodingPassed: verifiedPassed,
      totalCodingChallengesSolved: Object.values(updatedResults).filter((r: any) => r.passed).length,
      lastActiveTimestamp: Date.now(),
    };

    setProgress(updatedProgress);
    await saveUserProgress(updatedProgress, userId);
  };

  const handleSaveMockReport = async (report: MockInterviewReport) => {
    const currentReports = progress.mockInterviewReports || [];
    const updatedProgress: UserProgress = {
      ...progress,
      mockInterviewReports: [report, ...currentReports],
      lastActiveTimestamp: Date.now(),
    };
    setProgress(updatedProgress);
    await saveUserProgress(updatedProgress, userId);
    setToastMessage("Interview report saved successfully to your cloud profile.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenResetModal = () => {
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = async () => {
    const reset = await resetUserProgress(userId);
    setProgress(reset);
    setToastMessage("All learning progress, quizzes, and exams have been reset back to Topic 1.");
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setCurrentUser(null);
      setUserId("guest");
      localStorage.removeItem("cpp_student_user_id");

      const guestProg = await getUserProgress("guest");
      setProgress(guestProg);

      setCurrentView("roadmap");
      setSelectedUnitId("week-1");
      setIsAiChatOpen(false);
      setIsAuthOpen(false);

      setToastMessage("Signed out successfully. Switched to guest mode.");
      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    } catch (err: any) {
      console.error("Sign out error:", err);
      setToastMessage(err.message || "Failed to sign out.");
      setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    }
  };

  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    if (!user.isAnonymous) {
      setUserId(user.uid);
      localStorage.setItem("cpp_student_user_id", user.uid);
      try {
        const userProg = await getUserProgress(user.uid);
        if (userProg) {
          setProgress(userProg);
        }
        setToastMessage(`Welcome, ${user.displayName || user.email?.split("@")[0] || "Developer"}! Progress synced.`);
        setTimeout(() => setToastMessage(null), 4000);
      } catch (e) {
        console.warn("Could not load user progress upon login:", e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          id="global-status-toast"
          role="status"
          className="fixed top-18 right-4 z-50 p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-xs text-emerald-200 shadow-2xl flex items-center space-x-2.5 backdrop-blur-md animate-in slide-in-from-top-2 duration-200"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        progress={progress}
        currentUser={currentUser}
        onNavigateHome={() => setCurrentView("roadmap")}
        onNavigateReadiness={() => setCurrentView("readiness")}
        onNavigateMockInterview={() => setCurrentView("mock-interview")}
        onOpenDocs={() => setIsDocsOpen(true)}
        onToggleAiChat={() => setIsAiChatOpen(!isAiChatOpen)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
        isAiChatOpen={isAiChatOpen}
        activeExamTitle={activeExam.title}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === "roadmap" && (
          <RoadmapView
            progress={progress}
            onSelectUnit={handleSelectUnit}
            onSelectExam={handleSelectExam}
            onResetProgress={handleOpenResetModal}
            onNavigateReadiness={() => setCurrentView("readiness")}
            onNavigateMockInterview={() => setCurrentView("mock-interview")}
          />
        )}

        {currentView === "unit" && activeUnit && (
          <UnitView
            unit={activeUnit}
            progress={progress}
            onBackToRoadmap={() => setCurrentView("roadmap")}
            onSelectUnit={handleSelectUnit}
            onSelectExam={handleSelectExam}
            onCompleteUnit={handleCompleteUnit}
            onSaveQuizScore={handleSaveQuizScore}
            onSaveCodingResult={handleSaveCodingResult}
            onOpenAiWithContext={() => setIsAiChatOpen(true)}
            onOpenDocs={() => setIsDocsOpen(true)}
          />
        )}

        {currentView === "exam" && activeExam && (
          <ExamView
            exam={activeExam}
            userId={userId}
            progress={progress}
            onSelectUnit={handleSelectUnit}
            onExitExam={() => setCurrentView("roadmap")}
            onOpenDocs={() => setIsDocsOpen(true)}
            onExamAttemptSaved={(updated) => setProgress(updated)}
          />
        )}

        {currentView === "mock-interview" && (
          <MockInterviewView
            progress={progress}
            onNavigateHome={() => setCurrentView("roadmap")}
            onSelectUnit={handleSelectUnit}
            onSaveReport={handleSaveMockReport}
          />
        )}

        {currentView === "readiness" && (
          <ReadinessDashboard
            progress={progress}
            onSelectUnit={handleSelectUnit}
            onStartMockInterview={() => setCurrentView("mock-interview")}
          />
        )}
      </main>

      {/* C++ Standard Library Reference Modal (30+ comprehensive entries) */}
      <CppDocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

      {/* Gemini AI Systems Mentor Drawer */}
      <AiMentorDrawer
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        currentUnit={currentView === "unit" ? activeUnit : null}
      />

      {/* Authentication & Account Sync Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={handleAuthSuccess}
        onSignOut={handleSignOut}
      />

      {/* Reset Progress Confirmation Modal */}
      <ResetProgressModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleConfirmReset}
        progress={progress}
      />
    </div>
  );
}

export default function App() {
  return (
    <AssessmentProvider>
      <AppContent />
    </AssessmentProvider>
  );
}
