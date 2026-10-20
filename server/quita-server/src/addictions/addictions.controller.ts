import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AddictionsService } from './addictions.service';
import { CreateAddictionDto } from './dto/create-addiction.dto';
import { UpdateAddictionDto } from './dto/update-addiction.dto';

@ApiTags('addictions')
@Controller('addictions')
export class AddictionsController {
  constructor(private readonly addictions: AddictionsService) {}

  @Get()
  @ApiOperation({ summary: 'List addictions with live streak statistics' })
  list() {
    return this.addictions.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one addiction with its custom questions' })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.addictions.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an addiction and its custom questions' })
  create(@Body() dto: CreateAddictionDto) {
    return this.addictions.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an addiction, including replacing its question set',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAddictionDto,
  ) {
    return this.addictions.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an addiction with its questions and relapses',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    this.addictions.remove(id);
    return { ok: true };
  }
}
