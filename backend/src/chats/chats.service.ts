import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Express } from 'express';
import { writeFileSync } from 'fs';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateSession(roomCode: string, user) {
    const room = await this.prisma.room.findUnique({
      where: { code: roomCode },
      include: { owner: true },
    });
    if (!room) throw new NotFoundException('Комната не найдена');

    if (user.id === room.ownerId) {
      // Учитель
      return this.prisma.chatSession.findMany({
        where: { roomId: room.id },
        include: { student: true },
      });
    }

    // Ученик: ищем или создаём
    let session = await this.prisma.chatSession.findFirst({
      where: {
        roomId: room.id,
        studentId: user.id,
      },
    });

    if (!session) {
      session = await this.prisma.chatSession.create({
        data: {
          roomId: room.id,
          studentId: user.id,
          teacherId: room.ownerId,
        },
      });
    }

    return session;
  }

async getMessages(sessionId: string, user) {
  const session = await this.prisma.chatSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) throw new NotFoundException('Сессия не найдена');

  console.log('[🔐 Доступ к сессии]', {
    userId: user.id,
    studentId: session.studentId,
    teacherId: session.teacherId,
  });

  if (user.id !== session.studentId && user.id !== session.teacherId) {
    throw new ForbiddenException('Нет доступа к этой сессии');
  }

return this.prisma.message.findMany({
  where: { chatSessionId: sessionId },
  orderBy: { createdAt: 'asc' },
  include: { author: true },
});
}
  

  async sendMessage(
    sessionId: string,
    text: string,
    files: Express.Multer.File[],
    user: { id: string },
  ) {
    // 1) Проверяем сессию и доступ
    const session = await this.prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Сессия не найдена');
    if (user.id !== session.studentId && user.id !== session.teacherId) {
      throw new ForbiddenException('Нет доступа к этой сессии');
    }

    const created: any[] = [];

    // 2) Если есть файлы — создаём сообщение(я) с вложениями
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = extname(file.originalname);
        const fileName = `${uuid()}-${encodeURIComponent(file.originalname)}`;
        const filePath = `uploads/${fileName}`;
        writeFileSync(filePath, file.buffer);

        const msg = await this.prisma.message.create({
          data: {
            text: i === 0 ? text : '',            // только в первом файле сохраняем текст
            attachmentUrl: fileName,
            chatSession: { connect: { id: sessionId } },
            author:      { connect: { id: user.id } },
          },
          include: { author: true },
        });

        created.push(msg);
      }
    }
    // 3) Если нет файлов, но есть текст — одно текстовое сообщение
    else if (text && text.trim() !== '') {
      const msg = await this.prisma.message.create({
        data: {
          text,
          chatSession: { connect: { id: sessionId } },
          author:      { connect: { id: user.id } },
        },
        include: { author: true },
      });
      created.push(msg);
    }

    return created;  // возвращаем массив созданных сообщений
  }
}

