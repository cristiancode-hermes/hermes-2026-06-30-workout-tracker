import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExercisesService } from './exercises.service';
import { Exercise, MuscleGroup, Equipment, ExerciseType } from '../entities/exercise.entity';

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
});
