// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RoomLoginDto } from './dto/room-login.dto';
import { RoomsService } from '../rooms/rooms.service';
import { JwtAuthGuard } from './jwt-auth.guard';

  @Controller('auth')
  export class AuthController {
    constructor(
      private authService: AuthService,
      private roomsService: RoomsService,
    ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    const { accessToken, refreshToken } = await this.authService.login(user);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return { access_token: accessToken };
  }

  @Post('room-login')
  @HttpCode(200)
  async roomLogin(
    @Body() dto: RoomLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const room = await this.roomsService.findByCode(dto.roomCode);
    const { accessToken, refreshToken } = await this.authService.loginAsGuest(room);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return { access_token: accessToken };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies['refresh_token'];
    const payload = await this.authService.validateRefreshToken(token);
    const { accessToken, refreshToken: newRefresh } =
      await this.authService.getTokens(payload.sub, payload.role);

    res.cookie('refresh_token', newRefresh, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return { access_token: accessToken };
  }
}
