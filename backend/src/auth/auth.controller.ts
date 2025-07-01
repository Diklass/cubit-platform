import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RoomLoginDto } from './dto/room-login.dto';
import { RoomsService } from '../rooms/rooms.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private roomsService: RoomsService, ) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    return this.authService.login(user);
  }

    /** Вход по коду комнаты — создаём JWT с ролью GUEST */
  @Post('room-login')
  async roomLogin(@Body() dto: RoomLoginDto) {
    // найдём комнату или бросим 404
    const room = await this.roomsService.findByCode(dto.roomCode);
    return this.authService.loginAsGuest(room);
  }
}