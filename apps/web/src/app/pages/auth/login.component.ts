import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-surface-50 px-4 dark:bg-surface-950">
      <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg dark:bg-surface-900">
        <div class="mb-8 text-center">
          <span class="text-4xl">💪</span>
          <h1 class="mt-2 text-2xl font-bold text-surface-900 dark:text-white">Workout Tracker</h1>
          <p class="mt-1 text-sm text-surface-500">Sign in to your account</p>
        </div>

        @if (auth.error(); as err) {
          <div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
            {{ err }}
          </div>
        }

        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">Email</label>
            <input
              type="email"
              [(ngModel)]="email"
              class="w-full rounded-lg border border-surface-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">Password</label>
            <input
              type="password"
              [(ngModel)]="password"
              class="w-full rounded-lg border border-surface-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
              placeholder="••••••••"
            />
          </div>
          <button
            (click)="onLogin()"
            [disabled]="auth.isLoading()"
            class="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {{ auth.isLoading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </div>

        <p class="mt-6 text-center text-sm text-surface-500">
          Don't have an account?
          <a routerLink="/auth/register" class="font-medium text-primary-600 hover:text-primary-700">Register</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  protected readonly auth = inject(AuthService);
  protected readonly email = signal('');
  protected readonly password = signal('');

  protected onLogin(): void {
    if (this.email() && this.password()) {
      this.auth.login(this.email(), this.password());
    }
  }
}
