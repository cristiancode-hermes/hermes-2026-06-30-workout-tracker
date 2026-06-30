import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkoutService } from '../../services/workout.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { ErrorDisplayComponent } from '../../components/error-display/error-display.component';

@Component({
  selector: 'app-workout-list',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, EmptyStateComponent, ErrorDisplayComponent],
  template: `
    <div class="mx-auto max-w-4xl space-y-6 p-4 pb-20 lg:pb-4 lg:pl-0">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-surface-900 dark:text-white">Workouts</h1>
        <a routerLink="/workouts/new" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          + New Workout
        </a>
      </div>

      @if (workoutService.isLoading()) {
        <app-loading-spinner />
      } @else if (workoutService.error(); as err) {
        <app-error-display [message]="err" (retry)="workoutService.loadWorkouts()" />
      } @else if (workoutService.workouts().length === 0) {
        <app-empty-state icon="📋" message="No workouts yet" actionLabel="Create First Workout" (action)="goToNew()" />
      } @else {
        <div class="space-y-3">
          @for (w of workoutService.workouts(); track w.id) {
            <a [routerLink]="['/workouts', w.id]" class="block rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-surface-800">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h3 class="font-semibold text-surface-900 dark:text-white">{{ w.name }}</h3>
                  <p class="text-sm text-surface-500 dark:text-surface-400">
                    {{ formatDate(w.date) }} • {{ w.exerciseCount || 0 }} exercises
                  </p>
                </div>
                <div class="text-right">
                  <span class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ w.duration }} min</span>
                </div>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class WorkoutListComponent implements OnInit {
  protected readonly workoutService = inject(WorkoutService);

  ngOnInit(): void {
    this.workoutService.loadWorkouts();
  }

  protected formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  protected goToNew(): void {
    window.location.href = '/workouts/new';
  }
}
