import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Progress')
@Controller('progress')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post()
  @ApiOperation({ summary: 'Create a progress entry' })
  create(@Request() req: any, @Body() createProgressDto: CreateProgressDto) {
    return this.progressService.create(req.user.id, createProgressDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all progress entries for current user (latest first)' })
  findAll(@Request() req: any) {
    return this.progressService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a progress entry by ID' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.progressService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a progress entry' })
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    return this.progressService.update(+id, req.user.id, updateProgressDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a progress entry' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.progressService.remove(+id, req.user.id);
  }
}
