import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Этот маршрут теперь вернёт Hello World!
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Наш кастомный health-чек
  @Get('health')
  healthCheck(): { status: string } {
    return this.appService.health();
  }
}