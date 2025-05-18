import { Module } from '@nestjs/common';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { ChatsGateway } from './chats.gateway';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [ChatsController],
  providers: [ChatsService, ChatsGateway, PrismaService],
})
export class ChatsModule {}
