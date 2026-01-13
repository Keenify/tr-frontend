import React, { useState, KeyboardEvent } from 'react';
import { TodoData, TodoReorderItem } from '../types/todo';
import { format } from 'date-fns';
import { createTodo, updateTodo, reorderTodos } from '../services/useTodos';
import { TodoItem } from './TodoItem';

interface DayColumnProps {
  date: Date;
  todos: TodoData[];
  employeeId: string;
  companyId: string;
  onTodoCreated: (todo: TodoData) => void;
  onTodoUpdated: (todo: TodoData) => void;
  onTodoDeleted: (todoId: string) => void;
  onTodosReordered?: (reorderedTodos: TodoReorderItem[]) => void;
  isViewOnly?: boolean;
  maxTodosAcrossColumns?: number; // New prop to ensure consistent notelines
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
 * @param {boolean} isViewOnly - Whether the column is in view-only mode
 * @param {number} maxTodosAcrossColumns - Maximum number of todos across all columns
 */
export const DayColumn: React.FC<DayColumnProps> = ({
  date,
  todos,
  employeeId,
  companyId,
  onTodoCreated,
  onTodoUpdated,
  onTodoDeleted,
  onTodosReordered,
  isViewOnly = false,
  maxTodosAcrossColumns = 0 // Default to 0 if not provided
}) => {
  const [newTodoText, setNewTodoText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const minLines = 10; // Minimum number of lines (including todos and empty lines)

  // Sort todos by position
  const sortedTodos = [...todos].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  // Calculate empty lines based on the maximum todos across all columns or the minimum lines
  const totalLines = Math.max(maxTodosAcrossColumns, minLines);
  const emptyLines = Math.max(totalLines - sortedTodos.length - (isViewOnly ? 0 : 1), 0); // -1 for input row when not in view-only mode

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

  const handleDrop = async (e: React.DragEvent, dropIndex?: number) => {
    if (isViewOnly) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    setIsDragOver(false);
    setDragOverIndex(null);

    const todoId = e.dataTransfer.getData('todoId');
    const sourceDateStr = e.dataTransfer.getData('sourceDate');
    const targetDateStr = format(date, 'yyyy-MM-dd');

    // Find the dragged todo
    const draggedTodo = sortedTodos.find(t => t.id === todoId);

    // Check if this is a within-column reorder
    if (sourceDateStr === targetDateStr && dropIndex !== undefined && draggedTodo) {
      const currentIndex = sortedTodos.findIndex(t => t.id === todoId);
      if (currentIndex === dropIndex || currentIndex === -1) return; // No change needed

      // Calculate new order
      const newTodos = [...sortedTodos];
      const [removed] = newTodos.splice(currentIndex, 1);
      newTodos.splice(dropIndex, 0, removed);

      // Assign new positions (1, 2, 3...)
      const reorderItems: TodoReorderItem[] = newTodos.map((todo, idx) => ({
        id: todo.id,
        position: idx + 1
      }));

      // Optimistic update
      if (onTodosReordered) {
        onTodosReordered(reorderItems);
      }

      // API call
      try {
        await reorderTodos(reorderItems);
      } catch (error) {
        console.error('Failed to reorder todos:', error);
        // Rollback will be handled by parent component refetching data
      }
    } else {
      // Cross-column move (existing logic)
      try {
        const updatedTodo = await updateTodo(todoId, {
          due_date: targetDateStr
        });
        onTodoUpdated(updatedTodo);
      } catch (error) {
        console.error('Failed to update todo date:', error);
      }
    }
  };

  const handleTodoDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(index);
  };

  const handleTodoDrop = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    handleDrop(e, index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set isDragOver to false if we're leaving the column (not entering a child element)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  return (
    <div 
      className={`flex-1 border-r border-gray-100 bg-white flex flex-col overflow-hidden ${
        isDragOver ? 'bg-blue-50 shadow-inner' : ''
      }`}
      style={{ width: '14.28%', minWidth: '160px', flex: '0 0 auto' }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Header with date and arrows - sticky */}
      <div className="py-1 px-2 border-b border-gray-100 bg-white sticky top-0 z-10">
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
      <div className="flex flex-col overflow-hidden">
        {/* All todo items */}
        <div className="overflow-hidden">
          {sortedTodos.map((todo, index) => (
            <div
              key={todo.id}
              className={`h-[28px] relative ${dragOverIndex === index ? 'border-t-2 border-blue-500' : ''}`}
              onDragOver={(e) => handleTodoDragOver(e, index)}
              onDrop={(e) => handleTodoDrop(e, index)}
              onDragLeave={() => setDragOverIndex(null)}
            >
              <div className={`absolute bottom-0 ${isViewOnly ? 'left-0' : 'left-[24px]'} right-0 border-b border-gray-100`}></div>
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
            <div className="h-[28px] relative">
              <div className="absolute bottom-0 left-[24px] right-0 border-b border-gray-100"></div>
              <div className="h-full grid grid-cols-[24px_1fr] gap-2 items-center">
                <div className="flex justify-center items-center h-full">
                  {/* Empty space to align with checkbox column */}
                </div>
                <div className="flex items-center pr-2 overflow-hidden">
                  <input
                    type="text"
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onBlur={handleBlur}
                    placeholder="Add new todo..."
                    className="w-full outline-none bg-transparent text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Empty lines to fill remaining space - styled like note paper with visible lines */}
          {Array.from({ length: emptyLines }).map((_, index) => (
            <div 
              key={`empty-${index}`} 
              className="h-[28px] relative"
            >
              <div className={`absolute bottom-0 ${isViewOnly ? 'left-0' : 'left-[24px]'} right-0 border-b border-gray-100`}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 