export interface TodoData {
    id: string;
    title: string;
    description: string;
    due_date: string;
    is_completed?: boolean;
    color_code: string;
    employee_id: string;
    company_id: string;
    created_at?: string;
    updated_at?: string;
    section_id: string | null | undefined;
    section_name: string | null | undefined;
}

export interface CreateTodoPayload {
    title: string;
    description: string;
    due_date?: string | null; // Make due_date optional
    color_code: string;
    is_completed?: boolean;  // Optional, defaults to false
    employee_id: string;
    company_id: string;
    section_id?: string | null;
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