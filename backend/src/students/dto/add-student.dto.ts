import { IsOptional, IsUUID, IsEmail } from 'class-validator';

export class AddStudentDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUUID()
  groupId?: string;
}
