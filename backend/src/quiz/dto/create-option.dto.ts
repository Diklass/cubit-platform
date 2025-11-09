import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateOptionDto {
  @IsString()
  text: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}
