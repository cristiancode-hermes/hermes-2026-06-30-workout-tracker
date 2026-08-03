import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ExercisesModule } from './exercises/exercises.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { ProgressModule } from './progress/progress.module';
import { SeedModule } from './seed/seed.module';
import { User } from './entities/user.entity';
import { Exercise } from './entities/exercise.entity';
import { Workout } from './entities/workout.entity';
import { WorkoutExercise } from './entities/workout-exercise.entity';
import { ProgressEntry } from './entities/progress-entry.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const dbType = config.get<string>('DATABASE_TYPE') || 'sqljs';
        const url = config.get<string>('DATABASE_URL') || '';

        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            url,
            entities: [User, Exercise, Workout, WorkoutExercise, ProgressEntry],
            synchronize: true,
            ssl: { rejectUnauthorized: false },
          };
        }

        return {
          type: 'sqljs',
          location: 'data/workout-tracker.sqlite',
          autoSave: true,
          synchronize: true,
          entities: [User, Exercise, Workout, WorkoutExercise, ProgressEntry],
        };
      },
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'web', 'dist', 'web', 'browser'),
      serveRoot: '/',
      exclude: ['/api/(.*)'],
    }),
    AuthModule,
    ExercisesModule,
    WorkoutsModule,
    ProgressModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
