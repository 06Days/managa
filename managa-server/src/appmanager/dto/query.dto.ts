import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import type { ComponentKind } from '../types';

export class LogsQueryDto {
  @ApiPropertyOptional({ enum: ['client', 'server'] })
  @IsOptional()
  @IsIn(['client', 'server'])
  component?: ComponentKind;

  @ApiPropertyOptional({ default: 200, minimum: 1, maximum: 2000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2000)
  lines?: number;
}

export class UninstallQueryDto {
  @ApiPropertyOptional({
    description: 'Also delete the app data directory and logs.',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  purgeData?: boolean;
}
