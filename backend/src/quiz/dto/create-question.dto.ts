import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { QuestionType } from '@prisma/client';

export class CreateQuestionDto {
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsString()
  text: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}
