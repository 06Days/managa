import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiProperty({ description: 'The new task title', required: false })
  title?: string;

  @ApiProperty({ description: 'The new due date', required: false })
  due_date?: string;

  @ApiProperty({ description: 'is task done', required: false })
  done?: boolean;

  @ApiProperty({
    description: 'Whether the task is completed',
    required: false,
  })
  isCompleted?: boolean;

  @ApiProperty({ description: 'where task is in list', required: false })
  listPosition?: number;
}
