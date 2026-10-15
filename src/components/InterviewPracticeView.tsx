import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { INTERVIEW_PRACTICE } from '../data/interviewPractice';
import { CodeChallengeEditor } from './CodeChallengeEditor';
import { useAssessment } from '../lib/AssessmentContext';

export default function InterviewPracticeView({ onBack }: { onBack: () => void }) {
  const [selectedId, setSelectedId] = useState(INTERVIEW_PRACTICE[0].id);
  const lesson = INTERVIEW_PRACTICE.find(item => item.id === selectedId)!;
  const { setAssessmentMode, setAssessmentTitle } = useAssessment();
  const [mode, setMode] = useState<'practice' | 'assessment'>('practice');

  useEffect(() => {
    setAssessmentMode(mode === 'assessment' ? 'coding-assessment' : 'none');
    setAssessmentTitle(mode === 'assessment' ? lesson.title : undefined);
    return () => { setAssessmentMode('none'); setAssessmentTitle(undefined); };
  }, [mode, lesson.id]);

  const selectLesson = (id: string) => {
    if (id === selectedId) return;
    if (!window.confirm('Switch lessons? Your code and results in this practice view will be cleared.')) return;
    setMode('practice');
    setSelectedId(id);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 text-slate-100">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200">
        <ArrowLeft className="h-4 w-4" /> Curriculum Roadmap
      </button>
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-emerald-400 font-bold">Optional learning track</p>
        <h1 className="text-3xl font-bold">Interview Practice</h1>
        <p className="text-slate-300">Learn to recognize a pattern, explain why it works, and test a C++20 implementation. Use the suggested prerequisites when a concept is unfamiliar.</p>
        <p className="text-sm text-slate-400">Practice here does not change your 39-topic progress, exams, or readiness score. Code and results stay only in this view and are cleared when you leave or switch lessons.</p>
      </header>
      <nav aria-label="Interview practice lessons" className="flex flex-wrap gap-2">
        {INTERVIEW_PRACTICE.map((item, index) => (
          <button type="button" key={item.id} aria-current={item.id === selectedId ? 'page' : undefined}
            onClick={() => selectLesson(item.id)}
            className={`px-3 py-2 rounded-xl text-sm border ${item.id === selectedId ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-blue-400'}`}>
            {index + 1}. {item.title.split(':')[0]}
          </button>
        ))}
      </nav>
      <article className="space-y-5" aria-labelledby="interview-lesson-title">
        <h2 id="interview-lesson-title" className="text-2xl font-bold">{lesson.title}</h2>
        <p className="text-sm text-slate-400">Suggested preparation: {lesson.prerequisites}</p>
        {[
          ['When to use it', lesson.recognize], ['Build the reasoning', lesson.explanation],
          ['Trace an example', lesson.walkthrough], ['Common mistakes', lesson.pitfalls],
          ['Time and space', lesson.complexity], ['Explain and transfer', lesson.transfer],
        ].map(([title, content]) => (
          <section key={title} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
            <h3 className="font-semibold text-blue-300">{title}</h3>
            <p className="whitespace-pre-line text-sm text-slate-300 leading-relaxed">{content}</p>
          </section>
        ))}
        <section className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
          <h3 className="font-semibold text-blue-300">Submission contract</h3>
          <ul className="list-disc pl-5 text-sm text-slate-300 space-y-2">
            {lesson.challenge.constraints?.map(constraint => <li key={constraint}>{constraint}</li>)}
          </ul>
        </section>
        <CodeChallengeEditor key={lesson.id} challenge={lesson.challenge} onModeChange={setMode} />
      </article>
    </div>
  );
}
