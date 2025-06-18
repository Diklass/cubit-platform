import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // GET /users/me — вернёт { id, email, role, createdAt, updatedAt }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
     console.log('[req.user]', req.user);
    const { id } = req.user;  // ← убедись, что здесь id, а не userId
    const user = await this.users.findById(id);  // ← сюда передаётся undefined
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
