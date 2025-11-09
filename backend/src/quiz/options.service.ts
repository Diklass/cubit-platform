import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { ReorderOptionsDto } from './dto/reorder-options.dto';

@Injectable()
export class OptionsService {
  constructor(private prisma: PrismaService) {}

  async create(questionId: string, dto: CreateOptionDto) {
    return this.prisma.quizOption.create({
      data: {
        questionId,
        text: dto.text,
        isCorrect: dto.isCorrect,
        order: dto.order ?? 999,
      },
    });
  }

  async update(id: string, dto: UpdateOptionDto) {
    return this.prisma.quizOption.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    return this.prisma.quizOption.delete({
      where: { id },
    });
  }

  async reorder(questionId: string, dto: ReorderOptionsDto) {
    const actions = dto.items.map((item) =>
      this.prisma.quizOption.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    );

    await this.prisma.$transaction(actions);

    return this.prisma.quizOption.findMany({
      where: { questionId },
      orderBy: { order: 'asc' },
    });
  }
}
