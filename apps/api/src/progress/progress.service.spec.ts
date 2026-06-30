import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProgressService } from './progress.service';
import { ProgressEntry } from '../entities/progress-entry.entity';

describe('ProgressService', () => {
  let progressService: ProgressService;
  let progressRepository: Repository<ProgressEntry>;

  const userId = 1;

  const mockEntries: ProgressEntry[] = [
    {
      id: 1,
      userId,
      date: '2026-06-29',
      weight: 80.5,
      bodyFat: 15.0,
      notes: 'End of month',
      user: null as any,
    },
    {
      id: 2,
      userId,
      date: '2026-06-22',
      weight: 80.0,
      bodyFat: 15.3,
      notes: 'Mid month',
      user: null as any,
    },
    {
      id: 3,
      userId,
      date: '2026-06-01',
      weight: 78.0,
      bodyFat: 16.0,
      notes: 'Start of month',
      user: null as any,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: getRepositoryToken(ProgressEntry),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    progressService = module.get<ProgressService>(ProgressService);
    progressRepository = module.get<Repository<ProgressEntry>>(
      getRepositoryToken(ProgressEntry),
    );
  });

  describe('create', () => {
    it('should save and return a progress entry', async () => {
      const createDto = {
        date: '2026-07-01',
        weight: 81.0,
        bodyFat: 14.8,
        notes: 'New entry',
      };

      const savedEntry: ProgressEntry = {
        id: 4,
        userId,
        ...createDto,
        user: null as any,
      };

      jest.spyOn(progressRepository, 'save').mockResolvedValue(savedEntry as any);

      const result = await progressService.create(userId, createDto);

      expect(progressRepository.save).toHaveBeenCalledWith({
        ...createDto,
        userId,
      });
      expect(result).toEqual(savedEntry);
    });
  });

  describe('findAll', () => {
    it('should return all progress entries for the user ordered by date DESC', async () => {
      const sortedEntries = [...mockEntries].sort((a, b) =>
        b.date.localeCompare(a.date),
      );
      jest
        .spyOn(progressRepository, 'find')
        .mockResolvedValue(sortedEntries as any);

      const result = await progressService.findAll(userId);

      expect(result).toEqual(sortedEntries);
      expect(progressRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { date: 'DESC' },
      });
      expect(result[0].date).toBe('2026-06-29');
      expect(result[2].date).toBe('2026-06-01');
    });
  });

  describe('findOne', () => {
    it('should return a progress entry by id', async () => {
      const entry = mockEntries[0];
      jest.spyOn(progressRepository, 'findOne').mockResolvedValue(entry as any);

      const result = await progressService.findOne(1, userId);

      expect(result).toEqual(entry);
      expect(progressRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId },
      });
    });

    it('should throw NotFoundException when entry is not found', async () => {
      jest.spyOn(progressRepository, 'findOne').mockResolvedValue(null);

      await expect(progressService.findOne(99, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(progressRepository.findOne).toHaveBeenCalledWith({
        where: { id: 99, userId },
      });
    });
  });

  describe('update', () => {
    it('should update the progress entry fields', async () => {
      const existingEntry = { ...mockEntries[0] };
      const updateDto = { weight: 81.0, notes: 'Updated notes' };
      const updatedEntry = { ...existingEntry, ...updateDto };

      jest.spyOn(progressRepository, 'findOne').mockResolvedValue(existingEntry as any);
      jest.spyOn(progressRepository, 'save').mockResolvedValue(updatedEntry as any);

      const result = await progressService.update(1, userId, updateDto);

      expect(result).toEqual(updatedEntry);
      expect(progressRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId },
      });
      expect(progressRepository.save).toHaveBeenCalledWith(updatedEntry);
    });
  });

  describe('remove', () => {
    it('should delete a progress entry', async () => {
      const entry = mockEntries[0];
      jest.spyOn(progressRepository, 'findOne').mockResolvedValue(entry as any);
      jest.spyOn(progressRepository, 'remove').mockResolvedValue(entry as any);

      await progressService.remove(1, userId);

      expect(progressRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId },
      });
      expect(progressRepository.remove).toHaveBeenCalledWith(entry);
    });
  });
});
