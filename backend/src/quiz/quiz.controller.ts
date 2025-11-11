import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuestionType } from '@prisma/client';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('lessons')
export class QuizController {
  constructor(private quizService: QuizService) {}

  // GET /lessons/:lessonId/quiz
  @Get(':lessonId/quiz')
  async getQuiz(@Param('lessonId') lessonId: string) {
    return this.quizService.getQuizByLesson(lessonId);
  }

  // GET /lessons/:lessonId/quiz/attempts
@Get(':lessonId/quiz/attempts')
async getAttempts(@Param('lessonId') lessonId: string) {
  return this.quizService.getAttempts(lessonId);
}

  // POST /lessons/:lessonId/quiz
  @Post(':lessonId/quiz')
  async create(
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateQuizDto,
  ) {
    return this.quizService.createQuiz(lessonId, dto);
  }

  // POST /lessons/:lessonId/quiz/:quizId/questions
  @Post(':lessonId/quiz/:quizId/questions')
  async createQuestion(
    @Param('quizId') quizId: string,
    @Body() dto: { text: string; type: QuestionType }
  ) {
    return this.quizService.createQuestion(quizId, dto);
  }

  // PATCH /lessons/:lessonId/quiz
  @Patch(':lessonId/quiz')
  async update(
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizService.updateQuiz(lessonId, dto);
  }

  // GET /lessons/:lessonId/quiz/public
  @Get(':lessonId/quiz/public')
  async getPublic(@Param('lessonId') lessonId: string) {
    return this.quizService.getPublicQuiz(lessonId);
  }

  

@UseGuards(JwtAuthGuard)
@Post(':lessonId/quiz/submit')
async submitQuiz(
  @Param('lessonId') lessonId: string,
  @Body() body: { answers: Record<string, any> },
  @Req() req
) {
  const user = req.user;
  return this.quizService.submitAttempt(lessonId, user.id, body.answers);
}
@Post(':lessonId/quiz/check')
async check(
  @Param('lessonId') lessonId: string,
  @Body() body: { answers: Record<string, any> }
) {
  return this.quizService.checkQuiz(lessonId, body.answers);
}



}
