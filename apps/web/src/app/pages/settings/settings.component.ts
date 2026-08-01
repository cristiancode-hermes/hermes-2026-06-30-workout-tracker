import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DarkModeService } from '../../services/dark-mode.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [],
  template: `
<div class="mx-auto max-w-2xl space-y-6 p-4 pb-20 lg:pb-4 lg:pl-0">
<h1 class="heading-1 text-surface-900 dark:text-white">Settings</h1>

<!-- User Info -->
<div class="rounded-card bg-surface-card p-6 dark:bg-surface-800">
<h2 class="mb-4 heading-2 text-surface-900 dark:text-white">Profile</h2>
@if (auth.currentUser(); as user) {
<div class="space-y-2">
<div class="flex justify-between border-b border-surface-200 pb-2 dark:border-surface-700">
<span class="text-surface-500 dark:text-surface-400">Name</span>
<span class="font-medium text-surface-900 dark:text-white">{{ user.name }}</span>
</div>
<div class="flex justify-between border-b border-surface-200 pb-2 dark:border-surface-700">
<span class="text-surface-500 dark:text-surface-400">Email</span>
<span class="font-medium text-surface-900 dark:text-white">{{ user.email }}</span>
</div>
</div>
} @else {
<p class="text-sm text-surface-500">Not signed in</p>
}
</div>

<!-- Appearance -->
<div class="rounded-card bg-surface-card p-6 dark:bg-surface-800">
<h2 class="mb-4 heading-2 text-surface-900 dark:text-white">Appearance</h2>
<div class="flex items-center justify-between">
<div>
<p class="font-medium text-surface-900 dark:text-white">Dark Mode</p>
<p class="text-sm text-surface-500 dark:text-surface-400">{{ darkMode.isDark() ? 'Dark' : 'Light' }}</p>
</div>
<button
(click)="darkMode.toggle()"
class="relative inline-flex h-6 w-11 items-center rounded-badge transition-colors"
[class]="darkMode.isDark() ? 'bg-accent' : 'bg-surface-300'"
>
<span
class="inline-block h-4 w-4 transform rounded-badge bg-surface-card transition-transform"
[class]="darkMode.isDark() ? 'translate-x-6' : 'translate-x-1'"
></span>
</button>
</div>
</div>

<!-- App Info -->
<div class="rounded-card bg-surface-card p-6 dark:bg-surface-800">
<h2 class="mb-4 heading-2 text-surface-900 dark:text-white">About</h2>
<div class="space-y-2">
<div class="flex justify-between border-b border-surface-200 pb-2 dark:border-surface-700">
<span class="text-surface-500 dark:text-surface-400">App</span>
<span class="font-medium text-surface-900 dark:text-white">Workout Tracker</span>
</div>
<div class="flex justify-between border-b border-surface-200 pb-2 dark:border-surface-700">
<span class="text-surface-500 dark:text-surface-400">Version</span>
<span class="font-medium text-surface-900 dark:text-white">1.0.0</span>
</div>
<div class="flex justify-between">
<span class="text-surface-500 dark:text-surface-400">Framework</span>
<span class="font-medium text-surface-900 dark:text-white">Angular 22</span>
</div>
</div>
</div>

<!-- Logout -->
<button
(click)="auth.logout()"
class="w-full rounded-btn bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700"
>
Sign Out
</button>
</div>
`,
})
export class SettingsComponent {
  protected readonly auth = inject(AuthService);
  protected readonly darkMode = inject(DarkModeService);
}
