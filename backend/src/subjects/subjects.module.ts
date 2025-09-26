import { Module } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { SubjectDetail } from './dto/subject-detail.dto';

@Module({
  controllers: [SubjectsController],
  providers: [SubjectsService, PrismaService],
})
export class SubjectsModule {}
