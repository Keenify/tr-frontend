import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StaffRockData } from '../types/staffRocks';
import { TheRockData } from '../types/theRocks';
import { getCompanyStaffRocks, deleteStaffRock } from '../services/useStaffRocks';
import { getCompanyTheRocks as fetchAllCompanyRocks } from '../services/useTheRocks';
import { useDirectory } from '../../directory/hooks/useDirectory';
import toast from 'react-hot-toast';
import { ClipLoader } from 'react-spinners';
import { Edit2, Trash2, User } from 'react-feather';
import StaffRocksModal from './StaffRocksModal';
import '../styles/StaffRocksTable.css';

interface StaffRocksTableProps {
  companyId: string;
  currentUserId?: string;
}

// Group type to organize rocks by employee
interface GroupedRocks {
  employeeId: string;
  rocks: StaffRockData[];
}

const StaffRocksTable: React.FC<StaffRocksTableProps> = ({ companyId, currentUserId }) => {
  const [staffRocks, setStaffRocks] = useState<StaffRockData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingStaffRock, setEditingStaffRock] = useState<StaffRockData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { employees: allCompanyEmployees, isLoading: isLoadingEmployees, error: employeesError } = useDirectory(companyId);
  const [parentCompanyRocks, setParentCompanyRocks] = useState<TheRockData[]>([]);
  const [isLoadingParentRocks, setIsLoadingParentRocks] = useState(false);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('all');

  const employedEmployees = useMemo(() => {
    return allCompanyEmployees.filter(emp => emp.Is_Employed === true);
  }, [allCompanyEmployees]);

  // Group rocks by employee
  const groupedStaffRocks = useMemo(() => {
    const grouped: Record<string, GroupedRocks> = {};
    
    staffRocks.forEach(rock => {
      if (!rock.employee_user_id) return;
      
      if (!grouped[rock.employee_user_id]) {
        grouped[rock.employee_user_id] = {
          employeeId: rock.employee_user_id,
          rocks: []
        };
      }
      
      grouped[rock.employee_user_id].rocks.push(rock);
    });
    
    // Sort rocks by created_at within each group
    Object.values(grouped).forEach(group => {
      group.rocks.sort((a, b) => {
        // Sort by created_at in ascending order (oldest first)
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateA - dateB;
      });
    });
    
    return Object.values(grouped);
  }, [staffRocks]);

  const defaultManagerId = useMemo(() => {
    if (!currentUserId || !employedEmployees.length) return null;
    const currentUserDetails = employedEmployees.find(emp => emp.id === currentUserId);
    if (!currentUserDetails?.reports_to) return null;
    const manager = employedEmployees.find(emp => emp.id === currentUserDetails.reports_to);
    return manager ? manager.id : null;
  }, [currentUserId, employedEmployees]);

  const fetchStaffRocks = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    setError(null);
    try {
      const employeeIdToFilter = selectedEmployeeFilter === 'all' ? undefined : selectedEmployeeFilter;
      const data = await getCompanyStaffRocks(companyId, employeeIdToFilter);
      setStaffRocks(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch staff rocks';
      setError(errorMsg);
      toast.error(errorMsg);
    }
    setIsLoading(false);
  }, [companyId, selectedEmployeeFilter]);

  const fetchDropdownData = useCallback(async () => {
    if (!companyId) {
      return;
    }
    setIsLoadingParentRocks(true);
    try {
      const parentRockData = await fetchAllCompanyRocks(companyId);
      setParentCompanyRocks(parentRockData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load parent company rocks');
    }
    setIsLoadingParentRocks(false);
  }, [companyId]);

  useEffect(() => {
    fetchStaffRocks();
  }, [fetchStaffRocks]);

  useEffect(() => {
    if (isModalOpen && companyId) {
      fetchDropdownData();
    }
  }, [isModalOpen, companyId, fetchDropdownData]); 

  const handleEdit = (rock: StaffRockData) => {
    setEditingStaffRock({ ...rock }); 
    setIsModalOpen(true);
  };

  const handleDelete = async (staffRockId: string) => {
    if (window.confirm('Are you sure you want to delete this staff rock?')) {
      setIsLoading(true);
      try {
        await deleteStaffRock(staffRockId, companyId);
        toast.success('Staff Rock deleted successfully!');
        fetchStaffRocks();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete staff rock');
      }
      setIsLoading(false);
    }
  };
  
  const openModal = () => {
    setEditingStaffRock(null); 
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStaffRock(null);
  };
  
  const handleSaveSuccess = () => {
    fetchStaffRocks();
  };
  
  const renderTextWithNewlines = (text: string | null | undefined) => {
    if (text === null || text === undefined) return "N/A";
    return text.split('\n').map((line, index, arr) => (
      <React.Fragment key={index}>
        {line}
        {index < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const getStatusColor = (status: 'red' | 'orange' | 'green' | null) => {
    if (status === 'green') return 'bg-green-500';
    if (status === 'orange') return 'bg-yellow-500';
    if (status === 'red') return 'bg-red-500';
    return 'bg-gray-300';
  };

  if (error) return <p className="text-red-500 bg-red-50 p-3 rounded-md">Error: {error}</p>;
  if (employeesError && !isLoadingEmployees) return <p className="text-red-500 bg-red-50 p-3 rounded-md">Error loading employees: {employeesError}</p>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6 pb-2 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Staff Rocks</h2>
        <div className="flex items-center space-x-3">
            <div className="relative">
              <label htmlFor="employeeFilter" className="sr-only">Filter by employee</label>
              <select 
                  id="employeeFilter"
                  title="Filter by employee"
                  value={selectedEmployeeFilter} 
                  onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                  className="block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                  disabled={isLoadingEmployees}
              >
                  <option value="all">All Employees</option>
                  {employedEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{`${emp.first_name} ${emp.last_name}`}</option>
                  ))}
              </select>
            </div>
            <button onClick={openModal} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap shadow-sm">
              Add Staff Rock
            </button>
        </div>
      </div>

      <StaffRocksModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        companyId={companyId}
        editingStaffRock={editingStaffRock}
        parentCompanyRocks={parentCompanyRocks}
        employedEmployees={employedEmployees}
        isLoadingEmployees={isLoadingEmployees}
        isLoadingParentRocks={isLoadingParentRocks}
        defaultManagerId={defaultManagerId}
        currentUserId={currentUserId}
        onSaveSuccess={handleSaveSuccess}
        staffRocks={staffRocks}
      />

      {(isLoading || isLoadingEmployees || isLoadingParentRocks) && !isModalOpen && 
        <div className="flex justify-center items-center p-10">
            <ClipLoader size={40} color={"#4f46e5"} /> 
            <span className="ml-3 text-gray-600">Loading data, please wait...</span>
        </div>
      }

      {groupedStaffRocks.length > 0 && !isLoading && groupedStaffRocks.map((group) => {
        // Get the first rock to extract employee and manager info (all rocks in group have same employee)
        const firstRock = group.rocks[0];
        const employee = allCompanyEmployees.find(emp => emp.id === firstRock.employee_user_id);
        const manager = allCompanyEmployees.find(emp => emp.id === firstRock.manager_user_id);
        
        return (
          <div key={group.employeeId} className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
            {/* Information Panel */}
            <div className="bg-gray-50 p-4 border-b grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <h3 className="text-sm font-medium text-gray-500 mr-2">Individual:</h3>
                <div className="flex items-center">
                  {employee?.profile_pic_url ? (
                    <img 
                      src={employee.profile_pic_url} 
                      alt={`${employee.first_name} ${employee.last_name}`} 
                      className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2 text-gray-500">
                      <User size={16} />
                    </div>
                  )}
                  <p className="font-semibold text-gray-900">
                    {employee ? `${employee.first_name} ${employee.last_name}` : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <h3 className="text-sm font-medium text-gray-500 mr-2">Manager:</h3>
                <div className="flex items-center">
                  {manager?.profile_pic_url ? (
                    <img 
                      src={manager.profile_pic_url} 
                      alt={`${manager.first_name} ${manager.last_name}`} 
                      className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2 text-gray-500">
                      <User size={16} />
                    </div>
                  )}
                  <p className="font-semibold text-gray-900">
                    {manager ? `${manager.first_name} ${manager.last_name}` : 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Go To For:</h3>
                <p className="font-semibold text-gray-900">
                  {firstRock.go_to_for || 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[5%]">#</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[25%]">Rock</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[15%]">Linked To</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[20%]">Success Criteria</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[8%]">Status</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[16%]">Results Achieved</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[16%]">Manager Perspective</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {group.rocks.map((rock, index) => {
                    const parentRock = parentCompanyRocks.find(pr => pr.id === rock.the_rock_id);
                    
                    return (
                      <tr key={rock.id} className="group hover:bg-gray-50 transition-colors duration-150 relative">
                        <td className="px-4 py-3 text-sm font-medium text-gray-500 text-center">{index + 1}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-gray-800">{renderTextWithNewlines(rock.title)}</div>
                          <div className="text-gray-600 mt-1">{renderTextWithNewlines(rock.rock_description)}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {parentRock ? renderTextWithNewlines(parentRock.title) : renderTextWithNewlines(rock.link_to_higher_level_priorities)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {renderTextWithNewlines(rock.success_criteria)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <div className="flex items-center justify-center">
                            <div className={`w-6 h-6 rounded-full ${getStatusColor(rock.success_status)}`} 
                                title={rock.success_status ? rock.success_status.charAt(0).toUpperCase() + rock.success_status.slice(1) : 'Not Set'}>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {renderTextWithNewlines(rock.results_achieved)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {renderTextWithNewlines(rock.manager_perspective)}
                        </td>
                        <div className="rock-actions z-10">
                          <button 
                            onClick={() => handleEdit(rock)} 
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-full"
                            title="Edit Rock"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(rock.id)} 
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                            title="Delete Rock"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {staffRocks.length === 0 && !isLoading && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
          No staff rocks found{selectedEmployeeFilter !== 'all' ? ' for the selected employee' : ''}.
        </div>
      )}
    </div>
  );
};

export default StaffRocksTable; 