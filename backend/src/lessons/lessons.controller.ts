import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  create(@Body() dto: CreateLessonDto) {
    return this.lessonsService.create(dto);
  }

  // Заменили findAll() на list()
  @Get()
  findAll() {
    return this.lessonsService.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lessonsService.findById(id);
  }
}
