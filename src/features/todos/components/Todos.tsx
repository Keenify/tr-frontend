import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { TodoData, TodoReorderItem } from '../types/todo';
import { getEmployeeTodos } from '../services/useTodos';
import { DayColumn } from './DayColumn';
import { addDays, startOfToday, format, subDays, addWeeks, subWeeks, parseISO } from 'date-fns';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { directoryService } from '../../../shared/services/directoryService';
import { Employee } from '../../../shared/types/directory.types';
import { TodoSection } from './TodoSection';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaAngleLeft, FaAngleRight, FaAngleDoubleLeft, FaAngleDoubleRight, FaCalendarAlt } from 'react-icons/fa';
import TodoSearch from './TodoSearch';

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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const keyPressesRef = useRef<{key: string, time: number}[]>([]);
  
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

  const handleTodosReordered = (reorderedTodos: TodoReorderItem[]) => {
    // Update positions of todos in local state
    setTodos(prevTodos =>
      prevTodos.map(todo => {
        const reorderItem = reorderedTodos.find(item => item.id === todo.id);
        if (reorderItem) {
          return { ...todo, position: reorderItem.position };
        }
        return todo;
      })
    );
  };

  const handlePrevDay = () => {
    setStartDate(prevDate => subDays(prevDate, 1));
  };

  const handleNextDay = () => {
    setStartDate(prevDate => addDays(prevDate, 1));
  };

  const handlePrevWeek = () => {
    setStartDate(prevDate => subWeeks(prevDate, 1));
  };

  const handleNextWeek = () => {
    setStartDate(prevDate => addWeeks(prevDate, 1));
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setStartDate(date);
      setIsCalendarOpen(false);
    }
  };

  // Handle selecting a todo from search results
  const handleSelectSearchResult = (todo: TodoData) => {
    // Parse the due date and set it as the start date
    const dueDate = parseISO(todo.due_date);
    setStartDate(dueDate);
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

  // Handle click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Handle keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not in an input field
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const now = Date.now();
      
      // Add current keypress to the array
      if (e.key === 's' || e.key === 'S') {
        keyPressesRef.current.push({ key: 's', time: now });
        
        // Only keep the last 3 keypresses
        if (keyPressesRef.current.length > 3) {
          keyPressesRef.current.shift();
        }
        
        // Check if we have 3 's' keypresses within 500ms
        if (keyPressesRef.current.length === 3) {
          const firstPress = keyPressesRef.current[0].time;
          if (now - firstPress < 500) {
            setSearchTrigger(prev => !prev);
            keyPressesRef.current = [];
          }
        }
      } else {
        // Reset for any other key
        keyPressesRef.current = [];
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
    <div className="flex flex-col h-full bg-white">
      {isManager() && (
        <div className="p-1 bg-white sticky top-0 z-20">
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
              .filter(emp => emp.id !== userInfo?.id && emp.Is_Employed)
              .map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}'s Todos
                  {emp.email === PROTECTED_EMAIL ? " (protected)" : ""}
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Main container without any scrollbars - let DashboardLayout handle scrolling */}
      <div className="flex flex-col flex-1">
        {/* Daily Todos - Upper Half - Allow to grow as needed */}
        <div className="flex flex-col">
          {/* Navigation controls */}
          <div className="flex justify-between items-center p-2 border-b border-gray-100 bg-white sticky top-0 z-20">
            <div className="flex items-center space-x-2">
              <TodoSearch 
                todos={todos} 
                onSelectTodo={handleSelectSearchResult}
                triggerSearch={searchTrigger}
              />
              
              {/* Markdown formatting help tooltip */}
              <div className="relative group ml-2">
                <button
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Markdown formatting help"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-md shadow-lg p-3 text-xs z-50 transform scale-0 group-hover:scale-100 transition-transform origin-top-left">
                  <h4 className="font-bold mb-1">Markdown Formatting:</h4>
                  <ul className="space-y-1">
                    <li><code>**text**</code> → <strong>bold text</strong></li>
                    <li><code>__text__</code> → <em>italic text</em></li>
                  </ul>
                  <p className="mt-1 text-gray-500">Example: <code>__important__ **task**</code> → <em>important</em> <strong>task</strong></p>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="font-bold">Pro Tip:</p>
                    <p>Highlight text while editing to use the formatting toolbar!</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePrevWeek}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Previous week"
              >
                <FaAngleDoubleLeft className="text-gray-600" size={14} />
              </button>
              <button
                onClick={handlePrevDay}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Previous day"
              >
                <FaAngleLeft className="text-gray-600" size={14} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="Select date"
                >
                  <FaCalendarAlt className="text-gray-600" size={14} />
                </button>
                {isCalendarOpen && (
                  <div ref={calendarRef} className="absolute right-0 mt-1 z-30">
                    <DatePicker
                      selected={startDate}
                      onChange={handleDateChange}
                      inline
                      highlightDates={[new Date()]}
                      calendarClassName="shadow-lg"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={handleNextDay}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Next day"
              >
                <FaAngleRight className="text-gray-600" size={14} />
              </button>
              <button
                onClick={handleNextWeek}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Next week"
              >
                <FaAngleDoubleRight className="text-gray-600" size={14} />
              </button>
            </div>
          </div>

          {/* Columns */}
          <div className="flex flex-1 border-l border-r border-gray-100 overflow-x-auto">
            {(() => {
              // Calculate the maximum number of todos across all columns
              const todosPerDate = dates.map(date => 
                todos.filter(todo => 
                  todo.due_date === format(date, 'yyyy-MM-dd') && 
                  todo.section_id === null
                ).length
              );
              // Add 1 to ensure there's always at least one empty row with a noteline
              const maxTodos = Math.max(...todosPerDate) + 1;
              
              return dates.map((date) => (
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
                  onTodosReordered={handleTodosReordered}
                  isViewOnly={selectedEmployeeId !== null && selectedEmployeeId !== userInfo?.id}
                  maxTodosAcrossColumns={maxTodos}
                />
              ));
            })()}
          </div>
        </div>

        {/* Invisible spacer between sections */}
        <div className="h-4"></div>

        {/* Section todos */}
        <div className="flex-1 overflow-hidden">
          <TodoSection
            todos={todos.filter(todo => todo.section_id !== null)} // Only show todos with a section
            employeeId={selectedEmployeeId || userInfo?.id || ''}
            companyId={companyInfo?.id || ''}
            onTodoCreated={handleTodoCreated}
            onTodoUpdated={handleTodoUpdated}
            onTodoDeleted={handleTodoDeleted}
            onTodosReordered={handleTodosReordered}
            isViewOnly={selectedEmployeeId !== null && selectedEmployeeId !== userInfo?.id}
          />
        </div>
      </div>
    </div>
  );
};

export default Todos;
