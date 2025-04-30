export type ApplicationStage = 'pre-hire' | 'interview' | 'rejected' | 'post-hired';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship';

// API response types - may differ from internal types
export type APIApplicationStage = 'pre-hire' | 'Interview' | 'Rejected' | 'post-hired';
export type APIEmploymentType = 'Full Time' | 'Part Time' | 'Contract' | 'Internship';

export interface JobApplication {
  id: string; // Unique ID
  full_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  linkedin_profile?: string | null;
  job_applied_for: string;
  expected_salary?: string | null;
  available_start_date?: string | null;
  employment_type: APIEmploymentType | EmploymentType;
  cv_file_path?: string | null;
  notes?: string | null;
  status: APIApplicationStage | ApplicationStage;
  created_at: string;
  updated_at: string;
}

export interface ApplicantFormData {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  linkedin_profile?: string | null;
  job_applied_for: string;
  expected_salary?: string | null;
  available_start_date?: string | null;
  employment_type: EmploymentType;
  cv_file?: File | null;
  notes?: string | null;
  status: ApplicationStage;
} 