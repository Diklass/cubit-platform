import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  namespace: /^\/chats\/.+$/, // динамический namespace: /chats/:sessionId
  cors: { origin: '*' },
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    const namespace = client.nsp.name; // /chats/abc123
    console.log(`[WS] Connected to ${namespace}`);
  }

  handleDisconnect(client: Socket) {
    const namespace = client.nsp.name;
    console.log(`[WS] Disconnected from ${namespace}`);
  }

  @SubscribeMessage('joinSession')
  handleJoin(client: Socket, @MessageBody() sessionId: string) {
    client.join(sessionId);
    console.log(`Client joined session: ${sessionId}`);
  }

  @SubscribeMessage('chatMessage')
  async handleMessage(
    client: Socket,
    @MessageBody()
    payload: {
      sessionId: string;
      text: string;
      authorId: string;
    },
  ) {
    const { sessionId, text, authorId } = payload;

    // Запись в БД
    const message = await this.prisma.message.create({
      data: {
        text,
        chatSession: { connect: { id: sessionId } },
        author: { connect: { id: authorId } },
      },
      include: { author: true },
    });

    // Рассылка в сессию
    this.server.to(sessionId).emit('chatMessage', message);
  }

  @SubscribeMessage('chatEdited')
  async handleEdit(
    client: Socket,
    @MessageBody()
    payload: { messageId: string; text: string; sessionId: string },
  ) {
    const updated = await this.prisma.message.update({
      where: { id: payload.messageId },
      data: { text: payload.text },
    });

    this.server.to(payload.sessionId).emit('chatEdited', updated);
  }

  @SubscribeMessage('chatDeleted')
  async handleDelete(
    client: Socket,
    @MessageBody()
    payload: { messageId: string; sessionId: string },
  ) {
    await this.prisma.message.delete({
      where: { id: payload.messageId },
    });

    this.server.to(payload.sessionId).emit('chatDeleted', payload.messageId);
  }
}
