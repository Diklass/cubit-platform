import { IsArray, IsString, IsInt } from 'class-validator';

export class ReorderQuestionsDto {
  @IsArray()
  items: {
    id: string;
    order: number;
  }[];
}
