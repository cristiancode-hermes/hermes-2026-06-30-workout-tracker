import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workout } from '../entities/workout.entity';
import { WorkoutExercise } from '../entities/workout-exercise.entity';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectRepository(Workout)
    private readonly workoutRepository: Repository<Workout>,
    @InjectRepository(WorkoutExercise)
    private readonly workoutExerciseRepository: Repository<WorkoutExercise>,
  ) {}

  async create(
    userId: number,
    createWorkoutDto: CreateWorkoutDto,
  ): Promise<Workout> {
    const { exercises, ...workoutData } = createWorkoutDto;

    const workout = await this.workoutRepository.save({
      ...workoutData,
      userId,
    } as any);

    if (exercises && exercises.length > 0) {
      const workoutExercises = exercises.map((ex) => ({
        workoutId: workout.id,
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        restSeconds: ex.restSeconds,
        order: ex.order ?? 0,
      }));

      await this.workoutExerciseRepository.save(workoutExercises as any);
    }

    return this.findOne(workout.id, userId);
  }

  async findAll(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Workout[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.workoutRepository.findAndCount({
      where: { userId },
      relations: {
        exercises: { exercise: true },
      },
      order: { date: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: number, userId: number): Promise<Workout> {
    const workout = await this.workoutRepository.findOne({
      where: { id },
      relations: {
        exercises: { exercise: true },
      },
    });

    if (!workout) {
      throw new NotFoundException(`Workout #${id} not found`);
    }

    if (workout.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return workout;
  }

  async update(
    id: number,
    userId: number,
    updateWorkoutDto: UpdateWorkoutDto,
  ): Promise<Workout> {
    const workout = await this.findOne(id, userId);
    const { exercises, ...workoutData } = updateWorkoutDto;

    if (Object.keys(workoutData).length > 0) {
      Object.assign(workout, workoutData);
      await this.workoutRepository.save(workout as any);
    }

    if (exercises) {
      await this.workoutExerciseRepository.delete({ workoutId: id });

      const workoutExercises = exercises.map((ex) => ({
        workoutId: id,
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        restSeconds: ex.restSeconds,
        order: ex.order ?? 0,
      }));

      await this.workoutExerciseRepository.save(workoutExercises as any);
    }

    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    const workout = await this.findOne(id, userId);
    await this.workoutRepository.remove(workout);
  }
}
