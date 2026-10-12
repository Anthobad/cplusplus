import React, { useState, useEffect } from "react";
import { X, CheckCircle2, XCircle, RotateCcw, Award, AlertCircle, HelpCircle } from "lucide-react";
import { Quiz, QuizQuestion } from "../types";
import { useAssessment } from "../lib/AssessmentContext";

interface QuizModalProps {
  quiz: Quiz;
  isOpen: boolean;
  onClose: () => void;
  onPassQuiz: (score: number) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  quiz,
  isOpen,
  onClose,
  onPassQuiz
}) => {
  const { setAssessmentMode, setAssessmentTitle } = useAssessment();
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [isPassed, setIsPassed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAssessmentMode("quiz");
      setAssessmentTitle(quiz.title);
    } else {
      setAssessmentMode("none");
      setAssessmentTitle(undefined);
    }

    return () => {
      setAssessmentMode("none");
      setAssessmentTitle(undefined);
    };
  }, [isOpen, quiz.title, setAssessmentMode, setAssessmentTitle]);

  if (!isOpen) return null;

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const calculateResults = () => {
    let correctCount = 0;
    quiz.questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const scorePercentage = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = scorePercentage >= quiz.passingScorePercentage;

    setCurrentScore(scorePercentage);
    setIsPassed(passed);
    setSubmitted(true);

    if (passed) {
      onPassQuiz(scorePercentage);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setCurrentScore(0);
    setIsPassed(false);
  };

  const allAnswered = quiz.questions.every(q => selectedAnswers[q.id] !== undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <Award className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">{quiz.title}</h3>
              <p className="text-xs text-slate-400">
                Untimed Section Assessment • Passing score: {quiz.passingScorePercentage}%
              </p>
            </div>
          </div>
          {!submitted && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Warning Banner: AI Mentor Disabled */}
        <div className="px-6 py-2 bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
          <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>Notice: AI Mentor is locked during assessment mode. You can repeat this quiz if you do not pass.</span>
        </div>

        {/* Question Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Result Banner if submitted */}
          {submitted && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                isPassed
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                  : "bg-red-950/40 border-red-500/40 text-red-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                {isPassed ? (
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                ) : (
                  <XCircle className="h-7 w-7 text-red-400" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {isPassed ? "Assessment Passed!" : "Passing Score Not Met"}
                  </h4>
                  <p className="text-xs opacity-90">
                    Your score: {currentScore}% (Required: {quiz.passingScorePercentage}%)
                  </p>
                </div>
              </div>

              {!isPassed && (
                <button
                  onClick={handleRetry}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Retry Quiz</span>
                </button>
              )}
            </div>
          )}

          {/* List of Questions */}
          {quiz.questions.map((q, idx) => {
            const isAnswered = selectedAnswers[q.id] !== undefined;
            const isCorrect = selectedAnswers[q.id] === q.correctAnswerIndex;

            return (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
              >
                <div className="flex items-start space-x-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-slate-300 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{q.question}</p>
                    {q.codeSnippet && (
                      <pre className="mt-2 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-blue-300 overflow-x-auto">
                        {q.codeSnippet}
                      </pre>
                    )}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-2 pl-7">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[q.id] === optIdx;
                    let optionStyle = "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700";

                    if (submitted) {
                      if (optIdx === q.correctAnswerIndex) {
                        optionStyle = "bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-semibold";
                      } else if (isSelected && !isCorrect) {
                        optionStyle = "bg-red-950/40 border-red-500/60 text-red-200 line-through";
                      } else {
                        optionStyle = "bg-slate-900/50 border-slate-800/50 text-slate-500";
                      }
                    } else if (isSelected) {
                      optionStyle = "bg-blue-600/20 border-blue-500 text-blue-200 font-semibold";
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        disabled={submitted}
                        className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${optionStyle}`}
                      >
                        <span>{opt}</span>
                        {submitted && optIdx === q.correctAnswerIndex && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        )}
                        {submitted && isSelected && !isCorrect && (
                          <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation on submit */}
                {submitted && (
                  <div className="mt-3 pl-7 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Explanation: </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <div className="text-xs text-slate-400">
            {Object.keys(selectedAnswers).length} of {quiz.questions.length} questions answered
          </div>

          {!submitted ? (
            <button
              onClick={calculateResults}
              disabled={!allAnswered}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-all"
            >
              Submit Assessment
            </button>
          ) : isPassed ? (
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all"
            >
              Done & Continue
            </button>
          ) : (
            <button
              onClick={handleRetry}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-all flex items-center space-x-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
