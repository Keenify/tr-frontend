export interface TodoData {
    id: string;
    title: string;
    description: string;
    due_date: string;
    color_code: string;
    is_completed: boolean;
    company_id: string;
    employee_id: string;
    section_id?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateTodoPayload {
    title: string;
    description: string;
    due_date: string;
    color_code: string;
    is_completed?: boolean;  // Optional, defaults to false
    employee_id: string;
    company_id: string;
    section_id?: string;
}

export interface UpdateTodoPayload {
    title?: string;
    description?: string;
    due_date?: string;
    color_code?: string;
    is_completed?: boolean;
    section_id?: string;
}

export interface SectionData {
    name: string;
    id: string;
    tab_id: string;
    employee_id: string;
    created_at: string;
    updated_at: string;
    todos: TodoData[];
}

export interface CreateSectionPayload {
    name: string;
    tab_id: string;
    employee_id: string;
}

export interface UpdateSectionPayload {
    name?: string;
}

export interface TabData {
    name: string;
    id: string;
    company_id: string;
    employee_id: string;
    created_at: string;
    updated_at: string;
    sections: SectionData[];
}

export interface CreateTabPayload {
    name: string;
    company_id: string;
    employee_id: string;
}

export interface UpdateTabPayload {
    name?: string;
} 