import {
  Controller, Get, Post, Param, Body, UseGuards, Req, UploadedFiles, UseInterceptors,
  NotFoundException, ForbiddenException,Inject
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { Express } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatsGateway } from './chats.gateway'; 


@Controller()
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService,
    @Inject(ChatsGateway) private readonly chatsGateway: ChatsGateway,
  ) {}

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
  @UseInterceptors(FilesInterceptor('files', 10))
    async sendMessage(
   @Req() req: any,
   @Param('id') sessionId: string,
   @Body() dto: CreateMessageDto,
   @UploadedFiles() files: Express.Multer.File[] = []
 ) {
   // files — теперь массив из 0–10 файлов
   const created = await this.chatsService.sendMessage(sessionId, dto.text, files, req.user);
   // рассылаем каждое через WS
   for (const msg of created) {
     this.chatsGateway.server.to(sessionId).emit('chatMessage', msg);
   }
   return created;
 }
  
}


