import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../entities/user.entity';
import { Exercise } from '../entities/exercise.entity';
import { Workout } from '../entities/workout.entity';
import { WorkoutExercise } from '../entities/workout-exercise.entity';
import { ProgressEntry } from '../entities/progress-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Exercise,
      Workout,
      WorkoutExercise,
      ProgressEntry,
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
