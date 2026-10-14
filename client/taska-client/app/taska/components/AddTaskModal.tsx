import React, { useState } from 'react';

interface AddTaskModalProps {
  onClose: () => void;
  onSubmit: (title: string, dueDate: string) => void;
  listTitle?: string;
}

export default function AddTaskModal({ onClose, onSubmit, listTitle = '' }: AddTaskModalProps) {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setIsSubmitting(true);
    onSubmit(taskTitle, taskDueDate);
    onClose();
    setTaskTitle('');
    setTaskDueDate('');
    setIsSubmitting(false);
  };

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h5 className="modal-title">
              {listTitle ? `Add Task to ${listTitle}` : 'Add New Task'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="taskTitle" className="form-label">Task Title</label>
                <input
                  type="text"
                  className="form-control"
                  id="taskTitle"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="taskDueDate" className="form-label">Due Date (Optional)</label>
                <input
                  type="date"
                  className="form-control"
                  id="taskDueDate"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || !taskTitle.trim()}
              >
                {isSubmitting ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
