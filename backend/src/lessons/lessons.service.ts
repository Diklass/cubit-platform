import { Injectable } from '@nestjs/common';
import { PrismaClient, Lesson } from '@prisma/client';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Injectable()
export class LessonsService {
  private prisma = new PrismaClient();

  async findAll(): Promise<Lesson[]> {
    return this.prisma.lesson.findMany();
  }

  async create(dto: CreateLessonDto): Promise<Lesson> {
    return this.prisma.lesson.create({
      data: {
        title: dto.title,
        modelUrl: dto.modelUrl,
      },
    });
  }
}