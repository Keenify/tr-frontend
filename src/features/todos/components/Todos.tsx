import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { TodoData } from '../types/todo';
import { getEmployeeTodos } from '../services/useTodos';
import { DayColumn } from './DayColumn';
import { addDays, startOfToday, format } from 'date-fns';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';

interface TodosProps {
  session: Session;
}

/**
 * Main Todo list component that displays a 5-day view of todos
 * This component:
 * - Fetches user and company data using useUserAndCompanyData hook
 * - Loads todos for the current user
 * - Creates a 5-column layout (today + next 4 days)
 * - Manages the global todo state and passes update handlers to child components
 * 
 * @component
 * @param {Session} session - The current user's session
 */
const Todos: React.FC<TodosProps> = ({ session }) => {
  const [todos, setTodos] = useState<TodoData[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo, companyInfo, error: userDataError, isLoading: userDataLoading } = 
    useUserAndCompanyData(session.user.id);

  const loadTodos = useCallback(async () => {
    if (!userInfo) return;
    
    try {
      const fetchedTodos = await getEmployeeTodos(userInfo.id);
      setTodos(fetchedTodos);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  useEffect(() => {
    if (userInfo && !userDataLoading) {
      loadTodos();
    }
  }, [userInfo, userDataLoading, loadTodos]);

  const handleTodoCreated = (newTodo: TodoData) => {
    setTodos([...todos, newTodo]);
  };

  const handleTodoUpdated = (updatedTodo: TodoData) => {
    setTodos(todos.map(todo => 
      todo.id === updatedTodo.id ? updatedTodo : todo
    ));
  };

  const handleTodoDeleted = (todoId: string) => {
    setTodos(todos.filter(todo => todo.id !== todoId));
  };

  if (userDataLoading || loading) {
    return <div>Loading...</div>;
  }

  if (userDataError || !userInfo || !companyInfo) {
    return <div>Error loading user data</div>;
  }

  const today = startOfToday();
  const dates = Array.from({ length: 5 }, (_, i) => addDays(today, i));

  return (
    <div className="flex h-screen bg-white">
      {dates.map((date) => (
        <DayColumn
          key={date.toISOString()}
          date={date}
          todos={todos.filter(todo => {
            const todoDate = todo.due_date;
            const columnDate = format(date, 'yyyy-MM-dd');
            return todoDate === columnDate;
          })}
          employeeId={userInfo.id}
          companyId={companyInfo.id}
          onTodoCreated={handleTodoCreated}
          onTodoUpdated={handleTodoUpdated}
          onTodoDeleted={handleTodoDeleted}
        />
      ))}
    </div>
  );
};

export default Todos;
