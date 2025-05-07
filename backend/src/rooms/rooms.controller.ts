// backend/src/rooms/rooms.controller.ts
import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    UseGuards,
    UploadedFile,
    UseInterceptors,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { diskStorage } from 'multer';
  
  import { RoomsService } from './rooms.service';
  import { CreateRoomDto } from './dto/create-room.dto';
  import { PostMessageDto } from './dto/post-message.dto';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { RolesGuard } from '../auth/roles.guard';
  import { Roles } from '../auth/roles.decorator';
  
  @Controller('rooms')
  export class RoomsController {
    constructor(private readonly rooms: RoomsService) {}
  
    // любому (в том числе гостям)
    @Get(':code')
    async getRoom(@Param('code') code: string) {
      return this.rooms.findByCode(code);
    }
  
    // любому (в том числе гостям)
    @Post(':code/messages')
    @UseInterceptors(
      FileInterceptor('file', {
        storage: diskStorage({
          destination: './uploads',
          filename: (_, file, cb) =>
            cb(null, `${Date.now()}-${file.originalname}`),
        }),
      }),
    )
    async postMessage(
      @Param('code') code: string,
      @Body() dto: PostMessageDto,
      @UploadedFile() file?: Express.Multer.File,
    ) {
      const room = await this.rooms.findByCode(code);
      const attachmentUrl = file ? `/uploads/${file.filename}` : undefined;
      return this.rooms.addMessage(
        room.id,
        dto.author ?? null,
        dto.text,
        attachmentUrl,
      );
    }
  
    // только TEACHER и ADMIN
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('TEACHER', 'ADMIN')
    @Post()
    async create(@Body() dto: CreateRoomDto) {
      return this.rooms.createRoom(dto.title);
    }
  }
  