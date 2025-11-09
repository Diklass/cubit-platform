import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateQuizDto {
  @IsOptional()
  @IsString()
  title: string = "Новый тест";

  @IsOptional()
  @IsInt()
  passThreshold: number = 70;

  @IsOptional()
  @IsInt()
  maxAttempts?: number | null = null;

  @IsOptional()
  @IsBoolean()
  shuffleQuestions: boolean = false;

  @IsOptional()
  @IsBoolean()
  shuffleOptions: boolean = false;

  @IsOptional()
  @IsInt()
  timeLimitSec?: number | null = null;
}
