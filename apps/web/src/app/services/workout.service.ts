import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Workout, WorkoutCreateRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class WorkoutService {
  private readonly http = inject(HttpClient);

  readonly workouts = signal<Workout[]>([]);
  readonly currentWorkout = signal<Workout | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  loadWorkouts(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<Workout[]>('/api/workouts').subscribe({
      next: (data) => {
        this.workouts.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.error.set('Failed to load workouts');
      },
    });
  }

  loadWorkout(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<Workout>(`/api/workouts/${id}`).subscribe({
      next: (data) => {
        this.currentWorkout.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.error.set('Failed to load workout');
      },
    });
  }

  createWorkout(workout: WorkoutCreateRequest): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.post<Workout>('/api/workouts', workout).subscribe({
      next: (data) => {
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.error.set('Failed to create workout');
      },
    });
  }

  deleteWorkout(id: string): void {
    this.http.delete(`/api/workouts/${id}`).subscribe({
      next: () => {
        this.workouts.update((list) => list.filter((w) => w.id !== id));
      },
      error: () => {
        this.error.set('Failed to delete workout');
      },
    });
  }
}
