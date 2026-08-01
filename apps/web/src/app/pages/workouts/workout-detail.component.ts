import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WorkoutService } from '../../services/workout.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../components/error-display/error-display.component';

@Component({
  selector: 'app-workout-detail',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, ErrorDisplayComponent],
  template: `
<div class="mx-auto max-w-4xl space-y-6 p-4 pb-20 lg:pb-4 lg:pl-0">
<a routerLink="/workouts" class="inline-flex items-center gap-1 text-sm text-accent hover:text-accent dark:text-accent">
← Back to Workouts
</a>

@if (workoutService.isLoading()) {
<app-loading-spinner />
} @else if (workoutService.error(); as err) {
<app-error-display [message]="err" (retry)="loadWorkout()" />
} @else if (workoutService.currentWorkout(); as w) {
<!-- Header -->
<div class="rounded-card bg-surface-card p-6 dark:bg-surface-800">
<div class="flex items-start justify-between">
<div>
<h1 class="heading-1 text-surface-900 dark:text-white">{{ w.name }}</h1>
<p class="mt-1 text-surface-500 dark:text-surface-400">{{ formatDate(w.date) }}</p>
</div>
<div class="text-right">
<span class="heading-2 text-surface-700 dark:text-surface-300">{{ w.duration }} min</span>
</div>
</div>
@if (w.notes) {
<p class="mt-4 text-sm text-surface-600 dark:text-surface-400">{{ w.notes }}</p>
}
</div>

<!-- Exercises Table -->
<div class="rounded-card bg-surface-card p-6 dark:bg-surface-800">
<h2 class="mb-4 heading-2 text-surface-900 dark:text-white">Exercises</h2>
@if (w.exercises && w.exercises.length > 0) {
<div class="overflow-x-auto">
<table class="w-full text-left text-sm">
<thead>
<tr class="border-b border-surface-200 dark:border-surface-700">
<th class="pb-2 font-medium text-surface-500 dark:text-surface-400">Exercise</th>
<th class="pb-2 font-medium text-surface-500 dark:text-surface-400">Sets</th>
<th class="pb-2 font-medium text-surface-500 dark:text-surface-400">Reps</th>
<th class="pb-2 font-medium text-surface-500 dark:text-surface-400">Weight</th>
<th class="pb-2 font-medium text-surface-500 dark:text-surface-400">Rest</th>
</tr>
</thead>
<tbody>
@for (ex of w.exercises; track $index) {
<tr class="border-b border-surface-100 dark:border-surface-700/50">
<td class="py-3 font-medium text-surface-900 dark:text-white">{{ ex.exerciseName || 'Exercise' }}</td>
<td class="py-3 text-surface-600 dark:text-surface-400">{{ ex.sets }}</td>
<td class="py-3 text-surface-600 dark:text-surface-400">{{ ex.reps }}</td>
<td class="py-3 text-surface-600 dark:text-surface-400">{{ ex.weight }} kg</td>
<td class="py-3 text-surface-600 dark:text-surface-400">{{ ex.restSeconds }}s</td>
</tr>
}
</tbody>
</table>
</div>
} @else {
<p class="text-sm text-surface-500 dark:text-surface-400">No exercises in this workout</p>
}
</div>

<!-- Actions -->
<div class="flex gap-3">
<button
(click)="deleteWorkout(w.id)"
class="rounded-btn bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
>
Delete Workout
</button>
</div>
}
</div>
`,
})
export class WorkoutDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly workoutService = inject(WorkoutService);
  private workoutId = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.workoutId = id;
        this.loadWorkout();
      }
    });
  }

  protected loadWorkout(): void {
    if (this.workoutId) {
      this.workoutService.loadWorkout(this.workoutId);
    }
  }

  protected formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  protected deleteWorkout(id: string): void {
    if (confirm('Are you sure you want to delete this workout?')) {
      this.workoutService.deleteWorkout(id);
    }
  }
}
