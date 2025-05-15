import React, { useState, useEffect, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { useDirectory } from '../../../features/directory/hooks/useDirectory';
import { getCompanyScoreboards, updateScoreboard, createScoreboard } from '../services/useScoreboard';
import { ScoreboardData } from '../types/scoreboard';
import { Employee } from '../../../shared/types/directory.types';

interface ScoreboardManagerProps {
  session: Session;
}

interface EmployeeWithScore extends Employee {
  score: number;
  scoreboardId: string | null;
}

const ScoreboardManager: React.FC<ScoreboardManagerProps> = ({ session }) => {
  const userId = session?.user?.id;
  const { userInfo, companyInfo, error: userDataError, isLoading: userDataLoading } = useUserAndCompanyData(userId || '');
  const companyId = userInfo?.company_id || null;
  
  // Check if the user is a manager
  const isUserManager = useMemo(() => {
    if (!userInfo?.role) return false;
    const userRole = userInfo.role.toLowerCase();
    return userRole === 'manager' || userRole.includes('manager');
  }, [userInfo?.role]);
  
  // Redirect non-managers after checking
  useEffect(() => {
    if (userInfo && !userDataLoading && !isUserManager) {
      console.warn("Non-manager attempting to access ScoreboardManager");
    }
  }, [userInfo, userDataLoading, isUserManager]);
  
  const { 
    employees: directoryEmployees, 
    isLoading: employeesLoading, 
    error: employeesError,
    fetchEmployees 
  } = useDirectory(companyId || '');

  const [employees, setEmployees] = useState<EmployeeWithScore[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, boolean>>({});
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Fetch company scoreboards when employees are loaded
  useEffect(() => {
    const loadScoreboards = async () => {
      if (!companyId || directoryEmployees.length === 0) return;
      
      // Prevent excessive calls with cooldown
      const now = Date.now();
      if (now - lastFetchTime < 5000) {
        console.log("Skipping scoreboard fetch - cooldown period");
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        setLastFetchTime(now);
        
        // Fetch all scoreboards for the company
        const scoreboards = await getCompanyScoreboards(companyId);
        console.log("Loaded scoreboards:", scoreboards.length);
        
        // Create a map for quick lookup
        const scoreboardMap: Record<string, ScoreboardData> = {};
        scoreboards.forEach(sb => {
          scoreboardMap[sb.employee_id] = sb;
        });
        
        // Combine employee data with scoreboard data
        // Filter to only include currently employed employees
        const employeesWithScores = directoryEmployees
          .filter(emp => emp.Is_Employed) // Only include active employees
          .map(emp => {
            const scoreboard = scoreboardMap[emp.id];
            return {
              ...emp,
              score: scoreboard?.score || 0,
              scoreboardId: scoreboard?.id || null
            };
          });
        
        setEmployees(employeesWithScores);
        
        // Initialize edit values
        const initialEditValues: Record<string, number> = {};
        employeesWithScores.forEach(emp => {
          initialEditValues[emp.id] = emp.score;
        });
        setEditValues(initialEditValues);
        
      } catch (err) {
        console.error('Failed to load scoreboards:', err);
        setError(err instanceof Error ? err.message : 'Failed to load scoreboards');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadScoreboards();
  }, [companyId, directoryEmployees, lastFetchTime]);
  
  // Fetch employees when company ID is available
  useEffect(() => {
    if (companyId && !userDataLoading) {
      fetchEmployees();
    }
  }, [companyId, fetchEmployees, userDataLoading]);
  
  // Handle score input change
  const handleScoreChange = (employeeId: string, value: string) => {
    const score = parseInt(value, 10);
    if (!isNaN(score) && score >= 0) {
      setEditValues(prev => ({
        ...prev,
        [employeeId]: score
      }));
    }
  };
  
  // Update score for an employee
  const handleUpdateScore = async (employee: EmployeeWithScore) => {
    if (!companyId) return;
    
    // Skip if value hasn't changed
    if (editValues[employee.id] === employee.score) return;
    
    try {
      setPendingUpdates(prev => ({ ...prev, [employee.id]: true }));
      setError(null);
      
      const newScore = editValues[employee.id];
      
      if (employee.scoreboardId) {
        // Update existing scoreboard
        await updateScoreboard(
          employee.scoreboardId,
          companyId,
          { score: newScore }
        );
      } else {
        // Create new scoreboard
        await createScoreboard(
          { employee_id: employee.id, score: newScore },
          companyId
        );
      }
      
      // Update local state
      setEmployees(prev => 
        prev.map(emp => 
          emp.id === employee.id 
            ? { ...emp, score: newScore } 
            : emp
        )
      );
      
      setSuccessMessage(`Updated ${employee.first_name} ${employee.last_name}'s score to ${newScore} pop coins`);
      
      // Force a refresh to ensure consistency
      setLastFetchTime(Date.now() - 6000); // Ensure next fetch will happen
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      console.error('Failed to update score:', err);
      setError(err instanceof Error ? err.message : 'Failed to update score');
    } finally {
      setPendingUpdates(prev => ({ ...prev, [employee.id]: false }));
    }
  };
  
  // Filter employees based on search term
  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });
  
  // Calculate loading state
  const pageLoading = isLoading || userDataLoading || employeesLoading;
  const pageError = error || userDataError || employeesError;
  
  // If user is not a manager, show access denied
  if (!isUserManager && !userDataLoading) {
    return (
      <div className="w-full p-6 bg-red-50 border-l-4 border-red-500 rounded shadow">
        <p className="text-red-800">Access denied. Only managers can access this feature.</p>
      </div>
    );
  }
  
  if (pageLoading) {
    return (
      <div className="w-full p-6 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!companyId) {
    return (
      <div className="w-full p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded shadow">
        <p className="text-yellow-800">No company information available. Please ensure your account is associated with a company.</p>
      </div>
    );
  }
  
  if (pageError) {
    return (
      <div className="w-full p-6 bg-red-50 border-l-4 border-red-500 rounded shadow">
        <p className="text-red-800">
          {typeof pageError === 'string' ? pageError : pageError.message || 'An error occurred'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700">
        <h1 className="text-2xl font-bold text-white">Manage Employee Pop Coins</h1>
        <p className="text-blue-100">
          {companyInfo?.name || 'Company'} - Award pop coins to recognize employee achievements
        </p>
      </div>
      
      {successMessage && (
        <div className="m-6 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex justify-between items-center">
          <p>{successMessage}</p>
          <button 
            className="text-green-700"
            onClick={() => setSuccessMessage(null)}
            aria-label="Dismiss message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {error && (
        <div className="m-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center">
          <p>{error}</p>
          <button 
            className="text-red-700"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search employees"
            />
            {searchTerm && (
              <button
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Pop Coins</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Pop Coins</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No employees match your search criteria' : 'No employees found'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(employee => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={employee.profile_pic_url || `https://ui-avatars.com/api/?name=${employee.first_name}+${employee.last_name}&background=random`}
                            alt={`${employee.first_name} ${employee.last_name}`}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.first_name} {employee.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.role || 'Employee'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-semibold">{employee.score}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        className="w-20 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                        value={editValues[employee.id]}
                        onChange={(e) => handleScoreChange(employee.id, e.target.value)}
                        min="0"
                        aria-label={`Set pop coins for ${employee.first_name} ${employee.last_name}`}
                        title={`Set pop coins for ${employee.first_name} ${employee.last_name}`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className={`inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                          editValues[employee.id] === employee.score
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        }`}
                        onClick={() => handleUpdateScore(employee)}
                        disabled={editValues[employee.id] === employee.score || pendingUpdates[employee.id]}
                        aria-label={`Update ${employee.first_name}'s pop coins`}
                      >
                        {pendingUpdates[employee.id] ? (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <span>Update</span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScoreboardManager; 