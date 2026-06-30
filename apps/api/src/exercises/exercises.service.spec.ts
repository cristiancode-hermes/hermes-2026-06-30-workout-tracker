import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExercisesService } from './exercises.service';
import { Exercise, MuscleGroup, Equipment, ExerciseType } from '../entities/exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { NotFoundException } from '@nestjs/common';

describe('ExercisesService', () => {
  let exerciseService: ExercisesService;
  let exerciseRepository: Repository<Exercise>;

  const mockExercises: Exercise[] = [
    {
      id: 1,
      name: 'Bench Press',
      muscleGroup: MuscleGroup.CHEST,
      equipment: Equipment.BARBELL,
      instructions: 'Lie on bench',
      type: ExerciseType.STRENGTH,
      workoutExercises: [],
    },
    {
      id: 2,
      name: 'Squat',
      muscleGroup: MuscleGroup.LEGS,
      equipment: Equipment.BARBELL,
      instructions: 'Squat down',
      type: ExerciseType.STRENGTH,
      workoutExercises: [],
    },
    {
      id: 3,
      name: 'Push Ups',
      muscleGroup: MuscleGroup.CHEST,
      equipment: Equipment.BODYWEIGHT,
      instructions: 'Push up',
      type: ExerciseType.STRENGTH,
      workoutExercises: [],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExercisesService,
        {
          provide: getRepositoryToken(Exercise),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    exerciseService = module.get<ExercisesService>(ExercisesService);
    exerciseRepository = module.get<Repository<Exercise>>(
      getRepositoryToken(Exercise),
    );
  });

  describe('findAll', () => {
    it('should return all seeded exercises', async () => {
      jest
        .spyOn(exerciseRepository, 'find')
        .mockResolvedValue(mockExercises as any);

      const result = await exerciseService.findAll();

      expect(result).toEqual(mockExercises);
      expect(exerciseRepository.find).toHaveBeenCalledWith({
        where: {},
        order: { name: 'ASC' },
      });
    });

    it('should filter exercises by muscle group', async () => {
      const chestExercises = mockExercises.filter(
        (e) => e.muscleGroup === MuscleGroup.CHEST,
      );
      jest
        .spyOn(exerciseRepository, 'find')
        .mockResolvedValue(chestExercises as any);

      const result = await exerciseService.findAll(MuscleGroup.CHEST);

      expect(result).toEqual(chestExercises);
      expect(result.length).toBe(2);
      expect(exerciseRepository.find).toHaveBeenCalledWith({
        where: { muscleGroup: MuscleGroup.CHEST },
        order: { name: 'ASC' },
      });
    });
  });

  describe('create', () => {
    it('should create and return an exercise', async () => {
      const createExerciseDto: CreateExerciseDto = {
        name: 'Deadlift',
        muscleGroup: MuscleGroup.BACK,
        equipment: Equipment.BARBELL,
        instructions: 'Lift the bar',
        type: ExerciseType.STRENGTH,
      };

      const savedExercise: Exercise = {
        id: 4,
        ...createExerciseDto,
        workoutExercises: [],
      };

      jest
        .spyOn(exerciseRepository, 'save')
        .mockResolvedValue(savedExercise as any);

      const result = await exerciseService.create(createExerciseDto);

      expect(result).toEqual(savedExercise);
      expect(exerciseRepository.save).toHaveBeenCalledWith(createExerciseDto);
    });
  });

  describe('findOne', () => {
    it('should return an exercise by id', async () => {
      jest
        .spyOn(exerciseRepository, 'findOne')
        .mockResolvedValue(mockExercises[0] as any);

      const result = await exerciseService.findOne(1);

      expect(result).toEqual(mockExercises[0]);
      expect(exerciseRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException for non-existent id', async () => {
      jest
        .spyOn(exerciseRepository, 'findOne')
        .mockResolvedValue(null);

      await expect(exerciseService.findOne(999)).rejects.toThrow(
        NotFoundException,
      );
      expect(exerciseRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe('update', () => {
    it('should update and return the exercise', async () => {
      const updateExerciseDto: UpdateExerciseDto = {
        name: 'Updated Bench Press',
      };

      const existingExercise = { ...mockExercises[0] };
      const updatedExercise = { ...existingExercise, name: 'Updated Bench Press' };

      jest
        .spyOn(exerciseRepository, 'findOne')
        .mockResolvedValue(existingExercise as any);
      jest
        .spyOn(exerciseRepository, 'save')
        .mockResolvedValue(updatedExercise as any);

      const result = await exerciseService.update(1, updateExerciseDto);

      expect(result).toEqual(updatedExercise);
      expect(exerciseRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(exerciseRepository.save).toHaveBeenCalledWith(existingExercise);
    });
  });

  describe('remove', () => {
    it('should delete an exercise', async () => {
      jest
        .spyOn(exerciseRepository, 'findOne')
        .mockResolvedValue(mockExercises[1] as any);
      jest
        .spyOn(exerciseRepository, 'remove')
        .mockResolvedValue(mockExercises[1] as any);

      await exerciseService.remove(2);

      expect(exerciseRepository.findOne).toHaveBeenCalledWith({
        where: { id: 2 },
      });
      expect(exerciseRepository.remove).toHaveBeenCalledWith(mockExercises[1]);
    });
  });
});
