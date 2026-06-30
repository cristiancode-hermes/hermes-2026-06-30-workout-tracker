import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DarkModeService {
  readonly isDark = signal(false);

  constructor() {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('dark_mode') : null;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored === 'true' || (stored === null && prefersDark);
    this.isDark.set(initial);
    this.updateDOM(initial);

    effect(() => {
      const val = this.isDark();
      localStorage.setItem('dark_mode', String(val));
      this.updateDOM(val);
    });
  }

  private updateDOM(isDark: boolean): void {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
    }
  }

  toggle(): void {
    this.isDark.update((v) => !v);
  }
}
