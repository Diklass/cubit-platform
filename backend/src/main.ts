// src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import * as express from 'express'; 

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ✅ список доменов для фронтенда
  const allowedOrigins = [
    'http://localhost:5173',
    'https://твойдомен.com', // ← добавишь свой прод-URL
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.use(cookieParser());

  // ===== ЕДИНАЯ раздача /uploads из корня проекта =====
  const STATIC_DIR = join(process.cwd(), 'uploads');
  app.use(
    '/uploads',
    express.static(STATIC_DIR, {
      setHeaders: (res, path) => {
        // Берём первый origin (или динамически можно из запроса)
        const origin = allowedOrigins[0];
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    }),
  );
  // ====================================================

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3001);

  await app.listen(port);
  console.log(`🚀 Cubit backend listening on http://localhost:${port}`);
}

bootstrap();
