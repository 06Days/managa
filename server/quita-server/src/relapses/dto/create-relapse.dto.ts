import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class RelapseAnswerDto {
  @ApiPropertyOptional({
    description: 'Id of the custom question this answer belongs to.',
  })
  @IsOptional()
  @IsInt()
  questionId?: number;

  @ApiProperty({ example: 'A stressful day at work' })
  @IsString()
  @MaxLength(2000)
  answer!: string;
}

export class CreateRelapseDto {
  @ApiProperty({
    example: '2026-10-20T18:30:00.000Z',
    description: 'When the relapse happened.',
  })
  @IsISO8601()
  occurredAt!: string;

  @ApiPropertyOptional({ example: 'Skipped my evening walk.' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @ApiPropertyOptional({ type: [RelapseAnswerDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RelapseAnswerDto)
  answers?: RelapseAnswerDto[];
}
