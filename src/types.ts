export type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced" | "Interview Ready";

export type AssessmentMode =
  | "none"
  | "quiz"
  | "exam"
  | "coding-assessment"
  | "mock-interview";

export interface CodeSnippet {
  title: string;
  code: string;
  explanation: string;
}

export interface TheorySection {
  title: string;
  content: string;
  codeSnippets?: CodeSnippet[];
  callout?: {
    type: "info" | "warning" | "interview-tip" | "memory";
    text: string;
  };
}

export interface DeepDive {
  topic: string;
  breakdown: string[];
  diagramAscii?: string;
  interviewQuestion: string;
  idealAnswer: string;
}

export interface CodeExample {
  id: string;
  title: string;
  code: string;
  explanation: string;
  output?: string;
  keyTakeaways: string[];
}

export interface TrueFalseQuestion {
  id: string;
  statement: string;
  codeSnippet?: string;
  isTrue: boolean;
  explanation: string;
}

export interface MCQQuestion {
  id: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category?: string;
}

export interface WhyThisWorks {
  id: string;
  title: string;
  code: string;
  question: string;
  stepByStep: string[];
  coreConcept: string;
}

export interface TestCase {
  id?: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
  isHidden?: boolean;
}

export interface TestResult {
  stderr?: string;
  exitCode?: number;
  testId?: string;
  passed: boolean;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  executionTimeMs?: number;
  isHidden: boolean;
  error?: string;
}

export interface AICodeFeedback {
  feedback: string;
  qualityScore?: number;
  readabilityScore?: number;
  timeComplexity?: string;
  spaceComplexity?: string;
  suggestions: string[];
  alternativeApproaches?: string[];
  interviewTips?: string[];
}

export interface CodeSubmissionRequest {
  challengeId: string;
  studentCode: string;
  mode: "practice" | "assessment";
  wasAssisted: boolean;
  requestAiFeedback?: boolean;
  challengeTitle?: string;
  expectedBehavior?: string;
}

export interface CodeEvaluationResult {
  compilationTimeMs?: number;
  compiled: boolean;
  passed: boolean;
  score: number; // 0 - 100
  compileError?: string;
  runtimeError?: string;
  executionTimeMs?: number;
  testsPassed: number;
  totalTests: number;
  testResults: TestResult[];
  aiFeedback?: AICodeFeedback;
  mode?: "practice" | "assessment";
  wasAssisted?: boolean;
  verified?: boolean;
  configurationError?: boolean;
  error?: string;
}

export interface CodingChallenge {
  id: string;
  title: string;
  description?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  initialCode: string;
  solutionCode: string;
  testCases: TestCase[];
  hints: string[];
  expectedBehavior: string;
  estimatedTime?: string;
  tags?: string[];
  constraints?: string[];
  timeComplexityExpectation?: string;
  spaceComplexityExpectation?: string;
  driverCode?: string;
  category?: "stl-usage" | "implementation" | "algorithm" | "systems";
}

export interface UnitQuizQuestion {
  id: string;
  type: "mcq" | "true_false" | "code_output";
  question: string;
  codeSnippet?: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export type QuizQuestion = UnitQuizQuestion;

export interface UnitQuiz {
  id: string;
  title: string;
  passingScorePercentage: number; // e.g., 70
  questions: UnitQuizQuestion[];
}

export type Quiz = UnitQuiz;

export interface Unit {
  id: string; // e.g. "week-1", "week-18" (stable internal ID)
  weekNumber: number; // Module sequential index (1 to 39)
  phaseId: string;
  title: string;
  subtitle: string;
  goals: string;
  estimatedHours?: string; // e.g. "2–3 hours"
  topics: string[];
  theory: {
    overview: string;
    sections: TheorySection[];
  };
  deepDive: DeepDive;
  codeExamples: CodeExample[];
  exercises: {
    trueFalse: TrueFalseQuestion[];
    mcqs: MCQQuestion[];
    whyThisWorks: WhyThisWorks[];
    codingChallenge: CodingChallenge;
  };
  quiz: UnitQuiz;
}

export interface Phase {
  id: string; // e.g. "phase-1"
  number: number;
  title: string;
  weeksRange: string;
  calendarMonth: string;
  description: string;
  color: string;
  iconName: string;
  weeks: Unit[];
}

export interface TopicPerformance {
  topicId: string;
  topicTitle: string;
  domainId: string;
  attempts: number;
  correct: number;
  incorrect: number;
  codingAttempts: number;
  codingPasses: number;
  lastAttemptAt: string;
  masteryScore: number; // 0 - 100
}

export interface MockInterviewReport {
  id: string;
  timestamp: string | number;
  preset: "15-min" | "30-min" | "60-min";
  overallScore: number; // 0 - 100
  passed: boolean;
  categories: {
    category: string;
    score: number;
    rating: "Strong" | "Developing" | "Needs Practice" | "Needs Review";
    notes: string;
  }[];
  strengths: string[];
  weaknesses: string[];
  missedConcepts: string[];
  recommendedModules: { moduleId: string; title: string }[];
  detailedTranscript?: { role: "user" | "interviewer"; message: string; timestamp: string }[];
}

export interface UserProgress {
  userId?: string;
  unlockedUnits: string[];
  completedUnits: string[];
  completedUnitIds: string[]; // alias for completedUnits
  
