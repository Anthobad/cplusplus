import type { UserProgress } from '../types';
import { ALL_UNITS } from '../data/curriculumSummary';
import { getQuestionTopics } from '../data/examTopics';
import { examEvidenceForProgress, questionScoresForAttempt } from './examMastery';

export type ReadinessStatus = 'Strong' | 'Developing' | 'Needs Review' | 'Insufficient Data';
export interface DimensionReadiness { name: string; status: ReadinessStatus; score: number; dataPointsCount: number; details: string }
export interface WeakTopicItem { unitId: string; topicTitle: string; score: number; type: 'quiz'|'coding'|'exam'; reason: string }
export interface TopicMastery {
  unitId: string; topicTitle: string; score: number; completed: boolean;
  lessonScore?: number; examScore?: number; examWeight: number; examQuestions: number;
  observations: number; improvement?: number; confidence: 'Insufficient'|'Limited'|'Established';
  hasEvidence: boolean;
}
export interface ReadinessSummary {
  overallScore: number; overallStatus: ReadinessStatus; dimensions: DimensionReadiness[];
  weakTopics: WeakTopicItem[]; hasEnoughData: boolean; topics: TopicMastery[];
  reachedScore: number; reachedStatus: ReadinessStatus; reachedTopics: number; reachedAssessedTopics: number;
  coverage: number; legacyExamCount: number; legacyExamAverage?: number;
}
const clamp = (n: number) => Math.min(100, Math.max(0,n));
const numeric = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const mean = (numbers: number[]) => numbers.length ? numbers.reduce((a,b)=>a+b,0)/numbers.length : 0;
const status = (score: number, count: number): ReadinessStatus => !count ? 'Insufficient Data' : score>=80 ? 'Strong' : score>=65 ? 'Developing' : 'Needs Review';
// A partition: every curriculum topic contributes once to overall/category readiness.
const categories: [string, number[]][] = [
  ['C++ Fundamentals', [1,2,3,4,5,6,7,8,9,10,12,13,16]],
  ['Memory Management & Pointers', [11,18]],
  ['STL Containers', [17,19,20,27]],
  ['Data Structures', [21,22,23,24,25,26]],
  ['Algorithms & Complexity', [34,35,36,37,38,39]],
  ['OOP & Systems Architecture', [14,15,28,29,30,31,32,33]],
];

