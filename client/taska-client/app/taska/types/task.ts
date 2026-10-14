// /types/task.ts
// our interface pattern for loading the tasks and lists from backend
export interface Task {
  id?: number;
  title?: string;
  isCompleted: boolean;
  listPosition: number;
  // due_date?: string;
}

export interface TaskList {
  id: number;
  title: string;
  name: string;
  tasks: Task[];
}