import { IsOptional, IsString } from 'class-validator';

export class PostMessageDto {
  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  text?: string;
}
