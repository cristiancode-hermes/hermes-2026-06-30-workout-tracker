import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DarkModeService } from '../../services/dark-mode.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
<!-- Desktop Sidebar -->
<aside class="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-surface-200 bg-surface-card dark:border-surface-700 dark:bg-surface-900 lg:flex">
<div class="flex h-16 items-center gap-2 border-b border-surface-200 px-6 dark:border-surface-700">
<span class="heading-1 text-accent">💪 Workout</span>
</div>
<nav class="flex-1 space-y-1 p-4">
@for (link of links; track link.path) {
<a
[routerLink]="link.path"
routerLinkActive="bg-accent-light text-accent dark:bg-primary-950 dark:text-primary-300"
class="flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
>
<span class="text-lg">{{ link.icon }}</span>
{{ link.label }}
</a>
}
</nav>
<div class="border-t border-surface-200 p-4 dark:border-surface-700">
<div class="flex items-center justify-between">
<button
(click)="darkMode.toggle()"
class="rounded-btn p-2 text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
>
{{ darkMode.isDark() ? '☀️' : '🌙' }}
</button>
<button
(click)="logout()"
class="rounded-btn p-2 text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
title="Logout"
>
🚪
</button>
</div>
@if (auth.currentUser(); as user) {
<p class="mt-2 text-center text-xs text-surface-500 dark:text-surface-400">{{ user.name }}</p>
}
</div>
</aside>

<!-- Mobile Bottom Nav -->
<nav class="fixed inset-x-0 bottom-0 z-40 border-t border-surface-200 bg-surface-card dark:border-surface-700 dark:bg-surface-900 lg:hidden">
<div class="flex items-center justify-around px-2 py-2">
@for (link of links; track link.path) {
<a
[routerLink]="link.path"
routerLinkActive="text-accent dark:text-accent"
class="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-surface-500 dark:text-surface-400"
>
<span class="text-lg">{{ link.icon }}</span>
<span>{{ link.label }}</span>
</a>
}
</div>
</nav>
`,
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
  protected readonly darkMode = inject(DarkModeService);

  protected readonly links = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/exercises', label: 'Exercises', icon: '🏋️' },
    { path: '/workouts', label: 'Workouts', icon: '📋' },
    { path: '/progress', label: 'Progress', icon: '📈' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  protected logout(): void {
    this.auth.logout();
  }
}
