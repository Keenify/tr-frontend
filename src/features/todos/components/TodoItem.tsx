import React, { useState } from 'react';
import { TodoData } from '../types/todo';
import { updateTodo, deleteTodo } from '../services/useTodos';
import { FaTrash } from 'react-icons/fa';
import { FaRegSquare, FaRegCheckSquare } from 'react-icons/fa';

interface TodoItemProps {
  todo: TodoData;
  onUpdate: (todo: TodoData) => void;
  onDelete: (todoId: string) => void;
  isViewOnly?: boolean;
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
export const TodoItem: React.FC<TodoItemProps> = ({ todo, onUpdate, onDelete, isViewOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTrashHovered, setIsTrashHovered] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (isViewOnly) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('todoId', todo.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleUpdate = async () => {
    if (title.trim() === '') {
      try {
        await deleteTodo(todo.id);
        onDelete(todo.id);
      } catch (error) {
        console.error('Failed to delete todo:', error);
        setTitle(todo.title);
      }
      return;
    }

    if (title !== todo.title) {
      try {
        const updatedTodo = await updateTodo(todo.id, { title });
        onUpdate(updatedTodo);
      } catch (error) {
        console.error('Failed to update todo:', error);
        setTitle(todo.title);
      }
    }
    setIsEditing(false);
  };

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering edit mode
    try {
      const updatedTodo = await updateTodo(todo.id, { 
        is_completed: !todo.is_completed 
      });
      onUpdate(updatedTodo);
    } catch (error) {
      console.error('Failed to update todo completion:', error);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering edit mode
    try {
      setIsDeleting(true);
      await deleteTodo(todo.id);
      onDelete(todo.id);
    } catch (error) {
      console.error('Failed to delete todo:', error);
      setIsDeleting(false);
    }
  };

  return (
    <div
      draggable={!isViewOnly}
      onDragStart={handleDragStart}
      className={`h-full ${!isViewOnly ? 'cursor-move' : ''} hover:bg-gray-50 group flex items-center justify-between px-1.5`}
    >
      {isEditing && !isViewOnly ? (
        <input
          title="Todo Title"
          placeholder="Enter Todo Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleUpdate}
          onKeyPress={(e) => e.key === 'Enter' && handleUpdate()}
          className="w-full outline-none border-b border-gray-100 py-0.5 text-xs"
          autoFocus
        />
      ) : (
        <>
          <div className="flex items-center space-x-1.5 flex-grow min-w-0">
            {!isViewOnly && (
              <button
                onClick={handleToggleComplete}
                className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                  todo.is_completed ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'
                }`}
                title={todo.is_completed ? "Mark as incomplete" : "Mark as complete"}
              >
                {todo.is_completed ? (
                  <FaRegCheckSquare size={12} />
                ) : (
                  <FaRegSquare size={12} />
                )}
              </button>
            )}
            <div
              onClick={() => !isViewOnly && setIsEditing(true)}
              className={`flex items-center flex-grow min-w-0 overflow-hidden ${!isViewOnly ? 'cursor-pointer' : ''}`}
            >
              <span className={`truncate text-xs ${todo.is_completed ? 'line-through text-gray-400' : ''}`}>
                {todo.title}
              </span>
            </div>
          </div>
          {!isViewOnly && (
            <button
              onClick={handleDelete}
              onMouseEnter={() => setIsTrashHovered(true)}
              onMouseLeave={() => setIsTrashHovered(false)}
              className={`opacity-0 group-hover:opacity-100 transition-opacity ml-1 ${
                isDeleting ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              } ${isTrashHovered ? 'scale-110' : ''} transform transition-all duration-150`}
              title="Delete todo"
            >
              <FaTrash size={isTrashHovered ? 12 : 10} />
            </button>
          )}
        </>
      )}
    </div>
  );
};