import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExerciseService } from '../../services/exercise.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { ErrorDisplayComponent } from '../../components/error-display/error-display.component';

@Component({
  selector: 'app-exercise-library',
  standalone: true,
  imports: [FormsModule, LoadingSpinnerComponent, EmptyStateComponent, ErrorDisplayComponent],
  template: `
    <div class="mx-auto max-w-5xl space-y-6 p-4 pb-20 lg:pb-4 lg:pl-0">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-white">Exercise Library</h1>

      <!-- Search -->
      <div>
        <input
          type="text"
          [ngModel]="exerciseService.searchQuery()"
          (ngModelChange)="exerciseService.search($event)"
          placeholder="Search exercises..."
          class="w-full rounded-lg border border-surface-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
        />
      </div>

      <!-- Muscle Group Filters -->
      <div class="flex flex-wrap gap-2">
        <button
          (click)="exerciseService.filterByMuscleGroup(null)"
          class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
          [class]="!exerciseService.selectedMuscleGroup() ? 'bg-primary-600 text-white' : 'bg-surface-200 text-surface-600 hover:bg-surface-300 dark:bg-surface-700 dark:text-surface-400'"
        >
          All
        </button>
        @for (group of muscleGroups(); track group) {
          <button
            (click)="exerciseService.filterByMuscleGroup(group)"
            class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            [class]="exerciseService.selectedMuscleGroup() === group ? 'bg-primary-600 text-white' : 'bg-surface-200 text-surface-600 hover:bg-surface-300 dark:bg-surface-700 dark:text-surface-400'"
          >
            {{ group }}
          </button>
        }
      </div>

      <!-- Exercise Grid -->
      @if (exerciseService.isLoading()) {
        <app-loading-spinner />
      } @else if (exerciseService.error(); as err) {
        <app-error-display [message]="err" (retry)="exerciseService.loadExercises()" />
      } @else if (exerciseService.filteredExercises().length === 0) {
        <app-empty-state icon="🔍" message="No exercises found" />
      } @else {
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (ex of exerciseService.filteredExercises(); track ex.id) {
            <div class="rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-surface-800">
              <div class="mb-2 flex items-start justify-between">
                <h3 class="font-semibold text-surface-900 dark:text-white">{{ ex.name }}</h3>
                <span class="text-lg">{{ equipmentIcon(ex.equipment) }}</span>
              </div>
              <div class="mb-3 flex items-center gap-2">
                <span class="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  {{ ex.muscleGroup }}
                </span>
                <span class="text-xs text-surface-500 dark:text-surface-400">{{ ex.type }}</span>
              </div>
              <p class="mb-3 line-clamp-2 text-sm text-surface-600 dark:text-surface-400">{{ ex.instructions }}</p>
              <button
                (click)="toggleExpand(ex.id)"
                class="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {{ expandedIds().has(ex.id) ? 'Show less' : 'Show instructions' }}
              </button>
              @if (expandedIds().has(ex.id)) {
                <div class="mt-2 rounded-lg bg-surface-50 p-3 text-sm text-surface-700 dark:bg-surface-700/50 dark:text-surface-300">
                  {{ ex.instructions }}
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ExerciseLibraryComponent implements OnInit {
  protected readonly exerciseService = inject(ExerciseService);
  protected readonly expandedIds = signal(new Set<string>());

  protected readonly muscleGroups = signal<string[]>([]);

  ngOnInit(): void {
    this.exerciseService.loadExercises();
    // Wait a tick for exercises to load
    setTimeout(() => {
      this.muscleGroups.set(this.exerciseService.getMuscleGroups());
    }, 100);
  }

  protected toggleExpand(id: string): void {
    this.expandedIds.update((s) => {
      const newSet = new Set(s);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  protected equipmentIcon(equipment: string): string {
    const map: Record<string, string> = {
      barbell: '🏋️',
      dumbbell: '💪',
      machine: '⚙️',
      cables: '🪢',
      bodyweight: '🧘',
      kettlebell: '🔔',
      band: '🌈',
      foam_roller: '🔄',
      other: '📦',
    };
    return map[equipment.toLowerCase()] || '🏋️';
  }
}
