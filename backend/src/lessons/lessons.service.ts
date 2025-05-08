// backend/src/lessons/lessons.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, Prisma, Lesson } from '@prisma/client';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Injectable()
export class LessonsService {
  private prisma = new PrismaClient();

  async create(dto: CreateLessonDto): Promise<Lesson> {
    const data: Prisma.LessonUncheckedCreateInput = {
      title: dto.title,
      content: dto.content,
      modelUrl: dto.modelUrl,
      teacherId: dto.teacherId,
    };

    return this.prisma.lesson.create({ data });
  }

  /**
   * Пример получения урока по id
   */
  async findById(id: string): Promise<Lesson> {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Урок не найден');
    return lesson;
  }

  /**
   * Список всех уроков (или можно по teacherId и т.д.)
   */
  async list(): Promise<Lesson[]> {
    return this.prisma.lesson.findMany();
  }
}
