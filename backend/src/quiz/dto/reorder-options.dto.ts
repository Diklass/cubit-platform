import { IsArray } from 'class-validator';

export class ReorderOptionsDto {
  @IsArray()
  items: {
    id: string;
    order: number;
  }[];
}
