import { TaskList } from '../../task-list/entities/task-list.entity';
export declare class Task {
    id: number;
    title: string;
    isCompleted: boolean;
    listPosition: number;
    TaskList: TaskList;
}
