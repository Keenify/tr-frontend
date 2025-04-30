import { useState } from 'react';
import axios from 'axios';
import { supabase } from '../../../../lib/supabase';
import { 
  JobApplication, 
  ApplicantFormData, 
  ApplicationStage, 
  EmploymentType,
  APIApplicationStage,
  APIEmploymentType
} from '../types/hiring.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET_ATTACHMENTS || 'attachments';

// Map internal employment type values to API expected values
const mapEmploymentTypeToAPI = (type: EmploymentType): APIEmploymentType => {
  const mappings: Record<EmploymentType, APIEmploymentType> = {
    'full-time': 'Full Time',
    'part-time': 'Part Time',
    'contract': 'Contract',
    'internship': 'Internship'
  };
  return mappings[type];
};

// Map internal status values to API expected values
const mapStatusToAPI = (status: ApplicationStage): APIApplicationStage => {
  const mappings: Record<ApplicationStage, APIApplicationStage> = {
    'pre-hire': 'pre-hire',
    'interview': 'Interview',
    'post-hired': 'post-hired',
    'rejected': 'Rejected'
  };
  return mappings[status];
};

/**
 * Uploads a CV file to Supabase storage
 * @param {File} file - The CV file to upload
 * @returns {Promise<string>} - The storage path of the file
 */
export const uploadCV = async (file: File): Promise<string> => {
  // Create a unique file path using timestamp and original filename
  const fileKey = `hiring/cv/${Date.now()}_${file.name}`;

  console.log('Starting CV upload for:', file.name);

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileKey, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    console.error('Error uploading CV file:', error);
    throw error;
  }

  console.log('CV file uploaded successfully. Path:', fileKey);
  return fileKey;
};

/**
 * Gets a signed URL for viewing a stored CV file
 * @param {string} filePath - The storage path of the CV file 
 * @returns {Promise<string>} - The signed URL
 */
export const getCVSignedUrl = async (filePath: string): Promise<string> => {
  if (!filePath) {
    throw new Error('No file path provided');
  }

  console.log('Getting signed URL for CV:', filePath);
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, 60 * 60); // URL expires in 1 hour

  if (error) {
    console.error('Error getting signed URL for CV:', error);
    throw error;
  }

  if (!data?.signedUrl) {
    throw new Error('No signed URL returned');
  }

  return data.signedUrl;
};

/**
 * Hook for managing job applications via API
 */
