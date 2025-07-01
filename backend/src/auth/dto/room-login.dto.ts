import { IsString, Length } from 'class-validator';

export class RoomLoginDto {
  @IsString()
  @Length(1, 20)
  roomCode: string;
}