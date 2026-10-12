import React, { useState } from "react";
import { X, RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { UserProgress } from "../types";

interface ResetProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => Promise<void>;
  progress: UserProgress;
}

export const ResetProgressModal: React.FC<ResetProgressModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  progress,
}) => {
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onConfirmReset();
      onClose();
    } catch (err) {
      console.error("Reset failed:", err);
    } finally {
      setIsResetting(false);
    }
  };

  const completedCount = progress.completedUnitIds?.length || 0;
  const quizzesCount = Object.keys(progress.quizScores || {}).length;
  const examsCount = Object.keys(progress.examAttempts || {}).length;

  return (
    <div
      id="reset-progress-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isResetting) {
          onClose();
        }
      }}
    >
      <div
        id="reset-progress-modal"
        role="dialog"
        aria-labelledby="reset-modal-title"
        aria-modal="true"
        className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100"
      >
        {/* Close Button */}
        <button
          id="close-reset-modal-btn"
          type="button"
          onClick={onClose}
          disabled={isResetting}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Warning Icon & Heading */}
        <div className="flex items-start space-x-3.5 mb-5">
          <div className="p-3 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 id="reset-modal-title" className="text-lg font-bold text-white">
              Reset Learning Progress?
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              This action resets your curriculum progress back to Topic 1.
            </p>
          </div>
        </div>

        {/* Current State Summary */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-5 space-y-2 text-xs">
          <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>The following recorded progress will be cleared:</span>
          </div>
          <div className="flex justify-between text-slate-400 py-1 border-b border-slate-900 font-mono">
            <span>Completed Units:</span>
            <span className="font-bold text-slate-200">{completedCount} weeks</span>
          </div>
          <div className="flex justify-between text-slate-400 py-1 border-b border-slate-900 font-mono">
            <span>Quiz Results:</span>
            <span className="font-bold text-slate-200">{quizzesCount} quizzes</span>
          </div>
          <div className="flex justify-between text-slate-400 py-1 font-mono">
            <span>Milestone Exams:</span>
            <span className="font-bold text-slate-200">{examsCount} exam attempts</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          Your active unit will be reset to <strong className="text-slate-200">Topic 1: C++ Evolution</strong>. This syncs with both your local browser storage and your connected cloud account.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            id="cancel-reset-progress-btn"
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs transition-colors border border-slate-700 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            id="confirm-reset-progress-btn"
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-all shadow-lg shadow-red-600/20 flex items-center justify-center space-x-1.5 disabled:opacity-60"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>{isResetting ? "Resetting..." : "Yes, Reset Progress"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
