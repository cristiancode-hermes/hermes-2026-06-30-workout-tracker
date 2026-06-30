import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { WorkoutService } from '../../services/workout.service';
import { ProgressService } from '../../services/progress.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { ErrorDisplayComponent } from '../../components/error-display/error-display.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, LoadingSpinnerComponent, EmptyStateComponent, ErrorDisplayComponent],
  template: `
    <div class="mx-auto max-w-4xl space-y-6 p-4 pb-20 lg:pb-4 lg:pl-0">
      <!-- Greeting -->
      <div class="rounded-2xl bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white">
        <h1 class="text-xl font-bold sm:text-2xl">
          @if (auth.currentUser(); as user) {
            Good {{ timeOfDay() }}, {{ user.name }}!
          } @else {
            Welcome!
          }
        </h1>
        <p class="mt-1 text-primary-100">{{ todayDate() }}</p>
      </div>

      <!-- Progress Summary -->
      <div class="grid grid-cols-2 gap-4">
        <div class="rounded-xl bg-white p-4 shadow-sm dark:bg-surface-800">
          <p class="text-sm text-surface-500 dark:text-surface-400">Current Weight</p>
          <p class="text-2xl font-bold text-surface-900 dark:text-white">
            {{ currentWeight() > 0 ? currentWeight() + ' kg' : '—' }}
          </p>
        </div>
        <div class="rounded-xl bg-white p-4 shadow-sm dark:bg-surface-800">
          <p class="text-sm text-surface-500 dark:text-surface-400">Workouts This Month</p>
          <p class="text-2xl font-bold text-surface-900 dark:text-white">{{ workoutsThisMonth() }}</p>
        </div>
      </div>

      <!-- Recent Workouts -->
      <div>
        <h2 class="mb-3 text-lg font-semibold text-surface-900 dark:text-white">Recent Workouts</h2>
        @if (workoutService.isLoading()) {
          <app-loading-spinner />
        } @else if (workoutService.error(); as err) {
          <app-error-display [message]="err" (retry)="workoutService.loadWorkouts()" />
        } @else if (recentWorkouts().length === 0) {
          <app-empty-state icon="🏋️" message="No workouts yet" actionLabel="Start Workout" (action)="goToNewWorkout()" />
        } @else {
          <div class="space-y-2">
            @for (w of recentWorkouts(); track w.id) {
              <a [routerLink]="['/workouts', w.id]" class="block rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-surface-800">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-medium text-surface-900 dark:text-white">{{ w.name }}</h3>
                    <p class="text-sm text-surface-500 dark:text-surface-400">{{ w.date | date:'mediumDate' }} • {{ w.exerciseCount }} exercises</p>
                  </div>
                  <span class="text-sm text-surface-400">{{ w.duration }}min</span>
                </div>
              </a>
            }
          </div>
        }
      </div>

      <!-- Quick Actions -->
      <div>
        <h2 class="mb-3 text-lg font-semibold text-surface-900 dark:text-white">Quick Actions</h2>
        <div class="grid grid-cols-2 gap-4">
          <a routerLink="/workouts/new" class="flex items-center justify-center gap-2 rounded-xl bg-primary-600 p-4 text-white hover:bg-primary-700">
            <span>➕</span> New Workout
          </a>
          <a routerLink="/progress" class="flex items-center justify-center gap-2 rounded-xl bg-surface-200 p-4 text-surface-800 hover:bg-surface-300 dark:bg-surface-700 dark:text-surface-200 dark:hover:bg-surface-600">
            <span>📝</span> Log Progress
          </a>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly workoutService = inject(WorkoutService);
  protected readonly progressService = inject(ProgressService);

  protected readonly timeOfDay = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  });

  protected readonly todayDate = computed(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  });

  protected readonly recentWorkouts = computed(() => {
    return this.workoutService.workouts().slice(0, 5);
  });

  protected readonly workoutsThisMonth = computed(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return this.workoutService.workouts().filter((w) => {
      const d = new Date(w.date);
      return d.getMonth() === month && d.getFullYear() === year;
    }).length;
  });

  protected readonly currentWeight = computed(() => {
    const entries = this.progressService.entries();
    if (entries.length === 0) return 0;
    return entries[0].weight;
  });

  ngOnInit(): void {
    this.workoutService.loadWorkouts();
    this.progressService.loadEntries();
  }

  protected goToNewWorkout(): void {
    window.location.href = '/workouts/new';
  }
}
