import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskList } from './entities/task-list.entity';
import { CreateTaskListDto } from './dto/create-task-list.dto';
import { Task } from '../tasks/entities/task.entity';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
import { UpdateTaskDto } from '../tasks/dto/update-task.dto';
import { UpdateTaskListDto } from './dto/update-task-list.dto';
@Injectable()
export class TaskListService {
  constructor(
    @InjectRepository(TaskList)
    private readonly TaskListRepository: Repository<TaskList>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ){}
  async createList(createTaskListDto: CreateTaskListDto): Promise<TaskList> {
    const TaskList = this.TaskListRepository.create(createTaskListDto);
    return await this.TaskListRepository.save(TaskList);
  }

  async findAllLists(): Promise<TaskList[]> {
  return await this.TaskListRepository.find({
    relations: {tasks: true},
    order: {
      tasks: {
        listPosition: 'ASC', // Forces tasks to always return sorted by position
      },
    },
  });
}

  async findOneList(id: number): Promise<TaskList> {
    const TaskList = await this.TaskListRepository.findOne({
      where: { id },
      relations: {'tasks':true},
    });
    if (!TaskList) {
      throw new NotFoundException(`Task list with ID ${id} not found`);
    }
    return TaskList;
  }

  async addTaskToList(listId: number, createTaskDto: CreateTaskDto): Promise<Task> {
    const TaskList = await this.findOneList(listId);
    const task = this.taskRepository.create({
      ...createTaskDto,
      TaskList,
    });
    return await this.taskRepository.save(task);
  }

  async removeList(id: number): Promise<void> {
    const result = await this.TaskListRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Task list with ID ${id} not found`);
    }
  }
  async updateList(id: number, updateTaskListDto: UpdateTaskListDto): Promise<TaskList> {
    
    const taskList = await this.TaskListRepository.findOne({ where: { id } });
    if (!taskList) {
      throw new NotFoundException(`Task list with ID ${id} not found`);
    }

    
    this.TaskListRepository.merge(taskList, updateTaskListDto);
    
    
    return await this.TaskListRepository.save(taskList);
  }
 
 
}
