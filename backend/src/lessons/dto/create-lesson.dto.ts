import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsUrl()
  modelUrl?: string;
}