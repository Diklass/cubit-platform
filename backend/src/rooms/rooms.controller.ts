import {
  Controller, Post, Body, Get, Param,
  UseGuards, Req, UseInterceptors, UploadedFile
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard }   from '../auth/roles.guard';
import { Roles }        from '../auth/roles.decorator';
import { CreateRoomDto }    from './dto/create-room.dto';
import { PostMessageDto }   from './dto/post-message.dto';
import { RoomsService }     from './rooms.service';
import { FileInterceptor }  from '@nestjs/platform-express';
import { diskStorage }      from 'multer';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  // список комнат для пользователя
  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Req() req: any) {
    return this.rooms.listForUser(req.user.userId, req.user.role);
  }

  // создание комнаты — только TEACHER/ADMIN
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

  // получение комнаты по коду — любой
  @Get(':code')
  async getRoom(@Param('code') code: string) {
    return this.rooms.findByCode(code);
  }

  // отправка сообщения с файлом — любой, но если student, записываем в members
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
      }),
    }),
  )
  @Post(':code/messages')
  async postMessage(
    @Req() req: any,
    @Param('code') code: string,
    @Body() dto: PostMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const room = await this.rooms.findByCode(code);
    // если студент — записываем в members
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
}
