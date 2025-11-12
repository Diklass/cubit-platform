// students.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query,
  UseGuards, BadRequestException,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';

class RenameGroupDto { name!: string }
class MoveStudentDto { targetGroupId?: string | null }

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get('subjects')
  async getSubjects(@CurrentUser() user: { id: string }) {
    return this.students.listSubjectsForTeacher(user.id);
  }

  @Get(':subjectId/groups')
  async getGroups(@Param('subjectId') subjectId: string, @CurrentUser() user: { id: string }) {
    await this.students.assertTeacherHasSubject(user.id, subjectId);
    return this.students.getGroupsWithStudents(subjectId);
  }

  @Post(':subjectId/groups')
  async createGroup(
    @Param('subjectId') subjectId: string,
    @Body() dto: CreateGroupDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.students.assertTeacherHasSubject(user.id, subjectId);
    return this.students.createGroup(subjectId, dto);
  }

  @Patch(':subjectId/groups/:groupId')
  async renameGroup(
    @Param('subjectId') subjectId: string,
    @Param('groupId') groupId: string,
    @Body() dto: RenameGroupDto,
    @CurrentUser() user: { id: string },
  ) {
    if (!dto?.name?.trim()) throw new BadRequestException('Name is required');
    await this.students.assertTeacherHasSubject(user.id, subjectId);
    return this.students.renameGroup(subjectId, groupId, dto.name.trim());
  }

  @Delete(':subjectId/groups/:groupId')
  async deleteGroup(
    @Param('subjectId') subjectId: string,
    @Param('groupId') groupId: string,
    @Query('mode') mode: 'reassign' | 'remove' = 'reassign',
    @CurrentUser() user: { id: string },
  ) {
    await this.students.assertTeacherHasSubject(user.id, subjectId);
    return this.students.deleteGroup(subjectId, groupId, mode);
  }

  @Post(':subjectId/add')
  async addStudentToSubject(
    @Param('subjectId') subjectId: string,
    @Body() body: AddStudentDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.students.assertTeacherHasSubject(user.id, subjectId);
    if (!body.userId && !body.email) throw new BadRequestException('Provide either userId or email');
    return this.students.addStudent({ subjectId, userId: body.userId, email: body.email, groupId: body.groupId ?? null });
  }

  @Post(':subjectId/students/:subjectStudentId/move')
  async moveStudent(
    @Param('subjectId') subjectId: string,
    @Param('subjectStudentId') subjectStudentId: string,
    @Body() dto: MoveStudentDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.students.assertTeacherHasSubject(user.id, subjectId);
    const target = (dto?.targetGroupId ?? null) || null;
    return this.students.moveStudent(subjectId, subjectStudentId, target);
  }

  @Delete(':subjectId/students/:subjectStudentId')
  async removeStudent(
    @Param('subjectId') subjectId: string,
    @Param('subjectStudentId') subjectStudentId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.students.assertTeacherHasSubject(user.id, subjectId);
    return this.students.removeStudent(subjectId, subjectStudentId);
  }

  @Get(':subjectId/candidates')
  async searchCandidates(
    @Param('subjectId') subjectId: string,
    @Query('q') q = '',
    @Query('limit') limit = '20',
    @CurrentUser() user: { id: string },
  ) {
    await this.students.assertTeacherHasSubject(user.id, subjectId);
    const lim = Math.max(1, Math.min(50, Number(limit) || 20));
    return this.students.searchCandidates(subjectId, q ?? '', lim);
  }

  @Get(':subjectId/stats')
  async getStats(@Param('subjectId') subjectId: string, @CurrentUser() user: { id: string }) {
    await this.students.assertTeacherHasSubject(user.id, subjectId);
    return this.students.getSubjectStats(subjectId);
  }

@Get(':subjectId/groups/:groupId/stats')
async getGroupStats(@Param('groupId') groupId: string) {
  return this.students.getGroupStats(groupId);
}
}
