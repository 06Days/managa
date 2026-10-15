import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
export declare class TasksService {
    private readonly taskRepository;
    constructor(taskRepository: Repository<Task>);
    create(createTaskDto: CreateTaskDto): Promise<Task>;
    findAll(): Promise<Task[]>;
    remove(id: number): Promise<void>;
    toggle(id: number, listId: number): Promise<Task>;
    update(id: number, updateTaskDto: UpdateTaskDto): Promise<Task>;
    swapTask(listId: number, task1id: number, task2id: number): Promise<void>;
    reorderTasks(listId: number, tasks: {
        id: number;
    }[]): Promise<void>;
}
