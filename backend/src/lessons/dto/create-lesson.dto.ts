// backend/src/lessons/dto/create-lesson.dto.ts
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUrl()
  modelUrl?: string;

  @IsString()
  teacherId: string;
}
