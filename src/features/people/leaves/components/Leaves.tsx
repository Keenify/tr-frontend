import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useUserAndCompanyData } from '../../../../shared/hooks/useUserAndCompanyData';
import { directoryService } from '../../../../shared/services/directoryService';
import { getCompanyLeaveBalances, updateLeaveBalance, createLeaveBalance } from '../services/useLeaves';
import { Employee } from '../../../../shared/types/directory.types';
import { LeaveBalance } from '../types/leaves';
import { getAllEmployees } from '../../../../services/useUser';
import toast from 'react-hot-toast';
import { ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';

interface LeavesProps {
    session: Session;
}

export function Leaves({ session }: LeavesProps) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaveBalances, setLeaveBalances] = useState<Record<string, LeaveBalance>>({});
    const { companyInfo } = useUserAndCompanyData(session.user.id);
    const [isManager, setIsManager] = useState(false);
    const [editedBalances, setEditedBalances] = useState<Record<string, Partial<LeaveBalance>>>({});
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: 'asc' | 'desc';
    } | null>(null);

    useEffect(() => {
        async function checkManagerStatus() {
            if (!companyInfo?.id) return;
            try {
                const companyEmployees = await getAllEmployees(companyInfo.id);
                const currentUser = companyEmployees.find(emp => 
                    emp.email?.toLowerCase() === session.user.email?.toLowerCase()
                );
                setIsManager(currentUser?.role?.toLowerCase().includes('manager') || false);
            } catch (error) {
                console.error('Error checking manager status:', error);
            }
        }

        checkManagerStatus();
    }, [companyInfo?.id, session.user.email]);

    useEffect(() => {
        async function fetchData() {
            if (!companyInfo?.id) {
                console.log('No company ID available:', companyInfo);
                return;
            }

            try {
                const employeeList = await directoryService.fetchEmployees(companyInfo.id);
                setEmployees(employeeList);

                const balances = await getCompanyLeaveBalances(companyInfo.id);
                const balanceMap = balances.reduce((acc, balance) => ({
                    ...acc,
                    [balance.employee_id]: balance
                }), {});
                setLeaveBalances(balanceMap);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }

        fetchData();
    }, [companyInfo]);

    const handleInputChange = (employeeId: string, field: keyof LeaveBalance, value: number) => {
        setEditedBalances(prev => ({
            ...prev,
            [employeeId]: {
                ...(prev[employeeId] || {}),
                [field]: value
            }
        }));
    };

    const handleUpdateBalance = async (employeeId: string) => {
        if (!isManager || !editedBalances[employeeId]) return;
        try {
            const updatedBalance = await updateLeaveBalance(employeeId, editedBalances[employeeId]);
            setLeaveBalances(prev => ({
                ...prev,
                [employeeId]: updatedBalance
            }));
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
                timeoff_balance: 0
            });
            setLeaveBalances(prev => ({
                ...prev,
                [employeeId]: newBalance
            }));
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
        if (!sortConfig) return employees;

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

    if (!companyInfo?.id) {
        return <div>Loading company information...</div>;
    }

    return (
        <div className="min-h-full">
            <div className="py-4">
                <h1 className="text-2xl font-semibold text-gray-900">Leaves Management</h1>
                <p className="mt-2 text-sm text-gray-700">
                    Manage employee leaves and time off requests
                </p>
            </div>

            <div className="mt-6 max-w-4xl">
                <div className="overflow-hidden rounded-lg border border-gray-200 shadow">
                    <table className="w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50">
                                <th 
                                    onClick={() => sortData('name')}
                                    className="w-40 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
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
                                    onClick={() => sortData('timeoff_balance')}
                                    className="w-24 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Time Off
                                        {sortConfig?.key === 'timeoff_balance' ? (
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
                                {isManager && Object.keys(editedBalances).length > 0 && (
                                    <th className="w-20 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {getSortedEmployees().map((employee) => {
                                const leaveBalance = leaveBalances[employee.id];
                                const editedBalance = editedBalances[employee.id];
                                const hasChanges = !!editedBalance;

                                return (
                                    <tr 
                                        key={employee.id} 
                                        className={`hover:bg-gray-50 ${
                                            employee.email?.toLowerCase() === session.user.email?.toLowerCase()
                                                ? 'bg-blue-50 hover:bg-blue-100'
                                                : ''
                                        }`}
                                    >
                                        <td className="px-4 py-2 whitespace-nowrap border-r border-gray-200">
                                            <div className="text-sm font-medium text-gray-900 text-center">
                                                {employee.first_name} {employee.last_name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center border-r border-gray-200">
                                            <div className="flex justify-center">
                                                {isManager ? (
                                                    <input
                                                        title="Annual Leave Balance"
                                                        type="number"
                                                        value={editedBalance?.annual_leave_balance ?? leaveBalance?.annual_leave_balance ?? 0}
                                                        onChange={(e) => handleInputChange(employee.id, 'annual_leave_balance', parseInt(e.target.value))}
                                                        className="w-14 border rounded px-2 py-1 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                ) : (
                                                    <span>{leaveBalance?.annual_leave_balance ?? 'N/A'}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center border-r border-gray-200">
                                            <div className="flex justify-center">
                                                {isManager ? (
                                                    <input
                                                        title="Sick Leave Balance"
                                                        type="number"
                                                        value={editedBalance?.sick_leave_balance ?? leaveBalance?.sick_leave_balance ?? 0}
                                                        onChange={(e) => handleInputChange(employee.id, 'sick_leave_balance', parseInt(e.target.value))}
                                                        className="w-14 border rounded px-2 py-1 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                ) : (
                                                    <span>{leaveBalance?.sick_leave_balance ?? 'N/A'}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center border-r border-gray-200">
                                            <div className="flex justify-center">
                                                {isManager ? (
                                                    <input
                                                        title="Time Off Balance"
                                                        type="number"
                                                        value={editedBalance?.timeoff_balance ?? leaveBalance?.timeoff_balance ?? 0}
                                                        onChange={(e) => handleInputChange(employee.id, 'timeoff_balance', parseInt(e.target.value))}
                                                        className="w-14 border rounded px-2 py-1 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                ) : (
                                                    <span>{leaveBalance?.timeoff_balance ?? 'N/A'}</span>
                                                )}
                                            </div>
                                        </td>
                                        {isManager && Object.keys(editedBalances).length > 0 && (
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                                                {!leaveBalance ? (
                                                    <button
                                                        onClick={() => handleCreateBalance(employee.id)}
                                                        className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition-colors duration-150"
                                                    >
                                                        Initialize
                                                    </button>
                                                ) : hasChanges && (
                                                    <button
                                                        onClick={() => handleUpdateBalance(employee.id)}
                                                        className="bg-green-500 text-white px-3 py-1 rounded-md text-xs hover:bg-green-600 transition-colors duration-150"
                                                    >
                                                        Update
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Leaves;
