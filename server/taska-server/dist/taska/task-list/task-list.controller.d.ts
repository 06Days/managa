import { TaskListService } from './task-list.service';
import { UpdateTaskListDto } from './dto/update-task-list.dto';
import { CreateTaskListDto } from './dto/create-task-list.dto';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
export declare class TaskListController {
    private readonly taskListsService;
    constructor(taskListsService: TaskListService);
    createList(createTaskListDto: CreateTaskListDto): Promise<import("./entities/task-list.entity").TaskList>;
    findAllLists(): Promise<import("./entities/task-list.entity").TaskList[]>;
    findOneList(id: number): Promise<import("./entities/task-list.entity").TaskList>;
    updateList(id: number, updateTaskListDto: UpdateTaskListDto): Promise<import("./entities/task-list.entity").TaskList>;
    addTaskToList(id: number, createTaskDto: CreateTaskDto): Promise<import("../tasks/entities/task.entity").Task>;
    removeList(id: number): Promise<void>;
}
