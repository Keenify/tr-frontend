import { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { useUserAndCompanyData } from '../../../../shared/hooks/useUserAndCompanyData';
import { directoryService } from '../../../../shared/services/directoryService';
import { getCompanyLeaveBalances } from '../services/useLeaves';
import { Employee } from '../../../../shared/types/directory.types';
import { LeaveBalance } from '../types/leaves';
import { Tab } from '@headlessui/react';
import LeavesRequest from './LeavesRequest';
import { LeaveBalanceTable } from './LeaveBalance';

interface LeavesProps {
    session: Session;
}

export function Leaves({ session }: LeavesProps) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaveBalances, setLeaveBalances] = useState<Record<string, LeaveBalance>>({});
    const { companyInfo } = useUserAndCompanyData(session.user.id);
    const [isManager, setIsManager] = useState(false);
    const [selectedTab, setSelectedTab] = useState(0);

    const fetchLeaveData = useCallback(async () => {
        if (!companyInfo?.id) {
            console.log('No company ID available:', companyInfo);
            return;
        }

        try {
            const employeeList = await directoryService.fetchEmployees(companyInfo.id);
            const currentUser = employeeList.find(emp => 
                emp.email?.toLowerCase() === session.user.email?.toLowerCase()
            );
            
            // Check if manager (role contains 'manager')
            const isUserManager = currentUser?.role?.toLowerCase().includes('manager') || false;
            setIsManager(isUserManager);

            // Filter employees if not a manager
            const filteredEmployees = isUserManager
                ? employeeList 
                : employeeList.filter(emp => emp.email?.toLowerCase() === session.user.email?.toLowerCase());
            setEmployees(filteredEmployees);

            const balances = await getCompanyLeaveBalances(companyInfo.id);
            const balanceMap = balances.reduce((acc, balance) => ({
                ...acc,
                [balance.employee_id]: balance
            }), {});
            setLeaveBalances(balanceMap);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }, [companyInfo, session.user.email]);

    useEffect(() => {
        if (companyInfo?.id) {
            fetchLeaveData();
        }
    }, [companyInfo?.id, fetchLeaveData]);

    const handleTabChange = (index: number) => {
        setSelectedTab(index);
        if (index === 0) {
            fetchLeaveData();
        }
    };

    const handleBalanceUpdate = (employeeId: string, balance: LeaveBalance) => {
        setLeaveBalances(prev => ({
            ...prev,
            [employeeId]: balance
        }));
    };

    if (!companyInfo?.id) {
        return <div>Loading company information...</div>;
    }

    return (
        <div className="min-h-screen p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Leaves Management</h1>
                {companyInfo?.name && (
                    <span className="text-lg text-gray-600">{companyInfo.name}</span>
                )}
            </div>

            <Tab.Group selectedIndex={selectedTab} onChange={handleTabChange}>
                <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
                    <Tab
                        className={({ selected }: { selected: boolean }) =>
                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                            ${selected 
                                ? 'bg-white text-blue-700 shadow'
                                : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
                            }`
                        }
                    >
                        Leave Balances
                    </Tab>
                    <Tab
                        className={({ selected }: { selected: boolean }) =>
                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                            ${selected 
                                ? 'bg-white text-blue-700 shadow'
                                : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
                            }`
                        }
                    >
                        Leave Requests
                    </Tab>
                </Tab.List>

                <Tab.Panels>
                    <Tab.Panel>
                        <LeaveBalanceTable
                            employees={employees}
                            leaveBalances={leaveBalances}
                            isManager={isManager}
                            userEmail={session.user.email}
                            onBalanceUpdate={handleBalanceUpdate}
                        />
                    </Tab.Panel>
                    <Tab.Panel>
                        <LeavesRequest 
                            session={session} 
                            isManager={isManager}
                            companyId={companyInfo?.id}
                        />
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
}

export default Leaves;
