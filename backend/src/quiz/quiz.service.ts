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
      title: dto.title ?? "Тест по уроку",
      passThreshold: dto.passThreshold ?? 70,
      maxAttempts: dto.maxAttempts ?? null,
      shuffleQuestions: dto.shuffleQuestions ?? false,
      shuffleOptions: dto.shuffleOptions ?? false,
      timeLimitSec: dto.timeLimitSec ?? null,
      isPublished: false, // всегда false при создании
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

async checkQuiz(lessonId: string, answers: Record<string, any>) {
  const quiz = await this.prisma.quiz.findUnique({
    where: { lessonId },
    include: {
      questions: {
        include: {
          options: true
        },
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!quiz) throw new NotFoundException("Quiz not found");

  let correctCount = 0;
  let total = quiz.questions.length;

  const details: any[] = [];

  for (const q of quiz.questions) {
    const userAnswer = answers[q.id];

    let isCorrect = false;

    if (q.type === "SHORT_TEXT") {
      const normalized = (userAnswer || "").trim().toLowerCase();
      const correctOptions = q.options.map((o) => o.text.trim().toLowerCase());

      isCorrect = correctOptions.includes(normalized);
    }

    if (q.type === "SINGLE" || q.type === "DROPDOWN") {
      isCorrect = q.options.some((o) => o.id === userAnswer && o.isCorrect);
    }

    if (q.type === "MULTI") {
      const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      const userIds = Array.isArray(userAnswer) ? userAnswer : [];

      isCorrect =
        correctIds.length === userIds.length &&
        correctIds.every((id) => userIds.includes(id));
    }

    if (isCorrect) correctCount++;

    details.push({
      questionId: q.id,
      question: q.text,
      correct: isCorrect,
      correctOptions: q.options.filter((o) => o.isCorrect).map((o) => o.text),
      userAnswer,
    });
  }

  const percent = Math.round((correctCount / total) * 100);
  const passed = percent >= quiz.passThreshold;

  return {
    passed,
    percent,
    correctCount,
    total,
    details,
  };
}


}
