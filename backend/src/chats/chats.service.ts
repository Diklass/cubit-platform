import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Express } from 'express';
import { writeFileSync } from 'fs';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Получение или создание сессии чата для комнаты
   */
  async getOrCreateSession(roomCode: string, user: { id: string }) {
    const room = await this.prisma.room.findUnique({
      where: { code: roomCode },
      include: { owner: true },
    });
    if (!room) throw new NotFoundException('Комната не найдена');

    if (user.id === room.ownerId) {
      return this.prisma.chatSession.findMany({
        where: { roomId: room.id },
        include: { student: true },
      });
    }

    let session = await this.prisma.chatSession.findFirst({
      where: { roomId: room.id, studentId: user.id },
    });
    if (!session) {
      session = await this.prisma.chatSession.create({
        data: { roomId: room.id, studentId: user.id, teacherId: room.ownerId },
      });
    }
    return session;
  }

  /**
   * Получение всех сообщений сессии
   */
  async getMessages(sessionId: string, user: { id: string }) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Сессия не найдена');

    if (user.id !== session.studentId && user.id !== session.teacherId) {
      throw new ForbiddenException('Нет доступа к этой сессии');
    }

    return this.prisma.message.findMany({
      where: { chatSessionId: sessionId },
      orderBy: { createdAt: 'asc' },
      include: { author: true, attachments: true },
    });
  }

  /**
   * Отправка сообщения с текстом и вложениями (в одном сообщении)
   */
  async sendMessage(
    sessionId: string,
    text: string,
    files: Express.Multer.File[],
    user: { id: string },
  ) {
    // Проверяем сессию и доступ
    const session = await this.prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Сессия не найдена');
    if (user.id !== session.studentId && user.id !== session.teacherId) {
      throw new ForbiddenException('Нет доступа к этой сессии');
    }

    // Сохраняем файлы и формируем данные для вложений
    const attachmentsData = files.map(file => {
      const fileName = `${uuid()}-${encodeURIComponent(file.originalname)}`;
      writeFileSync(`uploads/${fileName}`, file.buffer);
      return { url: fileName };
    });

    // Создаём одно сообщение с вложениями
    const message = await this.prisma.message.create({
      data: {
        text: text?.trim() || '',
        chatSession: { connect: { id: sessionId } },
        author:      { connect: { id: user.id } },
        attachments: files.length > 0
          ? { create: attachmentsData }
          : undefined,
      },
      include: { author: true, attachments: true },
    });

    return message;
  }
}
