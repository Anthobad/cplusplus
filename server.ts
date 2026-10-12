import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { getCodeRunner } from "./server/codeRunner";
import { getTrustedChallenge } from "./server/challengeRegistry";
import { evaluateSubmission } from "./server/evaluateSubmission";
import { createRunnerServer } from "./runner/server";
import { AICodeFeedback } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialize Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Resilient model invocation with fallback chain
const RESILIENT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest"
];

async function generateContentWithResilience(
  ai: GoogleGenAI,
  params: { contents: any; config?: any }
): Promise<any> {
  let lastError: any = null;

  for (const model of RESILIENT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error("Gemini models unavailable");
}

// Health endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Fallback C++ Mentor Knowledge Engine
function getCppMentorFallbackReply(query: string, context?: string): string {
  const q = (query || "").toLowerCase();

  if (q.includes("unordered_map") || q.includes("hash map") || q.includes("collision")) {
    return `### \`std::unordered_map\` Internal Mechanics & Memory Layout

\`std::unordered_map\` is implemented using a **hash table with separate chaining**:
1. **Bucket Array**: A dynamic array of pointers to linked list nodes.
2. **Hash Function & Modulo**: Key is hashed via \`std::hash<Key>{}(k) % bucket_count\`.
3. **Collision Handling**: Separate chaining (singly-linked list per bucket).
4. **Load Factor & Rehash**: When \`load_factor() > max_load_factor()\` (default 1.0), it reallocates buckets and rehashes in $O(N)$.
5. **Complexity**: Average $O(1)$, Worst case $O(N)$ under hash collisions.`;
  }

  if (q.includes("vector") && (q.includes("push_back") || q.includes("capacity") || q.includes("realloc"))) {
    return `### \`std::vector\` Memory Model & Amortized $O(1)$ \`push_back\`

\`std::vector<T>\` manages 3 internal raw pointers:
- \`begin_\`: start of allocated memory
- \`end_\`: one past last element (\`size = end_ - begin_\`)
- \`capacity_end_\`: end of reserved storage (\`capacity = capacity_end_ - begin_\`)

#### Amortized $O(1)$ Growth:
When \`size == capacity\`, vector allocates $2 \\times$ (or 1.5x) memory, moves/copies elements, and destroys old memory. For $N$ elements, total copies $\\approx 2N$. $2N / N = O(1)$ amortized cost.`;
  }

  if (q.includes("smart pointer") || q.includes("unique_ptr") || q.includes("shared_ptr") || q.includes("weak_ptr")) {
    return `### Modern C++ Smart Pointers Comparison

| Pointer Type | Ownership | Size on 64-bit | Control Block? | Overhead |
| :--- | :--- | :--- | :--- | :--- |
| \`std::unique_ptr<T>\` | Sole ownership | 8 bytes (raw pointer) | No | Zero runtime overhead (EBO) |
| \`std::shared_ptr<T>\` | Shared ownership | 16 bytes (ptr + control block) | Yes (heap) | Atomic reference counting |
| \`std::weak_ptr<T>\` | Non-owning observer | 16 bytes | Yes (control block) | Must lock to access |

Always use \`std::make_unique\` (C++14) and \`std::make_shared\` (C++11) for memory safety and cache locality.`;
  }

  return `### C++ Systems Engineering Guidance

**Query**: "${query.slice(0, 60)}..."

In modern C++ systems programming:
1. **Deterministic Lifetime (RAII)**: Resources are bound to stack object lifetimes.
2. **Memory Layout**: Contiguous storage (\`std::vector\`, \`std::array\`) beats linked nodes due to hardware cache line prefetching.
3. **Value Semantics**: Prefer move semantics and \`std::unique_ptr\` over raw heap pointers.`;
}

// Progress-Aware AI Mentor endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const {
      messages,
      message,
      context,
      assessmentMode = "none",
      currentModule,
      completedModules = [],
      weakTopics = [],
      unstudiedTopics = [],
    } = req.body;

    // RULE 4: Enforce Assessment Mode restriction logically
    if (assessmentMode && assessmentMode !== "none") {
      return res.status(403).json({
        reply: "AI Mentor is disabled during assessment mode to preserve test integrity. Complete your assessment to resume AI assistance.",
        blockedByAssessment: true,
      });
    }

    const ai = getAIClient();

    let userQuery = "";
    if (typeof message === "string" && message.trim()) {
      userQuery = message.trim();
    } else if (Array.isArray(messages) && messages.length > 0) {
      const last = messages[messages.length - 1];
      userQuery = last.text || last.content || "";
    }

    if (!ai) {
      const reply = getCppMentorFallbackReply(userQuery, typeof context === "string" ? context : JSON.stringify(context));
      return res.json({ reply });
    }

    const conversationHistory: { role: "user" | "model"; parts: { text: string }[] }[] = [];
    if (Array.isArray(messages) && messages.length > 0) {
      for (const m of messages) {
        const text = m.text || m.content || "";
        if (!text) continue;
        conversationHistory.push({
          role: m.role === "assistant" || m.sender === "assistant" ? "model" : "user",
          parts: [{ text }],
        });
      }
    }

    if (conversationHistory.length === 0 && userQuery) {
      conversationHistory.push({
        role: "user",
        parts: [{ text: userQuery }],
      });
    }

    const systemInstruction = `You are an elite Senior C++ Staff Software Engineer & C++ Interview Mentor.
You are helping students learn modern C++ from fundamentals to senior systems/FAANG technical interview readiness.

Learner Progress Context:
- Current Module: ${currentModule ? JSON.stringify(currentModule) : "Browsing Roadmap"}
- Completed Modules: ${completedModules.length} completed
- Weak Areas / Needs Review: ${weakTopics.length > 0 ? weakTopics.join(", ") : "None reported yet"}
- Topics Not Yet Studied: ${unstudiedTopics.length > 0 ? unstudiedTopics.slice(0, 5).join(", ") : "Advanced topics"}

Pedagogical Directives:
1. Progress-Aware: Tailor explanations to the student's current progress. Avoid assuming knowledge of unstudied topics unless explicitly asked.
2. If the user asks for a quiz or practice ("Quiz me on X"), give a challenging C++ interview question with code.
3. If the user asks for a harder version or hints ("Give me a harder version", "Explain without giving the final solution"), adjust difficulty and provide guiding conceptual nudges.
4. Deep Systems Focus: Always explain memory mechanics (stack vs heap, cache locality, alignment, vtable offsets, RAII, move semantics).
5. Never provide fake or unverified answers. Show standard-compliant C++20 code.`;

    try {
      const response = await generateContentWithResilience(ai, {
        contents: conversationHistory.length > 0
          ? conversationHistory
          : [{ role: "user", parts: [{ text: userQuery || "Hello C++ Mentor!" }] }],
        config: {
          systemInstruction,
          temperature: 0.35,
        },
      });

      const reply = response.text || getCppMentorFallbackReply(userQuery, context);
      return res.json({ reply });
    } catch (_genError: any) {
      const fallbackReply = getCppMentorFallbackReply(userQuery, typeof context === "string" ? context : JSON.stringify(context));
      return res.json({ reply: fallbackReply });
    }
  } catch (error: any) {
    const fallbackReply = getCppMentorFallbackReply(req.body?.message || "", req.body?.context);
    res.json({ reply: fallbackReply });
  }
});

