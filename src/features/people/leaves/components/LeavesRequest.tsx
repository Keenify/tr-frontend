import { useEffect, useState, useCallback, useRef } from 'react';
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
import { PencilSquareIcon, MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useUserAndCompanyData } from '../../../../shared/hooks/useUserAndCompanyData';
import { directoryService } from '../../../../shared/services/directoryService';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { uploadLeaveAttachment, getLeaveAttachmentUrl } from '../services/useLeaveAttachments';
import EditLeaveRequestModal from './EditLeaveRequestModal';

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
    
    // Add state for company employees and selected employee
    const [companyEmployees, setCompanyEmployees] = useState<{id: string, name: string}[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

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

    const [cancellationReason, setCancellationReason] = useState<string>('');
    const [cancelRequestId, setCancelRequestId] = useState<string | null>(null);

    // Edit modal state
    const [selectedRequestForEdit, setSelectedRequestForEdit] = useState<LeaveRequest | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Ref for scrolling to table
    const tableRef = useRef<HTMLTableSectionElement>(null);

    // Filter state
    const [searchInput, setSearchInput] = useState('');
    const [filterConfig, setFilterConfig] = useState({
        search: '',
        status: '',
        leaveType: ''
    });

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

    // Add function to fetch company employees
    const fetchCompanyEmployees = useCallback(async () => {
        if (!companyId || !isManager) return;
        
        try {
            const employees = await directoryService.fetchEmployees(companyId);
            // Filter to only show employed employees
            const formattedEmployees = employees
                .filter(emp => emp.Is_Employed)
                .map(emp => ({
                    id: emp.id,
                    name: `${emp.first_name} ${emp.last_name}`
                }));
            setCompanyEmployees(formattedEmployees);
        } catch (error) {
            console.error('Error fetching company employees:', error);
            toast.error('Failed to fetch company employees');
        }
    }, [companyId, isManager]);

    // Move fetchLeaveRequests definition above the useEffect that uses it
    const fetchLeaveRequests = useCallback(async () => {
        if (!companyId || !userInfo?.id) return;
        
        setIsLoading(true);
        try {
            const response = await getCompanyLeaveRequests(companyId, {
                status: filterConfig.status || undefined,
                leave_type: filterConfig.leaveType || undefined,
                search_query: filterConfig.search || undefined,
                page: currentPage,
                page_size: pageSize
            });
            
            // Update pagination info
            setTotalRecords(response.total);
            setTotalPages(response.total_pages);
            
            // Filter requests if not a manager
            const filteredRequests = isManager 
                ? response.items 
                : response.items.filter(req => req.employee_id === userInfo.id);

            // Fetch employee names for all unique employee IDs
            const uniqueEmployeeIds = [...new Set(filteredRequests.map(req => req.employee_id))];
            const namesPromises = uniqueEmployeeIds.map(async (empId) => {
                // Check if we already have the name to avoid unnecessary calls
                if (employeeNames[empId]) return [empId, employeeNames[empId]];
                
                try {
                    const employee = await directoryService.fetchEmployee(empId);
                    return [empId, `${employee.first_name} ${employee.last_name}`];
                } catch (e) {
                    return [empId, 'Unknown Employee'];
                }
            });
            
            const namesEntries = await Promise.all(namesPromises);
            setEmployeeNames(prev => ({ ...prev, ...Object.fromEntries(namesEntries) }));
            setRequests(filteredRequests);
        } catch (error) {
            console.error('Error fetching leave requests:', error);
            toast.error('Failed to fetch leave requests');
        } finally {
            setIsLoading(false);
        }
    }, [companyId, userInfo?.id, isManager, filterConfig, currentPage, pageSize]);

    // Handle search button click
    const handleSearch = () => {
        setFilterConfig(prev => ({ 
            ...prev, 
            search: searchInput
        }));
        setCurrentPage(1); // Reset to first page on new search
    };

    // Handle clear filters
    const handleClearFilters = () => {
        setSearchInput('');
        setFilterConfig({
            search: '',
            status: '',
            leaveType: ''
        });
        setCurrentPage(1);
    };

    useEffect(() => {
        if (companyId) {
            fetchLeaveRequests();
        }
    }, [companyId, fetchLeaveRequests]);

    // Scroll to table when page changes
    useEffect(() => {
        if (tableRef.current) {
            // Small delay to ensure content is loaded
            setTimeout(() => {
                tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }, [currentPage]); 
    
    useEffect(() => {
        if (companyId) {
            if (isManager) {
                fetchCompanyEmployees();
            }
        }
    }, [companyId, isManager, fetchCompanyEmployees]);

    // Reset selected employee when form is reset
    useEffect(() => {
        if (!newRequest.leave_type) {
            setSelectedEmployeeId('');
        }
    }, [newRequest.leave_type]);

    // Handle form submission
    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Determine which employee ID to use
        const employeeId = isManager && selectedEmployeeId ? selectedEmployeeId : userInfo?.id;
        
        if (!employeeId) {
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
            await createLeaveRequest(employeeId, payload);
            
            const employeeName = isManager && selectedEmployeeId ? 
                companyEmployees.find(emp => emp.id === selectedEmployeeId)?.name || 'employee' : 
                'your';
            toast.success(`Leave request for ${employeeName} submitted successfully`);
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
            setSelectedEmployeeId('');
        } catch (error) {
            console.error('Error submitting leave request:', error);
            toast.error('Failed to submit leave request');
        } finally {
            setIsUploading(false);
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

    const handleCancelRequest = async (requestId: string) => {
        setCancelRequestId(requestId);
    };

    const submitCancellation = async () => {
        if (!cancelRequestId) return;

        try {
            await updateLeaveRequest(cancelRequestId, {
                status: 'canceled',
                cancellation_reason: cancellationReason
            });
            toast.success('Leave request canceled successfully');
            fetchLeaveRequests();
            setCancelRequestId(null);
            setCancellationReason('');
        } catch (error) {
            console.error('Error canceling leave request:', error);
            toast.error('Failed to cancel leave request');
        }
    };

    // Edit modal handlers
    const handleOpenEditModal = (request: LeaveRequest) => {
        setSelectedRequestForEdit(request);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setSelectedRequestForEdit(null);
        setIsEditModalOpen(false);
    };

    const handleUpdateLeaveRequest = async (payload: Partial<CreateLeaveRequestPayload>) => {
        if (!selectedRequestForEdit) return;

        try {
            await updateLeaveRequest(selectedRequestForEdit.id, payload);
            toast.success('Leave request updated successfully');
            fetchLeaveRequests(); // Refresh table
            handleCloseEditModal();
        } catch (error: any) {
            console.error('Error updating leave request:', error);

            // Enhanced error handling for backend validation
            if (error.response?.status === 400) {
                const message = error.response?.data?.detail || 'Validation error';
                toast.error(message);
            } else if (error.response?.status === 404) {
                toast.error('Leave request not found');
            } else {
                toast.error('Failed to update leave request');
            }

            throw error; // Re-throw so modal can handle loading state
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Cancellation Modal */}
            {cancelRequestId && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-4">Cancel Leave Request</h3>
                        <p className="mb-4 text-gray-600">Please provide a reason for cancellation:</p>
                        <textarea
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            className="w-full border rounded-md p-2 mb-4"
                            rows={3}
                            placeholder="Reason for cancellation"
                            required
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setCancelRequestId(null);
                                    setCancellationReason('');
                                }}
                                className="px-4 py-2 border rounded-md hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitCancellation}
                                disabled={!cancellationReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                                Confirm Cancellation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Leave Request Form */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium mb-4">
                    {isManager ? 'Submit Leave Request' : 'Submit New Leave Request'}
                </h2>
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Employee Selection for Managers */}
                        {isManager && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Employee</label>
                                <select
                                    title="Employee"
                                    value={selectedEmployeeId}
                                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">Myself</option>
                                    {companyEmployees
                                        .filter(employee => employee.id !== userInfo?.id) // Filter out the current user
                                        .map(employee => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        )}

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
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Half Day Selection - Only show for single day annual leave */}
                        {isSingleDayRequest() && newRequest.leave_type === 'annual_leave' && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Day Type</label>
                                <div className="space-x-4 flex items-center">
                                    <label className="inline-flex items-center">
                                        <input
                                            title="Full Day"
                                            type="radio"
                                            value=""
                                            checked={!newRequest.half_day}
                                            onChange={() => setNewRequest(prev => ({
                                                ...prev,
                                                half_day: null
                                            }))}
                                            className="form-radio h-4 w-4 text-blue-600"
                                        />
                                        <span className="ml-2">Full Day</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            title="AM Half Day"
                                            type="radio"
                                            value="AM"
                                            checked={newRequest.half_day === 'AM'}
                                            onChange={() => setNewRequest(prev => ({
                                                ...prev,
                                                half_day: 'AM'
                                            }))}
                                            className="form-radio h-4 w-4 text-blue-600"
                                        />
                                        <span className="ml-2">AM Half Day</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            title="PM Half Day"
                                            type="radio"
                                            value="PM"
                                            checked={newRequest.half_day === 'PM'}
                                            onChange={() => setNewRequest(prev => ({
                                                ...prev,
                                                half_day: 'PM'
                                            }))}
                                            className="form-radio h-4 w-4 text-blue-600"
                                        />
                                        <span className="ml-2">PM Half Day</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Time Off Specific Fields - Show after date selection */}
                        {newRequest.leave_type === 'timeoff' && startDate && (
                            <>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Off Type</label>
                                    <div className="space-x-4 flex items-center">
                                        <label className="inline-flex items-center">
                                            <input
                                                title="Days"
                                                type="radio"
                                                value="days"
                                                checked={newRequest.timeoff_type === 'days'}
                                                onChange={() => setNewRequest(prev => ({
                                                    ...prev,
                                                    timeoff_type: 'days',
                                                    timeoff_value: 1 // Reset value when changing type
                                                }))}
                                                className="form-radio h-4 w-4 text-blue-600"
                                            />
                                            <span className="ml-2">Days</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                title="Hours"
                                                type="radio"
                                                value="hours"
                                                checked={newRequest.timeoff_type === 'hours'}
                                                onChange={() => setNewRequest(prev => ({
                                                    ...prev,
                                                    timeoff_type: 'hours',
                                                    timeoff_value: 1 // Reset value when changing type
                                                }))}
                                                className="form-radio h-4 w-4 text-blue-600"
                                            />
                                            <span className="ml-2">Hours</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        {newRequest.timeoff_type === 'hours' ? 'Hours' : 'Days'} Requested
                                    </label>
                                    <input
                                        title="Time Off Value"
                                        type="number"
                                        min={newRequest.timeoff_type === 'hours' ? "0.25" : "1"}
                                        max={newRequest.timeoff_type === 'hours' ? "8" : "365"}
                                        step={newRequest.timeoff_type === 'hours' ? "0.25" : "1"}
                                        value={newRequest.timeoff_value}
                                        onChange={(e) => setNewRequest(prev => ({
                                            ...prev,
                                            timeoff_value: parseFloat(e.target.value)
                                        }))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                    {newRequest.timeoff_type === 'hours' && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Hours can be entered in 0.25 increments (0.25, 0.50, 0.75, etc.)
                                        </p>
                                    )}
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

                        {/* Reason Field - Only show for non-sick leave types */}
                        {newRequest.leave_type && newRequest.leave_type !== 'sick_leave' && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Reason
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
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
                        )}
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

            {/* Filters Section */}
            <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200">
                <div className="flex gap-3 items-center">
                    {/* Title */}
                    <div className="flex items-center gap-2 mr-2">
                        <FunnelIcon className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">Filters:</span>
                    </div>

                    {/* Search Input */}
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search employee name..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filterConfig.status}
                        onChange={(e) => {
                            setFilterConfig(prev => ({ ...prev, status: e.target.value }));
                            setCurrentPage(1);
                        }}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="canceled">Canceled</option>
                    </select>

                    {/* Leave Type Filter */}
                    <select
                        value={filterConfig.leaveType}
                        onChange={(e) => {
                            setFilterConfig(prev => ({ ...prev, leaveType: e.target.value }));
                            setCurrentPage(1);
                        }}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Types</option>
                        <option value="annual_leave">Annual</option>
                        <option value="sick_leave">Sick</option>
                        <option value="timeoff">Time Off</option>
                    </select>

                    {/* Search Button */}
                    <button
                        onClick={handleSearch}
                        className="px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors whitespace-nowrap"
                    >
                        Search
                    </button>

                    {/* Clear Button */}
                    <button
                        onClick={handleClearFilters}
                        className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        title="Clear all filters"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Leave Requests Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 table-fixed">
                        <thead ref={tableRef} className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                                    Employee Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                    <div className="flex items-center cursor-pointer" onClick={() => sortData('leave_type')}>
                                        Type
                                        <ChevronUpDownIcon className="h-4 w-4 ml-1" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                    <div className="flex items-center cursor-pointer" onClick={() => sortData('start_date')}>
                                        Start Date
                                        <ChevronUpDownIcon className="h-4 w-4 ml-1" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                    <div className="flex items-center cursor-pointer" onClick={() => sortData('end_date')}>
                                        End Date
                                        <ChevronUpDownIcon className="h-4 w-4 ml-1" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                    Day Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                                    Time Off Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                                    Reason
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                    Attachment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                    <div className="flex items-center cursor-pointer" onClick={() => sortData('status')}>
                                        Status
                                        <ChevronUpDownIcon className="h-4 w-4 ml-1" />
                                    </div>
                                </th>
                                {isManager && (
                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                        Edit
                                    </th>
                                )}
                                {isManager && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
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
                                    <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">
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
                                        {request.status === 'canceled' && request.cancellation_reason && (
                                            <div className="mt-1 text-xs text-gray-500">
                                                Reason: {request.cancellation_reason}
                                            </div>
                                        )}
                                    </td>
                                    {/* Edit Column - Managers only */}
                                    {isManager && (
                                        <td className="px-3 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => handleOpenEditModal(request)}
                                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                                title="Edit request"
                                            >
                                                <PencilSquareIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        {isManager && request.status === 'pending' && (
                                            <>
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
                                            </>
                                        )}
                                        {/* Allow users to cancel their own pending or approved requests that haven't started yet */}
                                        {request.employee_id === userInfo?.id && 
                                         (request.status === 'pending' || request.status === 'approved') && 
                                         (new Date(request.start_date) > new Date()) && (
                                            <button
                                                onClick={() => handleCancelRequest(request.id)}
                                                className="text-gray-600 hover:text-gray-900"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Controls */}
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{requests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
                                <span className="font-medium">{Math.min(currentPage * pageSize, totalRecords)}</span> of{' '}
                                <span className="font-medium">{totalRecords}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="sr-only">Previous</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                {/* Page numbers */}
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                currentPage === pageNum
                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="sr-only">Next</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Leave Request Modal */}
            {selectedRequestForEdit && (
                <EditLeaveRequestModal
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    onSubmit={handleUpdateLeaveRequest}
                    request={selectedRequestForEdit}
                    companyEmployees={companyEmployees}
                />
            )}
        </div>
    );
}

export default LeavesRequest; 