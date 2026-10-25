import React from "react";
import {
  BookOpen,
  Brain,
  Terminal,
  Shield,
  CheckCircle2,
  LogIn,
  LogOut,
  TrendingUp,
  Map,
  ShieldAlert
} from "lucide-react";
import { UserProgress } from "../types";
import { calculateOverallProgress } from "../data/curriculumSummary";
import { type User } from "firebase/auth";
import { useAssessment } from "../lib/AssessmentContext";

interface NavbarProps {
  currentView: "roadmap" | "unit" | "exam" | "mock-interview" | "readiness" | "interview-practice";
  progress: UserProgress;
  currentUser: User | null;
  onNavigateHome: () => void;
  onNavigateReadiness: () => void;
  onNavigateMockInterview: () => void;
  onOpenDocs: () => void;
  onToggleAiChat: () => void;
  onOpenAuth: () => void;
  onSignOut?: () => void;
  isAiChatOpen: boolean;
  isInExamOrQuiz?: boolean;
  activeExamTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  progress,
  currentUser,
  onNavigateHome,
  onNavigateReadiness,
  onNavigateMockInterview,
  onOpenDocs,
  onToggleAiChat,
  onOpenAuth,
  onSignOut,
  isAiChatOpen,
  activeExamTitle,
}) => {
  const stats = calculateOverallProgress(progress);
  const isRegistered = currentUser && !currentUser.isAnonymous;
  const { assessmentMode, isAssessmentActive, canUseAiMentor, assessmentTitle } = useAssessment();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Brand & Main Views */}
        <div className="flex items-center space-x-4">
          <button
            id="nav-home-btn"
            onClick={onNavigateHome}
            className="flex items-center space-x-2.5 text-left group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 group-hover:border-blue-400 transition-colors">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-slate-100 text-sm sm:text-base tracking-tight flex items-center gap-1.5">
                C++ Systems Mastery
                <span className="text-[10px] uppercase font-semibold tracking-wider bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 hidden xs:inline-block">
                  Job Ready
                </span>
              </span>
              <p className="text-xs text-slate-400 hidden md:block">
                10-Phase Systems Engineering & Interview Roadmap
              </p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 pl-3 border-l border-slate-800 text-xs">
            <button
              onClick={onNavigateHome}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                currentView === "roadmap" || currentView === "unit"
                  ? "bg-slate-900 text-blue-400 border border-slate-800"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Map className="h-3.5 w-3.5" />
              <span>Roadmap</span>
            </button>
            <button
              onClick={onNavigateReadiness}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                currentView === "readiness"
                  ? "bg-slate-900 text-blue-400 border border-slate-800"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Readiness</span>
            </button>
            <button
              onClick={onNavigateMockInterview}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                currentView === "mock-interview"
                  ? "bg-slate-900 text-purple-400 border border-slate-800"
                  : "text-slate-400 hover:text-purple-300"
              }`}
            >
              <Brain className="h-3.5 w-3.5" />
              <span>Mock Interview</span>
            </button>
          </nav>
        </div>

        {/* Center Assessment Status or Progress */}
        {isAssessmentActive ? (
          <div className="flex items-center space-x-2 bg-purple-950/40 text-purple-300 px-3 py-1 rounded-full border border-purple-500/40 text-xs font-semibold animate-pulse">
            <ShieldAlert className="h-3.5 w-3.5 text-purple-400" />
            <span>
              {assessmentMode === "exam"
                ? `EXAM: ${assessmentTitle || activeExamTitle || "Timed Examination"}`
                : assessmentMode === "quiz"
                ? `QUIZ: ${assessmentTitle || "Knowledge Check"}`
                : assessmentMode === "coding-assessment"
                ? `ASSESSMENT: ${assessmentTitle || "Verified Coding"}`
                : `MOCK INTERVIEW: ${assessmentTitle || "In Progress"}`}
            </span>
          </div>
        ) : (
          <div className="hidden xl:flex items-center space-x-3.5 bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-800 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{stats.completedCount} / {stats.totalUnits} Units</span>
            </div>
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
            <span className="font-semibold text-blue-400">{stats.percentage}%</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* C++ Docs Reference Button */}
          <button
            id="open-cpp-docs-btn"
            onClick={onOpenDocs}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors shadow-sm"
            title="Search C++ Standard Library reference (Containers, Smart Pointers, Algorithms, Concurrency)"
          >
            <BookOpen className="h-4 w-4 text-blue-400" />
            <span className="hidden sm:inline">C++ Library</span>
          </button>

          {/* AI Mentor Chat Button */}
          <button
            id="toggle-ai-chat-btn"
            onClick={onToggleAiChat}
            disabled={!canUseAiMentor}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-sm ${
              !canUseAiMentor
                ? "opacity-40 cursor-not-allowed bg-slate-900 text-slate-500 border border-slate-800"
                : isAiChatOpen
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                : "bg-purple-600/10 text-purple-300 hover:bg-purple-600/20 border border-purple-500/30"
            }`}
            title={
              !canUseAiMentor
                ? `AI Mentor is locked during active assessments (${assessmentMode})`
                : "Ask AI C++ Systems Mentor"
            }
          >
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">
              {!canUseAiMentor ? "AI Locked" : "AI Mentor"}
            </span>
          </button>

          {/* Authentication & User Account Button */}
          <div className="flex items-center space-x-1.5">
            <button
              id="nav-auth-btn"
              onClick={onOpenAuth}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                isRegistered
                  ? "bg-emerald-600/15 hover:bg-emerald-600/25 border-emerald-500/40 text-emerald-300"
                  : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-white"
              }`}
              title={isRegistered ? `Signed in as ${currentUser?.email || currentUser?.displayName}. Click to manage profile.` : "Sign In or Sign Up"}
            >
              {isRegistered ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                    {currentUser?.displayName?.[0] || currentUser?.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden md:inline font-mono truncate max-w-[120px]">
                    {currentUser?.displayName || currentUser?.email?.split("@")[0]}
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 text-blue-400" />
                  <span className="inline">Sign In</span>
                </>
              )}
            </button>

            {isRegistered && onSignOut && (
              <button
                id="nav-signout-quick-btn"
                onClick={onSignOut}
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-slate-800 transition-colors"
                title="Sign Out of Account"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
