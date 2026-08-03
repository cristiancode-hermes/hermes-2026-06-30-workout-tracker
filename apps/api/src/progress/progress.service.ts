import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgressEntry } from '../entities/progress-entry.entity';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(ProgressEntry)
    private readonly progressRepository: Repository<ProgressEntry>,
  ) {}

  async create(
    userId: number,
    createProgressDto: CreateProgressDto,
  ): Promise<ProgressEntry> {
    const entry = await this.progressRepository.save({
      ...createProgressDto,
      userId,
    } as any);
    return entry;
  }

  async findAll(userId: number): Promise<ProgressEntry[]> {
    return this.progressRepository.find({
      where: { userId },
      order: { date: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<ProgressEntry> {
    const entry = await this.progressRepository.findOne({
      where: { id, userId },
    });
    if (!entry) {
      throw new NotFoundException(`Progress entry #${id} not found`);
    }
    return entry;
  }

  async update(
    id: number,
    userId: number,
    updateProgressDto: UpdateProgressDto,
  ): Promise<ProgressEntry> {
    const entry = await this.findOne(id, userId);
    Object.assign(entry, updateProgressDto);
    return this.progressRepository.save(entry as any);
  }

  async remove(id: number, userId: number): Promise<void> {
    const entry = await this.findOne(id, userId);
    await this.progressRepository.remove(entry);
  }

  async exportCsv(userId: number) {
    const entries = await this.progressRepository.find({
      where: { userId },
      order: { date: 'ASC' },
    });

    const escape = (v: unknown): string => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const header = ['date', 'weight', 'body_fat', 'notes'];
    const rows = entries.map((e) => [
      e.date,
      e.weight,
      e.bodyFat,
      e.notes,
    ]);

    return {
      filename: `progress-${new Date().toISOString().slice(0, 10)}.csv`,
      csv: [header, ...rows].map((r) => r.map(escape).join(',')).join('\n'),
    };
  }
}
