import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('uploads')
export class UploadsController {
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) => {
          const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
          cb(null, `${Date.now()}-${originalName}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    return {
      url: `/uploads/${file.filename}`, // путь для фронтенда
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploadedBy: req.user.id,
    };
  }
}
