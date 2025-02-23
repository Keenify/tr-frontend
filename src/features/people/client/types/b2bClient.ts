export interface B2BClientData {
    client_company: string;
    business_unit: string | null;
    name: string;
    designation: string;
    email: string;
    contact_number: string;
    nature: string;
    credit_terms: string;
    last_price: string | null;
    remarks: string;
    id?: string;
    company_id: string;
    created_at?: string;
}

export type CreateB2BClientPayload = Omit<B2BClientData, 'id' | 'created_at'>;

export type UpdateB2BClientPayload = Omit<B2BClientData, 'id' | 'created_at' | 'company_id'>; 