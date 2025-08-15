import { Get, Post, Patch, Param, Body, UseGuards, Req, UploadedFiles, UseInterceptors, Inject } from '@nestjs/common';
import { Controller } from '@nestjs/common';
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

  // поддержка /rooms/:code/chats и /api/rooms/:code/chats
  @Get(['rooms/:code/chats', 'api/rooms/:code/chats'])
  async getChatSessions(@Param('code') code: string, @Req() req) {
    return this.chatsService.getOrCreateSession(code, req.user);
  }

  // ДОБАВЛЕНО: чтобы убрать 404 при загрузке страницы
  @Get(['rooms/:code/unread-counts', 'api/rooms/:code/unread-counts'])
  async getUnreadCounts() {
    // пока возвращаем пустой объект; фронт это принимает
    return {};
  }

  // поддержка /chats/:id/messages и /api/chats/:id/messages
  @Get(['chats/:id/messages', 'api/chats/:id/messages'])
  async getMessages(@Param('id') sessionId: string, @Req() req) {
    return this.chatsService.getMessages(sessionId, req.user);
  }

  // поддержка /chats/:id/messages и /api/chats/:id/messages
  @Post(['chats/:id/messages', 'api/chats/:id/messages'])
  @UseInterceptors(FilesInterceptor('files', 10))
  async sendMessage(
    @Req() req: any,
    @Param('id') sessionId: string,
    @Body('text') text: string,
    @UploadedFiles() files: Express.Multer.File[] = []
  ) {
    try {
      const message = await this.chatsService.sendMessage(
        sessionId,
        text,
        files,
        req.user,
      );

    this.chatsGateway.emitToSession(sessionId, 'chatMessage', {
      ...message,
      updatedAt: message.createdAt,
      readBy: [],
    });
    this.chatsGateway.emitToSession(sessionId, 'messageCreated', {
      ...message,
      updatedAt: message.createdAt,
      readBy: [],
    });

      return message;
    } catch (e: any) {
      console.error('[HTTP] sendMessage error:', e?.code || e?.name, e?.message, e?.stack);
      throw e;
    }
  }

  // поддержка /chats/:sessionId/messages/:messageId и /api/chats/:sessionId/messages/:messageId
  @Patch(['chats/:sessionId/messages/:messageId', 'api/chats/:sessionId/messages/:messageId'])
  @UseInterceptors(FilesInterceptor('newFiles', 10))
  async editMessage(
    @Req() req: any,
    @Param('sessionId') sessionId: string,
    @Param('messageId') messageId: string,
    @Body('text') text: string,
    @Body('removeAttachmentIds') removeIds: string | string[],
    @UploadedFiles() newFiles: Express.Multer.File[] = [],
  ) {
    try {
      const removeAttachmentIds = Array.isArray(removeIds)
        ? removeIds
        : removeIds
          ? [removeIds]
          : [];

      const updated = await this.chatsService.editMessage(
        messageId,
        text ?? '',
        removeAttachmentIds,
        newFiles,
        req.user,
      );

      this.chatsGateway.emitToSession(sessionId, 'chatEdited', updated);
      return updated;
    } catch (e: any) {
      console.error('[HTTP] editMessage error:', e?.code || e?.name, e?.message, e?.stack);
      throw e;
    }
  }
}
