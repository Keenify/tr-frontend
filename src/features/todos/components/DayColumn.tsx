import React, { useState, KeyboardEvent } from 'react';
import { TodoData } from '../types/todo';
import { format } from 'date-fns';
import { createTodo, updateTodo } from '../services/useTodos';
import { TodoItem } from './TodoItem';

interface DayColumnProps {
  date: Date;
  todos: TodoData[];
  employeeId: string;
  companyId: string;
  onTodoCreated: (todo: TodoData) => void;
  onTodoUpdated: (todo: TodoData) => void;
  onTodoDeleted: (todoId: string) => void;
  isViewOnly?: boolean;
}

/**
 * Represents a single day column in the todo list view
 * This component:
 * - Displays todos for a specific date
 * - Handles creation of new todos for that date
 * - Manages drag and drop functionality for moving todos between dates
 * - Updates todo due dates when todos are dropped
 * 
 * @component
 * @param {Date} date - The date this column represents
 * @param {TodoData[]} todos - Array of todos for this date
 * @param {string} employeeId - Current employee's ID
 * @param {string} companyId - Current company's ID
 * @param {Function} onTodoCreated - Callback when a new todo is created
 * @param {Function} onTodoUpdated - Callback when a todo is updated
 * @param {Function} onTodoDeleted - Callback when a todo is deleted
 */
export const DayColumn: React.FC<DayColumnProps> = ({
  date,
  todos,
  employeeId,
  companyId,
  onTodoCreated,
  onTodoUpdated,
  onTodoDeleted,
  isViewOnly = false
}) => {
  const [newTodoText, setNewTodoText] = useState('');
  const minLines = 5; // Reduced to show fewer empty lines since we're allowing extension
  const emptyLines = Math.max(minLines - todos.length - (isViewOnly ? 0 : 1), 0); // -1 for input row

  const createNewTodo = async () => {
    if (newTodoText.trim()) {
      try {
        const newTodo = await createTodo({
          title: newTodoText,
          description: '',
          due_date: format(date, 'yyyy-MM-dd'),
          color_code: '#7924C2',
          employee_id: employeeId,
          company_id: companyId,
          section_id: undefined, // For daily todos
        });
        onTodoCreated(newTodo);
        setNewTodoText('');
      } catch (error) {
        console.error('Failed to create todo:', error);
      }
    }
  };

  const handleKeyPress = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      await createNewTodo();
    }
  };

  const handleBlur = async () => {
    await createNewTodo();
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (isViewOnly) {
      e.preventDefault();
      return;
    }
    
    e.preventDefault();
    const todoId = e.dataTransfer.getData('todoId');
    
    try {
      const updatedTodo = await updateTodo(todoId, {
        due_date: format(date, 'yyyy-MM-dd')
      });
      onTodoUpdated(updatedTodo);
    } catch (error) {
      console.error('Failed to update todo date:', error);
    }
  };

  return (
    <div 
      className="flex-1 border-r border-gray-200 bg-white flex flex-col"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Header with date and arrows - sticky */}
      <div className="py-1 px-2 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex flex-col">
          <div className="text-xs text-gray-500">
            {format(date, 'd MMM yyyy')}
          </div>
          <div className="text-sm font-semibold text-purple-700 uppercase">
            {format(date, 'EEEE')}
          </div>
        </div>
      </div>
      
      {/* Content area with todos that can extend */}
      <div className="flex-1 flex flex-col">
        {/* All todo items */}
        <div className="flex-grow">
          {todos.map((todo) => (
            <div key={todo.id} className="h-[28px] border-b border-gray-200">
              <TodoItem 
                todo={todo} 
                onUpdate={onTodoUpdated}
                onDelete={onTodoDeleted}
                isViewOnly={isViewOnly}
              />
            </div>
          ))}
          
          {/* Add new todo input - positioned right after the last todo */}
          {!isViewOnly && (
            <div className="h-[28px] border-b border-gray-200">
              <div className="h-full flex items-center px-2">
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onBlur={handleBlur}
                  placeholder="Add new todo..."
                  className="w-full outline-none bg-transparent text-xs"
                />
              </div>
            </div>
          )}
          
          {/* Empty lines to fill remaining space - styled like note paper with visible lines */}
          {Array.from({ length: emptyLines }).map((_, index) => (
            <div 
              key={`empty-${index}`} 
              className="h-[28px] border-b border-gray-200"
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 