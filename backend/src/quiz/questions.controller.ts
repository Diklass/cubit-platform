import {
  Controller,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ReorderQuestionsDto } from './dto/reorder-questions.dto';

@Controller()
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Post('quizzes/:quizId/questions')
  create(
    @Param('quizId') quizId: string,
    @Body() dto: CreateQuestionDto
  ) {
    return this.questionsService.create(quizId, dto);
  }

  @Patch('questions/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto
  ) {
    return this.questionsService.update(id, dto);
  }

  @Delete('questions/:id')
  delete(@Param('id') id: string) {
    return this.questionsService.delete(id);
  }

  @Patch('quizzes/:quizId/questions/reorder')
  reorder(
    @Param('quizId') quizId: string,
    @Body() dto: ReorderQuestionsDto
  ) {
    return this.questionsService.reorder(quizId, dto);
  }
}
