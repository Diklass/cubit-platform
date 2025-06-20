// src/modules/chats/chats.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  UploadedFiles,
  UseInterceptors,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatsService } from './chats.service';
import { ChatsGateway } from './chats.gateway';

@Controller()
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(
    private readonly chatsService: ChatsService,
    @Inject(ChatsGateway) private readonly chatsGateway: ChatsGateway,
  ) {}

  @Get('rooms/:code/chats')
  async getChatSessions(@Param('code') code: string, @Req() req) {
    return this.chatsService.getOrCreateSession(code, req.user);
  }

  @Get('chats/:id/messages')
  async getMessages(@Param('id') sessionId: string, @Req() req) {
    return this.chatsService.getMessages(sessionId, req.user);
  }

  @Post('chats/:id/messages')
  @UseInterceptors(FilesInterceptor('files', 10))
  async sendMessage(
   @Req() req: any,
   @Param('id') sessionId: string,
   @Body('text') text: string,                     // <- только это поле из body
   @UploadedFiles() files: Express.Multer.File[] = []
 ) {
   return this.chatsService.sendMessage(sessionId, text, files, req.user);
 }
}
