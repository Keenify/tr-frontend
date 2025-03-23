import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { FiAlertCircle, FiRefreshCw, FiInfo, FiLock } from 'react-icons/fi';
import { CoreValueData } from '../types/coreValue';
import { CoreScoreWithDetailsData } from '../types/coreScore';
import { getCompanyCoreValues } from '../services/useCoreValues';
import { 
  getEmployeeCoreScoresWithDetails, 
  createCoreScore, 
  updateCoreScore 
} from '../services/useCoreScores';
import { getAllEmployees, UserData } from '../../../services/useUser';

interface CoreScoreTableProps {
  session: Session;
  employeeId: string;
}

// Score descriptions for reference
const SCORE_DESCRIPTIONS = [
  { score: 0, label: 'None of the time', description: 'Employee does not demonstrate this value' },
  { score: 1, label: 'Some of the time', description: 'Employee occasionally demonstrates this value' },
  { score: 2, label: 'Most of the time', description: 'Employee frequently demonstrates this value' },
  { score: 3, label: 'All the time', description: 'Employee consistently exemplifies this value' },
];

const CoreScoreTable: React.FC<CoreScoreTableProps> = ({ session, employeeId }) => {
  const [coreValues, setCoreValues] = useState<CoreValueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingScore, setEditingScore] = useState<{employeeId: string, coreValueId: string, scoreId: string | null} | null>(null);
  const [newScore, setNewScore] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showScoreGuide, setShowScoreGuide] = useState(false);
  const [isManager, setIsManager] = useState(false);
  
  // For manager view - all employees
  const [employees, setEmployees] = useState<UserData[]>([]);
  const [employeeScores, setEmployeeScores] = useState<Map<string, CoreScoreWithDetailsData[]>>(new Map());
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const { companyInfo, userInfo, isLoading: userDataLoading } = useUserAndCompanyData(session.user.id);

  // Fetch all employees and their scores - combined into a single useCallback
  const fetchCompanyEmployeesAndScores = useCallback(async (companyId: string) => {
    try {
      setLoadingEmployees(true);
      const employeeData = await getAllEmployees(companyId);
      console.log('Fetched employees:', employeeData);
      setEmployees(employeeData);
      
      // After fetching employees, fetch scores for each employee
      if (employeeData.length > 0) {
        try {
          const scoresMap = new Map<string, CoreScoreWithDetailsData[]>();
          
          // Create an array of promises to fetch all scores in parallel
          const fetchPromises = employeeData.map(async (employee) => {
            try {
              console.log(`Fetching scores for employee: ${employee.id}`);
              const employeeScores = await getEmployeeCoreScoresWithDetails(employee.id);
              scoresMap.set(employee.id, employeeScores);
              return employeeScores;
            } catch (err) {
              console.error(`Error fetching scores for employee ${employee.id}:`, err);
              scoresMap.set(employee.id, []);
              return [];
            }
          });
          
          // Wait for all fetches to complete
          await Promise.all(fetchPromises);
          
          setEmployeeScores(scoresMap);
        } catch (err) {
          console.error('Error fetching employee scores:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  }, []); // Empty dependency array as it doesn't use any props or state

  // Check if user is a manager
  useEffect(() => {
    if (userInfo) {
      // Check if user role contains 'manager'
      const hasManagerRole = userInfo.role ? 
        userInfo.role.toLowerCase().includes('manager') : false;
      
      console.log('User role check:', {
        role: userInfo.role,
        isManager: hasManagerRole
      });
      
      setIsManager(hasManagerRole);
      
      // If user is a manager, fetch all employees and their scores
      if (hasManagerRole && companyInfo?.id) {
        fetchCompanyEmployeesAndScores(companyInfo.id);
      }
    }
  }, [userInfo, companyInfo, fetchCompanyEmployeesAndScores]);

  // Check environment variables and employee ID on mount
  useEffect(() => {
    console.log('Environment and ID check:');
    console.log('- VITE_BACKEND_API_DOMAIN =', import.meta.env.VITE_BACKEND_API_DOMAIN);
    console.log('- employeeId from props:', employeeId);
    console.log('- session.user.id:', session.user.id);
    
    // Check if userInfo has a different employee ID field
    if (userInfo) {
      console.log('- userInfo:', userInfo);
      console.log('- User ID fields available:');
      Object.keys(userInfo).forEach(key => {
        if (key.includes('id') || key.includes('Id')) {
          console.log(`  - ${key}: ${userInfo[key as keyof typeof userInfo]}`);
        }
      });
    }
  }, [session, employeeId, userInfo]);

  // Fetch core values when component mounts
  useEffect(() => {
    const fetchCoreValues = async () => {
      if (!companyInfo?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch core values
        const valuesData = await getCompanyCoreValues(companyInfo.id);
        setCoreValues(valuesData);
        console.log('Fetched core values:', valuesData);
        
        // If not a manager, fetch scores only for the current user
        if (!isManager) {
          const scoresData = await getEmployeeCoreScoresWithDetails(employeeId);
          const newScoresMap = new Map<string, CoreScoreWithDetailsData[]>();
          newScoresMap.set(employeeId, scoresData);
          setEmployeeScores(newScoresMap);
        }
      } catch (err) {
        console.error('Error fetching core values:', err);
        setError('Failed to load core values');
      } finally {
        setLoading(false);
      }
    };

    if (!userDataLoading && companyInfo?.id) {
      fetchCoreValues();
    }
  }, [companyInfo?.id, userDataLoading, isManager, employeeId]);

  // Calculate total score for an employee
  const calculateTotalScore = (employeeId: string): number => {
    const scores = employeeScores.get(employeeId) || [];
    return scores.reduce((total, score) => total + score.score, 0);
  };

  // Get score for a specific core value and employee
  const getScoreForCoreValue = (employeeId: string, coreValueId: string): { scoreId: string; score: number } | null => {
    const scores = employeeScores.get(employeeId) || [];
    const scoreData = scores.find(score => score.core_value_id === coreValueId);
    if (scoreData) {
      return { scoreId: scoreData.id, score: scoreData.score };
    }
    return null;
  };

  // Handle updating a core score
  const handleUpdateScore = async (employeeId: string, scoreId: string) => {
    // Only allow managers to update scores
    if (!isManager) {
      setError('Only managers can update scores');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const payload = { score: newScore };
      console.log('Updating score with payload:', payload);
      console.log('Score ID:', scoreId);
      
      const updatedScore = await updateCoreScore(scoreId, payload);
      console.log('Update score response:', updatedScore);
      
      // Update the scores in our state
      setEmployeeScores(prevScores => {
        const newScores = new Map(prevScores);
        const employeeScores = newScores.get(employeeId) || [];
        
        const updatedEmployeeScores = employeeScores.map(score => 
          score.id === scoreId ? { ...score, score: updatedScore.score } : score
        );
        
        newScores.set(employeeId, updatedEmployeeScores);
        return newScores;
      });
      
      setEditingScore(null);
    } catch (err) {
      console.error('Error updating core score:', err);
      setError('Failed to update score');
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a new core score
  const handleCreateScore = async (employeeId: string, coreValueId: string) => {
    // Only allow managers to create scores
    if (!isManager) {
      setError('Only managers can create scores');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Create payload making sure we're using the correct employee ID
      const payload = {
        score: newScore,
        employee_id: employeeId,
        core_value_id: coreValueId
      };
      
      console.log('Creating score with payload:', JSON.stringify(payload, null, 2));
      console.log('Employee ID being used:', employeeId);
      console.log('Core Value ID:', coreValueId);
      
      const createdScore = await createCoreScore(payload);
      console.log('Create score response:', createdScore);
      
      // Find the core value details for this new score
      const coreValue = coreValues.find(value => value.id === coreValueId);
      console.log('Core value found:', coreValue);
      
      if (coreValue) {
        const newScoreWithDetails: CoreScoreWithDetailsData = {
          ...createdScore,
          core_value: coreValue,
          core_value_name: coreValue.name
        };
        
        // Update the scores in our state
        setEmployeeScores(prevScores => {
          const newScores = new Map(prevScores);
          const employeeScores = newScores.get(employeeId) || [];
          newScores.set(employeeId, [...employeeScores, newScoreWithDetails]);
          return newScores;
        });
      }
      
      setEditingScore(null);
    } catch (err) {
      console.error('Error creating core score:', err);
      console.error('Error details:', err instanceof Error ? err.message : String(err));
      setError(`Failed to create score: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Start editing a score
  const handleStartEdit = (employeeId: string, coreValueId: string, scoreId: string | null, currentScore: number) => {
    // Only allow managers to edit scores
    if (!isManager) {
      setError('You do not have permission to edit scores. Only managers can update scores.');
      return;
    }
    
    setEditingScore({ employeeId, coreValueId, scoreId });
    setNewScore(currentScore);
    console.log('Started editing score:', { employeeId, coreValueId, scoreId }, 'Current score:', currentScore);
  };

  // Handle score selection
  const handleScoreSelection = (score: number) => {
    setNewScore(score);
    console.log('Selected score:', score);
  };

  // Render numeric buttons for score selection (0-3)
  const renderScoreButtons = (selectedScore: number, onSelect: (score: number) => void) => {
    return SCORE_DESCRIPTIONS.map((option) => (
      <button
        key={option.score}
        type="button"
        onClick={() => onSelect(option.score)}
        className={`score-button ${option.score === selectedScore ? 'selected' : ''}`}
        aria-label={`Rate ${option.score}`}
        title={option.label}
      >
        <span className={`h-8 w-8 flex items-center justify-center rounded-full ${option.score === selectedScore ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          {option.score}
        </span>
      </button>
    ));
  };
  
  // Render score display
  const renderScoreDisplay = (score: number) => {
    const scoreInfo = SCORE_DESCRIPTIONS.find(d => d.score === score);
    if (!scoreInfo) return null;
    
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-600';
    
    if (score === 3) {
      bgColor = 'bg-green-100';
      textColor = 'text-green-700';
    } else if (score === 2) {
      bgColor = 'bg-blue-100'; 
      textColor = 'text-blue-700';
    } else if (score === 1) {
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-700';
    } else if (score === 0) {
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-500';
    }
    
    return (
      <div className={`inline-flex items-center justify-center rounded-full ${bgColor} ${textColor} w-8 h-8 font-medium`}>
        {score}
      </div>
    );
  };

  // Refresh data
  const handleRefresh = async () => {
    if (!companyInfo?.id) return;
    
    try {
      setRefreshing(true);
      setError(null);
      
      // Fetch core values
      const valuesData = await getCompanyCoreValues(companyInfo.id);
      setCoreValues(valuesData);
      
      if (isManager && employees.length > 0) {
        // For managers, refresh scores for all employees
        await fetchCompanyEmployeesAndScores(companyInfo.id);
      } else {
        // For non-managers, just refresh their own scores
        const scoresData = await getEmployeeCoreScoresWithDetails(employeeId);
        const newScoresMap = new Map<string, CoreScoreWithDetailsData[]>();
        newScoresMap.set(employeeId, scoresData);
        setEmployeeScores(newScoresMap);
      }
      
      console.log('Refreshed data - Core values:', valuesData);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Toggle score guide
  const toggleScoreGuide = () => {
    setShowScoreGuide(!showScoreGuide);
  };

  // Log component props and state for debugging
  useEffect(() => {
    console.log('CoreScoreTable state update:', { 
      coreValues: coreValues.length, 
      employees: employees.length,
      employeeScores: Array.from(employeeScores.entries()).map(([id, scores]) => ({ id, scoresCount: scores.length })),
      loading,
      error,
      editingScore,
      isManager
    });
  }, [coreValues, employees, employeeScores, loading, error, editingScore, isManager]);

  if (userDataLoading || loading || loadingEmployees) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-indigo-600 font-medium">Loading core scores...</p>
      </div>
    );
  }
  
  // Decide which employees to display
  const displayEmployees = isManager ? employees : (userInfo ? [userInfo] : []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            Employee Core Value Scores
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {isManager 
              ? "Rate employees on how well they embody your company's core values" 
              : "View how employees embody your company's core values"}
          </p>
        </div>
        <div className="flex space-x-3">
          {!isManager && (
            <div className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500">
              <FiLock className="mr-2 h-4 w-4" />
              View-only mode
            </div>
          )}
          <button 
            onClick={toggleScoreGuide} 
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiInfo className="mr-2 h-4 w-4 text-indigo-500" />
            Scoring Guide
          </button>
          <button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${refreshing ? 'opacity-50' : ''}`}
          >
            <FiRefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Scoring Guide Table */}
      {showScoreGuide && (
        <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
          <h4 className="text-sm font-medium text-indigo-800 mb-3">Core Value Scoring Reference</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-indigo-200 border border-indigo-200 rounded-lg bg-white">
              <thead className="bg-indigo-50">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">#</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Team member demonstrates this value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-indigo-100">
                {SCORE_DESCRIPTIONS.map((scoreDesc) => (
                  <tr key={scoreDesc.score} className="hover:bg-indigo-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-indigo-600">{scoreDesc.score}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{scoreDesc.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 px-6 py-4 my-4 mx-6 rounded-lg border-l-4 border-red-400">
          <div className="flex items-center">
            <FiAlertCircle className="h-5 w-5 text-red-500" />
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">
                Employee
              </th>
              {coreValues.map(value => (
                <th key={value.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-100">
                  <div className="max-w-[120px] mx-auto truncate" title={value.name}>
                    {value.name}
                  </div>
                  <div className="text-xxs normal-case text-gray-400 mt-1 max-w-[120px] mx-auto truncate hidden" title={value.description}>
                    {value.description}
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-100 bg-indigo-50 w-24">
                Total Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayEmployees.map(employee => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {employee?.profile_pic_url ? (
                        <img 
                          className="h-10 w-10 rounded-full object-cover" 
                          src={employee.profile_pic_url} 
                          alt="Employee" 
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-medium text-sm">
                          {employee?.first_name?.charAt(0) || 'E'}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {employee.first_name} {employee.last_name}
                        {employee.id === employeeId && (
                          <span className="ml-2 text-xs text-indigo-500">(You)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{employee.email || ''}</div>
                    </div>
                  </div>
                </td>
                
                {coreValues.map(value => {
                  const scoreData = getScoreForCoreValue(employee.id, value.id);
                  const isEditing = editingScore?.employeeId === employee.id && 
                                    editingScore?.coreValueId === value.id && 
                                    editingScore?.scoreId === (scoreData?.scoreId || 'new-' + value.id);
                  
                  return (
                    <td key={value.id} className="px-4 py-4 text-center border-l border-gray-100">
                      {isEditing ? (
                        <div className="flex flex-col items-center">
                          <div className="flex space-x-2 mb-2">
                            {renderScoreButtons(newScore, handleScoreSelection)}
                          </div>
                          <div className="flex space-x-2 mt-3">
                            <button 
                              className="px-2 py-1 text-xs bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
                              onClick={() => {
                                console.log('Save button clicked');
                                console.log('Score data:', scoreData);
                                console.log('Core value ID:', value.id);
                                if (scoreData) {
                                  handleUpdateScore(employee.id, scoreData.scoreId);
                                } else {
                                  handleCreateScore(employee.id, value.id);
                                }
                              }}
                            >
                              Save
                            </button>
                            <button 
                              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                              onClick={() => setEditingScore(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={`flex justify-center ${isManager ? 'cursor-pointer' : 'cursor-default'}`} 
                          onClick={() => {
                            if (isManager) {
                              handleStartEdit(
                                employee.id,
                                value.id,
                                scoreData?.scoreId || 'new-' + value.id, 
                                scoreData?.score || 0
                              );
                            }
                          }}
                        >
                          {scoreData ? renderScoreDisplay(scoreData.score) : (
                            <div className="text-sm text-gray-400 italic">
                              {isManager ? "Not rated" : "No rating"}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
                
                <td className="px-6 py-4 text-center font-medium text-lg border-l border-gray-100 bg-indigo-50">
                  {calculateTotalScore(employee.id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <FiInfo className="h-4 w-4 text-indigo-500" />
          {isManager ? (
            <span>Click on a score to edit. Scores range from 0 (None of the time) to 3 (All the time).</span>
          ) : (
            <span>Scores range from 0 (None of the time) to 3 (All the time). Only managers can edit scores.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoreScoreTable;

// Add custom styles
const styles = `
  .score-button {
    transition: all 0.2s;
  }
  
  .score-button:hover {
    transform: scale(1.1);
  }
  
  .text-xxs {
    font-size: 0.65rem;
  }
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
