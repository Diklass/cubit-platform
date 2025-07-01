import { Controller, Get, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // GET /users/me — вернёт { id, email, role, createdAt, updatedAt }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: any) {
    // req.user должен быть { id, email, role }
    const { id } = req.user;  
    if (!id) {
      throw new UnauthorizedException('User ID is missing in JWT payload');
    }
    const user = await this.users.findById(id);
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
