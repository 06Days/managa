import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskListService } from './task-list.service';
import { TaskListController } from './task-list.controller';
import { TaskList } from './entities/task-list.entity';
import { Task } from '../../taska/tasks/entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskList, Task])],
  controllers: [TaskListController],
  providers: [TaskListService],
})
export class TaskListModule {}