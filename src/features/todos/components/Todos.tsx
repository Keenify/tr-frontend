import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { TodoData } from '../types/todo';
import { getEmployeeTodos } from '../services/useTodos';
import { DayColumn } from './DayColumn';
import { addDays, startOfToday, format } from 'date-fns';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { directoryService } from '../../../shared/services/directoryService';
import { Employee } from '../../../shared/types/directory.types';

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { userInfo, companyInfo, error: userDataError, isLoading: userDataLoading } = 
    useUserAndCompanyData(session.user.id);

  // Fetch all employees in the company
  const fetchEmployees = useCallback(async () => {
    if (!companyInfo?.id) return;
    try {
      const employeesData = await directoryService.fetchEmployees(companyInfo.id);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }, [companyInfo?.id]);

  // Check if current user is a manager
  const isManager = useCallback(() => {
    if (!userInfo || !employees.length) return false;
    const currentEmployee = employees.find(emp => emp.id === userInfo.id);
    const userRole = currentEmployee?.role?.toLowerCase() || '';
    return userRole === 'manager' || userRole.includes('manager');
  }, [userInfo, employees]);

  const loadTodos = useCallback(async () => {
    if (!userInfo || !companyInfo) return;
    
    try {
      const fetchedTodos = selectedEmployeeId 
        ? await getEmployeeTodos(selectedEmployeeId)
        : await getEmployeeTodos(userInfo.id);
      setTodos(fetchedTodos);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setLoading(false);
    }
  }, [userInfo, companyInfo, selectedEmployeeId]);

  useEffect(() => {
    if (userInfo && !userDataLoading) {
      loadTodos();
      fetchEmployees();
    }
  }, [userInfo, userDataLoading, loadTodos, fetchEmployees]);

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
    <div className="flex flex-col h-screen bg-white">
      {isManager() && (
        <div className="p-4 border-b border-gray-200">
          <select
            title="Select Employee"
            value={selectedEmployeeId || userInfo?.id}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-64 p-2 border rounded"
          >
            <option value={userInfo?.id}>My Todos</option>
            {employees
              .filter(emp => emp.id !== userInfo?.id)
              .map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}'s Todos
                </option>
              ))}
          </select>
        </div>
      )}
      <div className="flex flex-1">
        {dates.map((date) => (
          <DayColumn
            key={date.toISOString()}
            date={date}
            todos={todos.filter(todo => todo.due_date === format(date, 'yyyy-MM-dd'))}
            employeeId={userInfo?.id || ''}
            companyId={companyInfo?.id || ''}
            onTodoCreated={handleTodoCreated}
            onTodoUpdated={handleTodoUpdated}
            onTodoDeleted={handleTodoDeleted}
            isViewOnly={selectedEmployeeId !== null}
          />
        ))}
      </div>
    </div>
  );
};

export default Todos;
