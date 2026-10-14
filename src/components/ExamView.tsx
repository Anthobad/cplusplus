import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Clock,
  AlertTriangle,
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Lock,
  Shuffle,
  Layers,
  HelpCircle
} from "lucide-react";
import confetti from "canvas-confetti";
import { Exam, ExamAttempt, UserProgress, CodeEvaluationResult } from "../types";
import { gradeExam } from '../lib/examGrading';
import { saveExamAttempt } from "../lib/firebase";
import { checkExamPrerequisites, getFirstUnitAfterExam } from "../data/curriculum";
import { generateRandomizedExam, getExamPoolStatistics } from "../data/examQuestionPools";
import { useAssessment } from "../lib/AssessmentContext";

interface ExamViewProps {
  exam: Exam;
  userId: string;
  onExitExam: () => void;
  onOpenDocs: () => void;
  progress?: UserProgress;
  onSelectUnit?: (unitId: string) => void;
  onExamAttemptSaved?: (updatedProgress: UserProgress) => void;
}

export const ExamView: React.FC<ExamViewProps> = ({
  exam,
  userId,
  onExitExam,
  onOpenDocs,
  progress,
  onSelectUnit,
  onExamAttemptSaved
}) => {
  // Prerequisite check
  const prereqStatus = progress ? checkExamPrerequisites(exam, progress) : { isUnlocked: true, totalRequired: 0, completedCount: 0, missingUnits: [], firstMissingUnit: undefined };
  const isPrereqLocked = !prereqStatus.isUnlocked;

  // Active randomized exam state
  const [activeExam, setActiveExam] = useState<Exam>(() => generateRandomizedExam(exam));
  const submissionVersion = useRef(0);
  const poolStats = getExamPoolStatistics(exam.id);
  const { setAssessmentMode, setAssessmentTitle } = useAssessment();

  // Sync if parent exam changes
  useEffect(() => {
    submissionVersion.current++;
    setActiveExam(generateRandomizedExam(exam));
    setAnswers({});
    setCodingResults({});
    setCodingPoints({});
    setSubmissionError(null);
    setExamSubmitted(false);
    setIsPassed(false);
    setExamScore(0);
    setSecondsRemaining(exam.durationMinutes * 60);
    submittingRef.current = false;
    setIsSubmitting(false);
    return () => { submissionVersion.current++; };
  }, [exam.id]);

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState(exam.durationMinutes * 60);
  const timeExpired = secondsRemaining === 0;
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isPrereqLocked && !examSubmitted) {
      setAssessmentMode("exam");
      setAssessmentTitle(exam.title);
    } else {
      setAssessmentMode("none");
      setAssessmentTitle(undefined);
    }

    return () => {
      setAssessmentMode("none");
      setAssessmentTitle(undefined);
    };
  }, [isPrereqLocked, examSubmitted, exam.title, setAssessmentMode, setAssessmentTitle]);

  // Tab switch / blur detection ("browser lock")
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showBlurWarning, setShowBlurWarning] = useState(false);

  // Answers state
  const [answers, setAnswers] = useState<{ [qId: string]: any }>({});
  const [examScore, setExamScore] = useState(0);
  const [isPassed, setIsPassed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const submitLatest = useRef<() => Promise<void>>(async () => {});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [codingResults, setCodingResults] = useState<Record<string, CodeEvaluationResult>>({});
  const [codingPoints, setCodingPoints] = useState<Record<string, number>>({});
  const [poolShuffledNotice, setPoolShuffledNotice] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    if (examSubmitted || isPrereqLocked || timeExpired) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [examSubmitted, isPrereqLocked, exam.id, timeExpired]);

  useEffect(() => {
    if (secondsRemaining === 0 && !examSubmitted && !isPrereqLocked) void submitLatest.current();
  }, [secondsRemaining, examSubmitted, isPrereqLocked]);

  // Tab switch and blur monitoring ("Browser Lock")
  useEffect(() => {
    if (examSubmitted || isPrereqLocked) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1);
        setShowBlurWarning(true);
      }
    };

    const handleWindowBlur = () => {
      setTabSwitches(prev => prev + 1);
      setShowBlurWarning(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [examSubmitted, isPrereqLocked]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleShufflePool = () => {
    if (examSubmitted || submittingRef.current || timeExpired) return;
    const freshExam = generateRandomizedExam(exam);
    setActiveExam(freshExam);
    setAnswers({});
    setSubmissionError(null);
    setPoolShuffledNotice(true);
    setTimeout(() => setPoolShuffledNotice(false), 3000);
  };

  const handleAnswerChange = (questionId: string, val: any) => {
    if (examSubmitted || submittingRef.current || timeExpired) return;
    setAnswers(prev => ({ ...prev, [questionId]: val }));
  };

  const handleSubmitExam = async () => {
    if (examSubmitted || isPrereqLocked || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmissionError(null);
    const submittedAnswers = { ...answers };
    const version = submissionVersion.current;
    let graded: Awaited<ReturnType<typeof gradeExam>>;
    try {
      graded = await gradeExam(activeExam, submittedAnswers);
    } catch (error) {
      if (version !== submissionVersion.current) return;
      setSubmissionError(error instanceof Error ? error.message : 'Evaluation failed. Your answers have been retained; retry submission.');
      submittingRef.current = false;
      setIsSubmitting(false);
      return;
    }
    if (version !== submissionVersion.current) return;
    const { score: scaledScore, passed } = graded;
    setCodingResults(graded.codingResults);
    setCodingPoints(graded.codingPoints);

    setExamScore(scaledScore);
    setIsPassed(passed);
    setExamSubmitted(true);

    if (passed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Save to Firebase database and update progress
    const attempt: ExamAttempt = {
      examId: activeExam.id,
      examTitle: activeExam.title,
      score: scaledScore,
      passed: passed,
      timestamp: Date.now(),
      tabSwitchWarnings: tabSwitches,
      answers: submittedAnswers,
      generatedQuestions: activeExam.questions,
      codingResults: graded.codingResults,
    };

    try {
      const updated = await saveExamAttempt(attempt, userId);
      if (onExamAttemptSaved) {
        onExamAttemptSaved(updated);
      }
    } catch (e) {
      console.warn("Could not persist exam attempt to Firebase:", e);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };
  submitLatest.current = handleSubmitExam;

  const handleRetakeExam = () => {
    if (submittingRef.current) return;
    // Generate fresh randomized questions from pool for retake!
    const freshExam = generateRandomizedExam(exam);
    setActiveExam(freshExam);
    setExamSubmitted(false);
    setIsPassed(false);
    setExamScore(0);
    setAnswers({});
    setCodingResults({});
    setCodingPoints({});
    setSubmissionError(null);
    setSecondsRemaining(activeExam.durationMinutes * 60);
    setTabSwitches(0);
    setShowBlurWarning(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (isPrereqLocked) {
    return (
      <div 
        id="locked-exam-gate-screen"
        className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6"
      >
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="h-8 w-8" />
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              Prerequisites Incomplete
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-3">
              Examination Locked
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              To preserve academic rigor, this proctored milestone exam requires completing all {prereqStatus.totalRequired} prerequisite units across {exam.coversPhases.length === 1 ? `Phase ${exam.coversPhases[0]}` : `Phases ${exam.coversPhases.join(", ")}`}.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Prerequisite Progress:</span>
              <span className="font-mono text-amber-400 font-bold">
                {prereqStatus.completedCount} / {prereqStatus.totalRequired} Units ({Math.round((prereqStatus.completedCount / prereqStatus.totalRequired) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.round((prereqStatus.completedCount / prereqStatus.totalRequired) * 100)}%` }}
              />
            </div>

            {prereqStatus.firstMissingUnit && (
              <div className="pt-2 border-t border-slate-900 text-xs">
                <div className="text-slate-500">Next incomplete curriculum unit:</div>
                <div className="text-white font-medium mt-0.5">
                  Topic {prereqStatus.firstMissingUnit.weekNumber}: {prereqStatus.firstMissingUnit.title}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="exit-locked-exam-btn"
              type="button"
              onClick={onExitExam}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors border border-slate-700"
            >
              Return to Roadmap
            </button>
            {prereqStatus.firstMissingUnit && onSelectUnit && (
              <button
                id="resume-from-locked-exam-btn"
                type="button"
                onClick={() => onSelectUnit(prereqStatus.firstMissingUnit!.id)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-1.5"
              >
                <span>Continue to Topic {prereqStatus.firstMissingUnit.weekNumber}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Locked Exam Top Header */}
      <div className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              {exam.title}
              <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded uppercase font-semibold tracking-wider">
                Exam Mode Active
              </span>
            </h2>
            <p className="text-xs text-slate-400 hidden sm:block">
              Browser Lock & Timed Proctoring Active • Passing: 50 / 100
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Shuffle Pool Button (before submit) */}
          {!examSubmitted && (
            <button
              onClick={handleShufflePool}
              disabled={isSubmitting || timeExpired}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors"
              title="Sample a different randomized set of questions from the pool"
            >
              <Shuffle className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden md:inline">Shuffle Pool</span>
            </button>
          )}

          {/* Countdown Clock */}
          <div className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border font-mono text-sm font-bold ${
            secondsRemaining < 300
              ? "bg-red-950/60 border-red-500 text-red-400 animate-pulse"
              : "bg-slate-950 border-slate-800 text-amber-400"
          }`}>
            <Clock className="h-4 w-4" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          {/* C++ Library Access if allowed */}
          {activeExam.allowCppReference && (
            <button
              onClick={onOpenDocs}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors"
              title="Reference C++ Standard Library functions allowed for this exam"
            >
              <BookOpen className="h-4 w-4 text-blue-400" />
              <span className="hidden sm:inline">C++ Library</span>
            </button>
          )}

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Pool Shuffled Notification Toast */}
      {poolShuffledNotice && (
        <div className="bg-indigo-950/90 border-b border-indigo-500 text-indigo-200 px-6 py-2 flex items-center justify-between text-xs animate-in slide-in-from-top">
          <div className="flex items-center space-x-2">
            <Shuffle className="h-4 w-4 text-indigo-400 shrink-0 animate-spin" />
            <span>
              <strong>Question Pool Randomized:</strong> Drew a fresh stratified sample of 7 questions from the pool of {poolStats.total} questions.
            </span>
          </div>
          <button
            onClick={() => setPoolShuffledNotice(false)}
            className="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 px-2 py-0.5 rounded font-semibold transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Switch Warning Overlay */}
      {showBlurWarning && !examSubmitted && (
        <div className="bg-amber-950/90 border-b border-amber-500 text-amber-200 px-6 py-2.5 flex items-center justify-between text-xs animate-in slide-in-from-top">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              <strong>Warning ({tabSwitches} logged):</strong> Focus loss or tab switch detected. The examination environment monitors active window state.
            </span>
          </div>
          <button
            onClick={() => setShowBlurWarning(false)}
            className="text-xs bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded font-semibold transition-colors"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Exam Body Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Pool Metadata & Rigor Banner */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <span>Randomized Question Pool System</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.2 rounded-full border border-indigo-500/30 font-mono">
                  {poolStats.total} Questions in Pool
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Every exam attempt draws a unique, balanced 100-point subset ({poolStats.mcqs} MCQs, {poolStats.trueFalse} True/False, {poolStats.whyWorks} Deep Concepts, {poolStats.codeAnalysis} Bug Analysis, {poolStats.challenges} Code Challenges).
              </p>
            </div>
          </div>
          {!examSubmitted && (
            <button
              onClick={handleShufflePool}
              disabled={isSubmitting || timeExpired}
              className="shrink-0 self-start sm:self-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-700 flex items-center space-x-1.5 text-xs"
            >
              <Shuffle className="h-3 w-3 text-indigo-400" />
              <span>Resample Pool</span>
            </button>
          )}
        </div>

        {/* Results Banner when Submitted */}
        {examSubmitted && (
          <div className={`p-6 rounded-2xl border shadow-2xl ${
            isPassed
              ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-100"
              : "bg-red-950/40 border-red-500/50 text-red-100"
          }`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shrink-0 ${
                  isPassed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                }`}>
                  {isPassed ? <Award className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {isPassed ? "Milestone Exam Passed!" : "Milestone Exam Failed (Passing Threshold Not Met)"}
                  </h3>
                  <p className="text-sm opacity-90 mt-0.5">
                    Score: <span className="font-bold font-mono text-base">{examScore} / 100</span> (Passing threshold: <span className="font-bold">{activeExam.passingScore || 50} / 100</span>)
                  </p>
                  <p className="text-xs opacity-80 mt-1">
                    {isPassed
                      ? "Congratulations! Subsequent curriculum phases have been unlocked."
                      : "You scored below the 50/100 passing threshold. Retaking will pull a fresh randomized question set from the pool."}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0 flex-wrap gap-2">
                {!isPassed && (
                  <button
                    id="exam-retake-btn"
                    onClick={handleRetakeExam}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 text-white transition-colors shadow-lg shadow-red-600/20"
                    title="Generate a new randomized question set and retake the exam"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Retake (Fresh Pool Draw)</span>
                  </button>
                )}
                {isPassed && onSelectUnit && (() => {
                  const nextUnit = getFirstUnitAfterExam(activeExam.id);
                  if (!nextUnit) return null;
                  return (
                    <button
                      id="exam-proceed-next-phase-btn"
                      onClick={() => onSelectUnit(nextUnit.id)}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-lg shadow-emerald-500/25"
                    >
                      <span>Proceed to Topic {nextUnit.weekNumber}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  );
                })()}
                <button
                  id="exam-return-roadmap-btn"
                  onClick={onExitExam}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-white text-slate-950 hover:bg-slate-200 transition-colors shadow-lg"
                >
                  <span>Return to Roadmap</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exam Questions Form */}
        <div className="space-y-6">
          {activeExam.questions.map((q, idx) => {
            const studentAns = answers[q.id];

            return (
              <div
                key={q.id}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md space-y-4"
              >
                {/* Question title & points */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-300">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
                        {q.question}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {q.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                            {q.category}
                          </span>
                        )}
                        {q.difficulty && (
                          <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                            q.difficulty === "Easy"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : q.difficulty === "Medium"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : q.difficulty === "Hard"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          }`}>
                            {q.difficulty}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                          Type: {q.type.replace(/-/g, " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {q.points} Pts
                  </span>
                </div>

                {/* Optional code snippet in question */}
                {q.codeSnippet && (
                  <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-blue-300 overflow-x-auto leading-relaxed">
                    {q.codeSnippet}
                  </pre>
                )}

                {/* Input Controls according to type */}
                {q.type === "mcq" && q.options && (
                  <div className="space-y-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = studentAns === optIdx;
                      let style = "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700";

                      if (examSubmitted) {
                        if (optIdx === q.correctAnswer) {
                          style = "bg-emerald-950/40 border-emerald-500 text-emerald-200 font-semibold";
                        } else if (isSelected && optIdx !== q.correctAnswer) {
                          style = "bg-red-950/40 border-red-500 text-red-200 line-through";
                        } else {
                          style = "bg-slate-950/50 border-slate-850 text-slate-600";
                        }
                      } else if (isSelected) {
                        style = "bg-blue-600/20 border-blue-500 text-blue-200 font-semibold";
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleAnswerChange(q.id, optIdx)}
                          disabled={examSubmitted || isSubmitting || timeExpired}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${style}`}
                        >
                          <span>{opt}</span>
                          {examSubmitted && optIdx === q.correctAnswer && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === "true-false" && (
                  <div className="flex space-x-3 pt-1">
                    {[true, false].map(val => {
                      const isSelected = studentAns === val;
                      let style = "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700";

                      if (examSubmitted) {
                        if (val === q.correctAnswer) {
                          style = "bg-emerald-950/40 border-emerald-500 text-emerald-200 font-semibold";
                        } else if (isSelected && val !== q.correctAnswer) {
                          style = "bg-red-950/40 border-red-500 text-red-200";
                        }
                      } else if (isSelected) {
                        style = "bg-blue-600/20 border-blue-500 text-blue-200 font-semibold";
                      }

                      return (
                        <button
                          key={val.toString()}
                          onClick={() => handleAnswerChange(q.id, val)}
                          disabled={examSubmitted || isSubmitting || timeExpired}
                          className={`flex-1 p-3 rounded-xl border text-xs font-semibold text-center transition-all ${style}`}
                        >
                          {val ? "True" : "False"}
                        </button>
                      );
                    })}
                  </div>
                )}

                {(q.type === "why-this-code-works" ||
                  q.type === "code-analysis" ||
                  q.type === "coding-challenge") && (
                  <div className="pt-1">
                    {q.type === 'coding-challenge' && (
                      <p className="text-xs text-blue-300 mb-3">{q.codingInstructions} Standard C++ headers are supplied by the evaluator. Coding points are based on public and hidden tests.</p>
                    )}
                    <textarea
                      rows={6}
                      aria-label={q.type === 'coding-challenge' ? `C++ answer ${idx + 1}` : `Explanation answer ${idx + 1}`}
                      value={studentAns ?? (q.type === 'coding-challenge' ? q.initialCode || '' : '')}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                      disabled={examSubmitted || isSubmitting || timeExpired}
                      placeholder="Write your explanation or C++ implementation here..."
                      className="w-full p-4 font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 disabled:opacity-80"
                    />
                  </div>
                )}

                {examSubmitted && q.type === 'coding-challenge' && codingResults[q.id] && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                    <p>{codingPoints[q.id]} / {q.points} coding points — {codingResults[q.id].testsPassed} / {codingResults[q.id].totalTests} tests passed.</p>
                    {codingResults[q.id].compileError && <pre className="whitespace-pre-wrap text-red-300">{codingResults[q.id].compileError}</pre>}
                    {codingResults[q.id].runtimeError && <p className="text-red-300">{codingResults[q.id].runtimeError}</p>}
                    {codingResults[q.id].testResults.filter(test => !test.isHidden && !test.passed && test.error).map((test, index) => (
                      <p key={index} className="text-red-300">{test.testId || `Public test ${index + 1}`}: {test.error}</p>
                    ))}
                  </div>
                )}

                {/* Post-submit official explanation */}
                {examSubmitted && (
                  <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <span className="font-bold text-amber-400 block mb-1">Official Solution & Rubric:</span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Action Area */}
        {submissionError && <p role="alert" className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-sm">{submissionError}</p>}
        {!examSubmitted && (
          <div className="pt-4 pb-12 flex items-center justify-between border-t border-slate-800">
            <p className="text-xs text-slate-400">
              {Object.keys(answers).length} of {activeExam.questions.length} questions answered
            </p>
            <button
              onClick={handleSubmitExam}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/30 transition-all flex items-center space-x-2"
            >
              {isSubmitting ? <Sparkles className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              <span>{isSubmitting ? 'Compiling and testing coding answers…' : 'Submit Examination & Finalize Score'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
