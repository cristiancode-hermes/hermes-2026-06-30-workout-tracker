import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ExerciseService } from '../../services/exercise.service';
import { WorkoutService } from '../../services/workout.service';
import { WorkoutExercise } from '../../models/models';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-workout-create',
  standalone: true,
  imports: [FormsModule, RouterLink, LoadingSpinnerComponent],
  template: `
<div class="mx-auto max-w-4xl space-y-6 p-4 pb-20 lg:pb-4 lg:pl-0">
<a routerLink="/workouts" class="inline-flex items-center gap-1 text-sm text-accent hover:text-accent dark:text-accent">
← Back to Workouts
</a>

<h1 class="heading-1 text-surface-900 dark:text-white">New Workout</h1>

<!-- Step Indicator -->
<div class="flex items-center gap-2">
@for (s of steps; track $index) {
<div class="flex items-center gap-2">
<div
class="flex h-8 w-8 items-center justify-center rounded-badge text-sm font-medium"
[class]="currentStep() > $index ? 'bg-accent text-white' : currentStep() === $index ? 'bg-accent text-white' : 'bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400'"
>
{{ $index + 1 }}
</div>
<span class="hidden text-sm sm:inline" [class]="currentStep() >= $index ? 'text-surface-900 dark:text-white' : 'text-surface-400'">{{ s }}</span>
@if ($index < steps.length - 1) {
<div class="h-0.5 w-8 rounded" [class]="currentStep() > $index ? 'bg-accent' : 'bg-surface-200 dark:bg-surface-700'"></div>
}
</div>
}
</div>

<!-- Step 1: Basic Info -->
@if (currentStep() === 0) {
<div class="rounded-card bg-surface-card p-6 dark:bg-surface-800">
<h2 class="mb-4 heading-2 text-surface-900 dark:text-white">Workout Details</h2>
<div class="space-y-4">
<div>
<label class="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">Workout Name</label>
<input
type="text"
[(ngModel)]="workoutName"
class="w-full rounded-btn border border-surface-300 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-surface-600 dark:bg-surface-800 dark:text-white"
placeholder="e.g. Upper Body Push"
/>
</div>
<div>
<label class="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">Date</label>
<input
type="date"
[(ngModel)]="workoutDate"
class="w-full rounded-btn border border-surface-300 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-surface-600 dark:bg-surface-800 dark:text-white"
/>
</div>
<div>
<label class="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">Duration (minutes)</label>
<input
type="number"
[(ngModel)]="workoutDuration"
class="w-full rounded-btn border border-surface-300 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-surface-600 dark:bg-surface-800 dark:text-white"
placeholder="e.g. 60"
/>
</div>
<div>
<label class="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">Notes (optional)</label>
<textarea
[(ngModel)]="workoutNotes"
rows="3"
class="w-full rounded-btn border border-surface-300 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-surface-600 dark:bg-surface-800 dark:text-white"
placeholder="Any notes..."
></textarea>
</div>
</div>
</div>
}

<!-- Step 2: Add Exercises -->
@if (currentStep() === 1) {
<div class="rounded-card bg-surface-card p-6 dark:bg-surface-800">
<h2 class="mb-4 heading-2 text-surface-900 dark:text-white">Add Exercises</h2>

@if (exerciseService.isLoading()) {
<app-loading-spinner />
} @else {
<!-- Exercise selector -->
<div class="mb-6">
<label class="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">Select Exercise</label>
<select
[(ngModel)]="selectedExerciseId"
class="w-full rounded-btn border border-surface-300 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-surface-600 dark:bg-surface-800 dark:text-white"
>
<option value="">Choose an exercise...</option>
@for (ex of exerciseService.exercises(); track ex.id) {
<option [value]="ex.id">{{ ex.name }} ({{ ex.muscleGroup }})</option>
}
</select>
</div>

@if (selectedExerciseId()) {
<div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
<div>
<label class="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">Sets</label>
<input type="number" [(ngModel)]="exerciseSets" class="w-full rounded-btn border border-surface-300 px-3 py-2 text-sm focus:border-accent focus:outline-none dark:border-surface-600 dark:bg-surface-800 dark:text-white" value="3" />
</div>
<div>
<label class="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">Reps</label>
<input type="number" [(ngModel)]="exerciseReps" class="w-full rounded-btn border border-surface-300 px-3 py-2 text-sm focus:border-accent focus:outline-none dark:border-surface-600 dark:bg-surface-800 dark:text-white" value="10" />
</div>
<div>
<label class="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">Weight (kg)</label>
<input type="number" [(ngModel)]="exerciseWeight" class="w-full rounded-btn border border-surface-300 px-3 py-2 text-sm focus:border-accent focus:outline-none dark:border-surface-600 dark:bg-surface-800 dark:text-white" value="0" />
</div>
<div>
<label class="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">Rest (sec)</label>
<input type="number" [(ngModel)]="exerciseRest" class="w-full rounded-btn border border-surface-300 px-3 py-2 text-sm focus:border-accent focus:outline-none dark:border-surface-600 dark:bg-surface-800 dark:text-white" value="60" />
</div>
</div>
<button
(click)="addExercise()"
class="rounded-btn bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
>
+ Add to Workout
</button>
}

<!-- Added Exercises -->
@if (addedExercises().length > 0) {
<div class="mt-6">
<h3 class="mb-3 font-semibold text-surface-900 dark:text-white">Added Exercises ({{ addedExercises().length }})</h3>
<div class="space-y-2">
@for (ex of addedExercises(); track $index) {
<div class="flex items-center justify-between rounded-btn bg-surface-50 p-3 dark:bg-surface-700/50">
<div>
<span class="font-medium text-surface-900 dark:text-white">{{ ex.exerciseName }}</span>
<span class="ml-2 text-sm text-surface-500 dark:text-surface-400">{{ ex.sets }}×{{ ex.reps }} @ {{ ex.weight }}kg</span>
</div>
<button (click)="removeExercise($index)" class="text-sm text-red-600 hover:text-red-700">Remove</button>
</div>
}
</div>
</div>
}
}
</div>
}

<!-- Step 3: Review & Save -->
@if (currentStep() === 2) {
<div class="rounded-card bg-surface-card p-6 dark:bg-surface-800">
<h2 class="mb-4 heading-2 text-surface-900 dark:text-white">Review Workout</h2>
<div class="space-y-3">
<div class="flex justify-between border-b border-surface-200 pb-2 dark:border-surface-700">
<span class="text-surface-500 dark:text-surface-400">Name</span>
<span class="font-medium text-surface-900 dark:text-white">{{ workoutName() }}</span>
</div>
<div class="flex justify-between border-b border-surface-200 pb-2 dark:border-surface-700">
<span class="text-surface-500 dark:text-surface-400">Date</span>
<span class="font-medium text-surface-900 dark:text-white">{{ workoutDate() }}</span>
</div>
<div class="flex justify-between border-b border-surface-200 pb-2 dark:border-surface-700">
<span class="text-surface-500 dark:text-surface-400">Duration</span>
<span class="font-medium text-surface-900 dark:text-white">{{ workoutDuration() }} min</span>
</div>
<div class="flex justify-between border-b border-surface-200 pb-2 dark:border-surface-700">
<span class="text-surface-500 dark:text-surface-400">Exercises</span>
<span class="font-medium text-surface-900 dark:text-white">{{ addedExercises().length }}</span>
</div>
@if (workoutNotes()) {
<div class="border-b border-surface-200 pb-2 dark:border-surface-700">
<span class="text-surface-500 dark:text-surface-400">Notes</span>
<p class="mt-1 text-surface-900 dark:text-white">{{ workoutNotes() }}</p>
</div>
}
</div>

@if (addedExercises().length > 0) {
<div class="mt-4">
<h3 class="mb-2 font-semibold text-surface-900 dark:text-white">Exercises</h3>
<div class="space-y-2">
@for (ex of addedExercises(); track $index) {
<div class="rounded-btn bg-surface-50 p-3 dark:bg-surface-700/50">
<span class="font-medium text-surface-900 dark:text-white">{{ ex.exerciseName }}</span>
<span class="ml-2 text-sm text-surface-500 dark:text-surface-400">{{ ex.sets }} × {{ ex.reps }} @ {{ ex.weight }}kg, rest {{ ex.restSeconds }}s</span>
</div>
}
</div>
</div>
}

<button
(click)="saveWorkout()"
[disabled]="workoutService.isLoading() || addedExercises().length === 0 || !workoutName()"
class="mt-6 w-full rounded-btn bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
>
{{ workoutService.isLoading() ? 'Saving...' : 'Save Workout' }}
</button>

@if (workoutService.error(); as err) {
<div class="mt-3 rounded-btn bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">{{ err }}</div>
}
</div>
}

<!-- Navigation Buttons -->
<div class="flex justify-between">
@if (currentStep() > 0) {
<button (click)="prevStep()" class="rounded-btn border border-surface-300 px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 dark:border-surface-600 dark:text-surface-300 dark:hover:bg-surface-800">
Previous
</button>
} @else {
<div></div>
}
@if (currentStep() < steps.length - 1) {
<button (click)="nextStep()" class="rounded-btn bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
Next
</button>
}
</div>
</div>
`,
})
export class WorkoutCreateComponent implements OnInit {
  protected readonly exerciseService = inject(ExerciseService);
  protected readonly workoutService = inject(WorkoutService);
  private readonly router = inject(Router);

