// src/rooms/rooms.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  Req,
  Res,
  DefaultValuePipe,
  ParseArrayPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { Response } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { CreateRoomDto } from './dto/create-room.dto';
import { PostMessageDto } from './dto/post-message.dto';
import { RoomsService } from './rooms.service';
import { RoomsGateway } from './rooms.gateway';




@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly rooms: RoomsService,
    private readonly gateway: RoomsGateway,
  ) {}

  /** Список комнат текущего пользователя (только авторизованные) */
  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Req() req: any) {
    return this.rooms.listForUser(req.user.id, req.user.role);
  }

  /** Создать новую комнату (только TEACHER | ADMIN) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post()
  async create(@Req() req: any, @Body() dto: CreateRoomDto) {
    // здесь точно есть req.user.id
    return this.rooms.createRoom(dto.title, req.user.id);
  }
  /** Войти в комнату по коду (любой авторизованный пользователь) */
  @UseGuards(JwtAuthGuard)
  @Post(':code/join')
  async join(@Req() req: any, @Param('code') code: string) {
    const room = await this.rooms.findByCode(code);
    await this.rooms.joinRoom(room.id, req.user.id);
    return { success: true };
  }

  /** 
   * Открытый маршрут: получить историю сообщений по коду.
   * Пустой @UseGuards() сбрасывает глобальный RolesGuard и JwtAuthGuard.
   */
  @UseGuards()
  @Get(':code')
  async getRoom(@Param('code') code: string) {
    return this.rooms.findByCode(code);
  }

  /** Отправка сообщения + файл (только авторизованные) */
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('file', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) => {
          // правильно сохраняем оригинальное имя в utf8
          const originalName = Buffer
            .from(file.originalname, 'latin1')
            .toString('utf8');
          cb(null, `${Date.now()}-${originalName}`);
        },
      }),
    }),
  )
  @Post(':code/messages')
  async postMessage(
    @Req() req: any,
    @Param('code') code: string,
    @Body() dto: PostMessageDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    const room = await this.rooms.findByCode(code);

    // если студент — автоматически записываем в члены
    if (req.user.role === 'STUDENT') {
      await this.rooms.joinRoom(room.id, req.user.userId);
    }


    const msg = await this.rooms.addMessage(
      room.id,
      dto.authorId ?? req.user.id,  // ← используем req.user.id, а не userId
      dto.text,
      files,
    );

    // сразу вещаем через WebSocket всем в комнате
    this.gateway.server.to(code).emit('newMessage', msg);

    return msg;
  }

  /** Удалить сообщение (только TEACHER | ADMIN) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Delete(':code/messages/:messageId')
  async removeMessage(
    @Param('code') code: string,
    @Param('messageId') messageId: string,
  ) {
    await this.rooms.deleteMessage(messageId);
    this.gateway.server.to(code).emit('messageDeleted', messageId);
    return { success: true };
  }

  /** Редактировать сообщение (только TEACHER | ADMIN) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Patch(':code/messages/:messageId')
  @UseInterceptors(
    FilesInterceptor('file', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) => {
          // правильно сохраняем оригинальное имя в utf8
          const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
          cb(null, `${Date.now()}-${originalName}`);
        },
      }),
    }),
  )
  async editMessage(
    @Param('code') code: string,
    @Param('messageId') messageId: string,
    @Body('text') text: string,
    @Body(
      'removeAttachmentIds',
      new DefaultValuePipe([]),
      new ParseArrayPipe({ items: String, optional: true }),
    )
    removeAttachmentIds: string[] = [],
    @UploadedFiles() files: Express.Multer.File[] = [],  // теперь у файлов будет .filename
  ) {
    const updated = await this.rooms.updateMessageWithAttachments(
      messageId,
      text,
      removeAttachmentIds,
      files,
    );
    this.gateway.server.to(code).emit('messageEdited', updated);
    return updated;
  }

  /** Скачать файл по имени */
  @UseGuards()  // тоже открытый эндпоинт
  @Get('files/:filename')
  serveFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = join(process.cwd(), 'uploads', filename);
    // убираем префикс timestamp-
    const originalName = filename.includes('-')
      ? filename.slice(filename.indexOf('-') + 1)
      : filename;
    res.download(filePath, originalName, err => {
      if (err) {
        res.status(404).send('File not found');
      }
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':code/chats')
  async getChats(@Req() req: any, @Param('code') code: string) {
    const { id, role } = req.user;      // ← берем req.user.id, а не req.user.userId
    if (role === 'STUDENT') {
      return this.rooms.getOrCreateSessionForStudent(code, id);
    } else {
      return this.rooms.listChatSessionsForTeacher(code, id);
    }
  }
}
