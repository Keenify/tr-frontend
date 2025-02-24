interface B2BAttachment {
  id: string;
  file_url: string;
  uploaded_at: string;
}

export interface B2BClientData {
    client_company: string;
    business_unit: string | null;
    name: string;
    designation: string | null;
    email: string;
    contact_number: string;
    nature: string;
    credit_terms: string;
    last_price: string | null;
    remarks: string;
    id?: string;
    company_id: string;
    created_at?: string;
    attachments: B2BAttachment[];
}

export type CreateB2BClientPayload = Omit<B2BClientData, 'id' | 'created_at'>;

export type UpdateB2BClientPayload = Pick<B2BClientData, 
  'client_company' | 
  'business_unit' | 
  'name' | 
  'designation' | 
  'email' | 
  'contact_number' | 
  'nature' | 
  'credit_terms' | 
  'last_price' | 
  'remarks'
>;

export interface B2BAttachmentResponse {
  file_url: string;
  description: string;
  id: string;
  b2b_client_id: string;
  uploaded_at: string;
} 