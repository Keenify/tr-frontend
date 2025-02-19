export interface CompanyData {
  name: string;
  completed_sign_up_sequence: boolean;
  company_brand_color: string | null;
  id: string;
  created_at: string;
  address: string;
  website_url: string;
  phone: string;
  logo_url: string;
}

export interface BranchInfo {
    name: string;
    phone: string;
    address: string;
}
