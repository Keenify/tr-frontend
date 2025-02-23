import { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { 
    getCompanyLeaveRequests, 
    createLeaveRequest, 
    updateLeaveRequest
} from '../services/useLeavesRequest';
import { LeaveRequest, LeaveType, LeaveStatus, CreateLeaveRequestPayload } from '../types/leaveRequest';
import toast from 'react-hot-toast';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useUserAndCompanyData } from '../../../../shared/hooks/useUserAndCompanyData';
import { directoryService } from '../../../../shared/services/directoryService';

interface LeavesRequestProps {
    session: Session;
    isManager: boolean;
    companyId?: string;
}

export function LeavesRequest({ session, isManager, companyId }: LeavesRequestProps) {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { userInfo } = useUserAndCompanyData(session.user.id);
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: 'asc' | 'desc';
    } | null>(null);
    const [employeeNames, setEmployeeNames] = useState<Record<string, string>>({});

    // Form state for new request
    const [newRequest, setNewRequest] = useState({
        leave_type: 'annual_leave' as LeaveType,
        start_date: '',
        end_date: '',
        request_reason: ''
    });

    const fetchLeaveRequests = useCallback(async () => {
        if (!companyId || !userInfo?.id) return;
        
        setIsLoading(true);
        try {
            const response = await getCompanyLeaveRequests(companyId);
            
            // Fetch employee names for all unique employee IDs
            const uniqueEmployeeIds = [...new Set(response.map(req => req.employee_id))];
            const namesPromises = uniqueEmployeeIds.map(async (empId) => {
                const employee = await directoryService.fetchEmployee(empId);
                return [empId, `${employee.first_name} ${employee.last_name}`];
            });
            
            const namesEntries = await Promise.all(namesPromises);
            setEmployeeNames(Object.fromEntries(namesEntries));
            setRequests(response);
        } catch (error) {
            console.error('Error fetching leave requests:', error);
            toast.error('Failed to fetch leave requests');
        } finally {
            setIsLoading(false);
        }
    }, [companyId, userInfo?.id]);

    useEffect(() => {
        if (companyId) {
            fetchLeaveRequests();
        }
    }, [companyId, fetchLeaveRequests]);

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInfo?.id) {
            toast.error('Employee ID not found');
            return;
        }
        try {
            const payload: CreateLeaveRequestPayload = {
                leave_type: newRequest.leave_type,
                start_date: new Date(newRequest.start_date).toISOString(),
                end_date: new Date(newRequest.end_date).toISOString(),
                request_reason: newRequest.request_reason
            };
            await createLeaveRequest(userInfo.id, payload);
            toast.success('Leave request submitted successfully');
            fetchLeaveRequests();
            setNewRequest({
                leave_type: 'annual_leave',
                start_date: '',
                end_date: '',
                request_reason: ''
            });
        } catch (error) {
            console.error('Error submitting leave request:', error);
            toast.error('Failed to submit leave request');
        }
    };

    const handleUpdateStatus = async (requestId: string, status: LeaveStatus) => {
        try {
            await updateLeaveRequest(requestId, { status });
            toast.success(`Leave request ${status} successfully`);
            fetchLeaveRequests();
        } catch (error) {
            console.error('Error updating leave request:', error);
            toast.error('Failed to update leave request');
        }
    };

    const sortData = (key: keyof LeaveRequest) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig?.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedRequests = () => {
        if (!sortConfig) return requests;

        const key = sortConfig.key as keyof LeaveRequest;
        return [...requests].sort((a, b) => {
            if (key === 'start_date' || key === 'end_date') {
                return sortConfig.direction === 'asc'
                    ? new Date(a[key]).getTime() - new Date(b[key]).getTime()
                    : new Date(b[key]).getTime() - new Date(a[key]).getTime();
            }
            return sortConfig.direction === 'asc'
                ? String(a[key]).localeCompare(String(b[key]))
                : String(b[key]).localeCompare(String(a[key]));
        });
    };

    const sortedRequests = getSortedRequests();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* New Leave Request Form */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium mb-4">Submit New Leave Request</h2>
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                            <select
                                title="Leave Type"
                                value={newRequest.leave_type}
                                onChange={(e) => setNewRequest(prev => ({ ...prev, leave_type: e.target.value as LeaveType }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            >
                                <option value="annual_leave">Annual Leave</option>
                                <option value="sick_leave">Sick Leave</option>
                                <option value="timeoff">Time Off</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Date</label>
                            <input
                                title="Start Date"
                                type="date"
                                value={newRequest.start_date}
                                onChange={(e) => setNewRequest(prev => ({ ...prev, start_date: e.target.value }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">End Date</label>
                            <input
                                title="End Date"
                                type="date"
                                value={newRequest.end_date}
                                onChange={(e) => setNewRequest(prev => ({ ...prev, end_date: e.target.value }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Reason</label>
                            <textarea
                                title="Reason"
                                value={newRequest.request_reason}
                                onChange={(e) => setNewRequest(prev => ({ ...prev, request_reason: e.target.value }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                rows={3}
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Submit Request
                        </button>
                    </div>
                </form>
            </div>

            {/* Leave Requests Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Employee Name
                            </th>
                            <th 
                                onClick={() => sortData('leave_type')}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            >
                                <div className="flex items-center">
                                    Type
                                    <ChevronUpDownIcon className="h-4 w-4 ml-1" />
                                </div>
                            </th>
                            <th 
                                onClick={() => sortData('start_date')}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            >
                                <div className="flex items-center">
                                    Start Date
                                    <ChevronUpDownIcon className="h-4 w-4 ml-1" />
                                </div>
                            </th>
                            <th 
                                onClick={() => sortData('end_date')}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            >
                                <div className="flex items-center">
                                    End Date
                                    <ChevronUpDownIcon className="h-4 w-4 ml-1" />
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Reason
                            </th>
                            <th 
                                onClick={() => sortData('status')}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            >
                                <div className="flex items-center">
                                    Status
                                    <ChevronUpDownIcon className="h-4 w-4 ml-1" />
                                </div>
                            </th>
                            {isManager && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedRequests.map((request) => (
                            <tr key={request.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {employeeNames[request.employee_id] || 'Loading...'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {request.leave_type.replace('_', ' ').toUpperCase()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(request.start_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(request.end_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {request.request_reason}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                        ${request.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                                        ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                        ${request.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                                        ${request.status === 'canceled' ? 'bg-gray-100 text-gray-800' : ''}
                                    `}>
                                        {request.status.toUpperCase()}
                                    </span>
                                </td>
                                {isManager && request.status === 'pending' && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => handleUpdateStatus(request.id, 'approved')}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(request.id, 'rejected')}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Reject
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default LeavesRequest; 