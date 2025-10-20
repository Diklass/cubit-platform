// src/subject/subjects.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type LessonLite = { id: string; title: string; order: number };
type ModuleNode = {
  id: string;
  title: string;
  parentId: string | null;
  children: ModuleNode[];
  lessons: LessonLite[];
};

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async create(title: string) {
  return this.prisma.subject.create({
    data: { title },
  });
}

async updateLesson(id: string, data: { title?: string; content?: string }) {
  return this.prisma.lesson.update({
    where: { id },
    data,
  });
}

async createModule(subjectId: string, title: string, parentId?: string) {
  return this.prisma.module.create({
    data: {
      title,
      subjectId,
      parentId: parentId ?? null,
    },
  });
}

async createLesson(moduleId: string, title: string, teacherId: string) {
  return this.prisma.lesson.create({
    data: { title, moduleId, teacherId },
  });
}

async findLesson(id: string) {
  const lesson = await this.prisma.lesson.findUnique({
    where: { id },
    include: {
      module: {
        include: {
          subject: true,
        },
      },
    },
  });
  if (!lesson) throw new NotFoundException('Lesson not found');
  return lesson;
}

async getLesson(id: string) {
  return this.prisma.lesson.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
    },
  });
}

async updateSubject(id: string, title: string) {
  return this.prisma.subject.update({
    where: { id },
    data: { title },
  });
}

async deleteSubject(id: string) {
  return this.prisma.subject.delete({ where: { id } });
}

async deleteModule(id: string) {
  return this.prisma.module.delete({ where: { id } });
}

async deleteLesson(id: string) {
  return this.prisma.lesson.delete({ where: { id } });
}

  async findAll() {
    const subjects = await this.prisma.subject.findMany({
      include: {
        modules: {
          include: { lessons: true },
        },
      },
    });

    return subjects.map((s) => ({
      id: s.id,
      title: s.title,
      moduleCount: s.modules.length,
      lessonCount: s.modules.reduce((acc, m) => acc + m.lessons.length, 0),
    }));
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      select: { id: true, title: true },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    

    // берём все модули этого предмета (плоско)
    const modules = await this.prisma.module.findMany({
      where: { subjectId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        lessons: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, title: true, /* нет order в схеме — сделаем 1..N */ },
        },
      },
    });

    // сконструируем карту узлов
    const map = new Map<string, ModuleNode>();
    for (const m of modules) {
      map.set(m.id, {
        id: m.id,
        title: m.title,
        parentId: m.parentId ?? null,
        children: [],
        lessons: m.lessons.map((l, idx) => ({ id: l.id, title: l.title, order: idx + 1 })),
      });
    }
    // навесим детей
    const roots: ModuleNode[] = [];
    for (const node of map.values()) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return {
      id: subject.id,
      title: subject.title,
      tree: roots,
    };
  }
}
