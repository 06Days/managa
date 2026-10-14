import { TaskList, Task } from "@/app/taska/types/task";
import { useState, useRef, useEffect, JSXElementConstructor, ReactElement, ReactNode, ReactPortal } from "react";
import { ReactSortable } from "react-sortablejs";
import AddTaskModal from './AddTaskModal';
import AddTaskListModal from './AddTasklistModal';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  list: TaskList;
  onAddTask: (listId: number, title: string, dueDate: string) => void;
  onDeleteTask: (taskId: number, listId: number) => void;
  onDeleteList: (listId: number) =>void;
  onToggleTask: (taskId: number, listId: number) => void;
  onReorderTasks: (listId: number, newTasks: Task[], saveToBackend?: boolean) => void;
  onUpdateListTitle?: (listId: number, newTitle: string) => void;
  onUpdateTaskTitle?: (taskId: number, listId: number, newTitle: string) => void;
  
  isEditingMode: boolean;
  toggleEdit: () => void;
}

// interface TaskListCardProps{
  
// }

export default function TaskCard({ 
  list, 
  onAddTask, 
  onDeleteTask, 
  onToggleTask, 
  onReorderTasks, 
  isEditingMode, 
  onUpdateListTitle,
  onUpdateTaskTitle,
  onDeleteList
}: TaskCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isEditingListTitle, setIsEditingListTitle] = useState(false);
  const [listTitleInput, setListTitleInput] = useState(list?.title || '');
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [taskTitleInput, setTaskTitleInput] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const tasksData = list?.tasks || [];

  const latestTasksRef = useRef<Task[]>(tasksData);
  latestTasksRef.current = tasksData;

  useEffect(() => {
    if (isEditingListTitle || editingTaskId !== null) {
      inputRef.current?.focus();
    }
  }, [isEditingListTitle, editingTaskId]);

  const handleSaveListTitle = () => {
    
    const trimmedInput=listTitleInput.trim()
    if (trimmedInput === '' && onDeleteList) {
      const confirmDelete = window.confirm(`Are you sure you want to delete the list "${list.title}"?`);
      if (confirmDelete) {
        onDeleteList(list.id);
        return;
      } else {
       
        setListTitleInput(list.title);
        setIsEditingListTitle(false);
        return;
      }
    }
    if (trimmedInput && listTitleInput !== list.title && onUpdateListTitle) {
      onUpdateListTitle(list.id, listTitleInput.trim());
    }
    setIsEditingListTitle(false);
  };

  const handleSaveTaskTitle = (taskId: number) => {
    if (taskTitleInput.trim() && onUpdateTaskTitle) {
      onUpdateTaskTitle(taskId, list.id, taskTitleInput.trim());
    }
    setEditingTaskId(null);
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div className={`card mb-3 ${styles.listcontainer}`}>
      <div className="card-header d-flex justify-content-between align-items-center">
        {isEditingListTitle ? (
          <input
            ref={inputRef}
            type="text"
            className="form-control form-control-sm w-50"
            value={listTitleInput}
            onChange={(e) => setListTitleInput(e.target.value)}
            onBlur={handleSaveListTitle}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveListTitle()}
          />
        ) : (
          <h5 
            className="input m-0" 
            role="button" 
            title="Click to edit list title"
            onClick={() => {
              setListTitleInput(list.title);
              setIsEditingListTitle(true);
            }}
          >
            {list?.title || 'Task List'}
          </h5>
        )}
        
        <div className="d-flex align-items-center gap-2">
          <button 
            className="btn btn-sm btn-primary" 
            onClick={handleOpenModal}
          >
            + Add Task
          </button>
          
          {isEditingMode && onDeleteList && (
            <button 
              className="btn btn-sm btn-outline-danger" 
              onClick={() => onDeleteList(list.id)}
            >
              Delete List
            </button>
          )}
        </div>
      </div>
    
      <div className="card-body">
        <ReactSortable
          tag="ul"
          className="list-unstyled m-0"
          list={tasksData}
          setList={(newTasks) => {
            latestTasksRef.current = newTasks;
            onReorderTasks(list.id, newTasks, false);
          }}
          onEnd={() => {
            onReorderTasks(list.id, latestTasksRef.current, true);
          }}
          animation={150}
        >
          {tasksData.map((task: { id: any; title: any; name: any; isCompleted: boolean | undefined; due_date: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }, index: any) => {
            const taskId = task.id!;
            const uniqueKey = taskId ? taskId : `temp-${index}`;
            const isEditingThisTask = editingTaskId === taskId;
            const displayTitle = task.title || task.name || '';

            return (
              <li key={uniqueKey} className={`mb-2 d-flex justify-content-between align-items-center ${styles.taskitem}`}>
                <div className="d-flex align-items-center flex-grow-1 me-2">
                  <input 
                    type="checkbox" 
                    checked={task.isCompleted} 
                    onChange={() => taskId && onToggleTask(taskId, list.id)} 
                    className={`me-2 ${styles.checkmark}`}
                  />

                  {isEditingThisTask ? (
                    <input
                      ref={inputRef}
                      type="text"
                      className="form-control form-control-sm"
                      value={taskTitleInput}
                      onChange={(e) => setTaskTitleInput(e.target.value)}
                      onBlur={() => handleSaveTaskTitle(taskId)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTaskTitle(taskId)}
                    />
                  ) : (
                    <span 
                      role="button"
                      title="Click to edit task title"
                      className={`flex-grow-1 ${task.isCompleted ? "text-decoration-line-through text-muted" : ""}`}
                      onClick={() => {
                        setEditingTaskId(taskId);
                        setTaskTitleInput(displayTitle);
                      }}
                    >
                      {displayTitle}
                    </span>
                  )}
                  
                  <span className="ms-3 text-muted small text-nowrap">{task.due_date}</span>
                </div>

                {(taskId && isEditingMode) && (
                  <button 
                    className="btn btn-sm btn-outline-danger" 
                    onClick={() => onDeleteTask(taskId, list.id)}
                  >
                    Delete
                  </button>
                )}
              </li>
            );
          })}
        </ReactSortable>
      </div>
     
      {isModalOpen && (
        <AddTaskModal
          onClose={handleCloseModal}
          onSubmit={(title, dueDate) => onAddTask(list.id, title, dueDate)}
          listTitle={list?.title}
        />
      )}
    </div>
  );
}