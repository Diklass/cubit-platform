// backend/src/rooms/rooms.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, Prisma, Room, RoomMember, Message } from '@prisma/client';
import { customAlphabet } from 'nanoid';
import { Express } from 'express';
import { v4 as uuid } from 'uuid';

const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7,
);

@Injectable()
export class RoomsService {
  private prisma = new PrismaClient();

  /**
   * Создаёт комнату (ownerId — scalar) и добавляет его в члены
   */
  async createRoom(title: string, ownerId: string): Promise<Room> {
    const code = nanoid();

    // -----------------------------
    // 1) создаём комнату (unchecked, чтобы указать ownerId напрямую)
    // -----------------------------
    const newRoom = await this.prisma.room.create({
      data: {
        title,
        code,
        ownerId,      // напрямую, потому что мы используем RoomUncheckedCreateInput
      } as Prisma.RoomUncheckedCreateInput,
    });

    // -----------------------------
    // 2) добавляем создателя в RoomMember
    // -----------------------------
    await this.prisma.roomMember.create({
      data: {
        roomId: newRoom.id,
        userId: ownerId,
      },
    });

    return newRoom;
  }

  /**
   * Получаем комнату вместе с её сообщениями
   */
 async findByCode(code: string) {
  const room = await this.prisma.room.findUnique({
    where: { code },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
          attachments: true,
        },
      },
    },
  });
  if (!room) throw new NotFoundException('Комната не найдена');
  return room;
}

  /**
   * Список комнат для пользователя:
   * - STUDENT — те, в которых он член
   * - иначе — те, которые он создал
   */
  async listForUser(userId: string, role: string): Promise<Room[]> {
    if (role === 'STUDENT') {
      return this.prisma.room.findMany({
        where: {
          members: { some: { userId } },
        },
      });
    } else {
      return this.prisma.room.findMany({
        where: { ownerId: userId },
      });
    }
  }

  /**
   * Добавление сообщения в комнату
   */
    async addMessage(
      roomId: string,
      author: string | null,
      text?: string,
      files: Express.Multer.File[] = [],
    ): Promise<Message> {
      // multer уже сохранил файлы, собираем их имена
      const attachmentsData = files.map(file => ({
        url: file.filename,
      }));

      return this.prisma.message.create({
        data: {
          room:        { connect: { id: roomId } },
          author:      author ? { connect: { id: author } } : undefined,
          text:        text?.trim() || '',
          attachments: attachmentsData.length
            ? { create: attachmentsData }
            : undefined,
        },
        include: {
          attachments: true,
          author:      true,    // ← теперь Prisma вернёт и автора
        },
      });
    }

  /**
   * При входе студента: отмечаем его членство
   */
  async joinRoom(roomId: string, userId: string): Promise<RoomMember> {
    return this.prisma.roomMember.upsert({
      where: { roomId_userId: { roomId, userId } },
      create: { roomId, userId },
      update: {},
    });
  }

   // Удаление
   async deleteMessage(messageId: string): Promise<{ count: number }> {
  // 1) убираем все вложения
  await this.prisma.attachment.deleteMany({
    where: { messageId },
  });
  // 2) теперь удаляем само сообщение
  return this.prisma.message.deleteMany({
    where: { id: messageId },
  });
}

  // Обновление текста
  async updateMessage(messageId: string, newText: string) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { text: newText },
    });
  }

  // Получить все сессии чатов для преподавателя
async listChatSessionsForTeacher(code: string, teacherId: string) {
  const room = await this.findByCode(code);
  return this.prisma.chatSession.findMany({
    where: {
      roomId: room.id,
      teacherId,
    },
    include: {
      student: true,
    },
  });
}

// Получить или создать сессию для ученика
async getOrCreateSessionForStudent(code: string, studentId: string) {
  const room = await this.findByCode(code);

  // ищем преподавателя — владельца комнаты
  const teacherId = room.ownerId;

  let session = await this.prisma.chatSession.findFirst({
    where: {
      roomId: room.id,
      studentId,
      teacherId,
    },
  });

  if (!session) {
    session = await this.prisma.chatSession.create({
      data: {
        roomId: room.id,
        studentId,
        teacherId,
      },
    });
  }

  return session;
}

 async updateMessageWithAttachments(
    messageId: string,
    text: string,
    removeAttachmentIds: string[] = [],
    newFiles: Express.Multer.File[] = [],
  ): Promise<Message> {
    // 1) убедимся, что такое сообщение есть
    const existing = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!existing) throw new NotFoundException('Сообщение не найдено');

    // 2) удаляем отмеченные вложения
    if (removeAttachmentIds.length) {
      await this.prisma.attachment.deleteMany({
        where: { id: { in: removeAttachmentIds } },
      });
    }

    // 3) добавляем новые файлы (multer уже сохранил их на диск)
    for (const file of newFiles) {
      await this.prisma.attachment.create({
        data: {
          url: file.filename,
          messageId,
        },
      });
    }

    // 4) обновляем текст и подтягиваем автора + оставшиеся вложения
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { text: text.trim() },
      include: {
        author: true,
        attachments: true,
      },
    });

    return updated;
  }
}

