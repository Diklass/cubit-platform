import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // GET /users/me — вернёт { id, email, role, createdAt, updatedAt }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: any) {
    // PassportStrategy положит в req.user объект { userId, email, role }
    const { userId } = req.user;
    const user = await this.users.findById(userId);
    // убираем passwordHash
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
