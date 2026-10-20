// app/page.tsx
'use client';

import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { TaskList, Task } from "./types/task";
import Navbar from "@/app/taska/components/navbar";
import TaskCard from "@/app/taska/components/TaskCard";
import AddTasklistModal from "@/app/taska/components/AddTasklistModal"; // Adjust path if needed

// managa builds this app with NEXT_PUBLIC_API_URL set to the allocated Taska
// API port. When it is absent the client uses same-origin requests, which are
// proxied to the API by the rewrites in next.config.ts.
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
const api = (path: string) => `${API_URL}${path}`;

export default function TaskaList() {
  const [lists, setTaskLists] = useState<TaskList[]>([]);
  const [isEditingMode, setIsEditingMode] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // Modal state

  const toggleEdit = () => {
    setIsEditingMode(prev => !prev);
    loadAll();
  };

  const loadAll = async () => {
    try {
      const res = await fetch(api('/task-lists'));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTaskLists(data);
    } catch (e) {
      console.error('Load failed', e);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAddList = (title: string) => {
    const newList = { title, name: title }; // Adapt fields based on your backend needs

    fetch(api('/task-lists'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newList),
    })
      .then((res) => res.json())
      .then((data) => {
        setTaskLists([...lists, data]);
        setIsModalOpen(false); // Close modal on success
      })
      .catch((error) => console.error('Error adding list', error));
  };

  const handleDeleteList = (listId: number) => {
    fetch(api(`/task-lists/${listId}`), {
      method: 'DELETE',
    })
      .then(() => {
        setTaskLists(lists.filter((list) => list.id !== listId));
      })
      .catch((error) => console.error('Error deleting list', error));
  };

  const handleAddTask = (listId: number, title: string, dueDate: string) => {
    const newTask = { title, due_date: dueDate, done: false };

    fetch(api(`/task-lists/${listId}/tasks`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    })
      .then((res) => res.json())
      .then((data) => {
        setTaskLists(lists.map((list) => 
          list.id === listId ? { ...list, tasks: [...list.tasks, data] } : list
        ));
      })
      .catch((error) => console.error('Error adding task', error));
  };

  const handleDeleteTask = (taskId: number, listId: number) => {
    fetch(api(`/task-lists/${listId}/tasks/${taskId}`), {
      method: 'DELETE',
    })
      .then(() => {
        setTaskLists(lists.map((list) => 
          list.id === listId ? { ...list, tasks: list.tasks.filter((task: { id: number; }) => task.id !== taskId) } : list
        ));
      })
      .catch((error) => console.error('Error deleting task', error));
  };

  const toggleTaskDone = (taskId: number, listId: number) => {
    fetch(api(`/task-lists/${listId}/tasks/${taskId}/toggle`), {
      method: 'POST',
    })
      .then((res) => res.json())
      .then((data) => {
        setTaskLists(lists.map((list) => 
          list.id === listId ? 
            { ...list, tasks: list.tasks.map((task: { id: number; }) => task.id === taskId ? data : task) } : list
        ));
      })
      .catch((error) => console.error('Error toggling task', error));
  };

  const handleReorderTasks = (listId: number, newTasks: Task[], saveToBackend = false) => {
    setTaskLists(lists.map((list) => 
      list.id === listId ? { ...list, tasks: newTasks } : list
    ));

    if (saveToBackend) {
      fetch(api(`/task-lists/${listId}/tasks/swap`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: newTasks }),
      }).catch((error) => console.error('Error reordering tasks', error));
    }
  };

  const handleUpdateListTitle = (listId: number, newTitle: string) => {
    fetch(api(`/task-lists/${listId}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
      .then((res) => res.json())
      .then((data) => {
        setTaskLists(lists.map((list) => 
          list.id === listId ? { ...list, title: data.title || newTitle } : list
        ));
      })
      .catch((error) => console.error('Error updating list title', error));
  };

  const handleUpdateTaskTitle = (taskId: number, listId: number, newTitle: string) => {
    fetch(api(`/task-lists/${listId}/tasks/${taskId}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
      .then((res) => res.json())
      .then((data) => {
        setTaskLists(lists.map((list) => 
          list.id === listId ? {
            ...list, 
            tasks: list.tasks.map((task: { id: number; }) => task.id === taskId ? data : task)
          } : list
        ));
      })
      .catch((error) => console.error('Error updating task title', error));
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button 
          className={`btn btn-sm ${isEditingMode ? 'btn-secondary' : 'btn-outline-secondary'}`}
          onClick={toggleEdit}
        >
          {isEditingMode ? 'Done Editing' : 'Edit Mode'}
        </button>

        {/* Button to trigger the modal */}
        <button 
          className="btn btn-success btn-sm"
          onClick={() => setIsModalOpen(true)}
        >
          + Add New Tasklist
        </button>
      </div>

      <Navbar />

      {/* Render the Modal conditionally */}
      {isModalOpen && (
        <AddTasklistModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleAddList} 
        />
      )}

      {/* Render Lists */}
      {lists.map((list) => (
        <TaskCard 
          key={list.id} 
          list={list} 
          onAddTask={handleAddTask} 
          onDeleteTask={handleDeleteTask}
          onDeleteList={handleDeleteList} 
          onToggleTask={toggleTaskDone} 
          onReorderTasks={handleReorderTasks}
          onUpdateListTitle={handleUpdateListTitle}
          onUpdateTaskTitle={handleUpdateTaskTitle}
          isEditingMode={isEditingMode}
          toggleEdit={toggleEdit}
        />
      ))}
    </div>
  );
}