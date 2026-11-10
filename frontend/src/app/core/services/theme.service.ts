import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'cartridge-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(this.readStored());

  constructor() {
    this.applyDom(this.isDark());
  }

  toggle(): void {
    this.setDark(!this.isDark());
  }

  setDark(dark: boolean): void {
    this.isDark.set(dark);
    try {
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
    this.applyDom(dark);
  }

  private readStored(): boolean {
    if (typeof localStorage === 'undefined') {
      return true;
    }
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (value === 'dark') {
        return true;
      }
      if (value === 'light') {
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }

  private applyDom(dark: boolean): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
}
