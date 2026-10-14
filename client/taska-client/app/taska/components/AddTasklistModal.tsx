import React, { useState } from 'react';

interface AddTasklistModalProps {
  onClose: () => void;
  onSubmit: (title: string) => void;
  
}


export default function AddTasklistModal({ onClose, onSubmit}: AddTasklistModalProps) {
  const [tasklistTitle, setTaskTitle] = useState('');
 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!tasklistTitle.trim()) return;

    setIsSubmitting(true);
    onSubmit(tasklistTitle);
    onClose();
    setTaskTitle('');
   
    setIsSubmitting(false);
  };

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h5 className="modal-title">
              {`Add new tasklist`}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="taskTitle" className="form-label">Tasklist Title</label>
                <input
                  type="text"
                  className="form-control"
                  id="taskTitle"
                  value={tasklistTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Enter list title"
                  required
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
                disabled={isSubmitting || !tasklistTitle.trim()}
              >
                {isSubmitting ? 'Adding...' : 'Add List'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
