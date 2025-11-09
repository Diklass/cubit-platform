import {
  Controller,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';

import { OptionsService } from './options.service';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { ReorderOptionsDto } from './dto/reorder-options.dto';

@Controller()
export class OptionsController {
  constructor(private optionsService: OptionsService) {}

  @Post('questions/:questionId/options')
  create(
    @Param('questionId') questionId: string,
    @Body() dto: CreateOptionDto
  ) {
    return this.optionsService.create(questionId, dto);
  }

  @Patch('options/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOptionDto
  ) {
    return this.optionsService.update(id, dto);
  }

  @Delete('options/:id')
  delete(@Param('id') id: string) {
    return this.optionsService.delete(id);
  }

  @Patch('questions/:questionId/options/reorder')
  reorder(
    @Param('questionId') questionId: string,
    @Body() dto: ReorderOptionsDto
  ) {
    return this.optionsService.reorder(questionId, dto);
  }
}
