import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import {
  Exercise,
  MuscleGroup,
  Equipment,
  ExerciseType,
} from '../entities/exercise.entity';
import { Workout } from '../entities/workout.entity';
import { WorkoutExercise } from '../entities/workout-exercise.entity';
import { ProgressEntry } from '../entities/progress-entry.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
    @InjectRepository(Workout)
    private readonly workoutRepository: Repository<Workout>,
    @InjectRepository(WorkoutExercise)
    private readonly workoutExerciseRepository: Repository<WorkoutExercise>,
    @InjectRepository(ProgressEntry)
    private readonly progressRepository: Repository<ProgressEntry>,
  ) {}

  async onModuleInit() {
    const existing = await this.userRepository.findOne({
      where: { email: 'demo@example.com' },
    });
    if (existing) {
      this.logger.log('Seed data already exists, skipping...');
      return;
    }

    this.logger.log('Seeding database...');

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const user = await this.userRepository.save({
      email: 'demo@example.com',
      password: hashedPassword,
      name: 'Demo User',
    } as any);

    // Create exercises
    const exercises = await this.exerciseRepository.save(
      [
        { name: 'Bench Press', muscleGroup: MuscleGroup.CHEST, equipment: Equipment.BARBELL, instructions: 'Lie on flat bench, lower bar to mid-chest, press up.', type: ExerciseType.STRENGTH },
        { name: 'Incline Dumbbell Press', muscleGroup: MuscleGroup.CHEST, equipment: Equipment.DUMBBELL, instructions: 'Sit on incline bench, press dumbbells up from chest.', type: ExerciseType.STRENGTH },
        { name: 'Push Ups', muscleGroup: MuscleGroup.CHEST, equipment: Equipment.BODYWEIGHT, instructions: 'Keep body straight, lower chest to floor, push up.', type: ExerciseType.STRENGTH },
        { name: 'Deadlift', muscleGroup: MuscleGroup.BACK, equipment: Equipment.BARBELL, instructions: 'Hinge at hips, keep back straight, lift bar.', type: ExerciseType.STRENGTH },
        { name: 'Pull Ups', muscleGroup: MuscleGroup.BACK, equipment: Equipment.BODYWEIGHT, instructions: 'Pull chin over bar, lower with control.', type: ExerciseType.STRENGTH },
        { name: 'Barbell Row', muscleGroup: MuscleGroup.BACK, equipment: Equipment.BARBELL, instructions: 'Bend over with flat back, row bar to lower chest.', type: ExerciseType.STRENGTH },
        { name: 'Squat', muscleGroup: MuscleGroup.LEGS, equipment: Equipment.BARBELL, instructions: 'Keep chest up, squat to parallel, drive up.', type: ExerciseType.STRENGTH },
        { name: 'Leg Press', muscleGroup: MuscleGroup.LEGS, equipment: Equipment.MACHINE, instructions: 'Push platform away with legs, control on return.', type: ExerciseType.STRENGTH },
        { name: 'Lunges', muscleGroup: MuscleGroup.LEGS, equipment: Equipment.DUMBBELL, instructions: 'Step forward into lunge, both knees at 90 degrees.', type: ExerciseType.STRENGTH },
        { name: 'Overhead Press', muscleGroup: MuscleGroup.SHOULDERS, equipment: Equipment.BARBELL, instructions: 'Press bar overhead from shoulders, keep core tight.', type: ExerciseType.STRENGTH },
        { name: 'Lateral Raise', muscleGroup: MuscleGroup.SHOULDERS, equipment: Equipment.DUMBBELL, instructions: 'Raise dumbbells to sides to shoulder height.', type: ExerciseType.STRENGTH },
        { name: 'Face Pull', muscleGroup: MuscleGroup.SHOULDERS, equipment: Equipment.CABLE, instructions: 'Pull cable rope toward face, squeeze rear delts.', type: ExerciseType.STRENGTH },
        { name: 'Bicep Curl', muscleGroup: MuscleGroup.ARMS, equipment: Equipment.DUMBBELL, instructions: 'Curl dumbbells up toward shoulders.', type: ExerciseType.STRENGTH },
        { name: 'Tricep Pushdown', muscleGroup: MuscleGroup.ARMS, equipment: Equipment.CABLE, instructions: 'Push cable attachment down, extend elbows.', type: ExerciseType.STRENGTH },
        { name: 'Hammer Curl', muscleGroup: MuscleGroup.ARMS, equipment: Equipment.DUMBBELL, instructions: 'Curl with neutral grip, palms facing each other.', type: ExerciseType.STRENGTH },
        { name: 'Plank', muscleGroup: MuscleGroup.CORE, equipment: Equipment.BODYWEIGHT, instructions: 'Hold straight body position on forearms.', type: ExerciseType.STRENGTH },
        { name: 'Cable Crunch', muscleGroup: MuscleGroup.CORE, equipment: Equipment.CABLE, instructions: 'Kneel and crunch cable attachment down.', type: ExerciseType.STRENGTH },
        { name: 'Running', muscleGroup: MuscleGroup.CARDIO, equipment: Equipment.OTHER, instructions: 'Run at steady or interval pace.', type: ExerciseType.CARDIO },
        { name: 'Jump Rope', muscleGroup: MuscleGroup.CARDIO, equipment: Equipment.OTHER, instructions: 'Jump rope at moderate pace.', type: ExerciseType.CARDIO },
        { name: 'Stretching', muscleGroup: MuscleGroup.FULL_BODY, equipment: Equipment.BODYWEIGHT, instructions: 'Full body stretching routine.', type: ExerciseType.FLEXIBILITY },
      ].map((e) => ({ ...e })),
    ) as Exercise[];

    // Create sample workouts
    const workout1 = await this.workoutRepository.save({
      name: 'Push Day',
      date: '2026-06-28',
      duration: 45,
      notes: 'Good session, increased bench weight',
      userId: user.id,
    } as any);

    await this.workoutExerciseRepository.save(
      [
        { workoutId: workout1.id, exerciseId: exercises[0].id, sets: 4, reps: 8, weight: 80, restSeconds: 90, order: 1 },
        { workoutId: workout1.id, exerciseId: exercises[1].id, sets: 3, reps: 10, weight: 24, restSeconds: 60, order: 2 },
        { workoutId: workout1.id, exerciseId: exercises[9].id, sets: 3, reps: 8, weight: 40, restSeconds: 90, order: 3 },
      ] as any,
    );

    const workout2 = await this.workoutRepository.save({
      name: 'Leg Day',
      date: '2026-06-29',
      duration: 50,
      notes: 'New squat PR!',
      userId: user.id,
    } as any);

    await this.workoutExerciseRepository.save(
      [
        { workoutId: workout2.id, exerciseId: exercises[6].id, sets: 5, reps: 5, weight: 100, restSeconds: 120, order: 1 },
        { workoutId: workout2.id, exerciseId: exercises[7].id, sets: 3, reps: 12, weight: 150, restSeconds: 60, order: 2 },
        { workoutId: workout2.id, exerciseId: exercises[8].id, sets: 3, reps: 10, weight: 20, restSeconds: 60, order: 3 },
      ] as any,
    );

    const workout3 = await this.workoutRepository.save({
      name: 'Pull Day',
      date: '2026-06-30',
      duration: 40,
      notes: 'Focused on back width',
      userId: user.id,
    } as any);

    await this.workoutExerciseRepository.save(
      [
        { workoutId: workout3.id, exerciseId: exercises[4].id, sets: 3, reps: 8, weight: 0, restSeconds: 90, order: 1 },
        { workoutId: workout3.id, exerciseId: exercises[5].id, sets: 4, reps: 10, weight: 60, restSeconds: 90, order: 2 },
      ] as any,
    );

    // Create progress entries
    await this.progressRepository.save(
      [
        { userId: user.id, date: '2026-06-01', weight: 78.0, bodyFat: 16.0, notes: 'Start of month' },
        { userId: user.id, date: '2026-06-08', weight: 78.5, bodyFat: 15.8, notes: 'Week 1' },
        { userId: user.id, date: '2026-06-15', weight: 79.2, bodyFat: 15.5, notes: 'Gaining lean mass' },
        { userId: user.id, date: '2026-06-22', weight: 80.0, bodyFat: 15.3, notes: 'Strong progress' },
        { userId: user.id, date: '2026-06-29', weight: 80.5, bodyFat: 15.0, notes: 'End of month check' },
      ] as any,
    );

    this.logger.log('Database seeded successfully');
  }
}
