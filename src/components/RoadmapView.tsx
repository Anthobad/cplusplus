import React from "react";
import {
  Lock,
  CheckCircle2,
  Play,
  Award,
  Shield,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Flame,
  ChevronRight,
  RotateCcw,
  XCircle,
  AlertTriangle,
  Brain
} from "lucide-react";
import { Phase, Unit, UserProgress, Exam } from "../types";
import {
  ALL_PHASES,
  ALL_UNITS,
  calculateOverallProgress,
  isUnitUnlocked,
  checkExamPrerequisites,
  isExamPassed,
  getUnitLockReason,
  getPhaseGatingExam
} from "../data/curriculum";
import { CURRICULUM_EXAMS } from "../data/exams";

interface RoadmapViewProps {
  progress: UserProgress;
  onSelectUnit: (unitId: string) => void;
  onSelectExam: (examId: string) => void;
  onResetProgress: () => void;
  onNavigateReadiness?: () => void;
  onNavigateMockInterview?: () => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  progress,
  onSelectUnit,
  onSelectExam,
  onResetProgress,
  onNavigateReadiness,
  onNavigateMockInterview,
}) => {
  const stats = calculateOverallProgress(progress);

  // Find the current active/unlocked unit that hasn't been completed yet
  const currentActiveUnit = ALL_UNITS.find(u => !progress.completedUnitIds.includes(u.id)) || ALL_UNITS[0];
  const currentActiveUnitLock = currentActiveUnit ? getUnitLockReason(currentActiveUnit.id, progress) : { isLocked: false };

  // Map exam milestones after specific domains/phases
  const getExamAfterPhase = (phaseNumber: number): Exam | undefined => {
    if (phaseNumber === 1) return CURRICULUM_EXAMS.find(e => e.id === "exam-foundations");
    if (phaseNumber === 2) return CURRICULUM_EXAMS.find(e => e.id === "exam-stl");
    if (phaseNumber === 3) return CURRICULUM_EXAMS.find(e => e.id === "exam-systems");
    if (phaseNumber === 4) return CURRICULUM_EXAMS.find(e => e.id === "exam-final");
    return undefined;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Top Hero & Personalized Progress Tracker Dashboard */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 pt-10 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Headline & Welcome */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Zero to Job-Ready Production Curriculum</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                C++ Systems Engineering Roadmap
              </h1>
              <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-2xl leading-relaxed">
                Step-by-step 4-domain systems engineering & interview curriculum: from pointer arithmetic and memory layout to smart pointers, STL internals, lock-free concurrency, and senior technical interview readiness.
              </p>
            </div>

            {/* Quick Resume CTA */}
            {currentActiveUnit && (
              <div className="shrink-0 bg-slate-900/90 border border-blue-500/40 p-4 rounded-2xl shadow-xl flex flex-col gap-2 max-w-xs">
                {currentActiveUnitLock.isLocked && currentActiveUnitLock.reason === "milestone_exam" && currentActiveUnitLock.requiredExam ? (
                  <>
                    <span className="text-[11px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                      <Shield className="h-3 w-3" />
                      <span>Milestone Exam Required:</span>
                    </span>
                    <div className="font-semibold text-sm text-slate-100 line-clamp-1">
                      {currentActiveUnitLock.requiredExam.title}
                    </div>
                    <button
                      onClick={() => onSelectExam(currentActiveUnitLock.requiredExam!.id)}
                      className="w-full mt-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/25 transition-all"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      <span>Take Milestone Exam</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] uppercase font-bold text-blue-400 tracking-wider">
                      Current Next Step:
                    </span>
                    <div className="font-semibold text-sm text-slate-100 line-clamp-1">
                      Topic {currentActiveUnit.weekNumber}: {currentActiveUnit.title}
                    </div>
                    <button
                      onClick={() => onSelectUnit(currentActiveUnit.id)}
                      className="w-full mt-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Resume Curriculum</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Student Stats Metrics Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Metric 1: Overall Progress */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Curriculum Progress</span>
                <div className="flex items-center space-x-2">
                  {(stats.completedCount > 0 || stats.quizzesPassed > 0 || stats.examsPassed > 0) && (
                    <button
                      id="hero-reset-progress-btn"
                      type="button"
                      onClick={onResetProgress}
                      className="text-[10px] text-slate-500 hover:text-red-400 inline-flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-800"
                      title="Reset learning progress back to Topic 1"
                    >
                      <RotateCcw className="h-2.5 w-2.5" />
                      <span>Reset</span>
                    </button>
                  )}
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-white font-mono">{stats.percentage}%</div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {stats.completedCount} of {stats.totalUnits} Units Completed
                </div>
              </div>
            </div>

            {/* Metric 2: Section Quizzes */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Section Quizzes Passed</span>
                <Award className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {stats.quizzesPassed} / {stats.totalUnits}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Repeatable section assessments
                </p>
              </div>
            </div>

            {/* Metric 3: Milestone Exams */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Milestone Exams Passed</span>
                <Shield className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {stats.examsPassed} / {CURRICULUM_EXAMS.length}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Timed & Browser-locked (50/100 to pass)
                </p>
              </div>
            </div>

            {/* Metric 4: Academic Integrity & Cloud Storage */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Firebase Sync</span>
                <CheckCircle2 className="h-4 w-4 text-blue-400" />
              </div>
              <div className="mt-3">
                <div className="text-xs font-semibold text-slate-200">Real-time Cloud Sync</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Progress, exam logs, and quiz results securely stored in Firestore.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Access to Competency Matrix & Mock Interview Loop */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
              <span>
                Want to evaluate your interview strengths? Try our real-time competency matrix or practice in a live interview screen.
              </span>
            </div>
            <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto">
              {onNavigateReadiness && (
                <button
                  type="button"
                  onClick={onNavigateReadiness}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
                >
                  <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                  <span>Interview Readiness</span>
                </button>
              )}
              {onNavigateMockInterview && (
                <button
                  type="button"
                  onClick={onNavigateMockInterview}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md shadow-purple-500/20 transition-all"
                >
                  <Brain className="h-3.5 w-3.5" />
                  <span>Mock Interview Loop</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Roadmap Timeline Sections */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
        {ALL_PHASES.map(phase => {
          const examAfterThisPhase = getExamAfterPhase(phase.number);
          const phaseGatingExam = getPhaseGatingExam(phase.number);
          const isPhaseGatedByExam = phaseGatingExam && !isExamPassed(phaseGatingExam.id, progress);

          return (
            <div key={phase.id} className="space-y-6">
              {/* Phase Header Card */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                    <span>{phase.calendarMonth}</span>
                    <span>•</span>
                    <span>{phase.weeksRange}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                    {phase.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
                    {phase.description}
                  </p>
                </div>

                <div className="text-xs font-semibold text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-center">
                  {phase.weeks.length} Units
                </div>
              </div>

              {/* Gated Phase Banner when required Milestone Exam is not passed */}
              {isPhaseGatedByExam && (
                <div className="flex items-center justify-between bg-red-950/30 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-xs gap-3">
                  <div className="flex items-center space-x-2.5">
                    <Lock className="h-4 w-4 shrink-0 text-red-400" />
                    <span>
                      <strong className="font-semibold text-red-300">Phase Locked:</strong> You must score at least 50/100 on{" "}
                      <span className="font-medium text-white">{phaseGatingExam.title}</span> to unlock these units.
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectExam(phaseGatingExam.id)}
                    className="shrink-0 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors shadow-md shadow-red-600/20"
                  >
                    Take Exam
                  </button>
                </div>
              )}

              {/* Weeks Grid in Phase */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {phase.weeks.map(unit => {
                  const unlocked = isUnitUnlocked(unit.id, progress);
                  const lockReason = getUnitLockReason(unit.id, progress);
                  const completed = progress.completedUnitIds.includes(unit.id);
                  const isCurrent = unit.id === currentActiveUnit?.id;
                  const quiz = progress.quizScores[unit.quiz.id];

                  return (
                    <div
                      key={unit.id}
                      className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        completed
                          ? "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                          : isCurrent
                          ? "bg-slate-900 border-blue-500/60 shadow-lg shadow-blue-500/10"
                          : unlocked
                          ? "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                          : "bg-slate-950/40 border-slate-900 opacity-60"
                      }`}
                    >
                      <div>
                        {/* Week Status Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-bold text-blue-400">
                              Topic {unit.weekNumber}
                            </span>
                            {completed && (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.2 rounded-full">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Completed</span>
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.2 rounded-full">
                                Up Next
                              </span>
                            )}
                          </div>

                          {!unlocked && (
                            <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                              <Lock className="h-3 w-3" />
                              <span>{lockReason.reason === "milestone_exam" ? "Exam Gated" : "Step-by-step lock"}</span>
                            </div>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-white leading-snug">
                          {unit.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {unit.subtitle}
                        </p>

                        {/* Topics tags */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {unit.topics.slice(0, 3).map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action Button & Quiz score */}
                      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <div className="text-[11px] text-slate-400">
                          {quiz?.passed ? (
                            <span className="text-emerald-400 font-semibold">Quiz: {quiz.score}%</span>
                          ) : quiz ? (
                            <span className="text-amber-400 font-semibold">Quiz retry needed ({quiz.score}%)</span>
                          ) : (
                            <span>Section quiz pending</span>
                          )}
                        </div>

                        {unlocked ? (
                          <button
                            onClick={() => onSelectUnit(unit.id)}
                            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              completed
                                ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                                : isCurrent
                                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                            }`}
                          >
                            <span>{completed ? "Review" : "Start Topic"}</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        ) : lockReason.reason === "milestone_exam" && lockReason.requiredExam ? (
                          <button
                            onClick={() => onSelectExam(lockReason.requiredExam!.id)}
                            className="flex items-center space-x-1.5 text-xs text-red-400 hover:text-red-300 font-semibold transition-colors"
                            title={`Score at least 50/100 on ${lockReason.requiredExam.title} to unlock this unit.`}
                          >
                            <Lock className="h-3.5 w-3.5 text-red-400" />
                            <span>Pass Exam to Unlock</span>
                          </button>
                        ) : (
                          <div className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-not-allowed">
                            <Lock className="h-3.5 w-3.5" />
                            <span>Complete Topic {lockReason.requiredUnit?.weekNumber || (unit.weekNumber - 1)} to Unlock</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Milestone Exam Section between phases */}
              {examAfterThisPhase && (() => {
                const examStatus = checkExamPrerequisites(examAfterThisPhase, progress);
                const isExamUnlocked = examStatus.isUnlocked;
                const examAttempt = progress.examAttempts?.[examAfterThisPhase.id];
                const isPassed = Boolean(examAttempt && examAttempt.passed && examAttempt.score >= (examAfterThisPhase.passingScore || 50));
                const hasFailedAttempt = Boolean(examAttempt && (!examAttempt.passed || examAttempt.score < (examAfterThisPhase.passingScore || 50)));

                return (
                  <div 
                    id={`exam-card-${examAfterThisPhase.id}`}
                    className={`mt-8 p-6 rounded-2xl transition-all ${
                      isPassed
                        ? "bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl"
                        : hasFailedAttempt
                        ? "bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-950 border border-red-500/40 shadow-xl"
                        : isExamUnlocked
                        ? "bg-gradient-to-r from-blue-950/30 via-slate-900 to-slate-950 border border-blue-500/30 shadow-xl"
                        : "bg-slate-900/50 border border-slate-800/90 shadow-md opacity-95"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      <div className="flex items-start space-x-3.5">
                        <div 
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                            isPassed
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : hasFailedAttempt
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : isExamUnlocked
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              : "bg-slate-800/80 text-slate-400 border-slate-700/60"
                          }`}
                        >
                          {isPassed ? (
                            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                          ) : hasFailedAttempt ? (
                            <XCircle className="h-6 w-6 text-red-400" />
                          ) : isExamUnlocked ? (
                            <Shield className="h-6 w-6" />
                          ) : (
                            <Lock className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span 
                              className={`text-xs font-bold uppercase tracking-wider ${
                                isPassed
                                  ? "text-emerald-400"
                                  : hasFailedAttempt
                                  ? "text-red-400"
                                  : isExamUnlocked
                                  ? "text-blue-400"
                                  : "text-slate-400"
                              }`}
                            >
                              {isPassed
                                ? "Milestone Exam Passed"
                                : hasFailedAttempt
                                ? "Milestone Exam Failed"
                                : isExamUnlocked
                                ? "Proctored Milestone Examination"
                                : "Locked Milestone Examination"}
                            </span>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                              {examAfterThisPhase.durationMinutes} Mins
                            </span>
                            {isPassed ? (
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded font-medium border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                <span>Passed ({examAttempt.score}/100)</span>
                              </span>
                            ) : hasFailedAttempt ? (
                              <span className="text-[10px] bg-red-500/15 text-red-300 px-2 py-0.5 rounded font-medium border border-red-500/30 flex items-center gap-1">
                                <XCircle className="h-2.5 w-2.5" />
                                <span>Failed ({examAttempt.score}/100 - Score ≥ 50 Required)</span>
                              </span>
                            ) : !isExamUnlocked ? (
                              <span className="text-[10px] bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded font-medium border border-amber-500/30 flex items-center gap-1">
                                <Lock className="h-2.5 w-2.5" />
                                <span>{examStatus.completedCount} / {examStatus.totalRequired} Units Completed</span>
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded font-medium border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                <span>Prerequisites Satisfied</span>
                              </span>
                            )}
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                            {examAfterThisPhase.title}
                          </h3>
                          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                            {examAfterThisPhase.description}
                          </p>

                          {/* Prerequisites explanation bar when locked */}
                          {!isExamUnlocked && (
                            <div className="pt-2">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 text-slate-400 mb-1.5">
                                <span className="text-amber-400/90 font-medium">
                                  Required: Complete all {examStatus.totalRequired} prerequisite units ({examAfterThisPhase.coversPhases.length === 1 ? `Phase ${examAfterThisPhase.coversPhases[0]}` : `Phases ${examAfterThisPhase.coversPhases.join(', ')}`})
                                </span>
                                <span className="font-mono text-[11px] text-slate-400">
                                  {Math.round((examStatus.completedCount / examStatus.totalRequired) * 100)}% Ready
                                </span>
                              </div>
                              <div className="w-full max-w-md bg-slate-800/90 h-1.5 rounded-full overflow-hidden border border-slate-700/40">
                                <div 
                                  className="bg-amber-400 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.round((examStatus.completedCount / examStatus.totalRequired) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 pt-1">
                            <span className="text-indigo-400 font-medium flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                              Randomized Question Pool
                            </span>
                            <span>•</span>
                            <span>100 Points Total</span>
                            <span>•</span>
                            <span className="text-amber-400 font-semibold">50 / 100 to pass</span>
                            <span>•</span>
                            <span>Browser Lock Enabled</span>
                            <span>•</span>
                            <span>
                              C++ Library:{" "}
                              {examAfterThisPhase.allowCppReference ? "Allowed" : "Prohibited"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="shrink-0 flex flex-col items-start lg:items-end gap-2">
                        {isExamUnlocked ? (
                          isPassed ? (
                            <div className="text-right">
                              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Passed ({examAttempt.score}/100)</span>
                              </div>
                              <button
                                id={`retake-exam-${examAfterThisPhase.id}-btn`}
                                type="button"
                                onClick={() => onSelectExam(examAfterThisPhase.id)}
                                className="mt-1 text-[11px] text-slate-400 hover:text-white underline"
                              >
                                Retake Exam
                              </button>
                            </div>
                          ) : hasFailedAttempt ? (
                            <div className="flex flex-col items-start lg:items-end gap-1.5">
                              <div className="text-xs font-bold text-red-400 flex items-center gap-1 justify-end">
                                <XCircle className="h-4 w-4" />
                                <span>Exam Failed ({examAttempt.score}/100)</span>
                              </div>
                              <span className="text-[10px] text-red-300/80">
                                Minimum 50/100 required to unlock Phase {phase.number + 1}
                              </span>
                              <button
                                id={`retake-exam-${examAfterThisPhase.id}-btn`}
                                type="button"
                                onClick={() => onSelectExam(examAfterThisPhase.id)}
                                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 transition-all flex items-center space-x-2"
                              >
                                <RotateCcw className="h-4 w-4" />
                                <span>Retake Exam ({examAttempt.score}/100)</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`start-exam-${examAfterThisPhase.id}-btn`}
                              type="button"
                              onClick={() => onSelectExam(examAfterThisPhase.id)}
                              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 transition-all flex items-center space-x-2"
                            >
                              <Shield className="h-4 w-4" />
                              <span>Enter Examination Room</span>
                            </button>
                          )
                        ) : (
                          <div className="flex flex-col items-start lg:items-end gap-1.5">
                            <button
                              id={`locked-exam-${examAfterThisPhase.id}-btn`}
                              type="button"
                              disabled
                              className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-800/80 text-slate-400 border border-slate-700/60 cursor-not-allowed flex items-center space-x-2 select-none opacity-80"
                              title={`Complete all ${examStatus.totalRequired} prerequisite units to unlock this examination.`}
                            >
                              <Lock className="h-3.5 w-3.5 text-slate-400" />
                              <span>Locked ({examStatus.completedCount}/{examStatus.totalRequired} Units)</span>
                            </button>
                            {examStatus.firstMissingUnit && (
                              <button
                                type="button"
                                onClick={() => onSelectUnit(examStatus.firstMissingUnit!.id)}
                                className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 transition-colors"
                              >
                                <span>Continue Topic {examStatus.firstMissingUnit.weekNumber}</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}

        {/* Course Progress Management Footer */}
        <div className="pt-10 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center justify-center sm:justify-start gap-1.5">
              <RotateCcw className="h-4 w-4 text-slate-400" />
              <span>Learning Progress Management</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Need a fresh start? Reset your curriculum checklist, quiz results, and exam attempts back to Topic 1.
            </p>
          </div>
          <button
            id="footer-reset-progress-btn"
            type="button"
            onClick={onResetProgress}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-red-300 bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/40 transition-all shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400 group-hover:text-red-400" />
            <span>Reset Learning Progress</span>
          </button>
        </div>
      </section>
    </div>
  );
};
