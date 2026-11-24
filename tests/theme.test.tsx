// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { ThemeProvider, THEME_STORAGE_KEY } from '../src/contexts/ThemeContext';
import { AuthModal } from '../src/components/AuthModal';
vi.mock('../src/lib/firebase', () => ({ signInWithGoogle: vi.fn(), logInWithEmail: vi.fn(), registerWithEmail: vi.fn(), logOut: vi.fn(), continueAsGuest: vi.fn() }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
let host: HTMLDivElement, root: Root;
beforeEach(() => { localStorage.clear(); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); delete document.documentElement.dataset.theme; });
const modal = (user: any = null) => <ThemeProvider><AuthModal isOpen onClose={() => {}} currentUser={user}/></ThemeProvider>;
const toggle = () => host.querySelector('[role="switch"]') as HTMLButtonElement;
it('account popup switches both ways and remembers the preference after remount', async () => {
  await act(async () => root.render(modal({ isAnonymous: false, displayName: 'Learner', uid: 'student' })));
  expect(toggle().getAttribute('aria-checked')).toBe('true');
  await act(async () => toggle().click());
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(document.documentElement.classList.contains('dark')).toBe(false);
  expect(document.documentElement.style.colorScheme).toBe('light');
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  await act(async () => root.unmount()); root = createRoot(host);
  await act(async () => root.render(modal()));
  expect(toggle().getAttribute('aria-checked')).toBe('false');
  await act(async () => toggle().click());
  expect(document.documentElement.dataset.theme).toBe('dark');
});
it('remains usable with blocked storage and synchronizes other browser tabs', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  await act(async () => root.render(modal()));
  await act(async () => toggle().click()); expect(document.documentElement.dataset.theme).toBe('light');
  await act(async () => window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'dark' })));
  expect(toggle().getAttribute('aria-checked')).toBe('true');
});
it('applies a saved theme before React starts, including invalid or unavailable storage', () => {
  const bootstrap = readFileSync('public/theme-init.js', 'utf8');
  localStorage.setItem(THEME_STORAGE_KEY, 'light'); new Function(bootstrap)();
  expect(document.documentElement.dataset.theme).toBe('light');
  localStorage.setItem(THEME_STORAGE_KEY, 'invalid'); new Function(bootstrap)();
  expect(document.documentElement.dataset.theme).toBe('dark');
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  expect(() => new Function(bootstrap)()).not.toThrow();
  expect(readFileSync('index.html','utf8').indexOf('/theme-init.js')).toBeLessThan(readFileSync('index.html','utf8').indexOf('/src/main.tsx'));
});
it('covers foregrounds and surfaces across all views without forced dark controls', () => {
  const css = readFileSync('src/index.css', 'utf8');
  const light = css.split(':root[data-theme="light"]')[1];
  const paths = ['src/App.tsx', ...readdirSync('src/components').filter(n => n.endsWith('.tsx')).map(n => 'src/components/' + n)];
  for (const path of paths) {
    const source = readFileSync(path, 'utf8');
    expect(source, path).not.toMatch(/colorScheme:\s*["']dark/);
    expect(source, path).not.toMatch(/text-(?:slate|blue|emerald|purple|red|amber|indigo)-\d+/);
    for (const match of source.matchAll(/text-ink-([\w-]+)/g)) {
      const name = match[1]; expect(css, `${path}: ${name}`).toContain(`--color-ink-${name}:`);
      expect(light, name).toContain(`--foreground-${name}:`);
    }
    for (const match of source.matchAll(/(?:bg|from|via|to)-(slate-\d+|(?:blue|emerald|purple|red|amber)-950)/g)) {
      expect(light, `${path}: ${match[1]}`).toContain(`--color-${match[1]}:`);
    }
  }
});
