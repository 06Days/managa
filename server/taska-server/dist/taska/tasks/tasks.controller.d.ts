import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    create(createTaskDto: CreateTaskDto): Promise<Task>;
    findAll(): Promise<Task[]>;
    remove(id: string): Promise<void>;
    updateTask(id: number, updateTaskDto: UpdateTaskDto): Promise<Task>;
    toggleTask(id: number, listId: number): Promise<Task>;
    updateList(id: number, updateTaskDto: UpdateTaskDto): Promise<Task>;
    reorderTasks(listId: number, body: {
        tasks: {
            id: number;
        }[];
    }): Promise<{
        success: boolean;
    }>;
}
