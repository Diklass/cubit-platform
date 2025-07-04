import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { Room } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,               // ← добавили
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  /** Генерирует пару токенов */
  async getTokens(sub: string, role: string) {
    const accessToken = this.jwtService.sign(
      { sub, role },
      {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '1h'),
      },
    );
    const refreshToken = this.jwtService.sign(
      { sub, role },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET', 'defaultRefreshSecret'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );
    return { accessToken, refreshToken };
  }

  /** Вход по логину/паролю */
  async login(user: { id: string; email: string; role: string }) {
    return this.getTokens(user.id, user.role);
  }

  /** Вход гостя по коду комнаты */
  async loginAsGuest(room: Room) {
    return this.getTokens(room.id, 'GUEST');
  }

  async validateRefreshToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET', 'defaultRefreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
