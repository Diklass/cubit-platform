// src/rooms/rooms.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/rooms',
  cors: { origin: '*' },
})
export class RoomsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  afterInit() {
    console.log('🛰 RoomsGateway initialized');
  }
  handleConnection(client: Socket) {
    console.log(`🛰 Client connected: ${client.id}`);
  }
  handleDisconnect(client: Socket) {
    console.log(`🛰 Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, roomCode: string) {
    client.join(roomCode);
    console.log(`🛰 ${client.id} joined room ${roomCode}`);
  }

  @SubscribeMessage('editMessage')
  handleEdit(client: Socket, payload: { roomCode: string; messageId: string; text: string }) {
    this.server.to(payload.roomCode).emit('messageEdited', {
      id: payload.messageId,
      text: payload.text,
    });
  }

  @SubscribeMessage('deleteMessage')
  handleDelete(client: Socket, payload: { roomCode: string; messageId: string }) {
    this.server.to(payload.roomCode).emit('messageDeleted', payload.messageId);
  }
}
