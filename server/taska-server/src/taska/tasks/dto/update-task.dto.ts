import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import {ApiProperty} from '@nestjs/swagger';
export class UpdateTaskDto extends PartialType(CreateTaskDto) {
    @ApiProperty({description: 'The new task title'})
    title?: string;
    @ApiProperty({description: 'The new due date'})
    due_date?: string;
    @ApiProperty({description: 'is task done'})
    done?: boolean;
    @ApiProperty({description: 'where task is in list'})
    listPosition?: number;
}
