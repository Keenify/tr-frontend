import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StaffRockData } from '../types/staffRocks';
import { TheRockData } from '../types/theRocks';
import { getCompanyStaffRocks, deleteStaffRock } from '../services/useStaffRocks';
import { getCompanyTheRocks as fetchAllCompanyRocks } from '../services/useTheRocks';
import { useDirectory } from '../../directory/hooks/useDirectory';
import toast from 'react-hot-toast';
import { ClipLoader } from 'react-spinners';
import StaffRocksModal from './StaffRocksModal';
import '../styles/StaffRocksTable.css';

interface StaffRocksTableProps {
  companyId: string;
  currentUserId?: string;
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
      />

      {(isLoading || isLoadingEmployees || isLoadingParentRocks) && !isModalOpen && 
        <div className="flex justify-center items-center p-10">
            <ClipLoader size={40} color={"#4f46e5"} /> 
            <span className="ml-3 text-gray-600">Loading data, please wait...</span>
        </div>
      }

      <div className="shadow-md overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-100">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[18%]">Rock Title</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[12%]">Employee</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[12%]">Manager</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[28%]">Description</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[15%]">Linked To</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[10%]">Status</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[5%]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staffRocks.map((rock) => {
              const employee = allCompanyEmployees.find(emp => emp.id === rock.employee_user_id);
              const manager = allCompanyEmployees.find(emp => emp.id === rock.manager_user_id);
              const parentRock = parentCompanyRocks.find(pr => pr.id === rock.the_rock_id);
              return (
                <tr key={rock.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800 break-words">{renderTextWithNewlines(rock.title)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{employee ? `${employee.first_name} ${employee.last_name}` : (rock.employee_user_id || 'N/A')}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{manager ? `${manager.first_name} ${manager.last_name}` : (rock.manager_user_id || 'N/A')}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-pre-wrap break-words">{renderTextWithNewlines(rock.rock_description)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-pre-wrap break-words">{parentRock ? renderTextWithNewlines(parentRock.title) : renderTextWithNewlines(rock.link_to_higher_level_priorities)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${rock.success_status === 'green' ? 'bg-green-100 text-green-800' : rock.success_status === 'orange' ? 'bg-yellow-100 text-yellow-800' : rock.success_status === 'red' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
                      {rock.success_status ? rock.success_status.charAt(0).toUpperCase() + rock.success_status.slice(1) : 'Not Set'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                    <button onClick={() => handleEdit(rock)} className="text-indigo-600 hover:text-indigo-800 transition-colors duration-150 mr-2">Edit</button>
                    <button onClick={() => handleDelete(rock.id)} className="text-red-500 hover:text-red-700 transition-colors duration-150">Delete</button>
                  </td>
                </tr>
              )}
            )}
             {staffRocks.length === 0 && !isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No staff rocks found{selectedEmployeeFilter !== 'all' ? ' for the selected employee' : ''}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffRocksTable; 