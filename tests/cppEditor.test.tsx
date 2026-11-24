// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import { insertNewlineAndIndent, undo, copyLineDown, copyLineUp } from '@codemirror/commands';
import { CppEditor } from '../src/components/CppEditor';

let host:HTMLDivElement,root:Root;
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
// jsdom has no layout engine. These shims only satisfy CodeMirror's geometry reads.
beforeEach(()=>{
  vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>setTimeout(()=>cb(performance.now()),0));
  vi.stubGlobal('cancelAnimationFrame',(id:number)=>clearTimeout(id));
  if(!Range.prototype.getClientRects)Range.prototype.getClientRects=()=>[] as any;
  if(!Range.prototype.getBoundingClientRect)Range.prototype.getBoundingClientRect=()=>({left:0,right:0,top:0,bottom:0,width:0,height:0}) as any;
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();});
const view=()=>EditorView.findFromDOM(host.querySelector('.cm-editor')!)!;
async function mount(value:string,extra:Partial<React.ComponentProps<typeof CppEditor>>={}){
 const onChange=vi.fn();const props={value,onChange,documentId:'one',...extra};
 await act(async()=>root.render(<CppEditor {...props}/>));return {props,onChange};
}
async function press(key:string,options:KeyboardEventInit={}){
 await act(async()=>{view().contentDOM.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...options}));});
}
describe('shared C++ editor',()=>{
 it('inserts four spaces with Tab and removes one indentation level with Shift+Tab',async()=>{
   const {onChange}=await mount('int x;');
   await press('Tab');expect(view().state.doc.toString()).toBe('    int x;');expect(onChange).toHaveBeenLastCalledWith('    int x;');
   await press('Tab',{shiftKey:true});expect(view().state.doc.toString()).toBe('int x;');
 });
 it.each(['void f() {','class Widget {'])('automatically indents after a function/class brace: %s',async code=>{
   await mount(code);await act(async()=>{view().dispatch({selection:{anchor:code.length}});insertNewlineAndIndent(view());});
   expect(view().state.doc.toString()).toBe(code+'\n    ');
 });
 it('copies lines up/down with standard shortcuts and supports undo',async()=>{
   await mount('one\ntwo');await press('ArrowDown',{altKey:true,shiftKey:true});expect(view().state.doc.toString()).toBe('one\none\ntwo');
   await act(async()=>{undo(view());});expect(view().state.doc.toString()).toBe('one\ntwo');
   await press('ArrowUp',{altKey:true,shiftKey:true});expect(view().state.doc.toString()).toBe('one\none\ntwo');
 });
 it('selects repeated names with Ctrl+D and edits all selections together',async()=>{
   await mount('int count = count + counter;');
   await act(async()=>view().dispatch({selection:{anchor:4,head:9}}));
   await press('d',{ctrlKey:true});expect(view().state.selection.ranges).toHaveLength(2);
   await act(async()=>view().dispatch(view().state.replaceSelection('total')));
   expect(view().state.doc.toString()).toBe('int total = total + counter;');
 });
 it('adds four spaces at multiple cursors and supports selection of all matches',async()=>{
   await mount('x\nx');await act(async()=>view().dispatch({selection:EditorSelection.create([EditorSelection.cursor(0),EditorSelection.cursor(2)])}));
   await press('Tab');expect(view().state.doc.toString()).toBe('    x\n    x');
   await act(async()=>view().dispatch({selection:{anchor:4,head:5}}));await press('l',{ctrlKey:true,shiftKey:true});expect(view().state.selection.ranges).toHaveLength(2);
 });
 it('highlights whole-name matches, supplies line numbers, and toggles wrapping',async()=>{
   await mount('int value = value + values;\nvalue++;');
   await act(async()=>view().dispatch({selection:{anchor:4,head:9}}));
   expect(host.querySelectorAll('.cm-selectionMatch').length).toBeGreaterThan(0);
   expect(host.querySelector('.cm-lineNumbers')).not.toBeNull();expect(view().contentDOM.classList.contains('cm-lineWrapping')).toBe(true);
   const toggle=host.querySelector('input[type=checkbox]') as HTMLInputElement;
   await act(async()=>toggle.click());expect(view().contentDOM.classList.contains('cm-lineWrapping')).toBe(false);
 });
 it('locks editing during exam submission while allowing trusted external value updates',async()=>{
   const {props,onChange}=await mount('original',{disabled:true});
   await press('Tab');expect(view().state.doc.toString()).toBe('original');expect(onChange).not.toHaveBeenCalled();
   await act(async()=>view().dispatch({changes:{from:0,insert:'forged'}}));expect(view().state.doc.toString()).toBe('original');
   await act(async()=>root.render(<CppEditor {...props} value="updated"/>));expect(view().state.doc.toString()).toBe('updated');expect(onChange).not.toHaveBeenCalled();
 });
 it('retains focus/cursors on ordinary controlled updates but resets undo on another question',async()=>{
   const {props}=await mount('first');const old=view();
   await act(async()=>old.dispatch({selection:{anchor:2},changes:{from:5,insert:'!'}}));
   await act(async()=>root.render(<CppEditor {...props} value="first!"/>));expect(view()).toBe(old);expect(view().state.selection.main.head).toBe(2);
   await act(async()=>root.render(<CppEditor {...props} documentId="second" value="second"/>));expect(view()).not.toBe(old);
   expect(view().state.doc.toString()).toBe('second');await act(async()=>{undo(view());});expect(view().state.doc.toString()).toBe('second');
 });
 it('preserves exam length limits for paste and keyboard edits',async()=>{
   const {onChange}=await mount('1234',{maxLength:5});
   await act(async()=>view().dispatch({changes:{from:4,insert:'56'}}));expect(view().state.doc.toString()).toBe('1234');expect(onChange).not.toHaveBeenCalled();
   expect(host.textContent).toContain('Maximum 5 characters');
   await act(async()=>view().dispatch({changes:{from:4,insert:'5'}}));expect(onChange).toHaveBeenLastCalledWith('12345');
 });
 it('keeps keyboard-focus escape and selection commands available',async()=>{
   await mount('code');const event=new KeyboardEvent('keydown',{key:'Escape',keyCode:27,bubbles:true,cancelable:true});
   view().contentDOM.dispatchEvent(event);
   const tab=new KeyboardEvent('keydown',{key:'Tab',keyCode:9,bubbles:true,cancelable:true});view().contentDOM.dispatchEvent(tab);
   expect(tab.defaultPrevented).toBe(false);expect(view().state.doc.toString()).toBe('code');
 });
});
