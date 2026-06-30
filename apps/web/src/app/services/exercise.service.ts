import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Exercise } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private readonly http = inject(HttpClient);

  readonly exercises = signal<Exercise[]>([]);
  readonly filteredExercises = signal<Exercise[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedMuscleGroup = signal<string | null>(null);
  readonly searchQuery = signal('');

  loadExercises(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<Exercise[]>('/api/exercises').subscribe({
      next: (data) => {
        this.exercises.set(data);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set('Failed to load exercises');
      },
    });
  }

  filterByMuscleGroup(muscleGroup: string | null): void {
    this.selectedMuscleGroup.set(muscleGroup);
    this.applyFilters();
  }

  search(query: string): void {
    this.searchQuery.set(query);
    this.applyFilters();
  }

  private applyFilters(): void {
    let result = this.exercises();
    const mg = this.selectedMuscleGroup();
    const sq = this.searchQuery().toLowerCase();
    if (mg) {
      result = result.filter((e) => e.muscleGroup === mg);
    }
    if (sq) {
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(sq) ||
          e.muscleGroup.toLowerCase().includes(sq) ||
          e.equipment.toLowerCase().includes(sq)
      );
    }
    this.filteredExercises.set(result);
  }

  getMuscleGroups(): string[] {
    const groups = new Set(this.exercises().map((e) => e.muscleGroup));
    return Array.from(groups).sort();
  }
}
