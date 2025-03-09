import React, { useState } from 'react';
import { TodoData } from '../types/todo';
import { updateTodo, deleteTodo } from '../services/useTodos';
import { FaTrash, FaFileAlt } from 'react-icons/fa';
import { FaRegSquare, FaRegCheckSquare } from 'react-icons/fa';
import TodoDescriptionDrawer from './TodoDescriptionDrawer';

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
 * - Provides access to the description drawer
 * - Supports Markdown formatting in todo titles
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
  const [isDescriptionDrawerOpen, setIsDescriptionDrawerOpen] = useState(false);

  // Direct rendering of markdown without using ReactMarkdown
  const renderMarkdown = (text: string) => {
    // Replace __text__ with italic spans
    let result = text.replace(/__([^_]+)__/g, '<span class="italic">$1</span>');
    
    // Replace *text* with bold spans
    result = result.replace(/\*([^*]+)\*/g, '<span class="font-bold">$1</span>');
    
    // Debug log to verify the processing
    if (text.includes('__') || text.includes('*')) {
      console.log('Original:', text);
      console.log('Processed:', result);
    }
    
    return result;
  };

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

  const handleOpenDescriptionDrawer = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering edit mode
    setIsDescriptionDrawerOpen(true);
  };

  return (
    <>
      <div
        draggable={!isViewOnly}
        onDragStart={handleDragStart}
        className={`h-full ${!isViewOnly ? 'cursor-move' : ''} hover:bg-gray-50 group grid grid-cols-[24px_1fr] gap-2 items-center pr-1.5`}
      >
        {/* Checkbox column - only visible on hover */}
        {!isViewOnly && (
          <div className="flex justify-center items-center h-full">
            <button
              onClick={handleToggleComplete}
              className={`transition-opacity ${
                todo.is_completed ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'
              } opacity-0 group-hover:opacity-100`}
              title={todo.is_completed ? "Mark as incomplete" : "Mark as complete"}
            >
              {todo.is_completed ? (
                <FaRegCheckSquare size={14} />
              ) : (
                <FaRegSquare size={14} />
              )}
            </button>
          </div>
        )}

        {/* Todo content column */}
        <div className="flex items-center justify-between w-full">
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
              <div
                onClick={() => !isViewOnly && setIsEditing(true)}
                className={`flex items-center flex-grow min-w-0 overflow-hidden ${!isViewOnly ? 'cursor-pointer' : ''}`}
              >
                {/* Use direct HTML rendering for markdown */}
                <span 
                  className={`text-xs ${todo.is_completed ? 'line-through text-gray-400' : ''}`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(todo.title) }}
                />
              </div>
              {!isViewOnly && (
                <div className="flex items-center">
                  <button
                    onClick={handleOpenDescriptionDrawer}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity mr-2 todo-icon ${
                      todo.description ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
                    }`}
                    title="View/edit description"
                  >
                    <FaFileAlt size={12} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity todo-icon ${
                      isDeleting ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                    }`}
                    title="Delete todo"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Description Drawer */}
      <TodoDescriptionDrawer
        todo={todo}
        isOpen={isDescriptionDrawerOpen}
        onClose={() => setIsDescriptionDrawerOpen(false)}
        onUpdate={onUpdate}
        isViewOnly={isViewOnly}
      />
    </>
  );
};