// Helper for qualitative AI Code Review
async function getQualitativeAIFeedback(
  ai: GoogleGenAI | null,
  code: string,
  challengeTitle: string,
  expectedBehavior: string,
  compilerOutcome: { compiled: boolean; passed: boolean; compileError?: string; runtimeError?: string }
): Promise<AICodeFeedback | undefined> {
  if (!ai || !code.trim()) return undefined;

  const prompt = `Review this student C++ code for: "${challengeTitle}".
Expected: ${expectedBehavior}

Student Code:
\`\`\`cpp
${code}
\`\`\`

Verification Outcome (determined by real compiler/tests):
- Compiled: ${compilerOutcome.compiled}
- Passed All Tests: ${compilerOutcome.passed}
${compilerOutcome.compileError ? `Compile Errors:\n${compilerOutcome.compileError}` : ""}
${compilerOutcome.runtimeError ? `Runtime Errors:\n${compilerOutcome.runtimeError}` : ""}

Provide qualitative code review feedback in JSON format:
{
  "feedback": "2-3 concise sentences on code quality, memory safety, and modern C++ idioms",
  "qualityScore": number (0 to 100),
  "readabilityScore": number (0 to 100),
  "timeComplexity": "e.g. O(N)",
  "spaceComplexity": "e.g. O(1)",
  "suggestions": ["list of actionable C++ recommendations (const ref, reserve, RAII)"],
  "alternativeApproaches": ["different algorithmic or container approaches"],
  "interviewTips": ["relevant senior interview advice"]
}`;

  try {
    const response = await generateContentWithResilience(ai, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });
    return JSON.parse(response.text || "{}") as AICodeFeedback;
  } catch (err) {
    console.warn("AI review generation skipped:", err);
    return undefined;
  }
}

