import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ReorderQuestionsDto } from './dto/reorder-questions.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

async create(quizId: string, dto: CreateQuestionDto) {
  // найти последний order
  const last = await this.prisma.quizQuestion.findFirst({
    where: { quizId },
    orderBy: { order: 'desc' },
  });

  const newOrder = last ? last.order + 1 : 1;

  return this.prisma.quizQuestion.create({
    data: {
      quizId,
      type: dto.type,
      text: dto.text,
      required: dto.required ?? true,
      order: newOrder,
    },
  });
}

  async update(id: string, dto: UpdateQuestionDto) {
    return this.prisma.quizQuestion.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    return this.prisma.quizQuestion.delete({
      where: { id },
    });
  }

  async reorder(quizId: string, dto: ReorderQuestionsDto) {
    const updates = dto.items.map((item) =>
      this.prisma.quizQuestion.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    );

    await this.prisma.$transaction(updates);

    return this.prisma.quizQuestion.findMany({
      where: { quizId },
      orderBy: { order: 'asc' },
    });
  }
}
