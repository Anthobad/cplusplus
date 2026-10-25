import { authenticatedFetch } from "../lib/authenticatedFetch";
import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Eye,
  EyeOff,
  Sparkles,
  Terminal,
  ShieldAlert,
  AlertTriangle,
  Award,
  HelpCircle,
  Clock
} from "lucide-react";
import Markdown from "react-markdown";
import { CodingChallenge, CodeEvaluationResult, CodeSubmissionRequest } from "../types";

interface CodeChallengeEditorProps {
  challenge: CodingChallenge;
  initialMode?: "practice" | "assessment";
  onSuccess?: () => void;
  onPracticeSuccess?: () => void;
  onModeChange?: (mode: "practice" | "assessment") => void;
}

export const CodeChallengeEditor: React.FC<CodeChallengeEditorProps> = ({
  challenge,
  initialMode = "practice",
  onSuccess,
  onPracticeSuccess,
  onModeChange,
}) => {
  const [code, setCode] = useState(challenge.initialCode);
  const [mode, setMode] = useState<"practice" | "assessment">(initialMode);
  const [showSolution, setShowSolution] = useState(false);
  const [wasAssisted, setWasAssisted] = useState(false);
  const [activeHintIndex, setActiveHintIndex] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<CodeEvaluationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [includeAiFeedback, setIncludeAiFeedback] = useState(true);
  const pendingEvaluation = useRef<AbortController | null>(null);

  useEffect(() => () => {
    pendingEvaluation.current?.abort();
    pendingEvaluation.current = null;
  }, []);

  const handleToggleMode = (newMode: "practice" | "assessment") => {
    pendingEvaluation.current?.abort();
    pendingEvaluation.current = null;
    setIsEvaluating(false);
    setMode(newMode);
    setShowSolution(false);
    setEvalResult(null);
    setErrorMessage(null);
    onModeChange?.(newMode);
  };

  const handleRevealSolution = () => {
    if (mode === "assessment") return; // Blocked in assessment
    setShowSolution(!showSolution);
    if (!showSolution) {
      setWasAssisted(true);
    }
  };

  const handleRunEvaluation = async () => {
    pendingEvaluation.current?.abort();
    const controller = new AbortController();
    pendingEvaluation.current = controller;
    const isCurrent = () => pendingEvaluation.current === controller && !controller.signal.aborted;
    setIsEvaluating(true);
    setEvalResult(null);
    setErrorMessage(null);

    try {
      const submission: CodeSubmissionRequest = {
        challengeId: challenge.id,
        studentCode: code,
        mode,
        wasAssisted,
        requestAiFeedback: mode === "practice" && includeAiFeedback,
        challengeTitle: challenge.title,
        expectedBehavior: challenge.expectedBehavior,
      };

      const response = await authenticatedFetch("/api/evaluate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Evaluator returned HTTP status ${response.status}`);
      }

      const data: CodeEvaluationResult = await response.json();
      if (!isCurrent()) return;
      setEvalResult(data);

      if (data.configurationError) {
        setErrorMessage(data.error || "This challenge is temporarily unavailable because its test configuration is incomplete.");
        return;
      }

      // Progression gating:
      // In Assessment mode: only strictly verified, unassisted pass triggers official onSuccess()
      if (mode === "assessment" && data.passed && data.verified && onSuccess) {
        onSuccess();
      } else if (mode === "practice" && data.passed && onPracticeSuccess) {
        onPracticeSuccess();
      }
    } catch (_err: any) {
      if (!isCurrent()) return;
      // RULE 1: Never fabricate a pass or score on infrastructure error.
      // Must display unavailable message without modifying progress.
      setErrorMessage("Code evaluation is temporarily unavailable. Your attempt was not counted.");
      setEvalResult({
        compiled: false,
        passed: false,
        score: 0,
        testsPassed: 0,
        totalTests: 0,
        testResults: [],
        compileError: "The C++ evaluation runner could not execute. Your attempt was not counted.",
        mode,
        wasAssisted,
        verified: false,
      });
    } finally {
      if (isCurrent()) {
        setIsEvaluating(false);
        pendingEvaluation.current = null;
      }
    }
  };

  return (
    <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 shadow-xl">
      {/* Challenge Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 bg-slate-900 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <h4 className="text-sm font-bold text-slate-100">{challenge.title}</h4>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              challenge.difficulty === "Easy"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : challenge.difficulty === "Medium"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-red-500/10 text-red-400 border-red-500/30"
            }`}
          >
            {challenge.difficulty}
          </span>
          {wasAssisted && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Assisted Attempt
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Mode Selector */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => handleToggleMode("practice")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                mode === "practice"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Practice
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode("assessment")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                mode === "assessment"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Assessment
            </button>
          </div>

          {/* Solution Toggle (Practice Mode Only) */}
          {mode === "practice" && (
            <button
              onClick={handleRevealSolution}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-colors"
            >
              {showSolution ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-blue-400" />}
              <span>{showSolution ? "Hide Solution" : "Reveal Solution"}</span>
            </button>
          )}

          {/* Run / Evaluate Code */}
          {mode === "practice" && <label className="flex items-center gap-1.5 text-xs text-slate-300">
            <input type="checkbox" checked={includeAiFeedback} disabled={isEvaluating}
              onChange={event => setIncludeAiFeedback(event.target.checked)} />
            Include AI review (slower)
          </label>}
          <button
            onClick={handleRunEvaluation}
            disabled={isEvaluating}
            className={`flex items-center space-x-1.5 px-3.5 py-1 rounded-lg text-xs font-semibold text-white shadow-lg disabled:opacity-50 transition-all ${
              mode === "assessment"
                ? "bg-purple-600 hover:bg-purple-500 shadow-purple-500/20"
                : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
            }`}
          >
            {isEvaluating ? (
              <Sparkles className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" />
            )}
            <span>{isEvaluating ? "Compiling & Testing..." : mode === "assessment" ? "Submit Assessment" : "Run Tests"}</span>
          </button>
        </div>
      </div>

      {/* Mode Banner */}
      <div
        className={`px-4 py-2 border-b text-[11px] flex items-center justify-between ${
          mode === "assessment"
            ? "bg-purple-950/30 border-purple-500/30 text-purple-200"
            : "bg-blue-950/20 border-blue-500/20 text-blue-300"
        }`}
      >
        <div className="flex items-center space-x-2">
          {mode === "assessment" ? (
            <>
              <ShieldAlert className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span>
                <strong>Assessment Mode:</strong> Hidden test cases enforced. AI Mentor and solution reveal are locked out. Verified pass required for progression.
              </span>
            </>
          ) : (
            <>
              <HelpCircle className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span>
                <strong>Practice Mode:</strong> Public test cases, hints, and qualitative AI feedback enabled. Revealing solution marks attempt as assisted.
              </span>
            </>
          )}
        </div>
      </div>

      {/* Description & Hints */}
      <div className="p-4 bg-slate-950/70 border-b border-slate-800/80 text-xs text-slate-300 leading-relaxed">
        <p className="mb-2.5 font-medium">{challenge.description || challenge.expectedBehavior}</p>

        {/* Public test cases summary */}
        {challenge.testCases && challenge.testCases.length > 0 && (
          <div className="flex flex-wrap gap-2 text-[11px] mb-2 font-mono">
            {challenge.testCases.map((tc, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                <span className="text-slate-500">Test {idx + 1}: </span>
                <span className="text-slate-300">{tc.input || "(stdin)"}</span>
                <span className="text-slate-500"> → </span>
                <span className="text-emerald-400 font-semibold">{tc.expectedOutput}</span>
              </div>
            ))}
          </div>
        )}

        {/* Hints accordion (Practice Mode only) */}
        {mode === "practice" && challenge.hints && challenge.hints.length > 0 && (
          <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-slate-800/50">
            <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400 font-semibold text-[11px]">Hint:</span>
            <span className="text-amber-200/90 text-[11px]">{challenge.hints[activeHintIndex]}</span>
            {challenge.hints.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveHintIndex((activeHintIndex + 1) % challenge.hints.length)}
                className="text-[10px] text-blue-400 hover:underline ml-auto"
              >
                Next hint ({activeHintIndex + 1}/{challenge.hints.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Interactive Code Editor Area */}
      <div className="relative">
        <textarea
          rows={12}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full p-4 font-mono text-xs bg-slate-950 text-emerald-300 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y leading-relaxed"
        />

        {/* Canonical Solution Overlay when revealed in Practice Mode */}
        {showSolution && mode === "practice" && (
          <div className="p-4 bg-slate-900/95 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-amber-400 font-mono text-[11px]">
                // Canonical Production C++ Solution (Attempt flagged as Assisted):
              </span>
              <button
                onClick={() => setCode(challenge.solutionCode)}
                className="text-[10px] text-blue-400 hover:text-blue-300 underline font-mono"
              >
                Copy into editor
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 font-mono text-slate-200 overflow-x-auto text-xs leading-relaxed border border-slate-800">
              {challenge.solutionCode}
            </pre>
          </div>
        )}
      </div>

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="p-4 bg-amber-950/40 border-t border-amber-500/40 text-amber-200 text-xs flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Evaluation Results Breakdown */}
      {evalResult && (
        <div
          className={`p-4 border-t ${
            evalResult.passed
              ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
              : "bg-red-950/30 border-red-500/30 text-red-200"
          }`}
        >
          <div className="flex items-start space-x-2.5">
            {evalResult.passed ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">
                  {evalResult.passed
                    ? mode === "assessment"
                      ? "Verified Assessment Passed!"
                      : "Practice Tests Passed!"
                    : "Compilation or Test Mismatch"}
                </span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-white font-bold">
                  {evalResult.testsPassed} / {evalResult.totalTests} Tests Passed ({evalResult.score}%)
                </span>
              </div>

              {/* Compilation Error Display */}
              {evalResult.compileError && (
                <div className="mt-2 p-3 rounded-lg bg-slate-950 border border-red-500/40 text-red-300 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                  {evalResult.compileError}
                </div>
              )}

              {/* Individual Test Results List */}
              {evalResult.testResults && evalResult.testResults.length > 0 && (
                <div className="mt-3 space-y-1.5 font-mono text-[11px]">
                  {evalResult.testResults.map((t, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded border flex items-center justify-between ${
                        t.passed
                          ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                          : "bg-red-950/40 border-red-500/30 text-red-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {t.passed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-400" />
                        )}
                        <span>{t.testId || `Test ${idx + 1}`}</span>
                        {t.isHidden && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 rounded border border-slate-700 text-slate-400">
                            Hidden
                          </span>
                        )}
                        {!t.isHidden && t.input && (
                          <span className="text-slate-400 text-[10px]">
                            [Input: {t.input.length > 30 ? t.input.slice(0, 30) + "..." : t.input}]
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-right">
                        {!t.isHidden && t.expectedOutput && (
                          <span className="text-slate-400 mr-2">Exp: {t.expectedOutput}</span>
                        )}
                        <span>{t.actualOutput || (t.passed ? "Passed" : "Failed")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Qualitative AI Feedback (Advisory Only) */}
              {evalResult.aiFeedback && (
                <div className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-blue-500/30 text-slate-300">
                  <div className="flex items-center space-x-1.5 text-blue-400 font-semibold mb-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI Engineering Code Review (Qualitative Advice)</span>
                  </div>
                  <p className="text-xs text-slate-200 mb-2 leading-relaxed">
                    {evalResult.aiFeedback.feedback}
                  </p>
                  {evalResult.aiFeedback.suggestions && evalResult.aiFeedback.suggestions.length > 0 && (
                    <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                      {evalResult.aiFeedback.suggestions.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
