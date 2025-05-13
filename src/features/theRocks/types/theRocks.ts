export interface TheRockData {
  id: string; // UUID
  company_id: string; // UUID
  title: string;
  rock_description: string;
  link_to_higher_level_priorities: string;
  success_criteria: string;
  success_status: 'red' | 'orange' | 'green' | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

export interface CreateTheRockPayload {
  title: string;
  rock_description: string;
  link_to_higher_level_priorities: string;
  success_criteria: string;
  success_status?: 'red' | 'orange' | 'green' | null;
}

export interface UpdateTheRockPayload {
  title?: string;
  rock_description?: string;
  link_to_higher_level_priorities?: string;
  success_criteria?: string;
  success_status?: 'red' | 'orange' | 'green' | null;
} 