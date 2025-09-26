import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { SubjectDetail } from './dto/subject-detail.dto';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  findAll() {
    return this.subjectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<SubjectDetail> {
    return this.subjectsService.findOne(id);
  }

  @Post(':id/modules')
  createModule(@Param('id') id: string, @Body('title') title: string, @Body('parentId') parentId?: string) {
    return this.subjectsService.createModule(id, title, parentId);
  }

  @Post('modules/:moduleId/lessons')
  createLesson(
    @Param('moduleId') moduleId: string,
    @Body('title') title: string,
    @CurrentUser() user: any,
  ) {
    return this.subjectsService.createLesson(moduleId, title, user.id);
  }
}
