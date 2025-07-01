import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { Room } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      // возвращаем без пароля
      const { passwordHash, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

    /** Генерирует JWT для гостя, заходящего по коду комнаты */
  async loginAsGuest(room: Room) {
    const payload = {
      sub: room.id,
      role: 'GUEST',           // или Role.GUEST, если импортируете enum
      code: room.code,         // пригодится на фронтенде
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
 }
