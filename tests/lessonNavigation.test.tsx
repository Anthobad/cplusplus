import React from 'react';
import { act, create, type ReactTestRenderer, type ReactTestInstance } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DomainUnitView from '../src/components/DomainUnitView';
import { CodeChallengeEditor } from '../src/components/CodeChallengeEditor';
import { QuizModal } from '../src/components/QuizModal';
import { UnitView } from '../src/components/UnitView';
import { AssessmentProvider, useAssessment } from '../src/lib/AssessmentContext';
import { ALL_UNITS } from '../src/data/curriculum';
import { loadUnit } from '../src/data/loadCurriculum';
import { authenticatedFetch } from '../src/lib/authenticatedFetch';
import type { Unit, UserProgress } from '../src/types';

vi.mock('../src/data/loadCurriculum', () => ({ loadUnit: vi.fn() }));
vi.mock('../src/lib/authenticatedFetch', () => ({ authenticatedFetch: vi.fn() }));
vi.mock('../src/lib/firebase', () => ({ submitQuiz: vi.fn() }));

const units = ALL_UNITS.slice(0, 3).map(unit => structuredClone(unit));
for (const unit of units) {
  unit.exercises.codingChallenge.hints = ['First hint', 'Second hint'];
}
// Reused exercise IDs make retained answer maps observable across lessons.
units[1].exercises.trueFalse = structuredClone(units[0].exercises.trueFalse);
const progress = { completedUnitIds: [], quizScores: { historical: { score: 80, passed: true } }, examAttempts: {},
  verifiedCodingPassed: ['historical-challenge'] } as unknown as UserProgress;
const passed = { compiled: true, passed: true, verified: true, score: 100, testsPassed: 1, totalTests: 1, testResults: [] };
const deferred = <T,>() => {
  let resolve!: (value: T) => void, reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
let renderer: ReactTestRenderer;
const text = (node: ReactTestInstance): string => node.children.map(child => typeof child === 'string' ? child : text(child)).join('');
const button = (label: string) => renderer.root.findAllByType('button').find(node => text(node).includes(label))!;
const click = async (label: string) => { await act(async () => { await button(label).props.onClick(); }); };
const editor = () => renderer.root.findByType('textarea');
function AssessmentProbe() {
  const state = useAssessment();
  return <output data-assessment={state.assessmentMode}>{state.assessmentTitle || ''}</output>;
}
async function mount(id = units[0].id, direct = false) {
  const complete = vi.fn(async () => {}), saved = vi.fn(), quizSaved = vi.fn();
  const navigate = (unitId: string) => renderer.update(view(unitId));
  const props = { progress, onSelectUnit: navigate, onCompleteUnit: complete,
    onSaveCodingResult: saved, onSaveQuizScore: quizSaved, onSelectExam: vi.fn(), onBackToRoadmap: vi.fn(),
    onOpenAiWithContext: vi.fn(), onOpenDocs: vi.fn() };
  const view = (unitId: string) => <AssessmentProvider>
    {direct ? <UnitView {...props} unit={units.find(unit => unit.id === unitId)!} /> :
    <DomainUnitView {...props} unitId={unitId} />}
    <AssessmentProbe />
  </AssessmentProvider>;
  await act(async () => { renderer = create(view(id)); });
  return { complete, saved, quizSaved, navigate: async (next: string) => { await act(async () => navigate(next)); } };
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.mocked(loadUnit).mockImplementation(async id => units.find(unit => unit.id === id)!);
  vi.mocked(authenticatedFetch).mockResolvedValue({ ok: true, json: async () => passed } as Response);
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  vi.resetAllMocks(); vi.unstubAllGlobals();
});

