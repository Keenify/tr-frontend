import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Employee } from '../../../../shared/types/directory.types';
import { LeaveBalance } from '../types/leaves';
import toast from 'react-hot-toast';
import { updateLeaveBalance, createLeaveBalance } from '../services/useLeaves';

interface LeaveBalanceProps {
  employees: Employee[];
  leaveBalances: Record<string, LeaveBalance>;
  isManager: boolean;
  userEmail?: string;
  onBalanceUpdate: (employeeId: string, balance: LeaveBalance) => void;
}

export function LeaveBalanceTable({ 
  employees, 
  leaveBalances, 
  isManager,
  userEmail,
  onBalanceUpdate 
}: LeaveBalanceProps) {
  const [editedBalances, setEditedBalances] = useState<Record<string, Partial<LeaveBalance>>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'annual_leave_balance', direction: 'desc' });

  const handleInputChange = (employeeId: string, field: keyof LeaveBalance, value: number) => {
    setEditedBalances(prev => {
      const newBalance = {
        ...(prev[employeeId] || {}),
        [field]: value
      };

      return {
        ...prev,
        [employeeId]: newBalance
      };
    });
  };

  const handleUpdateBalance = async (employeeId: string) => {
    if (!isManager || !editedBalances[employeeId]) return;

    try {
      let updatedBalance;
      const existingBalance = leaveBalances[employeeId];
      
      if (!existingBalance) {
        updatedBalance = await createLeaveBalance(employeeId, {
          annual_leave_balance: editedBalances[employeeId].annual_leave_balance ?? 0,
          sick_leave_balance: editedBalances[employeeId].sick_leave_balance ?? 0,
          timeoff_days_balance: editedBalances[employeeId].timeoff_days_balance ?? 0,
          timeoff_hours_balance: editedBalances[employeeId].timeoff_hours_balance ?? 0
        });
      } else {
        updatedBalance = await updateLeaveBalance(employeeId, editedBalances[employeeId]);
      }

      onBalanceUpdate(employeeId, updatedBalance);
      setEditedBalances(prev => {
        const newState = { ...prev };
        delete newState[employeeId];
        return newState;
      });
      toast.success('Leave balance updated successfully');
    } catch (error) {
      console.error('Error updating leave balance:', error);
      toast.error('Failed to update leave balance');
    }
  };

  const handleCreateBalance = async (employeeId: string) => {
    if (!isManager) return;
    try {
      const newBalance = await createLeaveBalance(employeeId, {
        annual_leave_balance: 0,
        sick_leave_balance: 0,
        timeoff_days_balance: 0,
        timeoff_hours_balance: 0
      });
      onBalanceUpdate(employeeId, newBalance);
      toast.success('Leave balance initialized successfully');
    } catch (error) {
      console.error('Error creating leave balance:', error);
      toast.error('Failed to initialize leave balance');
    }
  };

  const sortData = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedEmployees = () => {
    return [...employees].sort((a, b) => {
      if (sortConfig.key === 'name') {
        const nameA = `${a.first_name} ${a.last_name}`;
        const nameB = `${b.first_name} ${b.last_name}`;
        return sortConfig.direction === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }

      const balanceA = leaveBalances[a.id]?.[sortConfig.key as keyof LeaveBalance] ?? 0;
      const balanceB = leaveBalances[b.id]?.[sortConfig.key as keyof LeaveBalance] ?? 0;
      return sortConfig.direction === 'asc'
        ? Number(balanceA) - Number(balanceB)
        : Number(balanceB) - Number(balanceA);
    });
  };

  return (
    <div className="mt-6 max-w-4xl">
      <div className="overflow-hidden rounded-lg border border-gray-200 shadow">
        <table className="w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th 
                onClick={() => sortData('name')}
                className="w-40 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                rowSpan={2}
              >
                <div className="flex items-center justify-center gap-2">
                  Employee
                  {sortConfig?.key === 'name' ? (
                    sortConfig.direction === 'asc' ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )
                  ) : (
                    <ChevronUpDownIcon className="h-4 w-4" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => sortData('annual_leave_balance')}
                className="w-24 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                rowSpan={2}
              >
                <div className="flex items-center justify-center gap-2">
                  Annual Leave
                  {sortConfig?.key === 'annual_leave_balance' ? (
                    sortConfig.direction === 'asc' ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )
                  ) : (
                    <ChevronUpDownIcon className="h-4 w-4" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => sortData('sick_leave_balance')}
                className="w-24 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                rowSpan={2}
              >
                <div className="flex items-center justify-center gap-2">
                  Sick Leave
                  {sortConfig?.key === 'sick_leave_balance' ? (
                    sortConfig.direction === 'asc' ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )
                  ) : (
                    <ChevronUpDownIcon className="h-4 w-4" />
                  )}
                </div>
              </th>
              <th 
                colSpan={2}
                className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 bg-gray-100"
              >
                Time Off Balance
              </th>
              {isManager && (
                <th 
                  className="w-24 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  rowSpan={2}
                >
                  Actions
                </th>
              )}
            </tr>
            <tr className="bg-gray-50">
              <th 
                onClick={() => sortData('timeoff_days_balance')}
                className="w-24 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
              >
                <div className="flex items-center justify-center gap-2">
                  Days
                  {sortConfig?.key === 'timeoff_days_balance' ? (
                    sortConfig.direction === 'asc' ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )
                  ) : (
                    <ChevronUpDownIcon className="h-4 w-4" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => sortData('timeoff_hours_balance')}
                className="w-24 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
              >
                <div className="flex items-center justify-center gap-2">
                  Hours
                  {sortConfig?.key === 'timeoff_hours_balance' ? (
                    sortConfig.direction === 'asc' ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )
                  ) : (
                    <ChevronUpDownIcon className="h-4 w-4" />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {getSortedEmployees().map((employee) => {
              const leaveBalance = leaveBalances[employee.id];
              const editedBalance = editedBalances[employee.id];
              const hasChanges = !!editedBalance;
              const isCurrentUser = employee.email?.toLowerCase() === userEmail?.toLowerCase();

              return (
                <tr 
                  key={employee.id}
                  className={`hover:bg-gray-50 ${isCurrentUser ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
                >
                  <td className="px-4 py-2 whitespace-nowrap border-r border-gray-200">
                    <div className="text-sm font-medium text-gray-900 text-center">
                      {employee.first_name} {employee.last_name}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center border-r border-gray-200">
                    {isManager ? (
                      <input
                        title="Annual Leave Balance"
                        placeholder="Annual Leave Balance"
                        type="number"
                        onChange={(e) => handleInputChange(employee.id, 'annual_leave_balance', Number(e.target.value))}
                        className="w-16 text-center border rounded-md"
                        value={editedBalance?.annual_leave_balance ?? leaveBalance?.annual_leave_balance ?? 0}
                      />
                    ) : (
                      leaveBalance?.annual_leave_balance ?? 0
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center border-r border-gray-200">
                    {isManager ? (
                      <input
                        title="Sick Leave Balance"
                        placeholder="Sick Leave Balance"
                        type="number"
                        onChange={(e) => handleInputChange(employee.id, 'sick_leave_balance', Number(e.target.value))}
                        className="w-16 text-center border rounded-md"
                        value={editedBalance?.sick_leave_balance ?? leaveBalance?.sick_leave_balance ?? 0}
                      />
                    ) : (
                      leaveBalance?.sick_leave_balance ?? 0
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center border-r border-gray-200">
                    {isManager ? (
                      <input
                        title="Time Off (Days)"
                        placeholder="Time Off (Days)"
                        type="number"
                        onChange={(e) => handleInputChange(employee.id, 'timeoff_days_balance', Number(e.target.value))}
                        className="w-16 text-center border rounded-md"
                        value={editedBalance?.timeoff_days_balance ?? leaveBalance?.timeoff_days_balance ?? 0}
                      />
                    ) : (
                      leaveBalance?.timeoff_days_balance ?? 0
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center border-r border-gray-200">
                    {isManager ? (
                      <input
                        title="Time Off (Hours)"
                        placeholder="Time Off (Hours)"
                        type="number"
                        step="0.25"
                        min="0"
                        onChange={(e) => handleInputChange(employee.id, 'timeoff_hours_balance', Number(e.target.value))}
                        className="w-16 text-center border rounded-md"
                        value={editedBalance?.timeoff_hours_balance ?? leaveBalance?.timeoff_hours_balance ?? 0}
                      />
                    ) : (
                      leaveBalance?.timeoff_hours_balance ?? 0
                    )}
                  </td>
                  {isManager && (
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-center w-24 border-r border-gray-200">
                      {hasChanges ? (
                        <button
                          onClick={() => handleUpdateBalance(employee.id)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          Save
                        </button>
                      ) : !leaveBalance ? (
                        <button
                          onClick={() => handleCreateBalance(employee.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Initialize
                        </button>
                      ) : null}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 