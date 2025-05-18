import { IsOptional, IsString } from 'class-validator';

export class PostMessageDto {
  @IsOptional()
  @IsString()
  authorId?: string; // <-- корректное имя

  @IsOptional()
  @IsString()
  text?: string;
}
