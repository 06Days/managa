import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type { QuestionType } from '../../common/types';

const QUESTION_TYPES: QuestionType[] = ['text', 'number', 'boolean', 'scale'];

export class QuestionInputDto {
  @ApiPropertyOptional({
    description: 'Existing question id. Omit to create a new question.',
  })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ example: 'What triggered this relapse?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  prompt!: string;

  @ApiPropertyOptional({
    enum: QUESTION_TYPES,
    default: 'text',
  })
  @IsOptional()
  @IsIn(QUESTION_TYPES)
  type?: QuestionType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class CreateAddictionDto {
  @ApiProperty({ example: 'Alcohol' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Wine and spirits' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: '🍷', default: '🌱' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  icon?: string;

  @ApiPropertyOptional({ example: '#dc3545', default: '#0d6efd' })
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: 'color must be a six-digit hex colour such as #0d6efd',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'When the current attempt started. Defaults to now.',
    example: '2026-10-20T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  startedAt?: string;

  @ApiPropertyOptional({ type: [QuestionInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionInputDto)
  questions?: QuestionInputDto[];
}
