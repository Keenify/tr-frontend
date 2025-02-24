export interface SupplierData {
    supplier_company_name: string;
    contact_person_name: string;
    contact_person_phone: string;
    contact_person_email: string;
    category: string;
    purchased_items_services: string;
    procurement_steps: string;
    notes: string;
    id: string;
    company_id: string;
    created_at: string;
}

export interface CreateSupplierPayload {
    supplier_company_name: string;
    contact_person_name?: string;
    contact_person_phone?: string;
    contact_person_email?: string;
    category?: string;
    purchased_items_services?: string;
    procurement_steps?: string;
    notes?: string;
    company_id: string;
}

export interface UpdateSupplierPayload {
    supplier_company_name: string;
    contact_person_name: string;
    contact_person_phone: string;
    contact_person_email: string;
    category: string;
    purchased_items_services: string;
    procurement_steps: string;
    notes: string;
} 