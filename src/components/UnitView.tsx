import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Code2,
  HelpCircle,
  Award,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Cpu,
  Terminal,
  Layers,
  Sparkles,
  AlertTriangle,
  Shield
} from "lucide-react";
import { Unit, UserProgress } from "../types";
import { CodeChallengeEditor } from "./CodeChallengeEditor";
import { QuizModal } from "./QuizModal";
import { getNextUnit, getPreviousUnit, isUnitUnlocked, getNextStepAfterUnit } from "../data/curriculumSummary";
import { useAssessment } from "../lib/AssessmentContext";

interface UnitViewProps {
  unit: Unit;
  progress: UserProgress;
  onBackToRoadmap: () => void;
  onSelectUnit: (unitId: string) => void;
  onSelectExam: (examId: string) => void;
  onCompleteUnit: (unitId: string) => void | Promise<void>;
  onSaveQuizScore: (quizId: string, score: number, passed: boolean) => void;
  onSaveCodingResult?: (challengeId: string, result: { passed: boolean; score: number; verified: boolean; wasAssisted: boolean }) => void;
  onOpenAiWithContext: () => void;
  onOpenDocs: () => void;
}

export const UnitView: React.FC<UnitViewProps> = ({
  unit,
  progress,
  onBackToRoadmap,
  onSelectUnit,
  onSelectExam,
  onCompleteUnit,
  onSaveQuizScore,
  onSaveCodingResult,
  onOpenAiWithContext,
  onOpenDocs
}) => {
  const { setAssessmentMode, setAssessmentTitle } = useAssessment();
  const [activeTab, setActiveTab] = useState<"theory" | "deepdive" | "exercises" | "challenge">("theory");
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

  useEffect(() => () => {
    setAssessmentMode("none");
    setAssessmentTitle(undefined);
  }, [setAssessmentMode, setAssessmentTitle]);

  // Reset assessment mode when moving away from challenge tab
  useEffect(() => {
    if (activeTab !== "challenge") {
      setAssessmentMode("none");
      setAssessmentTitle(undefined);
    }
  }, [activeTab, setAssessmentMode, setAssessmentTitle]);

  // Exercise states for True/False and MCQs
  const [tfAnswers, setTfAnswers] = useState<{ [id: string]: boolean }>({});
  const [mcqAnswers, setMcqAnswers] = useState<{ [id: string]: number }>({});
  const [showWtwExplanation, setShowWtwExplanation] = useState<{ [id: string]: boolean }>({});

  const isCompleted = progress.completedUnitIds.includes(unit.id);
  const quizResult = progress.quizScores[unit.quiz.id];
  const nextUnit = getNextUnit(unit.id);
  const prevUnit = getPreviousUnit(unit.id);

  // Determine next pedagogical step (ensures milestone exams cannot be bypassed)
  const nextStep = getNextStepAfterUnit(unit.id, progress);
  const isGatedByExam = nextStep.type === "milestone_exam" && Boolean(nextStep.requiredExam);

  const handleTfSelect = (id: string, choice: boolean) => {
    setTfAnswers(prev => ({ ...prev, [id]: choice }));
  };

  const handleMcqSelect = (id: string, optIdx: number) => {
    setMcqAnswers(prev => ({ ...prev, [id]: optIdx }));
  };

  const handleQuizPassed = (score: number) => {
    onSaveQuizScore(unit.quiz.id, score, true);
  };

  const handleCompleteAndProceed = async () => {
    try { await onCompleteUnit(unit.id); }
    catch (error) { setCompletionError(error instanceof Error ? error.message : "Completion could not be saved."); return; }
    if (nextStep.type === "milestone_exam" && nextStep.requiredExam) {
      // Must take milestone exam — no bypass allowed!
      onSelectExam(nextStep.requiredExam.id);
      return;
    }
    if (nextStep.type === "next_unit" && nextStep.nextUnit) {
      onSelectUnit(nextStep.nextUnit.id);
      return;
    }
    onBackToRoadmap();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Unit Sub-Header Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/60 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <button
            onClick={onBackToRoadmap}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Curriculum Roadmap</span>
          </button>

          <div className="flex items-center space-x-3">
            {/* Status pill */}
            {isCompleted ? (
              <span className="flex items-center space-x-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Topic Completed</span>
              </span>
            ) : (
              <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                In Progress
              </span>
            )}

            {/* Quiz Trigger Button */}
            <button
              onClick={() => setIsQuizModalOpen(true)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                quizResult?.passed
                  ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>
                {quizResult?.passed
                  ? `Quiz Passed (${quizResult.score}%)`
                  : quizResult
                  ? `Quiz Failed (${quizResult.score}%) • Retry`
                  : "Take Section Quiz"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Unit Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
          <span>Topic {unit.weekNumber}</span>
          <span>•</span>
          <span>Domain {unit.phaseId.replace("phase-", "")}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {unit.title}
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          {unit.subtitle}
        </p>

        {/* Goals & Topic Badges */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">
              Unit Objective:
            </span>
            <p className="text-slate-200">{unit.goals}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            {unit.topics.slice(0, 4).map((t, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700/60"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Milestone Exam Gate Notice (if this is a phase milestone boundary) */}
        {isGatedByExam && nextStep.requiredExam && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                  Phase Milestone Checkpoint
                </span>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Completing this section unlocks <strong className="text-white">{nextStep.requiredExam.title}</strong>. Passing this examination (Score ≥ {nextStep.requiredExam.minScore}%) is required to unlock subsequent curriculum phases.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectExam(nextStep.requiredExam!.id)}
              className="self-start sm:self-center px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shrink-0 transition-colors"
            >
              Preview Exam
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-2 mt-6 border-b border-slate-800 overflow-x-auto">
          {[
            { id: "theory", label: "Core Theory & Concepts", icon: BookOpen },
            { id: "deepdive", label: "Systems Internals & FAQ", icon: Cpu },
            { id: "exercises", label: "Interactive Exercises (TF & MCQ)", icon: HelpCircle },
            { id: "challenge", label: "C++ Coding Challenge", icon: Terminal }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-blue-500 text-blue-400 bg-blue-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Tab 1: Theory */}
        {activeTab === "theory" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Overview */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 mb-2">
                Conceptual Overview
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {unit.theory.overview}
              </p>
            </div>

            {/* Sections */}
            {unit.theory.sections.map((sec, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4"
              >
                <h3 className="text-base font-bold text-white">{sec.title}</h3>
                <div className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                  {sec.content}
                </div>

                {/* Callout */}
                {sec.callout && (
                  <div
                    className={`p-4 rounded-xl border text-xs flex items-start space-x-2.5 ${
                      sec.callout.type === "memory"
                        ? "bg-purple-950/20 border-purple-500/30 text-purple-200"
                        : sec.callout.type === "warning"
                        ? "bg-red-950/20 border-red-500/30 text-red-200"
                        : "bg-blue-950/20 border-blue-500/30 text-blue-200"
                    }`}
                  >
                    <Cpu className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase tracking-wider block text-[10px] mb-0.5">
                        {sec.callout.type} Insight
                      </span>
                      {sec.callout.text}
                    </div>
                  </div>
                )}

                {/* Code Snippets */}
                {sec.codeSnippets?.map((snip, sIdx) => (
                  <div key={sIdx} className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                      <span>{snip.title}</span>
                      <span className="text-[10px] font-mono text-slate-500">C++ Syntax</span>
                    </div>
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
                      {snip.code}
                    </pre>
                    <p className="text-xs text-slate-400 italic pl-1">{snip.explanation}</p>
                  </div>
                ))}
              </div>
            ))}

            {/* Code Examples */}
            {unit.codeExamples && unit.codeExamples.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-emerald-400" />
                  <span>Interactive Code Examples</span>
                </h3>
                {unit.codeExamples.map(ex => (
                  <div key={ex.id} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <h4 className="text-sm font-bold text-slate-200">{ex.title}</h4>
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-blue-300 overflow-x-auto leading-relaxed">
                      {ex.code}
                    </pre>
                    <p className="text-xs text-slate-300">{ex.explanation}</p>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/60">
                      {ex.keyTakeaways.map((k, kIdx) => (
                        <span key={kIdx} className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          ✓ {k}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Deep Dive */}
        {activeTab === "deepdive" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                <Cpu className="h-4 w-4" />
                <span>Under the Hood Hardware Breakdown</span>
              </div>
              <h3 className="text-xl font-bold text-white">{unit.deepDive.topic}</h3>

              <ul className="space-y-2.5 pt-2">
                {unit.deepDive.breakdown.map((item, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-slate-300 flex items-start space-x-2 leading-relaxed font-mono bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-purple-400 font-bold shrink-0">{idx + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Interview Question Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-blue-500/30 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Senior C++ Technical Interview Target Question
                </span>
              </div>

              <h4 className="text-base sm:text-lg font-bold text-white">
                "{unit.deepDive.interviewQuestion}"
              </h4>

              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs sm:text-sm text-blue-200 leading-relaxed">
                <span className="font-bold text-blue-300 block mb-1">Model Production Answer:</span>
                {unit.deepDive.idealAnswer}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Interactive Exercises */}
        {activeTab === "exercises" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* True / False Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-blue-400" />
                <span>True or False Concept Check</span>
              </h3>

              <div className="space-y-3">
                {unit.exercises.trueFalse.map(tf => {
                  const answered = tfAnswers[tf.id] !== undefined;
                  const selectedVal = tfAnswers[tf.id];
                  const isCorrect = selectedVal === tf.isTrue;

                  return (
                    <div
                      key={tf.id}
                      className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
                    >
                      <p className="text-sm font-medium text-slate-200">{tf.statement}</p>

                      <div className="flex space-x-3">
                        {[true, false].map(val => {
                          const isSelected = selectedVal === val;
                          let btnStyle = "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700";

                          if (answered) {
                            if (val === tf.isTrue) {
                              btnStyle = "bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold";
                            } else if (isSelected && !isCorrect) {
                              btnStyle = "bg-red-950/40 border-red-500 text-red-300 line-through";
                            }
                          } else if (isSelected) {
                            btnStyle = "bg-blue-600/20 border-blue-500 text-blue-200";
                          }

                          return (
                            <button
                              key={val.toString()}
                              onClick={() => handleTfSelect(tf.id, val)}
                              className={`px-4 py-1.5 rounded-lg border text-xs font-semibold transition-all ${btnStyle}`}
                            >
                              {val ? "True" : "False"}
                            </button>
                          );
                        })}
                      </div>

                      {answered && (
                        <div
                          className={`p-3 rounded-xl text-xs ${
                            isCorrect
                              ? "bg-emerald-950/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-red-950/20 text-red-300 border border-red-500/30"
                          }`}
                        >
                          <span className="font-bold">{isCorrect ? "Correct! " : "Incorrect. "}</span>
                          {tf.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Multiple Choice Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-emerald-400" />
                <span>Multiple Choice Analysis</span>
              </h3>

              <div className="space-y-4">
                {unit.exercises.mcqs.map(mcq => {
                  const answered = mcqAnswers[mcq.id] !== undefined;
                  const selectedIdx = mcqAnswers[mcq.id];
                  const isCorrect = selectedIdx === mcq.correctAnswer;

                  return (
                    <div
                      key={mcq.id}
                      className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
                    >
                      <p className="text-sm font-medium text-slate-200">{mcq.question}</p>

                      <div className="space-y-2">
                        {mcq.options.map((opt, optIdx) => {
                          const isSelected = selectedIdx === optIdx;
                          let optStyle = "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700";

                          if (answered) {
                            if (optIdx === mcq.correctAnswer) {
                              optStyle = "bg-emerald-950/40 border-emerald-500 text-emerald-200 font-bold";
                            } else if (isSelected && !isCorrect) {
                              optStyle = "bg-red-950/40 border-red-500 text-red-200 line-through";
                            }
                          } else if (isSelected) {
                            optStyle = "bg-blue-600/20 border-blue-500 text-blue-200";
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleMcqSelect(mcq.id, optIdx)}
                              className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${optStyle}`}
                            >
                              <span>{opt}</span>
                              {answered && optIdx === mcq.correctAnswer && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {answered && (
                        <div
                          className={`p-3 rounded-xl text-xs ${
                            isCorrect
                              ? "bg-emerald-950/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-red-950/20 text-red-300 border border-red-500/30"
                          }`}
                        >
                          <span className="font-bold">{isCorrect ? "Correct! " : "Incorrect. "}</span>
                          {mcq.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Why This Works Section */}
            {unit.exercises.whyThisWorks && unit.exercises.whyThisWorks.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  <span>"Why This Code Works" Mechanical Analysis</span>
                </h3>

                {unit.exercises.whyThisWorks.map(wtw => {
                  const isOpen = showWtwExplanation[wtw.id];

                  return (
                    <div
                      key={wtw.id}
                      className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
                    >
                      <h4 className="text-sm font-bold text-white">{wtw.title}</h4>
                      <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-blue-300 overflow-x-auto">
                        {wtw.code}
                      </pre>
                      <p className="text-xs text-slate-300 font-medium">{wtw.question}</p>

                      <button
                        onClick={() =>
                          setShowWtwExplanation(prev => ({ ...prev, [wtw.id]: !isOpen }))
                        }
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline"
                      >
                        {isOpen ? "Hide Step-by-Step Breakdown" : "Reveal Step-by-Step Execution"}
                      </button>

                      {isOpen && (
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs text-slate-300 animate-in fade-in">
                          <ol className="space-y-1.5 list-decimal pl-4">
                            {wtw.stepByStep.map((step, sIdx) => (
                              <li key={sIdx}>{step}</li>
                            ))}
                          </ol>
                          <p className="pt-2 border-t border-slate-800 font-bold text-amber-400">
                            Core Invariant: {wtw.coreConcept}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Coding Challenge */}
        {activeTab === "challenge" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <CodeChallengeEditor
              key={unit.exercises.codingChallenge.id}
              challenge={unit.exercises.codingChallenge}
              initialMode="practice"
              onModeChange={(m) => {
                if (m === "assessment") {
                  setAssessmentMode("coding-assessment");
                  setAssessmentTitle(unit.exercises.codingChallenge.title);
                } else {
                  setAssessmentMode("none");
                  setAssessmentTitle(undefined);
                }
              }}
              onSuccess={() => {
                onSaveCodingResult?.(unit.exercises.codingChallenge.id, {
                  passed: true,
                  score: 100,
                  verified: true,
                  wasAssisted: false,
                });
                void Promise.resolve(onCompleteUnit(unit.id)).catch(error => setCompletionError(error.message));
              }}
              onPracticeSuccess={() => {
                onSaveCodingResult?.(unit.exercises.codingChallenge.id, {
                  passed: true,
                  score: 100,
                  verified: false,
                  wasAssisted: true,
                });
              }}
            />
          </div>
        )}
      </div>

      {completionError && <p role="alert" className="p-4 text-red-300">{completionError}</p>}
      {/* Bottom Step-by-Step Progression Bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-slate-950/90 border-t border-slate-800 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            {prevUnit ? (
              <button
                onClick={() => onSelectUnit(prevUnit.id)}
                className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Topic {prevUnit.weekNumber}: {prevUnit.title}</span>
              </button>
            ) : (
              <span className="text-xs text-slate-600">First Topic</span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {isGatedByExam && nextStep.requiredExam ? (
              <button
                id="mark-completed-btn"
                onClick={handleCompleteAndProceed}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/25 transition-all"
              >
                <Shield className="h-4 w-4" />
                <span>
                  {isCompleted
                    ? `Take Milestone Exam (${nextStep.requiredExam.title.split(":")[0]})`
                    : `Complete & Take Milestone Exam`}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : nextStep.type === "curriculum_completed" ? (
              <button
                id="mark-completed-btn"
                onClick={handleCompleteAndProceed}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 transition-all"
              >
                <Award className="h-4 w-4" />
                <span>Complete Curriculum & View Certification</span>
              </button>
            ) : (
              <button
                id="mark-completed-btn"
                onClick={handleCompleteAndProceed}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all"
              >
                <span>{isCompleted ? "Proceed to Next Topic" : "Mark Complete & Continue"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Modal */}
      <QuizModal
        quiz={unit.quiz}
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        onPassQuiz={handleQuizPassed}
      />
    </div>
  );
};
