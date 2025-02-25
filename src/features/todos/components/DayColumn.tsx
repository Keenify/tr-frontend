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
  onTodoDeleted
}) => {
  const [newTodoText, setNewTodoText] = useState('');

  const handleKeyPress = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTodoText.trim()) {
      try {
        const newTodo = await createTodo({
          title: newTodoText,
          description: '',
          due_date: format(date, 'yyyy-MM-dd'),
          color_code: '#7924C2', // Default color
          employee_id: employeeId,
          company_id: companyId
        });
        onTodoCreated(newTodo);
        setNewTodoText('');
      } catch (error) {
        console.error('Failed to create todo:', error);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
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
      className="flex-1 min-h-[500px] border-r border-gray-200 bg-white"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={handleDrop}
    >
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="text-lg font-semibold text-gray-700">
          {format(date, 'EEEE')}
        </div>
        <div className="text-sm text-gray-500">
          {format(date, 'dd MMM yyyy')}
        </div>
      </div>
      
      <div className="divide-y divide-gray-100">
        {todos.map((todo) => (
          <TodoItem 
            key={todo.id} 
            todo={todo} 
            onUpdate={onTodoUpdated}
            onDelete={onTodoDeleted}
          />
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-100">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add new todo..."
          className="w-full border-b border-gray-200 focus:border-blue-500 outline-none py-1 bg-transparent"
        />
      </div>
    </div>
  );
}; 