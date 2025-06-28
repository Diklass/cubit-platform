// src/rooms/dto/update-room-settings.dto.ts
import { IsHexColor, IsOptional, IsString, Length } from 'class-validator';

export class UpdateRoomSettingsDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  title?: string;

  @IsOptional()
  @IsHexColor()
  bgColor?: string;
}