  // Explicit progress tiers:
  lessonsCompleted?: string[];
  practiceCompleted?: string[];
  assessmentPassed?: string[];
  verifiedCodingPassed?: string[];

  unitQuizScores: Record<string, {
    score: number;
    passed: boolean;
    attempts: number;
    timestamp: string | number;
  }>;
  quizScores: Record<string, {
    score: number;
    passed: boolean;
    attempts?: number;
    timestamp?: number;
  }>;
  examAttempts: Record<string, ExamAttempt>;
  codingChallengeResults?: Record<string, {
    passed: boolean;
    score: number;
    testsPassed: number;
    totalTests: number;
    timestamp: string | number;
    wasAssisted?: boolean;
    verified?: boolean;
    executionTimeMs?: number;
  }>;
  topicPerformance?: Record<string, TopicPerformance>;
  mockInterviewReports?: MockInterviewReport[];

  currentUnitId: string;
  currentWeekNumber: number;
  streakDays: number;
  lastActiveDate: string;
  lastActiveTimestamp?: number;
  studySessionsCount: number;
  studentName: string;
  studentLevel: DifficultyLevel;
  totalCodingChallengesSolved: number;
  assessmentMode?: AssessmentMode;
}

export type ExamPartType = 
  | "knowledge"       // Part A: 10 MCQs
  | "code-reading"    // Part B: 5 Code Reading (output, UB, lifetime, complexity)
  | "debugging"       // Part C: 3 Bug hunting / fixing questions
  | "coding"          // Part D: 2 Real Compiler Tested problems
  | "explanation";    // Part E: 2 Conceptual Rubric questions

export interface ExamQuestionDetail {
  id: string;
  part?: ExamPartType;
  type: "mcq" | "true-false" | "code-reading" | "debugging" | "coding-challenge" | "interview-explanation" | "why-this-code-works" | "code-analysis";
  points: number;
  question: string;
  category?: string;
  difficulty?: "Easy" | "Medium" | "Hard" | "Advanced";
  codeSnippet?: string;
  options?: string[];
  correctAnswer?: any;
  explanation: string;
  rubricKeywords?: string[];
  // For coding questions in exams:
  initialCode?: string;
  codingChallengeId?: string;
  codingInstructions?: string;
  testCases?: TestCase[];
  driverCode?: string;
}

export interface ExamWeights {
  knowledge: number;     // e.g. 20%
  codeReading: number;   // e.g. 15%
  debugging: number;     // e.g. 20%
  coding: number;        // e.g. 35%
  explanation: number;   // e.g. 10%
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  subtitle?: string;
  durationMinutes: number;
  passingScore: number; // 50
  allowCppReference: boolean;
  coversPhases: number[];
  questions: ExamQuestionDetail[];
  weights?: ExamWeights;
  poolSize?: number;
  isRandomizedPool?: boolean;
}

export type ExamInstance = Exam;

export interface ExamAttempt {
  id?: string;
  examId: string;
  examTitle?: string;
  score: number; // 0 - 100 weighted
  passed: boolean; // score >= 50
  timestamp?: number;
  timeSpentSeconds?: number;
  tabSwitchWarnings?: number;
  tabSwitchCount?: number;
  answers?: Record<string, any>;
  partScores?: {
    knowledge?: number;
    codeReading?: number;
    debugging?: number;
    coding?: number;
    explanation?: number;
  };
  generatedQuestions?: ExamQuestionDetail[];
  codingResults?: Record<string, CodeEvaluationResult>;
  completedAt?: string;
  verified?: boolean;
}

export interface CppDocItem {
  id?: string;
  name: string;
  title?: string;
  category: string;
  header: string;
  synopsis?: string;
  timeComplexity?: string;
  description: string;
  example?: string;
  exampleCode?: string;
  commonPitfalls?: string;
  pitfalls?: string[];
  commonMembers?: { name: string; desc: string; complexity: string }[];
}

export interface InterviewReadinessDimension {
  name: string;
  score: number; // 0 - 100
  status: "Strong" | "Developing" | "Needs Practice" | "Needs Review";
  details: string;
}

export interface InterviewReadinessReport {
  overallScore: number;
  readinessLabel: "Interview Ready" | "Solid Progress" | "Developing" | "Novice";
  dimensions: InterviewReadinessDimension[];
  criticalWeaknesses: string[];
  nextSteps: string[];
}
