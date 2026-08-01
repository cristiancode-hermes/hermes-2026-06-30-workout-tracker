import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-display',
  standalone: true,
  template: `
<div class="flex flex-col items-center justify-center rounded-btn border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/30">
<span class="mb-2 text-3xl">⚠️</span>
<p class="mb-4 text-sm text-red-700 dark:text-red-400">{{ message() }}</p>
<button
(click)="retry.emit()"
class="rounded-btn bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
>
Try Again
</button>
</div>
`,
})
export class ErrorDisplayComponent {
  readonly message = input<string>('Something went wrong');
  readonly retry = output<void>();
}
