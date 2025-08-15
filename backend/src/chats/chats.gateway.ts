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

  private getIoServer(): Server {
    // Если this.server — Namespace, у него есть .server с корневым io.Server
    return (this.server as any)?.server ?? (this.server as any);
  }

  /** Широковещательная отправка в конкретную сессию (namespace + room) */
  emitToSession(sessionId: string, event: string, payload: any) {
    const io = this.getIoServer();

    // пробуем взять уже существующий namespace, иначе создаём
    const existing = (io as any)._nsps?.get?.(`/chats/${sessionId}`);
    const nsp = existing || io.of(`/chats/${sessionId}`);

    nsp.to(sessionId).emit(event, payload);
  }

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
    @MessageBody() payload: { sessionId: string; text: string; authorId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const msg = await this.chatsService.sendMessage(
      payload.sessionId,
      payload.text,
      [],
      { id: payload.authorId },
    );
    client.nsp.to(payload.sessionId).emit('chatMessage', msg);
  client.nsp.to(payload.sessionId).emit('messageCreated', msg);
    return msg; // ack
  }

  @SubscribeMessage('chatEdited')
  async handleEdit(
    @MessageBody() payload: { messageId: string; text: string; sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const updated = await this.prisma.message.update({
      where: { id: payload.messageId },
      data: { text: payload.text },
      include: { author: true, attachments: true },
    });
    client.nsp.to(payload.sessionId).emit('chatEdited', updated);
  }

  @SubscribeMessage('chatDeleted')
  async handleDelete(
    @MessageBody() payload: { messageId: string; sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatsService.deleteMessageWithAttachments(payload.messageId);
    client.nsp.to(payload.sessionId).emit('chatDeleted', payload.messageId);
  }
}
