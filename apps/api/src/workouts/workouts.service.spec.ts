import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { WorkoutsService } from './workouts.service';
import { Workout } from '../entities/workout.entity';
import { WorkoutExercise } from '../entities/workout-exercise.entity';

describe('WorkoutsService', () => {
  let workoutService: WorkoutsService;
  let workoutRepository: Repository<Workout>;
  let workoutExerciseRepository: Repository<WorkoutExercise>;

  const userId = 1;
  const mockWorkout: Workout = {
    id: 1,
    name: 'Push Day',
    date: '2026-06-30',
    duration: 45,
    notes: 'Good session',
    userId,
    exercises: [],
    user: null as any,
  };

  const mockWorkoutWithExercises: Workout = {
    ...mockWorkout,
    exercises: [
      {
        id: 1,
        workoutId: 1,
        exerciseId: 1,
        sets: 3,
        reps: 10,
        weight: 60,
        restSeconds: 60,
        order: 1,
        exercise: null as any,
        workout: null as any,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutsService,
        {
          provide: getRepositoryToken(Workout),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WorkoutExercise),
          useValue: {
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    workoutService = module.get<WorkoutsService>(WorkoutsService);
    workoutRepository = module.get<Repository<Workout>>(getRepositoryToken(Workout));
    workoutExerciseRepository = module.get<Repository<WorkoutExercise>>(getRepositoryToken(WorkoutExercise));
  });

  describe('create', () => {
    it('should create a workout without exercises', async () => {
      jest.spyOn(workoutRepository, 'save').mockResolvedValue(mockWorkout as any);
      jest.spyOn(workoutRepository, 'findOne').mockResolvedValue(mockWorkout as any);

      const result = await workoutService.create(userId, {
        name: 'Push Day',
        date: '2026-06-30',
        duration: 45,
        notes: 'Good session',
        exercises: [],
      });

      expect(workoutRepository.save).toHaveBeenCalledWith({
        name: 'Push Day',
        date: '2026-06-30',
        duration: 45,
        notes: 'Good session',
        userId,
      });
      expect(result).toEqual(mockWorkout);
    });

    it('should create a workout with exercises', async () => {
      const savedWorkout = { ...mockWorkout, id: 1 };
      jest.spyOn(workoutRepository, 'save').mockResolvedValue(savedWorkout as any);
      jest.spyOn(workoutRepository, 'findOne').mockResolvedValue(mockWorkoutWithExercises as any);
      jest.spyOn(workoutExerciseRepository, 'save').mockResolvedValue([] as any);

      const result = await workoutService.create(userId, {
        name: 'Push Day',
        date: '2026-06-30',
        duration: 45,
        notes: 'Good session',
        exercises: [{ exerciseId: 1, sets: 3, reps: 10, weight: 60, restSeconds: 60, order: 1 }],
      });

      expect(workoutExerciseRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockWorkoutWithExercises);
    });
  });

  describe('findAll', () => {
    it('should return paginated workouts', async () => {
      jest.spyOn(workoutRepository, 'findAndCount').mockResolvedValue([[mockWorkout] as any, 1]);

      const result = await workoutService.findAll(userId, 1, 10);

      expect(workoutRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId },
        relations: { exercises: { exercise: true } },
        order: { date: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({ data: [mockWorkout], total: 1, page: 1, limit: 10 });
    });

    it('should handle pagination offset correctly', async () => {
      jest.spyOn(workoutRepository, 'findAndCount').mockResolvedValue([[] as any, 0]);

      await workoutService.findAll(userId, 3, 10);

      expect(workoutRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId },
        relations: { exercises: { exercise: true } },
        order: { date: 'DESC' },
        skip: 20,
        take: 10,
      });
    });

    it('should use default pagination values', async () => {
      jest.spyOn(workoutRepository, 'findAndCount').mockResolvedValue([[] as any, 0]);

      await workoutService.findAll(userId);

      expect(workoutRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId },
        relations: { exercises: { exercise: true } },
        order: { date: 'DESC' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should return a workout for the correct user', async () => {
      jest.spyOn(workoutRepository, 'findOne').mockResolvedValue(mockWorkout as any);

      const result = await workoutService.findOne(1, userId);

      expect(result).toEqual(mockWorkout);
      expect(workoutRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { exercises: { exercise: true } },
      });
    });

    it('should throw NotFoundException if workout not found', async () => {
      jest.spyOn(workoutRepository, 'findOne').mockResolvedValue(null);

      await expect(workoutService.findOne(999, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if workout belongs to another user', async () => {
      const otherUserWorkout = { ...mockWorkout, userId: 2 };
      jest.spyOn(workoutRepository, 'findOne').mockResolvedValue(otherUserWorkout as any);

      await expect(workoutService.findOne(1, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateDto = { duration: 60, notes: 'Updated notes' };

    it('should update workout fields', async () => {
      jest.spyOn(workoutRepository, 'findOne').mockResolvedValue(mockWorkout as any);
      jest.spyOn(workoutRepository, 'save').mockResolvedValue({ ...mockWorkout, ...updateDto } as any);

      const result = await workoutService.update(1, userId, updateDto);

      expect(result).toEqual({ ...mockWorkout, ...updateDto });
    });

    it('should replace exercises when provided', async () => {
      const updateWithExercises = {
        ...updateDto,
        exercises: [{ exerciseId: 2, sets: 4, reps: 8, weight: 80, restSeconds: 90, order: 1 }],
      };
      jest.spyOn(workoutRepository, 'findOne').mockResolvedValue(mockWorkout as any);
      jest.spyOn(workoutRepository, 'save').mockResolvedValue(mockWorkout as any);
      jest.spyOn(workoutExerciseRepository, 'delete').mockResolvedValue({ affected: 1, raw: {} });
      jest.spyOn(workoutExerciseRepository, 'save').mockResolvedValue([] as any);

      await workoutService.update(1, userId, updateWithExercises);

      expect(workoutExerciseRepository.delete).toHaveBeenCalledWith({ workoutId: 1 });
      expect(workoutExerciseRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a workout belonging to the user', async () => {
      jest.spyOn(workoutRepository, 'findOne').mockResolvedValue(mockWorkout as any);
      jest.spyOn(workoutRepository, 'remove').mockResolvedValue(mockWorkout as any);

      await workoutService.remove(1, userId);

      expect(workoutRepository.remove).toHaveBeenCalledWith(mockWorkout);
    });

    it('should throw ForbiddenException when deleting another users workout', async () => {
      const otherUserWorkout = { ...mockWorkout, userId: 2 };
      jest.spyOn(workoutRepository, 'findOne').mockResolvedValue(otherUserWorkout as any);

      await expect(workoutService.remove(1, userId)).rejects.toThrow(ForbiddenException);
    });
  });
});