  protected readonly steps = ['Details', 'Exercises', 'Review'];

  protected readonly currentStep = signal(0);
  protected readonly workoutName = signal('');
  protected readonly workoutDate = signal(new Date().toISOString().split('T')[0]);
  protected readonly workoutDuration = signal(60);
  protected readonly workoutNotes = signal('');
  protected readonly selectedExerciseId = signal('');
  protected readonly exerciseSets = signal(10);
  protected readonly exerciseReps = signal(10);
  protected readonly exerciseWeight = signal(0);
  protected readonly exerciseRest = signal(60);
  protected readonly addedExercises = signal<WorkoutExercise[]>([]);

  ngOnInit(): void {
    this.exerciseService.loadExercises();
  }

  protected nextStep(): void {
    this.currentStep.update((s) => Math.min(s + 1, this.steps.length - 1));
  }

  protected prevStep(): void {
    this.currentStep.update((s) => Math.max(s - 1, 0));
  }

  protected addExercise(): void {
    const id = this.selectedExerciseId();
    if (!id) return;
    const exercise = this.exerciseService.exercises().find((e) => e.id === id);
    if (!exercise) return;

    this.addedExercises.update((list) => [
      ...list,
      {
        exerciseId: id,
        exerciseName: exercise.name,
        sets: this.exerciseSets(),
        reps: this.exerciseReps(),
        weight: this.exerciseWeight(),
        restSeconds: this.exerciseRest(),
      },
    ]);

    this.selectedExerciseId.set('');
    this.exerciseSets.set(10);
    this.exerciseReps.set(10);
    this.exerciseWeight.set(0);
    this.exerciseRest.set(60);
  }

  protected removeExercise(index: number): void {
    this.addedExercises.update((list) => list.filter((_, i) => i !== index));
  }

  protected saveWorkout(): void {
    if (!this.workoutName() || this.addedExercises().length === 0) return;

    this.workoutService.createWorkout({
      name: this.workoutName(),
      date: this.workoutDate(),
      duration: this.workoutDuration(),
      notes: this.workoutNotes(),
      exercises: this.addedExercises().map((e) => ({
        exerciseId: e.exerciseId,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight,
        restSeconds: e.restSeconds,
      })),
    });

    // Navigate back after a short delay
    setTimeout(() => {
      this.router.navigate(['/workouts']);
    }, 500);
  }
}
