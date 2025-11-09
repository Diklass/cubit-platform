import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuestionType } from '@prisma/client';

@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) {}

  async getQuizByLesson(lessonId: string) {
    return this.prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
      },
    });
  }

  async createQuiz(lessonId: string, dto: CreateQuizDto) {
    return this.prisma.quiz.create({
      data: {
        lessonId,
        title: dto.title,
        passThreshold: dto.passThreshold,
        maxAttempts: dto.maxAttempts,
        shuffleQuestions: dto.shuffleQuestions,
        shuffleOptions: dto.shuffleOptions,
        timeLimitSec: dto.timeLimitSec,
      },
    });
  }

  async updateQuiz(lessonId: string, dto: UpdateQuizDto) {
    const quiz = await this.getQuizByLesson(lessonId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    return this.prisma.quiz.update({
      where: { lessonId },
      data: dto,
    });
  }

  async getPublicQuiz(lessonId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: {
              orderBy: { order: 'asc' },
              select: { id: true, text: true }, // без isCorrect
            },
          },
        },
      },
    });

    if (!quiz || !quiz.isPublished) return null;

    return quiz;
  }

  async createQuestion(
  quizId: string,
  dto: { text: string; type: QuestionType }
) {
  // вычисляем порядок
  const last = await this.prisma.quizQuestion.findMany({
    where: { quizId },
    orderBy: { order: 'desc' },
    take: 1,
  });

  const nextOrder = last.length ? last[0].order + 1 : 1;

  const question = await this.prisma.quizQuestion.create({
    data: {
      text: dto.text,
      type: dto.type,
      order: nextOrder,
      quiz: {
        connect: { id: quizId },
      },
    },
  });

  return { question };
}

async createOption(questionId: string, dto: any) {
  // вычисляем order
  const last = await this.prisma.quizOption.findMany({
    where: { questionId },
    orderBy: { order: 'desc' },
    take: 1,
  });
  const nextOrder = last.length ? last[0].order + 1 : 1;

  return this.prisma.quizOption.create({
    data: {
      question: { connect: { id: questionId } },
      order: nextOrder,
      text: dto.text,
      isCorrect: dto.isCorrect,
    },
  });
}

async updateOption(optionId: string, dto: any) {
  return this.prisma.quizOption.update({
    where: { id: optionId },
    data: dto,
  });
}

async deleteOption(optionId: string) {
  return this.prisma.quizOption.delete({
    where: { id: optionId },
  });
}

}
