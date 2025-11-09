import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

import { OptionsController } from './options.controller';
import { OptionsService } from './options.service';

@Module({
  controllers: [
    QuizController,
    QuestionsController,
    OptionsController,
  ],
  providers: [
    QuizService,
    QuestionsService,
    OptionsService,
    PrismaService,
  ],
})
export class QuizModule {}
