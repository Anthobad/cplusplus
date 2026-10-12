import React from "react";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Brain,
  Award,
  Sparkles,
  BookOpen,
  Shield,
  Layers
} from "lucide-react";
import { UserProgress } from "../types";
import { calculateReadiness, DimensionReadiness, WeakTopicItem } from "../lib/readinessAnalytics";

interface ReadinessDashboardProps {
  progress: UserProgress;
  onSelectUnit: (unitId: string) => void;
  onStartMockInterview: () => void;
}

export const ReadinessDashboard: React.FC<ReadinessDashboardProps> = ({
  progress,
  onSelectUnit,
  onStartMockInterview,
}) => {
  const readiness = calculateReadiness(progress);

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Systems Engineering Competency Matrix</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Interview Readiness & Analytics</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real performance derived from completed quizzes, verified coding submissions, milestone examinations, and mock technical screens.
          </p>
        </div>

        <button
          onClick={onStartMockInterview}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-purple-500/20 self-start md:self-center"
        >
          <Brain className="h-4 w-4" />
          <span>Launch Mock Interview</span>
        </button>
      </div>

      {/* Overall Status Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div
            className={`h-20 w-20 rounded-2xl flex flex-col items-center justify-center font-mono font-black text-2xl border ${
              readiness.overallStatus === "Strong"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : readiness.overallStatus === "Developing"
                ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                : readiness.overallStatus === "Needs Review"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-slate-800/40 text-slate-400 border-slate-700/50"
            }`}
          >
            <span>{readiness.hasEnoughData ? `${readiness.overallScore}%` : "—"}</span>
            <span className="text-[10px] font-sans font-bold text-slate-400">Score</span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-white">
                Readiness Assessment: {readiness.overallStatus}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  readiness.overallStatus === "Strong"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : readiness.overallStatus === "Developing"
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    : readiness.overallStatus === "Needs Review"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {readiness.hasEnoughData ? "Verified Data" : "More Data Needed"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              {readiness.hasEnoughData
                ? "Calculated dynamically across active dimensions from verified exam scores, unit quizzes, and sandbox-executed coding challenges."
                : "Complete more unit quizzes and verified coding assessments to unlock comprehensive statistical interview readiness ratings."}
            </p>
          </div>
        </div>
      </div>

      {/* 8-Dimension Competency Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="h-4 w-4 text-blue-400" />
          <span>Core Technical Competency Dimensions</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {readiness.dimensions.map((d: DimensionReadiness, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{d.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      d.status === "Strong"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : d.status === "Developing"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        : d.status === "Needs Review"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : "bg-slate-800/40 text-slate-500 border-slate-700/50"
                    }`}
                  >
                    {d.status}
                  </span>
                </div>

                <div className="mt-2 text-xl font-bold font-mono text-white">
                  {d.dataPointsCount > 0 ? `${d.score}%` : "No Data"}
                </div>

                {d.dataPointsCount > 0 && (
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        d.status === "Strong"
                          ? "bg-emerald-500"
                          : d.status === "Developing"
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${d.score}%` }}
                    />
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">{d.details}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Needs Review / Weakness Section (Requirement 12) */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">Needs Review (Targeted Re-Study)</h3>
          </div>
          <span className="text-xs text-slate-400">
            {readiness.weakTopics.length > 0
              ? `${readiness.weakTopics.length} topic(s) below 70% threshold`
              : "0 critical weaknesses detected"}
          </span>
        </div>

        {readiness.weakTopics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {readiness.weakTopics.map((item: WeakTopicItem, idx: number) => (
              <button
                key={idx}
                onClick={() => onSelectUnit(item.unitId)}
                className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/30 hover:border-amber-400 hover:bg-slate-900/80 transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-amber-300">
                    {item.topicTitle}
                  </div>
                  <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                    Score: {item.score}% • {item.reason}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    Click to review module →
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 shrink-0 ml-2" />
              </button>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto" />
            <div className="text-sm font-semibold text-white">
              {readiness.hasEnoughData ? "No Critical Weaknesses" : "Not enough data yet"}
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {readiness.hasEnoughData
                ? "All completed quizzes and coding challenges have met or exceeded the 70% passing threshold."
                : "Complete quizzes and verified coding assessments to automatically surface areas requiring review."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
