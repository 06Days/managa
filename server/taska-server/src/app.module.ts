import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './taska/tasks/tasks.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './taska/tasks/entities/task.entity';
import { TaskListModule } from './taska/task-list/task-list.module';
import { TaskList } from './taska/task-list/entities/task-list.entity';

import { AppManagerModule } from './appmanager/app-manager.module';

@Module({
  
  controllers: [AppController],
  providers: [AppService],
  imports: [TaskListModule, 
    
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DATABASE_PATH ?? 'database.sqlite',
      entities: [Task, TaskList],
      synchronize: true, 
    }),
    TasksModule,
    AppManagerModule,
    
  
  ],
})
export class AppModule {}
