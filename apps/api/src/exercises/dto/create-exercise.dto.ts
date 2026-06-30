import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MuscleGroup,
  Equipment,
  ExerciseType,
} from '../../entities/exercise.entity';

export class CreateExerciseDto {
  @ApiProperty({ example: 'Bench Press' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: MuscleGroup, example: MuscleGroup.CHEST })
  @IsNotEmpty()
  @IsEnum(MuscleGroup)
  muscleGroup: MuscleGroup;

  @ApiProperty({ enum: Equipment, example: Equipment.BARBELL })
  @IsNotEmpty()
  @IsEnum(Equipment)
  equipment: Equipment;

  @ApiPropertyOptional({ example: 'Lie on bench, lower bar to chest...' })
  @IsOptional()
  @IsString()
  instructions: string;

  @ApiProperty({ enum: ExerciseType, example: ExerciseType.STRENGTH })
  @IsNotEmpty()
  @IsEnum(ExerciseType)
  type: ExerciseType;
}
