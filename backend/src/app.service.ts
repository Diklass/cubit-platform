import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // Старая реализация health()
  health(): { status: string } {
    return { status: 'ok' };
  }

  // Новый метод для тестов и GET /
  getHello(): string {
    return 'Hello World!';
  }
}