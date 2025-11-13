import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

    /** Проверяем, что учитель действительно ведёт предмет (есть его уроки в subject) */
  async assertTeacherHasSubject(teacherId: string, subjectId: string) {
    const ok = await this.prisma.subject.findFirst({
      where: {
        id: subjectId,
        modules: { some: { lessons: { some: { teacherId } } } },
      },
      select: { id: true },
    });
    if (!ok) throw new ForbiddenException('You have no access to this subject');
  }

  // Предметы, где учитель ведёт хотя бы один урок
  async listSubjectsForTeacher(teacherId: string) {
    return this.prisma.subject.findMany({
      where: {
        modules: {
          some: {
            lessons: {
              some: { teacherId },
            },
          },
        },
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Группы и учащиеся
  async getGroupsWithStudents(subjectId: string) {
    const groups = await this.prisma.studentGroup.findMany({
      where: { subjectId },
      include: {
        students: {
          include: { user: true },
        },
      },
    });
    const ungrouped = await this.prisma.subjectStudent.findMany({
      where: { subjectId, groupId: null },
      include: { user: true },
    });
    return { groups, ungrouped };
  }

  // Создание группы
  async createGroup(subjectId: string, dto: { name: string }) {
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new NotFoundException('Subject not found');
    return this.prisma.studentGroup.create({
      data: { name: dto.name, subjectId },
    });
  }

  // Добавление студента
  async addStudent(params: { subjectId: string; userId?: string; email?: string; groupId?: string }) {
    const { subjectId, userId, email, groupId } = params;

    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new NotFoundException('Subject not found');

    let uid = userId;
    if (!uid && email) {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) throw new NotFoundException('User not found by email');
      uid = user.id;
    }
    if (!uid) throw new NotFoundException('No user provided');

    return this.prisma.subjectStudent.upsert({
      where: {
        subjectId_userId: { subjectId, userId: uid },
      },
      update: { groupId: groupId ?? null },
      create: { subjectId, userId: uid, groupId: groupId ?? null },
      include: { user: true },
    });
  }

  // Базовая статистика
  async getSubjectStats(subjectId: string) {
    const groups = await this.prisma.studentGroup.findMany({ where: { subjectId } });
    const students = await this.prisma.subjectStudent.findMany({ where: { subjectId } });

    return {
      subjectId,
      groupsCount: groups.length,
      studentsCount: students.length,
    };
  }

    /** Переименовать группу */
  async renameGroup(subjectId: string, groupId: string, name: string) {
    const group = await this.prisma.studentGroup.findFirst({ where: { id: groupId, subjectId } });
    if (!group) throw new NotFoundException('Group not found in this subject');
    return this.prisma.studentGroup.update({ where: { id: groupId }, data: { name } });
  }

   /**
   * Удалить группу.
   * mode: 'reassign' (по умолчанию) — всем студентам группы ставим groupId = null, затем удаляем группу.
   * mode: 'remove' — удаляем связи студентов (SubjectStudent) этой группы из предмета и удаляем группу.
   */
  async deleteGroup(subjectId: string, groupId: string, mode: 'reassign' | 'remove' = 'reassign') {
    const group = await this.prisma.studentGroup.findFirst({ where: { id: groupId, subjectId } });
    if (!group) throw new NotFoundException('Group not found in this subject');

    if (mode === 'remove') {
      await this.prisma.subjectStudent.deleteMany({ where: { subjectId, groupId } });
    } else {
      await this.prisma.subjectStudent.updateMany({
        where: { subjectId, groupId },
        data: { groupId: null },
      });
    }
    return this.prisma.studentGroup.delete({ where: { id: groupId } });
  }

  /** Переместить учащегося (SubjectStudent.id) в группу/из группы */
  async moveStudent(subjectId: string, subjectStudentId: string, targetGroupId: string | null) {
    // проверим, что связь принадлежит этому предмету
    const link = await this.prisma.subjectStudent.findFirst({
      where: { id: subjectStudentId, subjectId },
      select: { id: true },
    });
    if (!link) throw new NotFoundException('Student link not found in this subject');

    if (targetGroupId) {
      const grp = await this.prisma.studentGroup.findFirst({ where: { id: targetGroupId, subjectId } });
      if (!grp) throw new NotFoundException('Target group not found in this subject');
    }

    return this.prisma.subjectStudent.update({
      where: { id: subjectStudentId },
      data: { groupId: targetGroupId },
      include: { user: true },
    });
  }

  /** Удалить учащегося из предмета (полностью) */
  async removeStudent(subjectId: string, subjectStudentId: string) {
    const link = await this.prisma.subjectStudent.findFirst({
      where: { id: subjectStudentId, subjectId },
      select: { id: true },
    });
    if (!link) throw new NotFoundException('Student link not found in this subject');

    return this.prisma.subjectStudent.delete({ where: { id: subjectStudentId } });
  }

  /**
   * Кандидаты на добавление в предмет: студенты, которых ещё нет в SubjectStudent,
   * + простой поиск по email/части email.
   */
  async searchCandidates(subjectId: string, query: string, limit = 20) {
    // найдём уже добавленных
    const existing = await this.prisma.subjectStudent.findMany({
      where: { subjectId },
      select: { userId: true },
    });
    const exclude = new Set(existing.map(e => e.userId));

    const users = await this.prisma.user.findMany({
      where: {
        role: Role.STUDENT,
        email: query
          ? { contains: query, mode: Prisma.QueryMode.insensitive }
          : undefined,
      },
      select: { id: true, email: true, createdAt: true, role: true },
      take: limit * 2, // с запасом, чтобы отфильтровать уже добавленных
      orderBy: { createdAt: 'desc' },
    });

    return users.filter(u => !exclude.has(u.id)).slice(0, limit);
  }
async getGroupStats(groupId: string) {
  const group = await this.prisma.studentGroup.findUnique({
    where: { id: groupId },
    include: {
      students: {
        include: {
          user: true,
          subject: true,
        },
      },
    },
  });
  if (!group) throw new NotFoundException("Group not found");

  const studentsCount = group.students.length;

  // В будущем можно рассчитать средний прогресс по QuizAttempt
  return {
    groupId,
    name: group.name,
    studentsCount,
  };
}

// === Статистика конкретного ученика ===
async getStudentStats(subjectId: string, userId: string) {
  const subject = await this.prisma.subject.findUnique({
    where: { id: subjectId },
  });
  if (!subject) throw new NotFoundException('Subject not found');

  // Все попытки тестов ученика в рамках данного предмета
  const attempts = await this.prisma.quizAttempt.findMany({
    where: {
      userId,
      quiz: {
        lesson: {
          module: { subjectId },
        },
      },
    },
    include: {
      quiz: { include: { lesson: true } },
    },
    orderBy: { submittedAt: 'desc' },
  });

  // Расчёт статистики
  const total = attempts.length;
  const passed = attempts.filter((a) => a.passed).length;
  const avgPercent =
    total > 0
      ? Math.round(
          attempts.reduce((s, a) => s + (a.percent ?? 0), 0) / total
        )
      : 0;

  return {
    subjectId,
    userId,
    totalAttempts: total,
    passedAttempts: passed,
    avgPercent,
    attempts: attempts.map((a) => ({
      quizId: a.quizId,
      lessonTitle: a.quiz.lesson.title,
      score: a.score,
      percent: a.percent,
      passed: a.passed,
      submittedAt: a.submittedAt,
    })),
  };
}
  
}
