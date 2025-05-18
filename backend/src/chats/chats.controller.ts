import {
  Controller, Get, Post, Param, Body, UseGuards, Req, UploadedFile, UseInterceptors,
  NotFoundException, ForbiddenException
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller()
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get('rooms/:code/chats')
  async getChatSessions(@Param('code') code: string, @Req() req) {
    const user = req.user;
    return this.chatsService.getOrCreateSession(code, user);
  }

  @Get('chats/:id/messages')
  async getMessages(@Param('id') sessionId: string, @Req() req) {
    return this.chatsService.getMessages(sessionId, req.user);
  }
  

  @Post('chats/:id/messages')
@UseInterceptors(FileInterceptor('file'))
async sendMessage(
  @Req() req: any,
  @Param('id') sessionId: string,
  @Body() dto: CreateMessageDto,
  @UploadedFile() file?: Express.Multer.File
) {
    return this.chatsService.sendMessage(sessionId, dto.text, file, req.user);
  }
  
}


