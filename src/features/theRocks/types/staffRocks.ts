export interface StaffRockData {
  id: string; // UUID
  company_id: string; // UUID
  the_rock_id: string; // UUID (parent TheRock)
  employee_user_id?: string | null; // UUID
  manager_user_id?: string | null; // UUID
  go_to_for?: string | null;
  title: string;
  rock_description: string;
  link_to_higher_level_priorities: string;
  success_criteria: string;
  results_achieved?: string | null;
  manager_perspective?: string | null;
  success_status: 'red' | 'orange' | 'green' | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

export interface CreateStaffRockPayload {
  the_rock_id: string; // UUID
  employee_user_id?: string | null;
  manager_user_id?: string | null;
  go_to_for?: string | null;
  title: string;
  rock_description: string;
  link_to_higher_level_priorities: string;
  success_criteria: string;
  results_achieved?: string | null;
  manager_perspective?: string | null;
  success_status?: 'red' | 'orange' | 'green' | null;
}

export interface UpdateStaffRockPayload {
  employee_user_id?: string | null;
  manager_user_id?: string | null;
  go_to_for?: string | null;
  title?: string;
  rock_description?: string;
  link_to_higher_level_priorities?: string;
  success_criteria?: string;
  results_achieved?: string | null;
  manager_perspective?: string | null;
  success_status?: 'red' | 'orange' | 'green' | null;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
} 