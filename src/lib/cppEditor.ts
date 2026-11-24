import { tags } from '@lezer/highlight';
import { Annotation, EditorSelection, EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine, drawSelection, rectangularSelection, crosshairCursor } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentLess, indentMore } from '@codemirror/commands';
import { bracketMatching, indentOnInput, indentUnit, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { cpp } from '@codemirror/lang-cpp';
import { highlightSelectionMatches, searchKeymap, selectNextOccurrence, selectSelectionMatches } from '@codemirror/search';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';

const cppHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#c084fc' },
  { tag: [tags.typeName, tags.className], color: '#67e8f9' },
  { tag: tags.string, color: '#86efac' },
  { tag: [tags.number, tags.bool], color: '#fbbf24' },
  { tag: tags.comment, color: '#94a3b8' },
  { tag: tags.function(tags.variableName), color: '#93c5fd' },
  { tag: tags.operator, color: '#cbd5e1' },
  { tag: tags.invalid, color: '#f87171' },
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
    EditorView.theme({
      '&': { height: '100%', backgroundColor: '#020617', color: '#e2e8f0', fontSize: '13px' },
      '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', overflow: 'auto', lineHeight: '1.7' },
      '.cm-content': { padding: '12px 0', caretColor: '#93c5fd' },
      '.cm-line': { padding: '0 12px' },
      '.cm-gutters': { backgroundColor: '#0f172a', color: '#64748b', borderColor: '#1e293b' },
      '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#172033' },
      '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: '#1e3a5f' },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#93c5fd' },
      '.cm-selectionMatch, .cm-selectionMatch-main': { backgroundColor: '#164e63', outline: '1px solid #22d3ee80' },
      '.cm-searchMatch': { backgroundColor: '#854d0e' },
      '.cm-panels': { backgroundColor: '#0f172a', color: '#e2e8f0' },
      '&.cm-focused': { outline: '1px solid #3b82f6' },
    }, { dark: true }),
  ];
}
