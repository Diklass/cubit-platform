// src/rooms/rooms.controller.ts
import {
  Controller, Get, Post, Delete, Patch,
  Param, Body, UploadedFile, UseInterceptors, Req, UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage }    from 'multer';

import { JwtAuthGuard }   from '../auth/jwt-auth.guard';
import { RolesGuard }     from '../auth/roles.guard';
import { Roles }          from '../auth/roles.decorator';
import { CreateRoomDto }  from './dto/create-room.dto';
import { PostMessageDto } from './dto/post-message.dto';
import { RoomsService }   from './rooms.service';
import { RoomsGateway }   from './rooms.gateway';


@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly rooms: RoomsService,
    private readonly gateway: RoomsGateway,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() req: any) {
    return this.rooms.listForUser(req.user.userId, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER','ADMIN')
  @Post()
  create(@Req() req: any, @Body() dto: CreateRoomDto) {
    return this.rooms.createRoom(dto.title, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':code/join')
  async join(@Req() req: any, @Param('code') code: string) {
    const room = await this.rooms.findByCode(code);
    await this.rooms.joinRoom(room.id, req.user.userId);
    return { success: true };
  }

  @Get(':code')
  getRoom(@Param('code') code: string) {
    return this.rooms.findByCode(code);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
    }),
  }))
  @Post(':code/messages')
  async postMessage(
    @Req() req: any,
    @Param('code') code: string,
    @Body() dto: PostMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const room = await this.rooms.findByCode(code);
    if (req.user.role === 'STUDENT') {
      await this.rooms.joinRoom(room.id, req.user.userId);
    }
    const attachmentUrl = file ? `/uploads/${file.filename}` : undefined;
    const msg = await this.rooms.addMessage(
      room.id,
      dto.author ?? req.user.email,
      dto.text,
      attachmentUrl,
    );
    // сразу рассылаем всем в комнате, включая автора
    this.gateway.server.to(code).emit('newMessage', msg);
    return msg;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':code/messages/:messageId')
  async removeMessage(
    @Param('code') code: string,
    @Param('messageId') messageId: string,
  ) {
    await this.rooms.deleteMessage(messageId);
    this.gateway.server.to(code).emit('messageDeleted', messageId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':code/messages/:messageId')
  async editMessage(
    @Param('code') code: string,
    @Param('messageId') messageId: string,
    @Body('text') text: string,
  ) {
    const updated = await this.rooms.updateMessage(messageId, text);
    this.gateway.server.to(code).emit('messageEdited', updated);
    return updated;
  }
}
