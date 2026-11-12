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
}

export const ReadinessDashboard: React.FC<ReadinessDashboardProps> = ({
  progress,
  onSelectUnit,
}) => {
  const readiness = React.useMemo(() => calculateReadiness(progress), [progress]);

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


      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Overall Readiness', score: readiness.overallScore, status: readiness.overallStatus,
            count: readiness.topics.filter(t => t.hasEvidence).length,
            description: `Across all 39 curriculum topics. ${readiness.coverage}% have assessment evidence; unreached topics reduce curriculum coverage, not exam marks.` },
          { label: 'Readiness at Your Current Progress', score: readiness.reachedScore, status: readiness.reachedStatus,
            count: readiness.reachedAssessedTopics,
            description: `${readiness.reachedAssessedTopics} of ${readiness.reachedTopics} reached topics assessed. Based on available evidence only; unattempted assessments are excluded.` },
        ].map(item => (
          <section key={item.label} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h3 className="text-base font-bold text-white">{item.label}</h3>
            <div className="text-3xl font-black font-mono text-blue-300">{item.count ? `${item.score}%` : '—'}</div>
            <div className="text-xs text-slate-300">{item.status}</div>
            <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
          </section>
        ))}
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

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
        <h3 className="font-bold text-white">Topic mastery and evidence</h3>
        <p className="text-xs text-slate-400">Completion records your study history; mastery reflects assessment evidence. {readiness.coverage}% of topics have evidence. Unassessed topics contribute zero demonstrated readiness, not a recorded failure.</p>
        <p className="text-xs text-slate-400">Lesson mastery averages available quiz and verified unassisted coding scores. Unattempted assessments are excluded, not scored as failures. Exam evidence has up to 80% weight, increasing with distinct question coverage. Retakes use the latest three results per question (60/30/10, normalized). Multi-topic questions share one contribution.</p>
        {readiness.legacyExamCount > 0 && <p className="text-xs text-amber-300">{readiness.legacyExamCount} historical exams lack trusted question details (aggregate average {readiness.legacyExamAverage}%). History is preserved; these scores are not assigned to topics.</p>}
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400"><tr><th className="p-2">Topic</th><th className="p-2">Completion</th><th className="p-2">Mastery</th><th className="p-2">Evidence</th></tr></thead>
            <tbody>{readiness.topics.map(topic => <tr key={topic.unitId} className="border-t border-slate-800">
              <td className="p-2"><button className="text-blue-300 hover:underline" onClick={() => onSelectUnit(topic.unitId)}>{topic.topicTitle}</button></td>
              <td className="p-2 text-slate-400">{topic.completed ? 'Completed' : 'Not completed'}</td>
              <td className="p-2 text-white">{topic.hasEvidence ? `${topic.score}%` : '—'}</td>
              <td className="p-2 text-slate-400">{topic.confidence}{topic.examScore !== undefined ? ` · Exam ${Math.round(topic.examScore)}% · ${Number(topic.examQuestions.toFixed(1))} question-equivalents` : ' · No exam evidence'}{(topic.improvement || 0)>0 ? ` · Improving +${Math.round(topic.improvement!)} points` : ''}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>

      {/* Needs Review / Weakness Section (Requirement 12) */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">Needs Review (Targeted Re-Study)</h3>
          </div>
          <span className="text-xs text-slate-400">
            {readiness.weakTopics.length > 0
              ? `${readiness.weakTopics.length} topics with supported review recommendations`
              : "0 critical weaknesses detected"}
          </span>
        </div>

        {readiness.weakTopics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {readiness.weakTopics.map((item: WeakTopicItem, idx: number) => (
              <button
                key={item.unitId}
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
                ? "No topic currently meets the evidence requirements for a review recommendation. Check coverage before interpreting this as mastery."
                : "Complete quizzes and verified coding assessments to automatically surface areas requiring review."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
