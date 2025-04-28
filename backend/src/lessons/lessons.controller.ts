import { Controller, Get, Post, Body } from '@nestjs/common';
import { Lesson } from '@prisma/client';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  async findAll(): Promise<Lesson[]> {
    return this.lessonsService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateLessonDto): Promise<Lesson> {
    return this.lessonsService.create(dto);
  }
}