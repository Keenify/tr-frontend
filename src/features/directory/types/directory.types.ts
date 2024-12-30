export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  user_id: string;
  completed_sign_up_sequence: boolean;
  profile_pic_url: string | null;
  company_id: string; // This is a UUID
  created_at: string;
}

export interface DirectoryFilters {
  searchQuery: string;
  sortOrder: 'asc' | 'desc';
  selectedEmployeeId: string | null;
}
