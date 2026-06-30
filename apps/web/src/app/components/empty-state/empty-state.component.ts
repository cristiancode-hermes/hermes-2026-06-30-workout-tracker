import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center p-12 text-center">
      <span class="mb-4 text-5xl">{{ icon() }}</span>
      <h3 class="mb-2 text-lg font-semibold text-surface-700 dark:text-surface-300">{{ message() }}</h3>
      @if (actionLabel()) {
        <button
          (click)="action.emit()"
          class="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input<string>('📭');
  readonly message = input<string>('No data found');
  readonly actionLabel = input<string>('');
  readonly action = output<void>();
}
