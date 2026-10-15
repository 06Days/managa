import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe, Patch } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
@Controller('task-lists/:listId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(+id);
  }
  @Put(':id')
  async updateTask(@Param('id') id: number, @Body() updateTaskDto: UpdateTaskDto): Promise<Task> {
    return await this.tasksService.update(id, updateTaskDto);
  }
  @Post(':id/toggle')
  async toggleTask(
    @Param('id', ParseIntPipe) id: number,
    @Param('listId', ParseIntPipe) listId: number
     ): Promise<Task>{
      console.log('hi');
    return await this.tasksService.toggle(id, listId);
    
  }
  @Patch(':id')
    updateList(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateTaskDto: UpdateTaskDto, 
    ) {
      return this.tasksService.update(id, updateTaskDto);
    }

  @Post('swap')
  async reorderTasks(
    @Param('listId', ParseIntPipe) listId: number,
    @Body() body: { tasks: { id: number }[] },
  ) {
    await this.tasksService.reorderTasks(listId, body.tasks);
    return { success: true };
  }
  
}