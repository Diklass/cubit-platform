// src/files/files.controller.ts
import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { Response } from 'express';

@Controller('files')
export class FilesController {
  private uploadDir = join(process.cwd(), 'uploads');

  @Get(':filename')
  async download(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = join(this.uploadDir, filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Файл не найден');
    }

    // Отрезаем префикс timestamp- и оставляем оригинальное имя
    const rawName = filename.includes('-')
      ? filename.substring(filename.indexOf('-') + 1)
      : filename;

    // Multer обычно сохраняет имя в UTF-8, так что decodeURIComponent не нужен,
    // но если где-то были URI-кодировки, можно:
    let decodedName: string;
    try {
      decodedName = decodeURIComponent(rawName);
    } catch {
      decodedName = rawName;
    }

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${decodedName.replace(/"/g, '')}"`,
    });

    const stream = createReadStream(filePath);
    stream.pipe(res);
  }
}
