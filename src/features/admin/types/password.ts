export interface PasswordData {
    name: string;
    username: string;
    url: string;
    notes: string;
    id: string;
    company_id: string;
    password_encrypted: string;
    country: string;
    created_at: string;
    updated_at: string;
}

export interface CreatePasswordPayload {
    name: string;
    username: string;
    url: string;
    notes: string;
    password: string;
    company_id: string;
    country: string;
}

export interface UpdatePasswordPayload {
    name?: string;
    username?: string;
    password?: string;
    url?: string;
    notes?: string;
    country?: string;
} 