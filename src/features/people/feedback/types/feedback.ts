export interface Employee {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
    user_id: string;
    completed_sign_up_sequence: boolean;
    profile_pic_url: string | null;
    company_id: string;
    reports_to: string;
    highest_rank: boolean;
    id: string;
    created_at: string;
}

export interface CreateFeedbackParams {
    userId: string;
    companyId: string;
    feedback: string;
}

export interface FeedbackResponse {
    id: string;
    feedback: string;
    userId: string;
    companyId: string;
    createdAt: string;
    employee: Employee;
}

export interface ApiResponse {
    user_id: string;
    company_id: string;
    created_at: string;
    feedback: string;
    id: string;
    employee: Employee;
}
