import { tags } from '@lezer/highlight';
import { Annotation, EditorSelection, EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine, drawSelection, rectangularSelection, crosshairCursor } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentLess, indentMore } from '@codemirror/commands';
import { bracketMatching, indentOnInput, indentUnit, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { cpp } from '@codemirror/lang-cpp';
import { highlightSelectionMatches, searchKeymap, selectNextOccurrence, selectSelectionMatches } from '@codemirror/search';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';

const cppHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--foreground-purple-300)' },
  { tag: [tags.typeName, tags.className], color: 'var(--foreground-blue-300)' },
  { tag: tags.string, color: 'var(--foreground-emerald-300)' },
  { tag: [tags.number, tags.bool], color: 'var(--foreground-amber-300)' },
  { tag: tags.comment, color: 'var(--foreground-slate-400)' },
  { tag: tags.function(tags.variableName), color: 'var(--foreground-blue-300)' },
  { tag: tags.operator, color: 'var(--foreground-slate-300)' },
  { tag: tags.invalid, color: 'var(--foreground-red-300)' },
]);
export const externalEditorUpdate = Annotation.define<boolean>();
// Insert literal spaces at every cursor; indent whole selections with Tab, unindent with Shift-Tab.
const fourSpaces = (view: EditorView) => {
  if (view.state.readOnly) return false;
  if (view.state.selection.ranges.some(range => !range.empty)) return indentMore(view);
  view.dispatch(view.state.changeByRange(range => ({
    changes: { from: range.from, insert: '    ' }, range: EditorSelection.cursor(range.from + 4),
  })), { userEvent: 'input.indent' });
  return true;
};
export const cppEditorKeymap = [
  { key: 'Tab', run: fourSpaces, shift: indentLess },
  { key: 'Mod-d', run: selectNextOccurrence, preventDefault: true },
  { key: 'Mod-Shift-l', run: selectSelectionMatches, preventDefault: true },
  ...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...searchKeymap,
];
export function cppEditorExtensions(): Extension[] {
  return [
    cpp(), EditorState.tabSize.of(4), indentUnit.of('    '),
    EditorState.allowMultipleSelections.of(true), drawSelection(), rectangularSelection(), crosshairCursor(),
    EditorView.clickAddsSelectionRange.of(event => event.altKey),
    lineNumbers(), highlightActiveLineGutter(), highlightActiveLine(),
    history(), indentOnInput(), bracketMatching(), closeBrackets(),
    syntaxHighlighting(cppHighlightStyle),
    highlightSelectionMatches({ highlightWordAroundCursor: true, wholeWords: true, maxMatches: 10000 }),
    keymap.of(cppEditorKeymap),
  ];
}

export function cppEditorAppearance(dark: boolean): Extension {
  return EditorView.theme({
      '&': { height: '100%', backgroundColor: 'var(--color-slate-950)', color: 'var(--foreground-slate-200)', fontSize: '13px' },
      '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', overflow: 'auto', lineHeight: '1.7' },
      '.cm-content': { padding: '12px 0', caretColor: 'var(--foreground-blue-300)' },
      '.cm-line': { padding: '0 12px' },
      '.cm-gutters': { backgroundColor: 'var(--color-slate-900)', color: 'var(--foreground-slate-500)', borderColor: 'var(--color-slate-700)' },
      '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'var(--editor-active)' },
      '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: 'var(--editor-selection)' },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--foreground-blue-300)' },
      '.cm-selectionMatch, .cm-selectionMatch-main': { backgroundColor: 'var(--editor-match)', outline: '1px solid #22d3ee80' },
      '.cm-searchMatch': { backgroundColor: 'var(--editor-search)' },
      '.cm-panels': { backgroundColor: 'var(--color-slate-900)', color: 'var(--foreground-slate-200)' },
      '&.cm-focused': { outline: '1px solid #3b82f6' },
    }, { dark });
}
