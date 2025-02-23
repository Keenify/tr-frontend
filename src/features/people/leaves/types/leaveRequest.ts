export type LeaveType = 'annual_leave' | 'sick_leave' | 'timeoff';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'canceled';

export interface LeaveRequest {
    id: string;
    employee_id: string;
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    request_reason: string;
    calendar_event_id: string;
    status: LeaveStatus;
    cancellation_reason: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateLeaveRequestPayload {
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    request_reason: string;
}

export interface UpdateLeaveRequestPayload {
    status: LeaveStatus;
    cancellation_reason?: string;
} 