import { UserProgress, Unit } from "../types";
import { ALL_UNITS, getUnitById } from "../data/curriculum";

export type ReadinessStatus = "Strong" | "Developing" | "Needs Review" | "Insufficient Data";

export interface DimensionReadiness {
  name: string;
  status: ReadinessStatus;
  score: number; // 0 - 100
  dataPointsCount: number;
  details: string;
}

export interface WeakTopicItem {
  unitId: string;
  topicTitle: string;
  score: number;
  type: "quiz" | "coding" | "exam";
  reason: string;
}

export interface ReadinessSummary {
  overallScore: number;
  overallStatus: ReadinessStatus;
  dimensions: DimensionReadiness[];
  weakTopics: WeakTopicItem[];
  hasEnoughData: boolean;
}

/**
 * Calculates deterministic interview readiness based strictly on verified stored learner data.
 */
export function calculateReadiness(progress: UserProgress): ReadinessSummary {
  const quizScores = progress.quizScores || {};
  const examAttempts = progress.examAttempts || {};
  const codingResults = progress.codingChallengeResults || {};
  const mockReports = progress.mockInterviewReports || [];

  // Helper to calculate average of relevant quiz IDs
  const getAverageForUnits = (unitIds: string[]): { avg: number; count: number } => {
    let total = 0;
    let count = 0;

    for (const uId of unitIds) {
      const unit = getUnitById(uId);
      if (!unit) continue;
      
      // Look up quiz score by canonical quiz.id, quiz-t{N}, quiz-w{N}, or direct unit ID
      const scoreObj =
        quizScores[unit.quiz.id] ||
        quizScores[`quiz-t${unit.weekNumber}`] ||
        quizScores[`quiz-w${unit.weekNumber}`] ||
        quizScores[`quiz-${unit.weekNumber}`] ||
        quizScores[unit.id];

      if (scoreObj && typeof scoreObj.score === "number") {
        total += scoreObj.score;
        count++;
      }
    }

    return { avg: count > 0 ? Math.round(total / count) : 0, count };
  };

  const getStatus = (score: number, count: number): ReadinessStatus => {
    if (count === 0) return "Insufficient Data";
    if (score >= 80) return "Strong";
    if (score >= 65) return "Developing";
    return "Needs Review";
  };

  // 1. C++ Fundamentals (Topics 1-10: Program Structure, Types, Memory Sizes, Ops, Math, I/O, Conditionals, Loops, Methods, Strings)
  const fundData = getAverageForUnits(["topic-1", "topic-2", "topic-3", "topic-4", "topic-5", "topic-6", "topic-7", "topic-8", "topic-9", "topic-10"]);
  const fundExam = examAttempts["exam-foundations"];
  let fundScore = fundData.avg;
  let fundCount = fundData.count;
  if (fundExam && typeof fundExam.score === "number") {
    fundScore = Math.round((fundScore * fundCount + fundExam.score) / (fundCount + 1));
    fundCount++;
  }
  const fundStatus = getStatus(fundScore, fundCount);

  // 2. Memory Management & Smart Pointers (Topics 3, 11, 18)
  const memData = getAverageForUnits(["topic-3", "topic-11", "topic-18"]);
  const memStatus = getStatus(memData.avg, memData.count);

  // 3. STL Containers (Topics 17, 19, 20, 21, 22)
  const stlData = getAverageForUnits(["topic-17", "topic-19", "topic-20", "topic-21", "topic-22"]);
  const stlExam = examAttempts["exam-stl"];
  let stlScore = stlData.avg;
  let stlCount = stlData.count;
  if (stlExam && typeof stlExam.score === "number") {
    stlScore = Math.round((stlScore * stlCount + stlExam.score) / (stlCount + 1));
    stlCount++;
  }
  const stlStatus = getStatus(stlScore, stlCount);

  // 4. Data Structures (Topics 21-27: Sets, Maps, Stacks, Queues, Trees, Graphs)
  const dsData = getAverageForUnits(["topic-21", "topic-22", "topic-23", "topic-24", "topic-25", "topic-26", "topic-27"]);
  const dsStatus = getStatus(dsData.avg, dsData.count);

  // 5. Algorithms & Complexity (Topics 34-39: Big-O, Sorting, Searching, Recursion)
  const algoData = getAverageForUnits(["topic-34", "topic-35", "topic-36", "topic-37", "topic-38", "topic-39"]);
  const finalExam = examAttempts["exam-final"];
  let algoScore = algoData.avg;
  let algoCount = algoData.count;
  if (finalExam && typeof finalExam.score === "number") {
    algoScore = Math.round((algoScore * algoCount + finalExam.score) / (algoCount + 1));
    algoCount++;
  }
  const algoStatus = getStatus(algoScore, algoCount);

  // 6. OOP & Systems Architecture (Topics 15, 28-33: Classes, Inheritance, Polymorphism, SOLID, Templates, Concurrency)
  const oopData = getAverageForUnits(["topic-15", "topic-28", "topic-29", "topic-30", "topic-31", "topic-32", "topic-33"]);
  const sysExam = examAttempts["exam-systems"];
  let oopScore = oopData.avg;
  let oopCount = oopData.count;
  if (sysExam && typeof sysExam.score === "number") {
    oopScore = Math.round((oopScore * oopCount + sysExam.score) / (oopCount + 1));
    oopCount++;
  }
  const oopStatus = getStatus(oopScore, oopCount);

  // 7. Verified Coding Performance
  const codingEntries = Object.values(codingResults);
  const codingCount = codingEntries.length;
  const verifiedPasses = codingEntries.filter((c: any) => c.passed && c.verified).length;
  const codingScore = codingCount > 0 ? Math.round((verifiedPasses / codingCount) * 100) : 0;
  const codingStatus = getStatus(codingScore, codingCount);

  // 8. Interview Performance
  const interviewCount = mockReports.length;
  const interviewScore =
    interviewCount > 0
      ? Math.round(mockReports.reduce((acc, r) => acc + (r.overallScore || 0), 0) / interviewCount)
      : 0;
  const interviewStatus = getStatus(interviewScore, interviewCount);

  const dimensions: DimensionReadiness[] = [
    {
      name: "C++ Fundamentals",
      status: fundStatus,
      score: fundScore,
      dataPointsCount: fundCount,
      details: fundCount > 0 ? `${fundScore}% average across foundational quizzes & exams` : "No assessment data yet",
    },
    {
      name: "Memory Management & Pointers",
      status: memStatus,
      score: memData.avg,
      dataPointsCount: memData.count,
      details: memData.count > 0 ? `${memData.avg}% average on pointer, stack/heap, and RAII modules` : "No assessment data yet",
    },
    {
      name: "STL Containers",
      status: stlStatus,
      score: stlScore,
      dataPointsCount: stlCount,
      details: stlCount > 0 ? `${stlScore}% average across STL container quizzes & exams` : "No assessment data yet",
    },
    {
      name: "Data Structures",
      status: dsStatus,
      score: dsData.avg,
      dataPointsCount: dsData.count,
      details: dsData.count > 0 ? `${dsData.avg}% on vector, list, red-black tree, and hash map topics` : "No assessment data yet",
    },
    {
      name: "Algorithms & Complexity",
      status: algoStatus,
      score: algoScore,
      dataPointsCount: algoCount,
      details: algoCount > 0 ? `${algoScore}% on algorithms, sorting, searching, and asymptotic analysis` : "No assessment data yet",
    },
    {
      name: "OOP & Systems Architecture",
      status: oopStatus,
      score: oopScore,
      dataPointsCount: oopCount,
      details: oopCount > 0 ? `${oopScore}% across classes, vtables, and systems architecture` : "No assessment data yet",
    },
    {
      name: "Verified Coding",
      status: codingStatus,
      score: codingScore,
      dataPointsCount: codingCount,
      details: codingCount > 0 ? `${verifiedPasses} of ${codingCount} challenges verified passing` : "No coding submissions yet",
    },
    {
      name: "Technical Interview Performance",
      status: interviewStatus,
      score: interviewScore,
      dataPointsCount: interviewCount,
      details: interviewCount > 0 ? `${interviewScore}% average across ${interviewCount} mock interview loop(s)` : "No mock interviews completed",
    },
  ];

  // Weak Topics Calculation ("Needs Review")
  const weakTopics: WeakTopicItem[] = [];

  for (const unit of ALL_UNITS) {
    const q =
      quizScores[unit.quiz.id] ||
      quizScores[`quiz-t${unit.weekNumber}`] ||
      quizScores[`quiz-w${unit.weekNumber}`] ||
      quizScores[`quiz-${unit.weekNumber}`] ||
      quizScores[unit.id];

    if (q && typeof q.score === "number" && q.score < 70) {
      weakTopics.push({
        unitId: unit.id,
        topicTitle: unit.title,
        score: q.score,
        type: "quiz",
        reason: `Quiz scored ${q.score}% (Passing is ${unit.quiz.passingScorePercentage}%)`,
      });
    }

    const c =
      codingResults[unit.exercises.codingChallenge.id] ||
      codingResults[`cc-t${unit.weekNumber}`] ||
      codingResults[`cc-w${unit.weekNumber}`] ||
      codingResults[`cc-${unit.weekNumber}`];

    if (c && (!c.passed || c.score < 70)) {
      weakTopics.push({
        unitId: unit.id,
        topicTitle: `${unit.title} Coding`,
        score: c.score || 0,
        type: "coding",
        reason: c.passed ? `Coding scored ${c.score}%` : "Coding challenge failed or incomplete",
      });
    }
  }

  // Active dimensions with data
  const dimensionsWithData = dimensions.filter((d) => d.status !== "Insufficient Data");
  const hasEnoughData = dimensionsWithData.length >= 2;

  const overallScore =
    dimensionsWithData.length > 0
      ? Math.round(dimensionsWithData.reduce((acc, d) => acc + d.score, 0) / dimensionsWithData.length)
      : 0;

  const overallStatus = getStatus(overallScore, dimensionsWithData.length);

  return {
    overallScore,
    overallStatus,
    dimensions,
    weakTopics,
    hasEnoughData,
  };
}
