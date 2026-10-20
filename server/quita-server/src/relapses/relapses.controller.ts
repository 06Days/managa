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
import { RelapsesService } from './relapses.service';
import { CreateRelapseDto } from './dto/create-relapse.dto';
import { UpdateRelapseDto } from './dto/update-relapse.dto';

@ApiTags('relapses')
@Controller('addictions/:addictionId/relapses')
export class RelapsesController {
  constructor(private readonly relapses: RelapsesService) {}

  @Get()
  @ApiOperation({ summary: 'List every relapse for one addiction' })
  list(@Param('addictionId', ParseIntPipe) addictionId: number) {
    return this.relapses.list(addictionId);
  }

  @Get(':relapseId')
  @ApiOperation({ summary: 'Get one relapse and its saved answers' })
  get(
    @Param('addictionId', ParseIntPipe) addictionId: number,
    @Param('relapseId', ParseIntPipe) relapseId: number,
  ) {
    return this.relapses.get(addictionId, relapseId);
  }

  @Post()
  @ApiOperation({ summary: 'Log a relapse and answer the custom questions' })
  create(
    @Param('addictionId', ParseIntPipe) addictionId: number,
    @Body() dto: CreateRelapseDto,
  ) {
    return this.relapses.create(addictionId, dto);
  }

  @Patch(':relapseId')
  @ApiOperation({ summary: 'Correct a relapse entry' })
  update(
    @Param('addictionId', ParseIntPipe) addictionId: number,
    @Param('relapseId', ParseIntPipe) relapseId: number,
    @Body() dto: UpdateRelapseDto,
  ) {
    return this.relapses.update(addictionId, relapseId, dto);
  }

  @Delete(':relapseId')
  @ApiOperation({ summary: 'Delete a relapse entry' })
  remove(
    @Param('addictionId', ParseIntPipe) addictionId: number,
    @Param('relapseId', ParseIntPipe) relapseId: number,
  ) {
    this.relapses.remove(addictionId, relapseId);
    return { ok: true };
  }
}
