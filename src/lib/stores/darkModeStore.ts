import { writable, type Writable } from 'svelte/store';

function determineInitialTheme(): boolean {
  if (typeof localStorage !== 'undefined') {
    return localStorage.theme === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  return false;
}

export const isDark: Writable<boolean> = writable(determineInitialTheme());
