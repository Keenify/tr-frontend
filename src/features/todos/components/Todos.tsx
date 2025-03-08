import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { TodoData } from '../types/todo';
import { getEmployeeTodos } from '../services/useTodos';
import { DayColumn } from './DayColumn';
import { addDays, startOfToday, format, subDays } from 'date-fns';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { directoryService } from '../../../shared/services/directoryService';
import { Employee } from '../../../shared/types/directory.types';
import { TodoSection } from './TodoSection';

// Protected email constants
const PROTECTED_EMAIL = 'czy199162@gmail.com';
const REQUIRED_PASSWORD = 'Qweewq4414';

interface TodosProps {
  session: Session;
}

/**
 * Main Todo list component that displays a 7-day view of todos
 * This component:
 * - Fetches user and company data using useUserAndCompanyData hook
 * - Loads todos for the current user
 * - Creates a 7-column layout (today + next 6 days)
 * - Manages the global todo state and passes update handlers to child components
 * - Displays both daily todos and section todos in separate panels
 * 
 * @component
 * @param {Session} session - The current user's session
 */
const Todos: React.FC<TodosProps> = ({ session }) => {
  const [todos, setTodos] = useState<TodoData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(startOfToday());
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const { userInfo, companyInfo, error: userDataError, isLoading: userDataLoading } = 
    useUserAndCompanyData(session.user.id);
    
  const isProtectedUser = session.user.email === PROTECTED_EMAIL;
  const isViewingProtectedUser = selectedEmployeeId ? 
    employees.find(emp => emp.id === selectedEmployeeId)?.email === PROTECTED_EMAIL : 
    isProtectedUser;

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

  const handlePrevDay = () => {
    setStartDate(prevDate => subDays(prevDate, 1));
  };

  const handleNextDay = () => {
    setStartDate(prevDate => addDays(prevDate, 1));
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setSelectedEmployeeId(selectedId === userInfo?.id ? null : selectedId);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === REQUIRED_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  // Check if authentication is needed (either viewing as or viewing the protected user)
  const needsAuthentication = isViewingProtectedUser && !isAuthenticated;

  if (userDataLoading || loading) {
    return <div>Loading...</div>;
  }

  if (userDataError || !userInfo || !companyInfo) {
    return <div>Error loading user data</div>;
  }

  // Password protection for viewing the protected user's todos
  if (needsAuthentication) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Authentication Required</h2>
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Create an array of 7 dates starting from startDate
  const dates = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  return (
    <div className="flex flex-col h-screen bg-white">
      {isManager() && (
        <div className="p-1 border-b border-gray-100 bg-white">
          <select
            title="Select Employee"
            value={selectedEmployeeId || userInfo?.id}
            onChange={handleEmployeeChange}
            className="w-48 p-0.5 text-xs border rounded"
          >
            <option value={userInfo?.id}>
              {isProtectedUser ? "My Todos (protected)" : "My Todos"}
            </option>
            {employees
              .filter(emp => emp.id !== userInfo?.id)
              .map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}'s Todos
                  {emp.email === PROTECTED_EMAIL ? " (protected)" : ""}
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Main container with single scrollbar */}
      <div className="flex flex-col flex-1 overflow-auto">
        {/* Daily Todos - Upper Half */}
        <div className="min-h-[50%] flex mb-6">
          {/* Left arrow */}
          <div className="flex items-start justify-center w-6 pt-1 sticky top-0">
            <button
              onClick={handlePrevDay}
              className="p-0.5 hover:bg-gray-100 rounded-full transition-colors"
              title="Previous day"
            >
              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Columns */}
          <div className="flex flex-1">
            {dates.map((date) => (
              <DayColumn
                key={date.toISOString()}
                date={date}
                todos={todos.filter(todo => 
                  todo.due_date === format(date, 'yyyy-MM-dd') && 
                  todo.section_id === null // Only show todos without a section
                )}
                employeeId={selectedEmployeeId || userInfo?.id || ''}
                companyId={companyInfo?.id || ''}
                onTodoCreated={handleTodoCreated}
                onTodoUpdated={handleTodoUpdated}
                onTodoDeleted={handleTodoDeleted}
                isViewOnly={selectedEmployeeId !== null}
              />
            ))}
          </div>

          {/* Right arrow */}
          <div className="flex items-start justify-center w-6 pt-1 sticky top-0">
            <button
              onClick={handleNextDay}
              className="p-0.5 hover:bg-gray-100 rounded-full transition-colors"
              title="Next day"
            >
              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Section Todos - Lower Half */}
        <div className="min-h-[50%]">
          <TodoSection 
            todos={todos.filter(todo => todo.section_id !== null)} // Only show todos with a section
            employeeId={selectedEmployeeId || userInfo?.id || ''}
            companyId={companyInfo?.id || ''}
            onTodoCreated={handleTodoCreated}
            onTodoUpdated={handleTodoUpdated}
            onTodoDeleted={handleTodoDeleted}
            isViewOnly={selectedEmployeeId !== null}
          />
        </div>
      </div>
    </div>
  );
};

export default Todos;