// Request flooding & duplicate in-flight evaluation prevention
const inFlightEvaluations = new Map<string, Promise<{ status: number; result: any }>>();
const recentClientRequests = new Map<string, number>();

// REAL C++ Code Execution & Evaluation endpoint
// The compiler and test runner exclusively decide correctness.
app.post("/api/evaluate-code", async (req, res) => {
  try {
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown";
    const now = Date.now();
    const lastReq = recentClientRequests.get(clientIp) || 0;

    // Reject rapid repeated clicks (< 300ms) to prevent accidental UI flooding
    if (now - lastReq < 300) {
      return res.status(429).json({
        compiled: false,
        passed: false,
        score: 0,
        testsPassed: 0,
        totalTests: 0,
        testResults: [],
        mode: req.body?.mode || "practice",
        wasAssisted: Boolean(req.body?.wasAssisted),
        verified: false,
        error: "Please wait a moment before re-submitting.",
      });
    }
    recentClientRequests.set(clientIp, now);

    // Bounded cleanup for client IP map
    if (recentClientRequests.size > 1000) {
      const expiry = now - 60000;
      for (const [ip, ts] of recentClientRequests.entries()) {
        if (ts < expiry) recentClientRequests.delete(ip);
      }
    }

    // Deduplicate identical in-flight submissions from the same client
    const sourceCode = (req.body.code || req.body.studentCode || "").trim();
    const dedupeKey = `${clientIp}:${req.body.challengeId || ""}:${req.body.mode || ""}:${sourceCode}`;

    let evalPromise = inFlightEvaluations.get(dedupeKey);
    if (!evalPromise) {
      evalPromise = evaluateSubmission(req.body).finally(() => {
        inFlightEvaluations.delete(dedupeKey);
      });
      inFlightEvaluations.set(dedupeKey, evalPromise);
    }

    const { status, result } = await evalPromise;

    // Attach qualitative AI feedback if requested (AI NEVER overrides compiler/test pass/fail)
    const requestAiFeedback = req.body.requestAiFeedback !== false;

    if (requestAiFeedback && result.compiled) {
      const ai = getAIClient();
      try {
        const registryChallenge = req.body.challengeId ? getTrustedChallenge(req.body.challengeId) : undefined;
        const feedback = await getQualitativeAIFeedback(
          ai,
          sourceCode,
          registryChallenge?.title || req.body.challengeTitle || "C++ Coding Challenge",
          req.body.expectedBehavior || "Correct implementation",
          result
        );
        if (feedback) {
          result.aiFeedback = feedback;
        }
      } catch (_e) {}
    }

    return res.status(status).json(result);
  } catch (error: any) {
    console.error("Evaluation service failure:", error);
    // Explicit error response without modifying progression (Requirement 1, 2 & 18)
    return res.status(503).json({
      compiled: false,
      passed: false,
      score: 0,
      testsPassed: 0,
      totalTests: 0,
      testResults: [],
      mode: req.body?.mode || "practice",
      wasAssisted: Boolean(req.body?.wasAssisted),
      verified: false,
      error: "Code evaluation is temporarily unavailable. Your attempt was not counted.",
      compileError: "The C++ evaluation runner could not execute. Your attempt was not counted.",
    });
  }
});

