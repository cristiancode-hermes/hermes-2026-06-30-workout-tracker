export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  instructions: string;
  type: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName?: string;
  sets: number;
  reps: number;
  weight: number;
  restSeconds: number;
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  duration: number;
  notes: string;
  exerciseCount?: number;
  exercises?: WorkoutExercise[];
}

export interface WorkoutCreateRequest {
  name: string;
  date: string;
  duration: number;
  notes: string;
  exercises: WorkoutExercise[];
}

export interface ProgressEntry {
  id: string;
  date: string;
  weight: number;
  bodyFat: number;
  notes: string;
}

export interface ProgressCreateRequest {
  date: string;
  weight: number;
  bodyFat: number;
  notes: string;
}
