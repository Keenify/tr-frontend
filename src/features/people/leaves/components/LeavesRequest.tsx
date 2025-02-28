import { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { 
    getCompanyLeaveRequests, 
    createLeaveRequest, 
    updateLeaveRequest
} from '../services/useLeavesRequest';
import { 
    LeaveRequest, 
    LeaveType, 
    LeaveStatus, 
    CreateLeaveRequestPayload, 
    HalfDayType,
    TimeoffType 
} from '../types/leaveRequest';
import toast from 'react-hot-toast';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useUserAndCompanyData } from '../../../../shared/hooks/useUserAndCompanyData';
import { directoryService } from '../../../../shared/services/directoryService';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { uploadLeaveAttachment, getLeaveAttachmentUrl } from '../services/useLeaveAttachments';

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

    // Updated and new form state
    const [newRequest, setNewRequest] = useState({
        leave_type: '' as LeaveType,
        start_date: '',
        end_date: '',
        request_reason: '',
        half_day: null as HalfDayType,
        timeoff_type: 'days' as TimeoffType,
        timeoff_value: 0,
        attachment_filepath: '',
    });

    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [startDate, endDate] = dateRange;
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Helper function to check if it's a single day request
    const isSingleDayRequest = useCallback(() => {
        if (!startDate || !endDate) return false;
        return startDate.toDateString() === endDate.toDateString();
    }, [startDate, endDate]);

    // Handle leave type change
    const handleLeaveTypeChange = (type: LeaveType) => {
        setNewRequest(prev => ({
            ...prev,
            leave_type: type,
            // Reset related fields
            half_day: null,
            timeoff_type: 'days',
            timeoff_value: 0,
            attachment_filepath: '',
        }));
        setDateRange([null, null]);
        setSelectedFile(null);
    };

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    // Handle date range selection
    const handleDateChange = (update: [Date | null, Date | null]) => {
        setDateRange(update);
        if (update[0]) {
            setNewRequest(prev => ({ 
                ...prev, 
                start_date: update[0]?.toISOString() || '',
                // Reset half day if not single day
                half_day: !update[1] || update[0]?.toDateString() === update[1]?.toDateString() 
                    ? prev.half_day 
                    : null
            }));
        }
        if (update[1]) {
            setNewRequest(prev => ({ 
                ...prev, 
                end_date: update[1]?.toISOString() || '' 
            }));
        }
    };

    // Handle form submission
    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInfo?.id) {
            toast.error('Employee ID not found');
            return;
        }

        setIsUploading(true);
        try {
            let attachmentPath = '';
            if (newRequest.leave_type === 'sick_leave' && selectedFile) {
                attachmentPath = await uploadLeaveAttachment(selectedFile);
            }

            const payload: CreateLeaveRequestPayload = {
                leave_type: newRequest.leave_type,
                start_date: newRequest.start_date,
                end_date: newRequest.end_date,
                request_reason: newRequest.request_reason,
                half_day: isSingleDayRequest() ? newRequest.half_day : null,
                attachment_filepath: attachmentPath || undefined,
            };

            // Add timeoff specific fields
            if (newRequest.leave_type === 'timeoff') {
                payload.timeoff_type = newRequest.timeoff_type;
                payload.timeoff_value = newRequest.timeoff_value;
            }

            console.log('Submitting leave request:', payload);
            await createLeaveRequest(userInfo.id, payload);
            
            toast.success('Leave request submitted successfully');
            fetchLeaveRequests();
            
            // Reset form
            setNewRequest({
                leave_type: '' as LeaveType,
                start_date: '',
                end_date: '',
                request_reason: '',
                half_day: null,
                timeoff_type: 'days',
                timeoff_value: 0,
                attachment_filepath: '',
            });
            setDateRange([null, null]);
            setSelectedFile(null);
        } catch (error) {
            console.error('Error submitting leave request:', error);
            toast.error('Failed to submit leave request');
        } finally {
            setIsUploading(false);
        }
    };

    const fetchLeaveRequests = useCallback(async () => {
        if (!companyId || !userInfo?.id) return;
        
        setIsLoading(true);
        try {
            const response = await getCompanyLeaveRequests(companyId);
            
            // Filter requests if not a manager
            const filteredRequests = isManager 
                ? response 
                : response.filter(req => req.employee_id === userInfo.id);

            // Fetch employee names for all unique employee IDs
            const uniqueEmployeeIds = [...new Set(filteredRequests.map(req => req.employee_id))];
            const namesPromises = uniqueEmployeeIds.map(async (empId) => {
                const employee = await directoryService.fetchEmployee(empId);
                return [empId, `${employee.first_name} ${employee.last_name}`];
            });
            
            const namesEntries = await Promise.all(namesPromises);
            setEmployeeNames(Object.fromEntries(namesEntries));
            setRequests(filteredRequests);
        } catch (error) {
            console.error('Error fetching leave requests:', error);
            toast.error('Failed to fetch leave requests');
        } finally {
            setIsLoading(false);
        }
    }, [companyId, userInfo?.id, isManager]);

    useEffect(() => {
        if (companyId) {
            fetchLeaveRequests();
        }
    }, [companyId, fetchLeaveRequests]);

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

    // Add this new function to handle attachment viewing
    const handleViewAttachment = async (filepath: string) => {
        try {
            const url = await getLeaveAttachmentUrl(filepath);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error getting attachment URL:', error);
            toast.error('Failed to open attachment');
        }
    };

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
                        {/* Leave Type Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                            <select
                                title="Leave Type"
                                value={newRequest.leave_type}
                                onChange={(e) => handleLeaveTypeChange(e.target.value as LeaveType)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select Leave Type</option>
                                <option value="annual_leave">Annual Leave</option>
                                <option value="sick_leave">Sick Leave</option>
                                <option value="timeoff">Time Off</option>
                            </select>
                        </div>

                        {/* Date Selection - Only show if leave type is selected */}
                        {newRequest.leave_type && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Select Dates</label>
                                <div className="mt-1 relative">
                                    <DatePicker
                                        selectsRange={true}
                                        startDate={startDate}
                                        endDate={endDate}
                                        onChange={handleDateChange}
                                        isClearable={true}
                                        placeholderText="Select start date - end date"
                                        className="block w-full min-w-[300px] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        dateFormat="dd/MM/yyyy"
                                        minDate={new Date()}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Half Day Selection - Only show for single day annual leave */}
                        {isSingleDayRequest() && newRequest.leave_type === 'annual_leave' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Day Type</label>
                                <select
                                    title="Day Type"
                                    value={newRequest.half_day || ''}
                                    onChange={(e) => setNewRequest(prev => ({ 
                                        ...prev, 
                                        half_day: e.target.value as HalfDayType 
                                    }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">Full Day</option>
                                    <option value="AM">AM Half Day</option>
                                    <option value="PM">PM Half Day</option>
                                </select>
                            </div>
                        )}

                        {/* Time Off Specific Fields - Show after date selection */}
                        {newRequest.leave_type === 'timeoff' && startDate && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Time Off Type</label>
                                    <select
                                        title="Time Off Type"
                                        value={newRequest.timeoff_type}
                                        onChange={(e) => setNewRequest(prev => ({ 
                                            ...prev, 
                                            timeoff_type: e.target.value as TimeoffType 
                                        }))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="days">Days</option>
                                        <option value="hours">Hours</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        {newRequest.timeoff_type === 'hours' ? 'Hours' : 'Days'} Requested
                                    </label>
                                    <input
                                        title="Time Off Value"
                                        type="number"
                                        min="1"
                                        max={newRequest.timeoff_type === 'hours' ? "8" : "365"}
                                        value={newRequest.timeoff_value}
                                        onChange={(e) => setNewRequest(prev => ({ 
                                            ...prev, 
                                            timeoff_value: parseInt(e.target.value) 
                                        }))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {/* File Upload for Sick Leave */}
                        {newRequest.leave_type === 'sick_leave' && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Medical Certificate</label>
                                <input
                                    title="Medical Certificate"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    className="mt-1 block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-50 file:text-blue-700
                                        hover:file:bg-blue-100"
                                    required
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Please upload your medical certificate (PDF, JPG, PNG)
                                </p>
                            </div>
                        )}

                        {/* Reason Field */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Reason</label>
                            <textarea
                                title="Reason"
                                value={newRequest.request_reason}
                                onChange={(e) => setNewRequest(prev => ({ 
                                    ...prev, 
                                    request_reason: e.target.value 
                                }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                rows={3}
                                required
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end mt-4">
                        <button
                            type="submit"
                            disabled={isUploading}
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? 'Submitting...' : 'Submit Request'}
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
                                Day Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Time Off Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Reason
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Attachment
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {request.half_day ? `${request.half_day} Half Day` : 'Full Day'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {request.leave_type === 'timeoff' && request.timeoff_type && (
                                        `${request.timeoff_value} ${request.timeoff_type}`
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {request.request_reason}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {request.leave_type === 'sick_leave' && request.attachment_filepath && (
                                        <button
                                            onClick={() => handleViewAttachment(request.attachment_filepath!)}
                                            className="text-blue-600 hover:text-blue-900 underline"
                                        >
                                            View Attachment
                                        </button>
                                    )}
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