describe('Lesson navigation state', () => {
  it('keys the coding editor independently when an existing UnitView receives a new challenge', async () => {
    const { navigate } = await mount(units[0].id, true);
    await click('C++ Coding Challenge');
    await act(async () => editor().props.onChange({ target: { value: '// stale code' } }));
    await click('Run Tests');
    await navigate(units[1].id);
    expect(editor().props.value).toBe(units[1].exercises.codingChallenge.initialCode);
    expect(text(renderer.root)).not.toContain('Practice Tests Passed!');
  });
  it.each([false, true])('starts a fresh lesson after Continue (previously executed: %s)', async executed => {
    const baseline = structuredClone(progress);
    const { complete } = await mount();
    await click('C++ Coding Challenge');
    await act(async () => editor().props.onChange({ target: { value: '// previous topic code' } }));
    await click('Next hint');
    if (executed) {
      await click('Run Tests');
      expect(text(renderer.root)).toContain('Practice Tests Passed!');
    }
    await click('Mark Complete & Continue');
    expect(complete).toHaveBeenCalledWith(units[0].id);
    expect(renderer.root.findAllByType(CodeChallengeEditor)).toHaveLength(0); // Fresh theory tab.
    await click('C++ Coding Challenge');
    expect(editor().props.value).toBe(units[1].exercises.codingChallenge.initialCode);
    expect(text(renderer.root)).not.toContain('Tests Passed (');
    expect(text(button('Next hint'))).toContain('(1/2)');
    expect(renderer.root.findByType(QuizModal).props.isOpen).toBe(false);
    expect(progress).toEqual(baseline); // UI resets never erase persisted history.
  });

  it('clears exercise answers, open quiz and assessment context immediately while the next lesson loads', async () => {
    const { navigate } = await mount();
    await click('Interactive Exercises');
    await click('True');
    expect(text(renderer.root)).toMatch(/Correct!|Incorrect\./);
    await click('Take Section Quiz');
    expect(renderer.root.findByType('output').props['data-assessment']).toBe('quiz');
    const pending = deferred<Unit>();
    vi.mocked(loadUnit).mockReturnValueOnce(pending.promise);
    await navigate(units[1].id);
    expect(renderer.root.findAllByType(QuizModal)).toHaveLength(0);
    expect(renderer.root.findAllByType(CodeChallengeEditor)).toHaveLength(0);
    expect(text(renderer.root)).toContain('Loading lesson');
    expect(renderer.root.findByType('output').props['data-assessment']).toBe('none');
    await act(async () => pending.resolve(units[1]));
    await click('Interactive Exercises');
    expect(text(renderer.root)).not.toMatch(/Correct!|Incorrect\./);
    expect(renderer.root.findByType(QuizModal).props.isOpen).toBe(false);
  });

  it('ignores a prior evaluation response even if response.json completes after navigation', async () => {
    const { complete, saved } = await mount();
    await click('C++ Coding Challenge');
    await click('Assessment');
    const pending = deferred<typeof passed>();
    vi.mocked(authenticatedFetch).mockResolvedValueOnce({ ok: true, json: () => pending.promise } as Response);
    let evaluation!: Promise<void>;
    await act(async () => { evaluation = button('Submit Assessment').props.onClick(); });
    const signal = vi.mocked(authenticatedFetch).mock.calls[0][1]!.signal!;
    await click('Mark Complete & Continue');
    expect(signal.aborted).toBe(true);
    expect(renderer.root.findByType('output').props['data-assessment']).toBe('none');
    await click('C++ Coding Challenge');
    await click('Run Tests');
    const currentResult = text(renderer.root);
    await act(async () => { pending.resolve(passed); await evaluation; });
    expect(text(renderer.root)).toBe(currentResult);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(saved).toHaveBeenCalledExactlyOnceWith(units[1].exercises.codingChallenge.id, expect.any(Object));
  });

  it('ignores a rejected evaluation from an editor removed by tab switching and still runs the new editor', async () => {
    const { saved } = await mount();
    await click('C++ Coding Challenge');
    const pending = deferred<Response>();
    vi.mocked(authenticatedFetch).mockReturnValueOnce(pending.promise);
    let evaluation!: Promise<void>;
    await act(async () => { evaluation = button('Run Tests').props.onClick(); });
    await click('Core Theory');
    await click('C++ Coding Challenge');
    await act(async () => { pending.reject(new Error('late failure')); await evaluation; });
    expect(text(renderer.root)).not.toContain('temporarily unavailable');
    expect(editor().props.value).toBe(units[0].exercises.codingChallenge.initialCode);
    await click('Run Tests');
    expect(text(renderer.root)).toContain('Practice Tests Passed!');
    expect(saved).toHaveBeenCalledOnce();
  });

  it('does not apply an assessment response after switching the editor to practice mode', async () => {
    const { complete, saved } = await mount();
    await click('C++ Coding Challenge');
    await click('Assessment');
    const pending = deferred<Response>();
    vi.mocked(authenticatedFetch).mockReturnValueOnce(pending.promise);
    let evaluation!: Promise<void>;
    await act(async () => { evaluation = button('Submit Assessment').props.onClick(); });
    await click('Practice');
    await act(async () => { pending.resolve({ ok: true, json: async () => passed } as Response); await evaluation; });
    expect(text(renderer.root)).not.toContain('Tests Passed (');
    expect(complete).not.toHaveBeenCalled();
    expect(saved).not.toHaveBeenCalled();
    expect(renderer.root.findByType('output').props['data-assessment']).toBe('none');
  });

  it('never renders an obsolete topic when domain loads finish out of order or fail', async () => {
    const { navigate } = await mount();
    const second = deferred<Unit>(), third = deferred<Unit>();
    vi.mocked(loadUnit).mockReturnValueOnce(second.promise).mockReturnValueOnce(third.promise);
    await navigate(units[1].id);
    await navigate(units[2].id);
    await act(async () => second.resolve(units[1]));
    expect(text(renderer.root)).toContain('Loading lesson');
    expect(renderer.root.findAllByType(QuizModal)).toHaveLength(0);
    await act(async () => third.reject(new Error('offline')));
    expect(text(renderer.root)).toContain('could not be loaded');
    expect(renderer.root.findAllByType(QuizModal)).toHaveLength(0);
    await click('Retry lesson');
    expect(renderer.root.findByType(QuizModal).props.quiz.id).toBe(units[2].quiz.id);
  });
});
