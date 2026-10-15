import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';


@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ){}
  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create(createTaskDto);
    return await this.taskRepository.save(task);
  }
async findAll(): Promise<Task[]> {
    return await this.taskRepository.find();
  }

async remove(id: number): Promise<void> {
  const result = await this.taskRepository.delete(id);
  if (result.affected === 0) {
    throw new NotFoundException(`Task with ID ${id} not found`);
  }
}

async toggle(id: number, listId: number): Promise<Task> {
  
  const task = await this.taskRepository.findOne({where: {id}});
  if(!task){
    throw new NotFoundException(`Could not toggle task with ID ${id}`);
  }
  task.isCompleted=!task.isCompleted;
  console.log('h1');

  return await this.taskRepository.save(task);

}

async update(id: number, updateTaskDto: UpdateTaskDto): Promise<Task> {
  const task = await this.taskRepository.findOne({ where: { id } });
  if (!task) {
    throw new NotFoundException(`Task with ID ${id} not found`);
  }
  this.taskRepository.merge(task, updateTaskDto);
  return await this.taskRepository.save(task);
}

async swapTask(listId: number, task1id: number, task2id: number): Promise<void>{
  const task1 = await this.taskRepository.findOne({where: {id: task1id, TaskList: {id: listId}}});
  const task2 = await this.taskRepository.findOne({where: {id: task2id, TaskList: {id: listId}}});
  if (!task1 || !task2) {
    throw new NotFoundException(`One or another of the lists couldn't be found`);
  }
  const temp = task1.listPosition;
  task1.listPosition=task2.listPosition;
  task2.listPosition=temp;
  
  await this.taskRepository.save([task1, task2]);
}
async reorderTasks(listId: number, tasks: { id: number }[]): Promise<void> {
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i] && tasks[i].id) {
      await this.taskRepository.update(
        { id: tasks[i].id, TaskList: { id: listId } },
        { listPosition: i }
      );
    }
  }
}


}


