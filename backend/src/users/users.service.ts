import { Injectable } from '@nestjs/common';
import { PrismaClient, User, Role } from '@prisma/client';

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  async create(
    email: string,
    passwordHash: string,
    role: Role = Role.STUDENT,     // ← используем тип и константу из Prisma
  ): Promise<User> {
    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role,                       // теперь Role, а не string
      },
    });
  }
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
