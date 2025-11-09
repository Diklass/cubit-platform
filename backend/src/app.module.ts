import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LessonsModule } from './lessons/lessons.module';
import { RoomsModule } from './rooms/rooms.module';

import { RolesGuard } from './auth/roles.guard';
import { FilesController } from './files/files.controller';
import { ChatsModule } from './chats/chats.module';

import { SubjectsModule } from './subjects/subjects.module';

import { UploadsModule } from './uploads/uploads.module';

import { QuizModule } from './quiz/quiz.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    LessonsModule,
    RoomsModule,
    ChatsModule,
    SubjectsModule,
    UploadsModule,
    QuizModule,
  ],
  controllers: [AppController, FilesController,], 
  providers: [
    AppService,                              // ← добавляем AppService
  ],
})
export class AppModule {}
