import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from './rooms.service';

@WebSocketGateway({
  namespace: '/rooms',
  cors: {
    origin: '*',           // разрешаем фронтенду подключаться
  },
})
export class RoomsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly roomsService: RoomsService) {}

  afterInit(server: Server) {
    console.log('🛰 RoomsGateway initialized');
  }

  handleConnection(client: Socket) {
    console.log(`🛰 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🛰 Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() roomCode: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(roomCode);
    console.log(`🛰 ${client.id} joined room ${roomCode}`);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() payload: { roomCode: string; author: string; text: string; attachmentUrl?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.roomsService.findByCode(payload.roomCode);
    const msg = await this.roomsService.addMessage(
      room.id,
      payload.author,
      payload.text,
      payload.attachmentUrl,
    );

    // broadcast — только остальным
    client.broadcast.to(payload.roomCode).emit('newMessage', msg);

    return msg;
  }
}
