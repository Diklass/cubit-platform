import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Express } from 'express';
import { v4 as uuid } from 'uuid';

import { writeFileSync, mkdirSync } from 'fs';
import { join, extname } from 'path';

const UPLOADS_DIR = join(process.cwd(), 'uploads');
mkdirSync(UPLOADS_DIR, { recursive: true });

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

  async editMessage(
    messageId: string,
    newText: string,
    removeAttachmentIds: string[],
    newFiles: Express.Multer.File[],
    user: { id: string },
  )  {
    // 1) проверяем авторство
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { author: true },
    });
    if (!msg) throw new NotFoundException('Сообщение не найдено');
    if (msg.authorId !== user.id) throw new ForbiddenException('Нет доступа');

    // 2) удалить указанные вложения
    if (removeAttachmentIds.length) {
      await this.prisma.attachment.deleteMany({
        where: { id: { in: removeAttachmentIds } },
      });
    }

    // 3) сохранить новые файлы
    const attachmentsData = newFiles.map(file => {
      const fileExt = extname(file.originalname || '') || '';
      const fileName = `${uuid()}${fileExt}`;     // ТОЛЬКО uuid + расширение
      writeFileSync(join(UPLOADS_DIR, fileName), file.buffer);
      return { url: fileName, messageId };
    });
    if (attachmentsData.length) {
      await this.prisma.attachment.createMany({ data: attachmentsData });
    }

    // 4) обновить текст и вернуть вместе с attachments
    return this.prisma.message.update({
      where: { id: messageId },
      data: { text: newText.trim() || '' },
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
    const session = await this.prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Сессия не найдена');
    if (user.id !== session.studentId && user.id !== session.teacherId) {
      throw new ForbiddenException('Нет доступа к этой сессии');
    }

    // Сохраняем файлы и формируем данные для вложений
    const attachmentsData = files.map(file => {
      const fileExt = extname(file.originalname || '') || '';
      const fileName = `${uuid()}${fileExt}`;     // ТОЛЬКО uuid + расширение
      writeFileSync(join(UPLOADS_DIR, fileName), file.buffer);
      return { url: fileName };
    });

    // Создаём одно сообщение с вложениями
    const message = await this.prisma.message.create({
          data: {
            text: text?.trim() || '',
            chatSession: { connect: { id: sessionId } },
            author:      { connect: { id: user.id } },
            attachments: files.length > 0 ? { create: attachmentsData } : undefined,
          },
          include: { author: true, attachments: true },
        });

        return message;
      }
  async deleteMessageWithAttachments(messageId: string) {
  // сначала удаляем вложения
  await this.prisma.attachment.deleteMany({
    where: { messageId },
  });
  // затем само сообщение
  return this.prisma.message.delete({
    where: { id: messageId },
  });
}
}
