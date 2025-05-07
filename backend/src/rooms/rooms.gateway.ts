import { 
    SubscribeMessage, 
    WebSocketGateway, 
    WebSocketServer, 
    OnGatewayInit 
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { RoomsService } from './rooms.service';
  
  @WebSocketGateway({ namespace: 'rooms' })
  export class RoomsGateway implements OnGatewayInit {
    @WebSocketServer() server: Server;
  
    constructor(private readonly rooms: RoomsService) {}
  
    afterInit(server: Server) {
      // необязательно
    }
  
    @SubscribeMessage('join')
    handleJoin(client: Socket, roomCode: string) {
      client.join(roomCode);
    }
  
    @SubscribeMessage('message')
    async handleMessage(
      client: Socket,
      payload: { roomCode: string; author: string; text?: string }
    ) {
      const room = await this.rooms.findByCode(payload.roomCode);
      const msg = await this.rooms.addMessage(room.id, payload.author, payload.text);
      this.server.to(payload.roomCode).emit('newMessage', msg);
    }
  }
  