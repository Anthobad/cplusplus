import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  Sparkles,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  Layers,
  Terminal,
  ShieldAlert,
  ChevronRight,
  Code2
} from "lucide-react";
import Markdown from "react-markdown";
import { MockInterviewReport, UserProgress } from "../types";
import { useAssessment } from "../lib/AssessmentContext";

interface MockInterviewViewProps {
  progress: UserProgress;
  onNavigateHome: () => void;
  onSelectUnit: (unitId: string) => void;
  onSaveReport?: (report: MockInterviewReport) => void;
}

interface Message {
  id: string;
  role: "user" | "interviewer";
  text: string;
  timestamp: string;
}

type InterviewPreset = "15-min" | "30-min" | "60-min";

const PHASES = [
  { id: "fundamentals", label: "C++ Fundamentals & Memory Model" },
  { id: "memory", label: "Pointers, Lifetimes & RAII" },
  { id: "stl", label: "STL Containers, Iterators & Big-O" },
  { id: "systems", label: "Concurrency, OOP & Architecture" },
];

export const MockInterviewView: React.FC<MockInterviewViewProps> = ({
  progress,
  onNavigateHome,
  onSelectUnit,
  onSaveReport,
}) => {
  const { setAssessmentMode, setAssessmentTitle } = useAssessment();

  // State
  const [screen, setScreen] = useState<"preset" | "session" | "report">("preset");
  const [preset, setPreset] = useState<InterviewPreset>("30-min");
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [report, setReport] = useState<MockInterviewReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Manage assessment state
  useEffect(() => {
    if (screen === "session") {
      setAssessmentMode("mock-interview");
      setAssessmentTitle(`Staff C++ Mock Interview (${preset})`);
    } else {
      setAssessmentMode("none");
      setAssessmentTitle(undefined);
    }

    return () => {
      setAssessmentMode("none");
      setAssessmentTitle(undefined);
    };
  }, [screen, preset, setAssessmentMode, setAssessmentTitle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Start interview session
  const handleStartInterview = async (selectedPreset: InterviewPreset) => {
    setPreset(selectedPreset);
    setScreen("session");
    setMessages([]);
    setPhaseIndex(0);
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "continue",
          preset: selectedPreset,
          currentPhase: PHASES[0].id,
          history: [],
          userMessage: "Hello, I am ready for the technical interview. Please begin.",
        }),
      });

      if (!response.ok) {
        throw new Error("Interview service temporarily unreachable");
      }

      const data = await response.json();
      const initialMsg: Message = {
        id: "msg-" + Date.now(),
        role: "interviewer",
        text:
          data.reply ||
          "Welcome to the C++ Systems Technical Interview. Let's start with C++ fundamentals and memory management. Could you describe how the memory layout of a program is structured between stack, heap, data segment, and BSS?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([initialMsg]);
    } catch (_err) {
      setErrorMsg("Failed to start the AI Interviewer. Please check server connectivity.");
    } finally {
      setIsLoading(false);
    }
  };

  // Send candidate answer
  const handleSendMessage = async () => {
    const textToSend = userInput.trim();
    const codeToSend = codeSnippet.trim();
    if (!textToSend && !codeToSend) return;

    const fullMessage = codeToSend
      ? `${textToSend}\n\n\`\`\`cpp\n${codeToSend}\n\`\`\``
      : textToSend;

    const userMsg: Message = {
      id: "usr-" + Date.now(),
      role: "user",
      text: fullMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setUserInput("");
    setCodeSnippet("");
    setShowCodeEditor(false);
    setIsLoading(true);
    setErrorMsg(null);

    // Advance phase index every 3 exchanges
    const nextPhaseIdx = Math.min(Math.floor(newMessages.length / 3), PHASES.length - 1);
    setPhaseIndex(nextPhaseIdx);

    try {
      const response = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "continue",
          preset,
          currentPhase: PHASES[nextPhaseIdx].id,
          history: newMessages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          userMessage: fullMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to receive interviewer response");
      }

      const data = await response.json();
      const assistantMsg: Message = {
        id: "int-" + Date.now(),
        role: "interviewer",
        text: data.reply || "Could you analyze the time and space complexity of that approach?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (_err) {
      setErrorMsg("Interviewer response could not be loaded. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Conclude interview and generate report
  const handleConcludeInterview = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finish",
          preset,
          history: messages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Report generation failed");
      }

      const data = await response.json();
      const generatedReport: MockInterviewReport = {
        id: "rep-" + Date.now(),
        timestamp: Date.now(),
        preset,
        overallScore: data.report?.overallScore || 72,
        passed: Boolean(data.report?.passed),
        categories: data.report?.categories || [
          { category: "C++ Fundamentals", score: 75, rating: "Developing", notes: "Good syntax basics" },
          { category: "Memory Management & Pointers", score: 70, rating: "Developing", notes: "Review RAII and unique_ptr" },
          { category: "STL & Containers", score: 80, rating: "Strong", notes: "Solid container choices" },
          { category: "OOP & Systems Architecture", score: 65, rating: "Needs Practice", notes: "Review virtual destructors and vtable" },
          { category: "Communication & Reasoning", score: 75, rating: "Developing", notes: "Articulates trade-offs" },
        ],
        strengths: data.report?.strengths || ["Understands container complexity trade-offs", "Clean reasoning"],
        weaknesses: data.report?.weaknesses || ["Deep vtable layout", "Exception safety in constructors"],
        missedConcepts: data.report?.missedConcepts || ["Empty Base Optimization", "Strong exception safety"],
        recommendedModules: data.report?.recommendedModules || [
          { moduleId: "week-5", title: "Pointers & Dynamic Memory" },
          { moduleId: "week-19", title: "Polymorphism & Vtables" },
        ],
      };

      setReport(generatedReport);
      setScreen("report");
      onSaveReport?.(generatedReport);
    } catch (_err) {
      setErrorMsg("Failed to generate comprehensive interview report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* SCREEN 1: PRESET SELECTION */}
      {screen === "preset" && (
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold uppercase tracking-wider">
              <Brain className="h-3.5 w-3.5" />
              <span>Simulated FAANG / Systems Technical Loop</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Live C++ Mock Technical Interview
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Experience an authentic, rigorous technical interview conducted by a simulated Senior Staff Systems Engineer.
              The interviewer evaluates your architectural trade-offs, memory mechanics, Big-O analysis, and standard idioms.
            </p>
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Quick 15 min */}
            <div
              onClick={() => handleStartInterview("15-min")}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900/80 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Quick Loop</span>
                  <span className="flex items-center gap-1 text-purple-400">
                    <Clock className="h-3.5 w-3.5" /> ~15 min
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-3 group-hover:text-purple-300 transition-colors">
                  Rapid Technical Screen
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Fast-paced screening covering C++ fundamentals, type safety, references vs pointers, and memory layout.
                </p>
              </div>
              <button className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 group-hover:bg-purple-600 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5">
                <span>Start Screening</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Standard 30 min */}
            <div
              onClick={() => handleStartInterview("30-min")}
              className="relative p-6 rounded-2xl bg-slate-900 border-2 border-purple-500/60 shadow-xl shadow-purple-500/10 hover:border-purple-400 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="absolute -top-3 right-5 px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider">
                Recommended
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Standard Loop</span>
                  <span className="flex items-center gap-1 text-purple-400">
                    <Clock className="h-3.5 w-3.5" /> ~30 min
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-3 group-hover:text-purple-300 transition-colors">
                  Full Technical Interview
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Covers memory models, stack vs heap, RAII, STL internals (vector vs list vs hash maps), and algorithmic complexity.
                </p>
              </div>
              <button className="mt-6 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20">
                <span>Start Standard Loop</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Full 60 min */}
            <div
              onClick={() => handleStartInterview("60-min")}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900/80 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Staff / Systems Loop</span>
                  <span className="flex items-center gap-1 text-purple-400">
                    <Clock className="h-3.5 w-3.5" /> ~60 min
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-3 group-hover:text-purple-300 transition-colors">
                  Senior Deep Dive
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  In-depth systems questioning: vtable offsets, exception safety, lock-free concurrency, custom allocators, and system design.
                </p>
              </div>
              <button className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 group-hover:bg-purple-600 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5">
                <span>Start Senior Loop</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Past Reports if any */}
          {progress.mockInterviewReports && progress.mockInterviewReports.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white">Previous Interview Transcripts & Scorecards</h3>
              <div className="space-y-3">
                {progress.mockInterviewReports.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      setReport(r);
                      setScreen("report");
                    }}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                          r.passed
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {r.overallScore}%
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {r.preset === "15-min" ? "Quick Screen" : r.preset === "30-min" ? "Standard Loop" : "Senior Loop"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(r.timestamp).toLocaleDateString()} • {r.passed ? "Passed Threshold" : "Needs Review"}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCREEN 2: ACTIVE INTERVIEW SESSION */}
      {screen === "session" && (
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-80px)]">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Staff C++ Technical Interviewer</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                    {preset}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Current Focus: <span className="text-purple-300 font-medium">{PHASES[phaseIndex]?.label}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleConcludeInterview}
              disabled={isLoading || messages.length < 2}
              className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-40"
            >
              Conclude & Generate Scorecard
            </button>
          </div>

          {/* Phase Progress Bar */}
          <div className="grid grid-cols-4 gap-1.5 py-3 shrink-0">
            {PHASES.map((p, idx) => (
              <div
                key={p.id}
                className={`h-1.5 rounded-full transition-all ${
                  idx <= phaseIndex ? "bg-purple-500" : "bg-slate-800"
                }`}
                title={p.label}
              />
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start space-x-3 ${
                  m.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                  }`}
                >
                  {m.role === "user" ? "You" : <Brain className="h-4 w-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none whitespace-pre-wrap"
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md"
                  }`}
                >
                  <div className="markdown-body space-y-2">
                    <Markdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        code: ({ children, ...props }: any) => (
                          <code
                            className="px-1 py-0.5 rounded bg-slate-950 border border-slate-800 text-purple-300 font-mono text-[11px]"
                            {...props}
                          >
                            {children}
                          </code>
                        ),
                        pre: ({ children }: any) => (
                          <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-[11px] overflow-x-auto my-2">
                            {children}
                          </pre>
                        ),
                      }}
                    >
                      {m.text}
                    </Markdown>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400 text-right">{m.timestamp}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center space-x-2 text-xs text-purple-400 p-2">
                <Sparkles className="h-4 w-4 animate-spin" />
                <span>Interviewer is evaluating your response and preparing follow-ups...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 mb-2 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white text-xs underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Code Editor Drawer if toggled */}
          {showCodeEditor && (
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl mb-2 shrink-0">
              <div className="flex items-center justify-between mb-1.5 text-xs text-slate-300 font-mono">
                <span>C++ Code Implementation Snippet:</span>
                <button
                  type="button"
                  onClick={() => setShowCodeEditor(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-200"
                >
                  Close
                </button>
              </div>
              <textarea
                rows={5}
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="// Write or paste C++ code here..."
                spellCheck={false}
                className="w-full p-2.5 font-mono text-xs bg-slate-950 text-emerald-300 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
              />
            </div>
          )}

          {/* Candidate Input Area */}
          <div className="pt-2 shrink-0 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Respond to the interviewer:</span>
              <button
                type="button"
                onClick={() => setShowCodeEditor(!showCodeEditor)}
                className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 font-medium"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>{showCodeEditor ? "Hide Code Snippet" : "Attach C++ Code"}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <textarea
                rows={2}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Explain your technical reasoning, trade-offs, and complexity..."
                disabled={isLoading}
                className="flex-1 p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || (!userInput.trim() && !codeSnippet.trim())}
                className="h-12 w-12 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-colors shadow-lg shadow-purple-500/20"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 3: INTERVIEW SCORECARD REPORT */}
      {screen === "report" && report && (
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-in fade-in duration-300">
          {/* Header Banner */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Official Debrief Scorecard</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Interview Performance Report</h2>
              <p className="text-xs text-slate-400 mt-1">
                Completed on {new Date(report.timestamp).toLocaleDateString()} • Preset: {report.preset}
              </p>
            </div>

            <button
              onClick={() => setScreen("preset")}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>New Interview</span>
            </button>
          </div>

          {/* Overall Score Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <div
                className={`h-20 w-20 rounded-2xl flex flex-col items-center justify-center font-mono font-black text-2xl border ${
                  report.overallScore >= 70
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}
              >
                <span>{report.overallScore}%</span>
                <span className="text-[10px] font-sans font-bold text-slate-400">Overall</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-white">
                    {report.passed ? "Candidate Recommended: Hire" : "Candidate Outcome: Needs Practice"}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      report.passed
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {report.passed ? "Passing Threshold Met" : "Below 70% Threshold"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 max-w-lg leading-relaxed">
                  Evaluated across modern C++ language mechanics, memory models, runtime complexity, and systems communication.
                </p>
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Dimension Scorecard</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.categories.map((c, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">{c.category}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        c.rating === "Strong"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : c.rating === "Developing"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {c.rating} ({c.score}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{c.notes}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4" />
                <span>Demonstrated Strengths</span>
              </div>
              <ul className="space-y-1.5 text-xs text-emerald-200/90 list-disc list-inside">
                {report.strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            {/* Critical Weaknesses */}
            <div className="p-5 rounded-xl bg-red-950/20 border border-red-500/30 space-y-3">
              <div className="flex items-center space-x-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                <XCircle className="h-4 w-4" />
                <span>Critical Knowledge Gaps</span>
              </div>
              <ul className="space-y-1.5 text-xs text-red-200/90 list-disc list-inside">
                {report.weaknesses.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended Modules (Clickable!) */}
          {report.recommendedModules && report.recommendedModules.length > 0 && (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                <BookOpen className="h-4 w-4" />
                <span>Targeted Curriculum Recommendations</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {report.recommendedModules.map((mod) => (
                  <button
                    key={mod.moduleId}
                    onClick={() => {
                      onSelectUnit(mod.moduleId);
                    }}
                    className="p-3 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 flex items-center justify-between text-left transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-blue-300">
                        {mod.title}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{mod.moduleId}</div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="text-center pt-4">
            <button
              onClick={onNavigateHome}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-blue-500/20"
            >
              Return to Roadmap Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
