import { Controller, Get, Param, Post, Body, Delete } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { SubjectDetail } from './dto/subject-detail.dto';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Patch } from '@nestjs/common';

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

    @Get('lessons/:id')
  findLesson(@Param('id') id: string) {
    return this.subjectsService.findLesson(id);
  }

  @Post(':id/modules')
  createModule(@Param('id') id: string, @Body('title') title: string, @Body('parentId') parentId?: string) {
    return this.subjectsService.createModule(id, title, parentId);
  }

  @Post()
  create(@Body('title') title: string) {
    return this.subjectsService.create(title);
  }

    @Delete(':id')
    deleteSubject(@Param('id') id: string) {
      return this.subjectsService.deleteSubject(id);
    }

    @Delete('modules/:id')
    deleteModule(@Param('id') id: string) {
      return this.subjectsService.deleteModule(id);
    }

    @Delete('lessons/:id')
    deleteLesson(@Param('id') id: string) {
      return this.subjectsService.deleteLesson(id);
    }

  @Post('modules/:moduleId/lessons')
  createLesson(
    @Param('moduleId') moduleId: string,
    @Body('title') title: string,
    @CurrentUser() user: any,
  ) {
    return this.subjectsService.createLesson(moduleId, title, user.id);
  }


  @Patch('lessons/:id')
updateLesson(
  @Param('id') id: string,
  @Body() body: { title?: string; content?: string },
) {
  return this.subjectsService.updateLesson(id, body);
}
}
