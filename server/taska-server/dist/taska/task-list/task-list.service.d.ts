import { Repository } from 'typeorm';
import { TaskList } from './entities/task-list.entity';
import { CreateTaskListDto } from './dto/create-task-list.dto';
import { Task } from '../tasks/entities/task.entity';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
import { UpdateTaskListDto } from './dto/update-task-list.dto';
export declare class TaskListService {
    private readonly TaskListRepository;
    private readonly taskRepository;
    constructor(TaskListRepository: Repository<TaskList>, taskRepository: Repository<Task>);
    createList(createTaskListDto: CreateTaskListDto): Promise<TaskList>;
    findAllLists(): Promise<TaskList[]>;
    findOneList(id: number): Promise<TaskList>;
    addTaskToList(listId: number, createTaskDto: CreateTaskDto): Promise<Task>;
    removeList(id: number): Promise<void>;
    updateList(id: number, updateTaskListDto: UpdateTaskListDto): Promise<TaskList>;
}
