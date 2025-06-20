// src/modules/chats/chats.gateway.ts
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatsService } from './chats.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  namespace: /^\/chats\/.+$/, // namespace = /chats/:sessionId
  cors: { origin: '*' },
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly chatsService: ChatsService,
    private readonly prisma: PrismaService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`[WS] Connected to ${client.nsp.name}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] Disconnected from ${client.nsp.name}`);
  }

  @SubscribeMessage('joinSession')
  handleJoin(
    @MessageBody() sessionId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(sessionId);
    console.log(`[WS] Client joined session ${sessionId}`);
  }

  @SubscribeMessage('chatMessage')
  async handleMessage(
    @MessageBody()
    payload: { sessionId: string; text: string; authorId: string },
  ) {
    // через WS файлы не передаются, только текст
    const msg = await this.chatsService.sendMessage(
      payload.sessionId,
      payload.text,
      [], // без файлов
      { id: payload.authorId },
    );

    // msg уже содержит author и attachments
    this.server.to(payload.sessionId).emit('chatMessage', msg);
  }

  @SubscribeMessage('chatEdited')
  async handleEdit(
    @MessageBody() payload: { messageId: string; text: string; sessionId: string },
  ) {
    const updated = await this.prisma.message.update({
      where: { id: payload.messageId },
      data: { text: payload.text },
      include: { author: true, attachments: true },
    });
    this.server.to(payload.sessionId).emit('chatEdited', updated);
  }

  @SubscribeMessage('chatDeleted')
  async handleDelete(
    @MessageBody() payload: { messageId: string; sessionId: string },
  ) {
    await this.prisma.message.delete({ where: { id: payload.messageId } });
    this.server.to(payload.sessionId).emit('chatDeleted', payload.messageId);
  }
}
