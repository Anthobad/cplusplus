import React from 'react';
import { act, create } from 'react-test-renderer';
import { describe, it, expect, vi } from 'vitest';
import { ReadinessDashboard } from '../src/components/ReadinessDashboard';
import type { UserProgress } from '../src/types';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
describe('readiness dashboard',()=> {
  it('shows completion separately, evidence and review reasons, and navigates to canonical topics',async()=> {
    const onSelectUnit=vi.fn();
    const progress={completedUnitIds:['topic-18'],quizScores:{'quiz-t18':{score:100,passed:true}},examAttempts:{
      'exam-foundations':{id:'a',examId:'exam-foundations',score:0,passed:false,integritySource:'server-v2',
        questionScores:['ef-mcq-1','ef-mcq-5','ef-mcq-7'].map(questionId=>({questionId,earned:0,possible:10}))}
    }} as unknown as UserProgress;
    let renderer:ReturnType<typeof create>;
    await act(async()=>{renderer=create(<ReadinessDashboard progress={progress} onSelectUnit={onSelectUnit}/>);});
    const json=JSON.stringify(renderer!.toJSON());
    expect(json).toContain('Overall Readiness');expect(json).toContain('Readiness at Your Current Progress');expect(json).toContain('unattempted assessments are excluded');
    expect(json).toContain('Completed');expect(json).toContain('Exam performance 0%');expect(json).toContain('Established');expect(json).toContain('Insufficient');
    // Find the review card by its rendered text without serializing React's owner graph.
    const buttons=renderer!.root.findAllByType('button');
    const card=buttons.find(b=>b.findAllByProps({className:'text-[11px] text-amber-400 font-mono mt-0.5'}).length);
    expect(card).toBeDefined();await act(async()=>{card!.props.onClick();});expect(onSelectUnit).toHaveBeenCalledWith('topic-18');
    const empty={completedUnitIds:[],quizScores:{},examAttempts:{}} as unknown as UserProgress;
    await act(async()=>{renderer!.update(<ReadinessDashboard progress={empty} onSelectUnit={onSelectUnit}/>);});
    expect(JSON.stringify(renderer!.toJSON())).not.toContain('Exam performance 0%');
    await act(async()=>renderer!.unmount());
  });
});
