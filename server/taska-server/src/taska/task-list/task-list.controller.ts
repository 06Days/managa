import { Controller, Get, Post, Body, Param, Delete, Patch, ParseIntPipe } from '@nestjs/common';
import { TaskListService } from './task-list.service';
import { UpdateTaskListDto } from './dto/update-task-list.dto'; 
import { CreateTaskListDto } from './dto/create-task-list.dto';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';

@Controller('task-lists')
export class TaskListController {
  constructor(private readonly taskListsService: TaskListService) {}

  @Post()
  createList(@Body() createTaskListDto: CreateTaskListDto) {
    return this.taskListsService.createList(createTaskListDto);
  }

  @Get()
  findAllLists() {
    return this.taskListsService.findAllLists();
  }

  @Get(':id')
  findOneList(@Param('id', ParseIntPipe) id: number) {
    return this.taskListsService.findOneList(id);
  }

  @Patch(':id')
  updateList(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskListDto: UpdateTaskListDto, 
  ) {
    return this.taskListsService.updateList(id, updateTaskListDto);
  }

  @Post(':id/tasks')
  addTaskToList(@Param('id', ParseIntPipe) id: number, @Body() createTaskDto: CreateTaskDto) {
    return this.taskListsService.addTaskToList(id, createTaskDto);
  }

  @Delete(':id')
  removeList(@Param('id', ParseIntPipe) id: number) {
    return this.taskListsService.removeList(id);
  }
}