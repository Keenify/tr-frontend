export interface LeaveBalance {
    id: string;
    employee_id: string;
    annual_leave_balance: number;
    sick_leave_balance: number;
    timeoff_days_balance: number;
    timeoff_hours_balance: number;
    created_at: string;
    updated_at: string;
}

export interface CreateLeaveBalancePayload {
    annual_leave_balance: number;
    sick_leave_balance: number;
    timeoff_days_balance: number;
    timeoff_hours_balance: number;
}

export interface UpdateLeaveBalancePayload {
    annual_leave_balance?: number;
    sick_leave_balance?: number;
    timeoff_days_balance?: number;
    timeoff_hours_balance?: number;
} 