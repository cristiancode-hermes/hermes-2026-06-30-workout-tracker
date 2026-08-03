import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { ProgressEntry } from '../entities/progress-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProgressEntry]), PassportModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
