import { useState, useEffect } from 'react';
import { Employee } from '../../types/directory.types';
import { directoryService } from '../../services/directoryService';
import { AddTeammateModal } from '../modals/AddTeammateModal';
import '../../styles/OrgChartConfigPanel.css';

interface OrgChartConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onUpdate: () => void;
}

export const OrgChartConfigPanel = ({ isOpen, onClose, companyId, onUpdate }: OrgChartConfigPanelProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [highestRanking, setHighestRanking] = useState<string>('');
  const [reportingStructure, setReportingStructure] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await directoryService.fetchEmployees(companyId);
        setEmployees(data);

        // Find the highest-ranking employee
        const highestRankEmployee = data.find(emp => emp.highest_rank === true);
        if (highestRankEmployee) {
          setHighestRanking(highestRankEmployee.id);
        }

        // Set initial reporting structure
        const initialStructure = data.reduce((acc, emp) => {
          if (emp.reports_to) {
            acc[emp.id] = emp.reports_to;
          }
          return acc;
        }, {} as Record<string, string>);
        setReportingStructure(initialStructure);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      }
    };

    if (isOpen) {
      fetchEmployees();
    }
  }, [companyId, isOpen]);

  const handleReportingChange = async (employeeId: string, managerId: string) => {
    try {
      await directoryService.updateEmployee(employeeId, { reports_to: managerId });
      setReportingStructure(prev => ({
        ...prev,
        [employeeId]: managerId
      }));
      onUpdate();
    } catch (error) {
      console.error('Failed to update reporting structure:', error);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-30 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } backdrop`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } panel`}
      >
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex justify-start mb-4">
              <button
                onClick={onClose}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <span className="mr-2">≡</span>
                Close panel
              </button>
            </div>

            <h2 className="text-xl font-bold mb-2">Configure Org chart</h2>
            <p className="text-gray-600 mb-4">
              Use the fields below to structure the reporting hierarchy of your organization
            </p>

            <div className="mb-6">
              <button
                className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                onClick={() => setIsModalOpen(true)}
              >
                Add teammate
              </button>
            </div>

            {/* Highest Ranking Executive */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">★</span>
                <h3 className="font-semibold">Select the highest ranking executive (required)</h3>
              </div>
              <p className="text-gray-600 mb-2">
                This is often the CEO or President of the organization
              </p>
              <select
                title="Select the highest ranking executive"
                value={highestRanking}
                onChange={(e) => setHighestRanking(e.target.value)}
                className={`w-full p-2 border rounded-md ${highestRanking ? 'bg-gray-200 text-gray-500' : ''}`}
                disabled={!!highestRanking}
                style={{ appearance: highestRanking ? 'none' : 'auto' }}
              >
                <option value="">Select...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reporting Structure */}
            {employees
              .filter(emp => emp.id !== highestRanking)
              .map(employee => (
                <div key={employee.id} className="mb-6">
                  <h3 className="font-medium mb-2">
                    {employee.first_name} {employee.last_name}
                  </h3>
                  <div className="text-sm text-gray-500 mb-1">Reports to</div>
                  <select
                    title="Select the manager for this employee"
                    value={reportingStructure[employee.id] || ''}
                    onChange={(e) => handleReportingChange(employee.id, e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select...</option>
                    {employees
                      .filter(emp => emp.id !== employee.id)
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name}
                        </option>
                      ))}
                  </select>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Add Teammate Modal */}
      <AddTeammateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          onUpdate();
        }}
        companyId={companyId}
      />
    </>
  );
}; 