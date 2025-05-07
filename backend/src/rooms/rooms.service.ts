// backend/src/rooms/rooms.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 7);

@Injectable()
export class RoomsService {
  private prisma = new PrismaClient();

  async createRoom(title?: string) {
    const code = nanoid();
    return this.prisma.room.create({ data: { title, code } });
  }

  async findByCode(code: string) {
    const room = await this.prisma.room.findUnique({
      where: { code },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!room) throw new NotFoundException(`Room ${code} not found`);
    return room;
  }

  async addMessage(roomId: string, author: string | null, text?: string, attachmentUrl?: string) {
    return this.prisma.message.create({
      data: { roomId, author, text, attachmentUrl },
    });
  }
}
