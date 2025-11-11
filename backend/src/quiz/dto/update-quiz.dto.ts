import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateQuizDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  passThreshold?: number;

  @IsOptional()
  @IsInt()
  maxAttempts?: number;

  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @IsOptional()
  @IsBoolean()
  shuffleOptions?: boolean;

  @IsOptional()
  @IsInt()
  timeLimitSec?: number;

  // ✅ ДОБАВЛЯЕМ!
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
