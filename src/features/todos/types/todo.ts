export interface TodoData {
    id: string;
    title: string;
    description: string;
    due_date: string;
    color_code: string;
    company_id: string;
    employee_id: string;
    created_at: string;
    updated_at: string;
}

export interface CreateTodoPayload {
    title: string;
    description: string;
    due_date: string;
    color_code: string;
    employee_id: string;
    company_id: string;
}

export interface UpdateTodoPayload {
    title?: string;
    description?: string;
    due_date?: string;
    color_code?: string;
} 