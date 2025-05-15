import { Session } from "@supabase/supabase-js";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useUserAndCompanyData } from "../../../shared/hooks/useUserAndCompanyData";
import { useDirectory } from "../../../features/directory/hooks/useDirectory";
import { Employee } from "../../../shared/types/directory.types";
import { getCompanyScoreboards, updateScoreboard, createScoreboard } from "../services/useScoreboard";
import { ScoreboardData } from "../types/scoreboard";
import ScoreboardManagerModal from "./ScoreboardManagerModal";

interface LeaderboardProps {
  session: Session;
  isManager?: boolean;
}

interface EmployeeScore extends Employee {
  score: number;
  scoreboardId: string | null;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ session, isManager: propIsManager = false }) => {
  const userId = session?.user?.id;
  const { userInfo, companyInfo, error: userDataError, isLoading: userDataLoading } = useUserAndCompanyData(userId || '');
  
  // Detect if the user is a manager based on their role - check if the role contains "manager"
  const isUserManager = useMemo(() => {
    if (propIsManager) return true; // If explicitly provided as true via props, use that
    if (!userInfo?.role) return false;
    
    const userRole = userInfo.role.toLowerCase();
    return userRole === 'manager' || userRole.includes('manager');
  }, [propIsManager, userInfo?.role]);
  
  // State for ScoreboardManager modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Only proceed with a valid company ID - don't default to empty string
  const companyId = userInfo?.company_id || null;
  
  useEffect(() => {
    if (userInfo && !userDataLoading) {
      console.log("User info loaded:", userInfo);
      console.log("Company ID:", userInfo.company_id || "Not available");
      console.log("Is manager:", isUserManager);
    }
  }, [userInfo, userDataLoading, isUserManager]);
  
  const { 
    employees: directoryEmployees, 
    isLoading: employeesLoading, 
    error: employeesError,
    fetchEmployees
  } = useDirectory(companyId || '');

  const [employeesWithScores, setEmployeesWithScores] = useState<EmployeeScore[]>([]);
  const [isUpdating, setIsUpdating] = useState<{[key: string]: boolean}>({});
  const [editMode, setEditMode] = useState<{[key: string]: boolean}>({});
  const [editValues, setEditValues] = useState<{[key: string]: number}>({});
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  // Fetch scoreboards when company ID is available, but avoid excessive API calls
  const fetchScoreboards = useCallback(async (force = false) => {
    if (!companyId) return;
    
    // Prevent excessive calls by implementing a cooldown period
    const now = Date.now();
    if (!force && now - lastFetchTime < 5000) {
      console.log("Skipping fetch, last fetch was less than 5 seconds ago");
      return;
    }
    
    try {
      console.log("Fetching scoreboards for company:", companyId);
      setLastFetchTime(now);
      
      const scoreboards = await getCompanyScoreboards(companyId);
      console.log("Scoreboards data:", scoreboards);
      
      // Create a map of employee_id to scoreboard
      const scoreboardMap = scoreboards.reduce<Record<string, ScoreboardData>>((acc, sb) => {
        acc[sb.employee_id] = sb;
        return acc;
      }, {});
      
      // Merge employee data with scoreboards
      // Only include employees that are currently employed
      const withScores = directoryEmployees
        .filter(emp => emp.Is_Employed) // Only show active employees
        .map(emp => {
          const scoreboard = scoreboardMap[emp.id];
          return {
            ...emp,
            score: scoreboard?.score || 0,
            scoreboardId: scoreboard?.id || null
          };
        });
      
      // Sort by score (highest first)
      const sortedEmployees = withScores.sort((a, b) => b.score - a.score);
      setEmployeesWithScores(sortedEmployees);
      
      // Initialize edit values
      const newEditValues: {[key: string]: number} = {};
      sortedEmployees.forEach(emp => {
        newEditValues[emp.id] = emp.score;
      });
      setEditValues(newEditValues);
      
    } catch (error) {
      console.error("Error fetching scoreboards:", error);
    }
  }, [companyId, directoryEmployees, lastFetchTime]);
  
  // Initial data load - only run when directoryEmployees changes or when companyId becomes available
  useEffect(() => {
    if (directoryEmployees.length > 0 && companyId && !employeesLoading) {
      fetchScoreboards(true); // Force fetch on initial load
    }
  }, [directoryEmployees.length, companyId, employeesLoading]);
  
  // Manually trigger fetch when company ID becomes available
  useEffect(() => {
    if (companyId && !userDataLoading) {
      console.log("Fetching employees with company ID:", companyId);
      fetchEmployees();
    }
  }, [companyId, fetchEmployees, userDataLoading]);

  const handleEditClick = (employeeId: string) => {
    if (!isUserManager) return;
    
    setEditMode(prev => ({
      ...prev,
      [employeeId]: true
    }));
  };
  
  const handleCancelEdit = (employeeId: string) => {
    setEditMode(prev => ({
      ...prev,
      [employeeId]: false
    }));
    
    // Reset edit value to current score
    const employee = employeesWithScores.find(emp => emp.id === employeeId);
    if (employee) {
      setEditValues(prev => ({
        ...prev,
        [employeeId]: employee.score
      }));
    }
  };
  
  const handleScoreChange = (employeeId: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setEditValues(prev => ({
        ...prev,
        [employeeId]: numValue
      }));
    }
  };
  
  const handleUpdateScore = async (employee: EmployeeScore) => {
    if (!companyId) return;
    
    setIsUpdating(prev => ({
      ...prev,
      [employee.id]: true
    }));
    setUpdateError(null);
    
    try {
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
          {
            employee_id: employee.id,
            score: newScore
          },
          companyId
        );
      }
      
      // Update local state
      setEmployeesWithScores(prev => 
        prev.map(emp => 
          emp.id === employee.id ? { ...emp, score: newScore } : emp
        ).sort((a, b) => b.score - a.score) // Re-sort after update
      );
      
      // Exit edit mode
      setEditMode(prev => ({
        ...prev,
        [employee.id]: false
      }));
      
      // Force a refresh of the data to ensure consistency
      fetchScoreboards(true);
      
    } catch (error) {
      console.error("Error updating score:", error);
      setUpdateError(error instanceof Error ? error.message : "Failed to update score");
    } finally {
      setIsUpdating(prev => ({
        ...prev,
        [employee.id]: false
      }));
    }
  };

  // Open the ScoreboardManager modal
  const openScoreboardManager = () => {
    setIsModalOpen(true);
  };

  // Close the ScoreboardManager modal
  const closeScoreboardManager = () => {
    setIsModalOpen(false);
    // Refresh the leaderboard data when modal is closed
    fetchScoreboards(true);
  };

  const isLoading = userDataLoading || employeesLoading;
  const error = userDataError || employeesError;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 w-full">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading scoreboard data...</p>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded shadow-md">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              No company information available. Please ensure your user account is associated with a company.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-md">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {typeof error === 'string' ? error : error.message || "Failed to load scoreboard data"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (employeesWithScores.length === 0) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow-md">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              No employees found for leaderboard. Please add employees to see the leaderboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-2xl overflow-hidden">
      <div className="px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">
            Top Performers
          </h1>
          <div className="flex items-center space-x-4">
            <div className="bg-blue-400 bg-opacity-30 rounded-lg px-4 py-2">
              <span className="text-sm text-blue-100">{companyInfo?.name || 'Company'} Leaderboard</span>
            </div>
            
            {/* Manage Scores button - only visible for managers */}
            {isUserManager && (
              <button 
                onClick={openScoreboardManager}
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg shadow-md transition-colors duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Manage Pop Coins
              </button>
            )}
          </div>
        </div>
        
        {updateError && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{updateError}</span>
            <span 
              className="absolute top-0 bottom-0 right-0 px-4 py-3" 
              onClick={() => setUpdateError(null)}
            >
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {employeesWithScores.map((employee, index) => (
            <div 
              key={employee.id}
              className={`relative overflow-hidden rounded-xl transition-all duration-300 transform hover:scale-105 ${
                index === 0 ? 'bg-gradient-to-r from-yellow-300 to-yellow-500 shadow-yellow-400/30 shadow-lg' :
                index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 shadow-gray-400/30 shadow-lg' :
                index === 2 ? 'bg-gradient-to-r from-amber-700 to-amber-500 shadow-amber-400/30 shadow-lg' :
                'bg-white shadow-lg'
              }`}
            >
              <div className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center bg-white bg-opacity-90 text-xl font-bold shadow-md z-10">
                {index + 1}
              </div>
              
              <div className="p-6 flex items-center">
                <div className="relative">
                  <div className={`w-20 h-20 rounded-full border-4 ${
                    index === 0 ? 'border-yellow-200' :
                    index === 1 ? 'border-gray-200' :
                    index === 2 ? 'border-amber-200' : 'border-gray-100'
                  } overflow-hidden bg-white shadow-inner`}>
                    <img 
                      src={employee.profile_pic_url || `https://ui-avatars.com/api/?name=${employee.first_name}+${employee.last_name}&background=random`} 
                      alt={`${employee.first_name} ${employee.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                <div className="ml-6 flex-grow">
                  <h3 className={`text-lg font-bold ${index < 3 ? 'text-white' : 'text-gray-800'}`}>
                    {employee.first_name} {employee.last_name}
                  </h3>
                  <p className={`text-sm ${index < 3 ? 'text-white text-opacity-80' : 'text-gray-600'}`}>
                    {employee.role || 'Team Member'}
                  </p>
                  
                  <div className="mt-2 flex items-center">
                    {editMode[employee.id] ? (
                      <div className="flex items-center space-x-2">
                        <input 
                          type="number" 
                          className="w-20 px-2 py-1 border rounded text-gray-700"
                          value={editValues[employee.id]}
                          onChange={(e) => handleScoreChange(employee.id, e.target.value)}
                          min="0"
                          aria-label="Edit pop coins score"
                          title="Edit pop coins score"
                          placeholder="Score"
                        />
                        <button 
                          className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 disabled:opacity-50"
                          onClick={() => handleUpdateScore(employee)}
                          disabled={isUpdating[employee.id]}
                        >
                          {isUpdating[employee.id] ? 'Saving...' : 'Save'}
                        </button>
                        <button 
                          className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                          onClick={() => handleCancelEdit(employee.id)}
                          disabled={isUpdating[employee.id]}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className={`text-3xl font-extrabold ${
                          index === 0 ? 'text-white' :
                          index === 1 ? 'text-white' :
                          index === 2 ? 'text-white' : 'text-blue-600'
                        }`}>
                          {employee.score}
                        </div>
                        <div className={`ml-2 text-sm ${
                          index < 3 ? 'text-white text-opacity-80' : 'text-gray-500'
                        }`}>
                          pop coins
                        </div>
                        
                        {isUserManager && (
                          <button 
                            className={`ml-3 p-1 rounded-full ${
                              index < 3 ? 'bg-white bg-opacity-30 text-white' : 'bg-gray-200 text-gray-600'
                            } hover:bg-opacity-50`}
                            onClick={() => handleEditClick(employee.id)}
                            aria-label="Edit score"
                            title="Edit score"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {index < 3 && (
                <div className={`absolute -right-8 -top-8 w-24 h-24 rotate-45 ${
                  index === 0 ? 'bg-yellow-300' :
                  index === 1 ? 'bg-gray-300' : 'bg-amber-600'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* ScoreboardManager Modal */}
      <ScoreboardManagerModal 
        session={session}
        isOpen={isModalOpen}
        onClose={closeScoreboardManager}
      />
    </div>
  );
};

export default Leaderboard;
