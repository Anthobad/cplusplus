import React, { useEffect, useId, useRef, useState } from 'react';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { cppEditorAppearance, cppEditorExtensions, externalEditorUpdate } from '../lib/cppEditor';

import { useTheme } from '../contexts/ThemeContext';

export interface CppEditorProps {
  value: string;
  onChange: (value: string) => void;
  documentId: string;
  disabled?: boolean;
  label?: string;
  maxLength?: number;
}
export function CppEditor({ value, onChange, documentId, disabled = false, label = 'C++20 source', maxLength }: CppEditorProps) {
  const { theme } = useTheme();
  const appearanceConfig = useRef(new Compartment());
  const container = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  const current = useRef({ value, onChange, disabled, maxLength });
  current.current = { value, onChange, disabled, maxLength };
  const [wrap, setWrap] = useState(true);
  const [limitMessage, setLimitMessage] = useState('');
  const wrapConfig = useRef(new Compartment());
  const editableConfig = useRef(new Compartment());
  const helpId = useId();
  useEffect(() => {
    if (!container.current) return;
    const view = new EditorView({ parent: container.current, state: EditorState.create({
      doc: current.current.value,
      extensions: [
        ...cppEditorExtensions(),
        appearanceConfig.current.of(cppEditorAppearance(theme === 'dark')),
        wrapConfig.current.of(wrap ? EditorView.lineWrapping : []),
        editableConfig.current.of([EditorState.readOnly.of(current.current.disabled), EditorView.editable.of(!current.current.disabled)]),
        EditorView.contentAttributes.of({ 'aria-label': label, 'aria-describedby': helpId, 'aria-multiline': 'true', spellcheck: 'false' }),
        EditorState.transactionFilter.of(transaction => {
          if (transaction.docChanged && current.current.disabled && !transaction.annotation(externalEditorUpdate)) return [];
          const limit = current.current.maxLength;
          if (transaction.docChanged && !transaction.annotation(externalEditorUpdate) && limit !== undefined &&
            transaction.newDoc.length > limit && transaction.newDoc.length >= transaction.startState.doc.length) {
            setLimitMessage(`Maximum ${limit.toLocaleString()} characters. This edit was not inserted.`);
            return [];
          }
          return transaction;
        }),
        EditorView.updateListener.of(update => {
          if (update.docChanged && !update.transactions.every(t => t.annotation(externalEditorUpdate))) {
            setLimitMessage('');
            current.current.onChange(update.state.doc.toString());
          }
        }),
      ],
    }) });
    editor.current = view;
    setLimitMessage('');
    return () => { editor.current = null; view.destroy(); };
    // A different exercise must receive fresh selections, undo history and editor state.
  }, [documentId, label, helpId]);
  useEffect(() => {
    const view = editor.current;
    if (view && value !== view.state.doc.toString()) view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value }, annotations: externalEditorUpdate.of(true),
    });
  }, [value]);
  useEffect(() => {
    editor.current?.dispatch({ effects: editableConfig.current.reconfigure([EditorState.readOnly.of(disabled), EditorView.editable.of(!disabled)]) });
  }, [disabled]);
  useEffect(() => { editor.current?.dispatch({ effects: wrapConfig.current.reconfigure(wrap ? EditorView.lineWrapping : []) }); }, [wrap]);
  useEffect(() => { editor.current?.dispatch({ effects: appearanceConfig.current.reconfigure(cppEditorAppearance(theme === 'dark')) }); }, [theme]);
  return <div className="min-w-0">
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900 text-xs text-ink-slate-300 border-b border-slate-800">
      <span>C++20 · 4 spaces</span>
      <label className="flex items-center gap-2"><input type="checkbox" checked={wrap} onChange={event => setWrap(event.target.checked)} />Word wrap</label>
      <details className="basis-full"><summary className="cursor-pointer">Keyboard shortcuts</summary>
        <div className="mt-2 p-3 rounded-lg bg-slate-800 border border-slate-600 shadow-xl space-y-1">
          <p>Tab / Shift+Tab: indent / unindent</p><p>Enter: automatic C++ indentation</p>
          <p>Shift+Alt+↑/↓: copy line up/down</p><p>Alt+↑/↓: move line up/down</p>
          <p>Ctrl/Cmd+Alt+↑/↓ or Alt+click: add cursors</p>
          <p>Ctrl/Cmd+D: select next matching occurrence</p><p>Ctrl/Cmd+Shift+L: select all occurrences</p>
          <p>Ctrl/Cmd+/: toggle comment</p><p>Ctrl/Cmd+F: find · Ctrl/Cmd+Z: undo</p>
          <p>Escape, then Tab: move keyboard focus out of the editor</p>
        </div>
      </details>
    </div>
    <div ref={container} style={{ height: '20rem', minHeight: '12rem', maxHeight: '70vh', resize: 'vertical', overflow: 'hidden' }} />
    <p id={helpId} className="px-3 py-1 text-[10px] text-ink-slate-400">Select a name to highlight its matches. Press Escape, then Tab to leave the editor.</p>
    {limitMessage && <p role="status" className="px-3 py-1 text-xs text-ink-amber-300">{limitMessage}</p>}
  </div>;
}