/** Derived from persisted evidence only; never used to award completion or exam credit. */
export function calculateReadiness(progress: UserProgress): ReadinessSummary {
  const evidence = examEvidenceForProgress(progress);
  const topicEvidence = new Map<string, { weighted: number; weight: number; observations: number; change: number }>();
  for (const [id, observations] of Object.entries(evidence.questions)) {
    const mapping = getQuestionTopics(id);
    if (!mapping?.topicIds.length || !observations.length) continue;
    const weights = [0.6,0.3,0.1].slice(0,observations.length);
    const score = observations.reduce((sum,o,i)=>sum+o.score*weights[i],0)/weights.reduce((a,b)=>a+b,0);
    const allocation = 1/mapping.topicIds.length;
    for (const topicId of mapping.topicIds) {
      const e = topicEvidence.get(topicId) || { weighted:0,weight:0,observations:0,change:0 };
      e.weighted += score*allocation; e.weight += allocation;
      e.observations += observations.length*allocation;
      e.change += (observations[0].score-observations[observations.length-1].score)*allocation;
      topicEvidence.set(topicId,e);
    }
  }
  const weakTopics: WeakTopicItem[] = [];
  const topics: TopicMastery[] = ALL_UNITS.map(unit => {
    const n = unit.weekNumber, qs = progress.quizScores || {}, cs = progress.codingChallengeResults || {};
    const quiz = qs[unit.quiz.id] || qs[`quiz-t${n}`] || qs[`quiz-w${n}`] || qs[`quiz-${n}`] || qs[unit.id];
    const coding = cs[unit.exercises.codingChallenge.id] || cs[`cc-t${n}`] || cs[`cc-w${n}`] || cs[`cc-${n}`];
    const lesson: number[] = [];
    if (numeric(quiz?.score)) lesson.push(clamp(quiz.score));
    if (coding?.verified && !coding.wasAssisted && numeric(coding.score)) lesson.push(clamp(coding.score));
    const e = topicEvidence.get(unit.id);
    const examScore = e?.weight ? e.weighted/e.weight : undefined;
    const lessonScore = lesson.length ? mean(lesson) : undefined;
    // Two question-equivalents of smoothing; bounded exam share; retakes never grow this share.
    const examWeight = examScore === undefined ? 0 : lessonScore === undefined ? 1 : 0.8*e!.weight/(e!.weight+2);
    // Missing assessments are neutral; evidence coverage is reported separately.
    const score = Math.round(clamp(lessonScore === undefined ? (examScore ?? 0)
      : examScore === undefined ? lessonScore : lessonScore*(1-examWeight)+examScore*examWeight));
    const hasEvidence = lesson.length>0 || Boolean(e?.weight);
    const confidence = !hasEvidence ? 'Insufficient' : (e && e.weight>=3 && e.observations>=3) || lesson.length===2 ? 'Established' : 'Limited';
    const item: TopicMastery = { unitId:unit.id,topicTitle:unit.title,score,
      completed:(progress.completedUnitIds || progress.completedUnits || []).includes(unit.id),
      lessonScore,examScore,examWeight,examQuestions:e?.weight||0,observations:e?.observations||0,
      improvement:e?.weight ? e.change/e.weight : undefined,confidence,hasEvidence };
    const examWeak = examScore !== undefined && examScore<65 &&
      ((e?.weight||0)>=2 || ((e?.weight||0)>=1 && (e?.observations||0)>=3));
    const lessonWeak = lesson.length>0 && mean(lesson)<70;
    if (examWeak || lessonWeak) weakTopics.push({ unitId:unit.id,topicTitle:unit.title,score,
      type:examWeak?'exam':coding?.verified && coding.score<70?'coding':'quiz',
      reason:examWeak ? `Exam performance ${Math.round(examScore!)}% across ${Number(e!.weight.toFixed(1))} question-equivalents (${Number(e!.observations.toFixed(1))} observations)${item.improvement!>0?`; improving +${Math.round(item.improvement!)} points`:''}`
        : `Lesson assessment average ${Math.round(mean(lesson))}%; ${confidence.toLowerCase()} evidence` });
    return item;
  });
  weakTopics.sort((a,b)=> {
    const ta=topics.find(t=>t.unitId===a.unitId)!,tb=topics.find(t=>t.unitId===b.unitId)!;
    return (b.type==='exam'?1:0)-(a.type==='exam'?1:0) || a.score-b.score || tb.observations-ta.observations || a.unitId.localeCompare(b.unitId);
  });
  const dimensions: DimensionReadiness[] = categories.map(([name,numbers])=> {
    const entries=topics.filter(t=>numbers.includes(Number(t.unitId.replace('topic-',''))));
    const count=entries.filter(t=>t.hasEvidence).length;
    const score=Math.round(mean(entries.map(t=>t.score)));
    return {name,score,status:status(score,count),dataPointsCount:count,
      details:`${count}/${entries.length} topics assessed; missing evidence contributes no demonstrated readiness`};
  });
  const coding=Object.values(progress.codingChallengeResults||{}).filter(c=>c.verified&&!c.wasAssisted&&numeric(c.score));
  dimensions.push({name:'Verified Coding',score:Math.round(mean(coding.map(c=>clamp(c.score)))),status:status(mean(coding.map(c=>clamp(c.score))),coding.length),dataPointsCount:coding.length,details:'Diagnostic only; coding is already included in topic mastery'});
  const reports=(progress.mockInterviewReports||[]).filter(r=>numeric(r.overallScore));
  const interview=Math.round(mean(reports.map(r=>clamp(r.overallScore))));
  dimensions.push({name:'Technical Interview Performance',score:interview,status:status(interview,reports.length),dataPointsCount:reports.length,details:'Self-reported mock interview diagnostic; excluded from trusted curriculum readiness'});
  const assessed=topics.filter(t=>t.hasEvidence).length;
  const overallScore=Math.round(mean(topics.map(t=>t.score)));
  // Reached means the curriculum prefix through the current, completed or assessed topic.
  // Within that prefix, unknown mastery is excluded, not treated as a failed assessment.
  const reachedIds = new Set([...(progress.completedUnitIds || []), ...(progress.completedUnits || []),
    ...(progress.currentUnitId ? [progress.currentUnitId] : []), ...topics.filter(t=>t.hasEvidence).map(t=>t.unitId)]);
  const reachedIndex = topics.reduce((highest,t,i)=>reachedIds.has(t.unitId)?Math.max(highest,i):highest,-1);
  const reached = topics.slice(0,reachedIndex+1);
  const reachedAssessed = reached.filter(t=>t.hasEvidence);
  const reachedScore = Math.round(mean(reachedAssessed.map(t=>t.score)));
  const legacy=Object.values(progress.examAttempts||{}).filter(a=>!questionScoresForAttempt(a).length&&numeric(a.score));
  return {reachedScore,reachedStatus:status(reachedScore,reachedAssessed.length),reachedTopics:reached.length,reachedAssessedTopics:reachedAssessed.length,
    overallScore,overallStatus:status(overallScore,assessed),dimensions,weakTopics,
    hasEnoughData:assessed>=3,topics,coverage:Math.round(100*assessed/(topics.length||1)),legacyExamCount:legacy.length,
    legacyExamAverage:legacy.length?Math.round(mean(legacy.map(a=>clamp(a.score)))):undefined};
}
