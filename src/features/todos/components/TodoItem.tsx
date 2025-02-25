import React, { useState } from 'react';
import { TodoData } from '../types/todo';
import { updateTodo, deleteTodo } from '../services/useTodos';
import { FaTrash } from 'react-icons/fa';

interface TodoItemProps {
  todo: TodoData;
  onUpdate: (todo: TodoData) => void;
  onDelete: (todoId: string) => void;
}

/**
 * Individual todo item component that can be dragged between days
 * This component:
 * - Displays a single todo with its title and color indicator
 * - Handles inline editing of the todo title
 * - Enables drag and drop functionality for moving todos between dates
 * - Updates todo data when changes are made
 * 
 * @component
 * @param {TodoData} todo - The todo item data
 * @param {Function} onUpdate - Callback when todo is updated
 * @param {Function} onDelete - Callback when todo is deleted
 */
export const TodoItem: React.FC<TodoItemProps> = ({ todo, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('todoId', todo.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleUpdate = async () => {
    if (title !== todo.title) {
      try {
        const updatedTodo = await updateTodo(todo.id, { title });
        onUpdate(updatedTodo);
      } catch (error) {
        console.error('Failed to update todo:', error);
        setTitle(todo.title); // Reset on error
      }
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      await deleteTodo(todo.id);
      onDelete(todo.id);
    } catch (error) {
      console.error('Failed to delete todo:', error);
      setIsDeleting(false);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="cursor-move hover:bg-gray-50 rounded p-1 group flex items-center justify-between"
    >
      {isEditing ? (
        <input
          title="Todo Title"
          placeholder="Enter Todo Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleUpdate}
          onKeyPress={(e) => e.key === 'Enter' && handleUpdate()}
          className="w-full outline-none border-b border-blue-500"
          autoFocus
        />
      ) : (
        <>
          <div
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 flex-grow"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: todo.color_code }}
            />
            <span>{todo.title}</span>
          </div>
          <button
            onClick={handleDelete}
            className={`opacity-0 group-hover:opacity-100 transition-opacity ${
              isDeleting ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
            title="Delete todo"
          >
            <FaTrash size={14} />
          </button>
        </>
      )}
    </div>
  );
}; 