export const useJobApplications = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Create a new job application
   * @param {ApplicantFormData} applicationData - The application data
   * @returns {Promise<JobApplication>} - The created job application
   */
  const createJobApplication = async (applicationData: ApplicantFormData): Promise<JobApplication> => {
    setLoading(true);
    setError(null);
    
    try {
      let cv_file_path = null;
      
      // Upload CV file if provided
      if (applicationData.cv_file) {
        cv_file_path = await uploadCV(applicationData.cv_file);
      }
      
      // Prepare the data for API with correctly mapped values
      const apiData = {
        full_name: applicationData.full_name,
        email: applicationData.email,
        phone: applicationData.phone,
        country: applicationData.country,
        city: applicationData.city,
        linkedin_profile: applicationData.linkedin_profile,
        job_applied_for: applicationData.job_applied_for,
        expected_salary: applicationData.expected_salary,
        available_start_date: applicationData.available_start_date,
        employment_type: mapEmploymentTypeToAPI(applicationData.employment_type),
        cv_file_path,
        notes: applicationData.notes,
        status: mapStatusToAPI(applicationData.status)
      };
      
      console.log('Sending data to API:', apiData);
      
      // Call the API
      const response = await axios.post<JobApplication>(
        `${API_URL}/job-applications/`, 
        apiData
      );
      
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('API Error response:', err);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an existing job application
   * @param {string} id - The job application ID
   * @param {Partial<ApplicantFormData>} applicationData - The updated application data
   * @returns {Promise<JobApplication>} - The updated job application
   */
  const updateJobApplication = async (
    id: string, 
    applicationData: Partial<ApplicantFormData>
  ): Promise<JobApplication> => {
    setLoading(true);
    setError(null);
    
    try {
      let cv_file_path = undefined;
      
      // Upload new CV file if provided
      if (applicationData.cv_file) {
        cv_file_path = await uploadCV(applicationData.cv_file);
      }
      
      // Extract cv_file to avoid sending it to the API
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { cv_file, ...restData } = applicationData;
      
      // Create base API data with proper typing
      interface ApiDataType {
        full_name?: string;
        email?: string;
        phone?: string;
        country?: string;
        city?: string;
        linkedin_profile?: string | null;
        job_applied_for?: string;
        expected_salary?: string | null;
        available_start_date?: string | null;
        employment_type?: APIEmploymentType;
        cv_file_path?: string;
        notes?: string | null;
        status?: APIApplicationStage;
      }
      
      const apiData: ApiDataType = { ...restData };
      
      // Only include cv_file_path if we have a new one
      if (cv_file_path) {
        apiData.cv_file_path = cv_file_path;
      }
      
      // Map employment_type and status if present
      if (apiData.employment_type) {
        apiData.employment_type = mapEmploymentTypeToAPI(apiData.employment_type as EmploymentType);
      }
      
      if (apiData.status) {
        apiData.status = mapStatusToAPI(apiData.status as ApplicationStage);
      }
      
      console.log('Updating with data:', apiData);
      
      // Call the API
      const response = await axios.put<JobApplication>(
        `${API_URL}/job-applications/${id}`, 
        apiData
      );
      
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('API Error on update:', err);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get all job applications
   * @param {number} limit - Maximum number of applications to return
   * @param {number} skip - Number of applications to skip
   * @returns {Promise<JobApplication[]>} - List of applications
   */
  const getAllJobApplications = async (limit = 100, skip = 0): Promise<JobApplication[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<JobApplication[]>(
        `${API_URL}/job-applications/?skip=${skip}&limit=${limit}`
      );
      
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get job applications by status
   * @param {ApplicationStage} status - The application status to filter by
   * @returns {Promise<JobApplication[]>} - The list of job applications
   */
  const getJobApplicationsByStatus = async (status: ApplicationStage): Promise<JobApplication[]> => {
    setLoading(true);
    setError(null);
    
    try {
      // First get all applications (API doesn't seem to have status filtering)
      const allApplications = await getAllJobApplications();
      
      // Then filter by status - need to handle potential differences in status format
      const apiStatus = mapStatusToAPI(status);
      return allApplications.filter(app => 
        app.status === apiStatus || app.status === status
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get a job application by ID
   * @param {string} id - The job application ID
   * @returns {Promise<JobApplication>} - The job application
   */
  const getJobApplicationById = async (id: string): Promise<JobApplication> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<JobApplication>(
        `${API_URL}/job-applications/${id}`
      );
      
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a job application
   * @param {string} id - The job application ID
   * @returns {Promise<void>}
   */
  const deleteJobApplication = async (id: string): Promise<JobApplication> => {
    setLoading(true);
    setError(null);
    
    try {
      // First, get the application to check if it has a CV file
      const application = await getJobApplicationById(id);
      
      // Delete the CV file if it exists (still using Supabase storage)
      if (application.cv_file_path) {
        const { error: storageError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([application.cv_file_path]);
          
        if (storageError) {
          console.error('Error deleting CV file:', storageError);
          // Continue with application deletion even if file deletion fails
        }
      }
      
      // Call the API to delete
      const response = await axios.delete<JobApplication>(
        `${API_URL}/job-applications/${id}`
      );
      
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createJobApplication,
    updateJobApplication,
    getAllJobApplications,
    getJobApplicationsByStatus,
    getJobApplicationById,
    deleteJobApplication,
    getCVSignedUrl
  };
};

export default useJobApplications; 