// Assessment: Conceptual Explanation Evaluation (Milestone Exam Part E)
app.post("/api/assess-explanation", async (req, res) => {
  try {
    const { question, studentAnswer, rubricKeywords = [], maxPoints = 10 } = req.body;
    const ai = getAIClient();

    if (!ai || !studentAnswer || !studentAnswer.trim()) {
      return res.json({
        score: 0,
        maxPoints,
        feedback: "Please provide an explanation to receive points.",
        coveredKeywords: [],
        missedKeywords: rubricKeywords,
        aiEvaluated: true,
      });
    }

    const prompt = `You are evaluating a student's answer to a senior C++ interview conceptual question.
Question: "${question}"
Rubric Keywords expected: ${JSON.stringify(rubricKeywords)}
Max Points: ${maxPoints}

Student Answer:
"${studentAnswer}"

Evaluate whether the explanation demonstrates true technical understanding (memory mechanics, runtime vs compile-time behavior, standard semantics).
Return JSON strictly in this structure:
{
  "score": number (between 0 and ${maxPoints}),
  "feedback": "2-3 sentences evaluating the answer's technical accuracy and depth",
  "coveredKeywords": ["list of rubric concepts student correctly explained"],
  "missedKeywords": ["list of rubric concepts omitted or described inaccurately"],
  "idealAnswerSummary": "Concise senior engineer model response"
}`;

    const response = await generateContentWithResilience(ai, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const data = JSON.parse(response.text || "{}");
    return res.json({
      ...data,
      maxPoints,
      aiEvaluated: true,
    });
  } catch (err: any) {
    return res.json({
      score: 0,
      maxPoints: req.body.maxPoints || 10,
      feedback: "Explanation evaluation is temporarily unavailable.",
      coveredKeywords: [],
      missedKeywords: [],
      aiEvaluated: true,
    });
  }
});

// Mock Interview AI Agent endpoint
app.post("/api/mock-interview", async (req, res) => {
  try {
    const {
      history = [],
      currentPhase = "fundamentals",
      preset = "30-min",
      userMessage,
      action = "continue", // "continue" | "finish"
    } = req.body;

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({ error: "AI Interviewer unavailable" });
    }

    if (action === "finish") {
      // Generate structured final scorecard report
      const reportPrompt = `You are an elite Senior Staff C++ Engineering Interviewer conducting a debrief.
Interview Preset: ${preset}
Transcript:
${JSON.stringify(history)}

Generate a comprehensive, realistic interview performance scorecard.
Return JSON strictly matching this schema:
{
  "overallScore": number (0 to 100),
  "passed": boolean (overallScore >= 70),
  "categories": [
    {
      "category": "C++ Fundamentals",
      "score": number (0 to 100),
      "rating": "Strong" | "Developing" | "Needs Practice" | "Needs Review",
      "notes": "Specific critique from transcript"
    },
    {
      "category": "Memory Management & Pointers",
      "score": number (0 to 100),
      "rating": "Strong" | "Developing" | "Needs Practice" | "Needs Review",
      "notes": "Critique on stack/heap/RAII/smart pointers"
    },
    {
      "category": "STL & Containers",
      "score": number (0 to 100),
      "rating": "Strong" | "Developing" | "Needs Practice" | "Needs Review",
      "notes": "Critique on container choices and algorithms"
    },
    {
      "category": "OOP & System Design",
      "score": number (0 to 100),
      "rating": "Strong" | "Developing" | "Needs Practice" | "Needs Review",
      "notes": "Critique on vtable, polymorphism, SOLID"
    },
    {
      "category": "Communication & Reasoning",
      "score": number (0 to 100),
      "rating": "Strong" | "Developing" | "Needs Practice" | "Needs Review",
      "notes": "Critique on articulating technical trade-offs"
    }
  ],
  "strengths": ["list of 2-3 genuine strengths demonstrated"],
  "weaknesses": ["list of 2-3 specific technical gaps"],
  "missedConcepts": ["specific terms or idioms missed, e.g. EBO, spurious wakeups, move constructor noexcept"],
  "recommendedModules": [
    { "moduleId": "week-18", "title": "Smart Pointers" }
  ]
}`;

      const response = await generateContentWithResilience(ai, {
        contents: [{ role: "user", parts: [{ text: reportPrompt }] }],
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const report = JSON.parse(response.text || "{}");
      return res.json({ report });
    }

    // Interactive Interviewer behavior (Requirement 11):
    // Does NOT reveal answers immediately; asks follow-ups, challenges assumptions, requests complexity analysis.
    const systemPrompt = `You are a real-world Senior C++ Staff Software Engineer conducting a live technical interview for a systems role.
Current Phase: ${currentPhase} (Phases: fundamentals -> memory/internals -> coding -> oop/design -> follow-up)
Preset: ${preset}

Interviewer Behavioral Rules:
1. Do NOT teach or reveal correct answers.
2. Ask ONE focused question at a time.
3. When the candidate answers:
   - Challenge their assumptions (e.g. "What if the input is too large to fit in RAM?", "Why did you choose unordered_map over map?")
   - Ask for time & space complexity
   - Probe for edge cases and undefined behavior
4. If the candidate struggles, give a subtle interview hint without solving it.
5. Keep tone professional, rigorous, and authentic to a FAANG/HFT C++ interview.`;

    const contents = history.map((h: any) => ({
      role: h.role === "assistant" || h.role === "interviewer" ? "model" : "user",
      parts: [{ text: h.text || h.message || "" }],
    }));

    if (userMessage) {
      contents.push({ role: "user", parts: [{ text: userMessage }] });
    }

    const response = await generateContentWithResilience(ai, {
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4,
      },
    });

    const reply = response.text || "Could you explain the memory layout implications of that choice?";
    return res.json({ reply });
  } catch (err: any) {
    console.error("Mock interview error:", err);
    return res.status(500).json({ error: "Failed to generate interviewer response" });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";
  const RUNNER_PORT = parseInt(process.env.RUNNER_PORT || "8088", 10);

  if (!isProduction) {
    // Development convenience: start local sandbox runner daemon on loopback port if unconfigured
    if (!process.env.ISOLATED_RUNNER_ENDPOINT) {
      try {
        const runnerServer = createRunnerServer();
        runnerServer.on("error", (err: any) => {
          if (err.code === "EADDRINUSE") {
            console.log(`[Isolated C++ Runner] Dev sandbox daemon already active on port ${RUNNER_PORT}`);
          } else {
            console.warn("[Isolated C++ Runner] Runner server notice:", err.message);
          }
        });
        runnerServer.listen(RUNNER_PORT, "127.0.0.1", () => {
          console.log(`[Isolated C++ Runner] Local dev sandbox daemon listening on http://127.0.0.1:${RUNNER_PORT}`);
        });
        process.env.ISOLATED_RUNNER_ENDPOINT = `http://127.0.0.1:${RUNNER_PORT}`;
      } catch (runnerErr: any) {
        console.warn("[Isolated C++ Runner] Could not start local daemon:", runnerErr.message);
      }
    }
  } else {
    // Production Security: in-container C++ execution is strictly prohibited.
    if (process.env.ISOLATED_RUNNER_ENDPOINT) {
      console.log(
        `[Production Architecture] Delegating to authenticated external Cloud Run runner: ${process.env.ISOLATED_RUNNER_ENDPOINT}`
      );
    } else {
      console.log(
        "[Production Architecture] No external Cloud Run runner configured. " +
        "Delegating to zero-cost Wandbox C++20 execution provider ($0, no billing required)."
      );
    }
  }

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`C++ Roadmap server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
