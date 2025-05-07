import { IsOptional, IsString } from 'class-validator';

export class CreateRoomDto {
  @IsOptional()
  @IsString()
  title?: string;
}
