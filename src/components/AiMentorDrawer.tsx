import React, { useState, useRef, useEffect } from "react";
import { X, Send, Brain, Bot, User, Sparkles, AlertCircle, Trash2 } from "lucide-react";
import Markdown from "react-markdown";
import { Unit } from "../types";
import { useAssessment } from "../lib/AssessmentContext";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

interface AiMentorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUnit?: Pick<Unit, "title" | "weekNumber" | "topics"> | null;
  isDisabledDueToExamOrQuiz?: boolean;
}

export const AiMentorDrawer: React.FC<AiMentorDrawerProps> = ({
  isOpen,
  onClose,
  currentUnit,
  isDisabledDueToExamOrQuiz = false
}) => {
  const { canUseAiMentor, assessmentMode, assessmentTitle } = useAssessment();
  const isLocked = !canUseAiMentor || isDisabledDueToExamOrQuiz;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      sender: "assistant",
      text: "Hello! I am your AI C++ Systems Mentor. Ask me about pointer arithmetic, memory layouts, vtables, cache locality, or have me explain why a code snippet compiles or crashes.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading || isLocked) return;

    const userMessage: Message = {
      id: "user-" + Date.now(),
      sender: "user",
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentMode,
          message: userMessage.text,
          messages: [...messages, userMessage].map(m => ({
            role: m.sender === "assistant" ? "model" : "user",
            content: m.text
          })),
          context: currentUnit
            ? `Current Unit: ${currentUnit.title} (Topic ${currentUnit.weekNumber}). Topics: ${currentUnit.topics.join(", ")}.`
            : "Student is browsing the C++ Systems Roadmap."
        })
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          throw new Error(errData.reply || "AI Mentor is locked during assessment.");
        }
        throw new Error("Failed to contact AI mentor server");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: "assistant-" + Date.now(),
        sender: "assistant",
        text: data.reply || "I encountered an error generating a response.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: "err-" + Date.now(),
        sender: "assistant",
        text: "Sorry, I had trouble reaching the AI Mentor server. Please check your connection and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "welcome-msg",
        sender: "assistant",
        text: "History cleared. What C++ concept or code challenge would you like to explore?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Gemini C++ Mentor
              <span className="text-[10px] font-normal bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded">
                AI Powered
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {currentUnit ? `Context: Topic ${currentUnit.weekNumber}` : "General C++ Assistant"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            id="close-ai-drawer"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Lock Notice if in Exam, Quiz, or Assessment */}
      {isLocked && (
        <div className="p-4 bg-amber-950/40 border-b border-amber-500/40 text-amber-300 text-xs flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-semibold block">AI Mentor Locked During Assessment</span>
            The C++ Mentor is strictly disabled during active assessments ({assessmentTitle || assessmentMode}) to preserve test integrity.
          </div>
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start space-x-2.5 ${
              msg.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
            }`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-purple-600/20 text-purple-400 border border-purple-500/30"
              }`}
            >
              {msg.sender === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-tr-none whitespace-pre-wrap"
                  : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm"
              }`}
            >
              {msg.sender === "user" ? (
                <div>{msg.text}</div>
              ) : (
                <div className="markdown-body space-y-2">
                  <Markdown
                    components={{
                      h1: ({ children }) => (
                        <h3 className="text-sm font-bold text-white mt-2.5 mb-1 pb-1 border-b border-slate-800">
                          {children}
                        </h3>
                      ),
                      h2: ({ children }) => (
                        <h4 className="text-xs font-bold text-white mt-2 mb-1">
                          {children}
                        </h4>
                      ),
                      h3: ({ children }) => (
                        <h5 className="text-xs font-semibold text-blue-300 mt-2 mb-1">
                          {children}
                        </h5>
                      ),
                      p: ({ children }) => (
                        <p className="my-1.5 text-slate-200 leading-relaxed first:mt-0 last:mb-0">
                          {children}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-white">
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-slate-300">
                          {children}
                        </em>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-4 space-y-1 my-1.5 text-slate-300">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-4 space-y-1 my-1.5 text-slate-300">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="leading-relaxed">
                          {children}
                        </li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-blue-500/60 pl-2.5 my-1.5 text-slate-400 italic">
                          {children}
                        </blockquote>
                      ),
                      hr: () => <hr className="my-2.5 border-slate-800" />,
                      code: ({ className, children, ...props }: any) => {
                        const isCodeBlock = className && className.includes("language-");
                        if (isCodeBlock) {
                          return (
                            <code className="block font-mono text-[11px] text-emerald-300 whitespace-pre overflow-x-auto" {...props}>
                              {children}
                            </code>
                          );
                        }
                        return (
                          <code
                            className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-blue-300 font-mono text-[11px]"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children }) => (
                        <pre className="my-2 overflow-x-auto rounded-xl bg-slate-900/90 border border-slate-800/80 p-3 font-mono text-[11px] leading-relaxed text-emerald-300">
                          {children}
                        </pre>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline font-medium"
                        >
                          {children}
                        </a>
                      )
                    }}
                  >
                    {msg.text}
                  </Markdown>
                </div>
              )}
              <div
                className={`text-[10px] mt-1.5 text-right ${
                  msg.sender === "user" ? "text-blue-200" : "text-slate-500"
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-2xl rounded-tl-none px-4 py-3 bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center space-x-2">
              <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-spin" />
              <span>Analyzing C++ concepts...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts (if empty or starting) */}
      {messages.length <= 2 && !isLocked && (
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 flex flex-wrap gap-1.5">
          {[
            "Explain how an unordered_map works under the hood",
            "Why is vector push_back amortized O(1)?",
            "What is a virtual destructor and why is it needed?"
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(prompt);
              }}
              className="text-[11px] bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-700/50 transition-colors text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950/80">
        <div className="relative flex items-center">
          <textarea
            rows={2}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              isLocked
                ? `AI Mentor is locked during ${assessmentTitle || assessmentMode}...`
                : "Ask anything about C++, memory, pointers, or compile errors..."
            }
            disabled={isLocked || isLoading}
            className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLocked || isLoading || !inputText.trim()}
            className="absolute right-2 bottom-2.5 p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:hover:bg-purple-600 text-white transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
