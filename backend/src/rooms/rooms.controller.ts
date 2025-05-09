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
  UseInterceptors,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateRoomDto } from './dto/create-room.dto';
import { PostMessageDto } from './dto/post-message.dto';
import { RoomsService } from './rooms.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Req() req: any) {
    return this.rooms.listForUser(req.user.userId, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post()
  async create(@Req() req: any, @Body() dto: CreateRoomDto) {
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
  async getRoom(@Param('code') code: string) {
    return this.rooms.findByCode(code);
  }

  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) =>
          cb(null, `${Date.now()}-${file.originalname}`),
      }),
    }),
  )
  @UseGuards(JwtAuthGuard)
  @Post(':code/messages')
  async postMessage(
    @Req() req: any,
    @Param('code') code: string,
    @Body() dto: PostMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const room = await this.rooms.findByCode(code);
    if (req.user?.role === 'STUDENT') {
      await this.rooms.joinRoom(room.id, req.user.userId);
    }
    const attachmentUrl = file ? `/uploads/${file.filename}` : undefined;
    return this.rooms.addMessage(
      room.id,
      dto.author ?? req.user?.email ?? null,
      dto.text,
      attachmentUrl,
    );
  }

  // Удалить сообщение
  @Delete(':code/messages/:messageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async removeMessage(@Param('messageId') messageId: string) {
    return this.rooms.deleteMessage(messageId);
  }

  // Редактировать сообщение
  @Patch(':code/messages/:messageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async editMessage(
    @Param('messageId') messageId: string,
    @Body('text') text: string,
  ) {
    return this.rooms.updateMessage(messageId, text);
  }
}
