import { Module } from '@nestjs/common';
import { TaskListModule } from '../task-list/task-list.module';
import { TasksModule } from '../tasks/tasks.module';
import { TaskaMcpController } from './taska-mcp.controller';
import { TaskaMcpService } from './taska-mcp.service';

@Module({
  imports: [TaskListModule, TasksModule],
  controllers: [TaskaMcpController],
  providers: [TaskaMcpService],
})
export class TaskaMcpModule {}
