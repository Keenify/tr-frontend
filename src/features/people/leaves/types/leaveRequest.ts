export type LeaveType = 'annual_leave' | 'sick_leave' | 'timeoff';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'canceled';
export type HalfDayType = 'AM' | 'PM' | null;
export type TimeoffType = 'hours' | 'days';

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
    half_day: HalfDayType;
    timeoff_type?: TimeoffType;
    timeoff_value?: number;
    attachment_filepath?: string;
}

export interface CreateLeaveRequestPayload {
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    request_reason: string;
    half_day?: HalfDayType;
    timeoff_type?: TimeoffType;
    timeoff_value?: number;
    attachment_filepath?: string;
}

export interface UpdateLeaveRequestPayload {
    // NEW FIELDS - For editing leave requests
    leave_type?: LeaveType;
    start_date?: string;
    end_date?: string;
    request_reason?: string;
    half_day?: HalfDayType;

    // EXISTING FIELDS - For approval/rejection/cancellation
    status?: LeaveStatus;
    cancellation_reason?: string;
    attachment_filepath?: string;
    timeoff_type?: TimeoffType;
    timeoff_value?: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
} 