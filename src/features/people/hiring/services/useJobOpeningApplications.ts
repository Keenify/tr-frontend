import { useState } from 'react';
import { getPresignedDownloadUrl } from '../../../../services/storageService';

interface JobOpeningData {
  role?: string;
  department?: string;
  locations?: string[];
  remote_status?: string;
}

interface ApplicationWithJoinedData {
  id: string;
  job_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  resume_url?: string | null;
  status?: string | null;
  created_at: string;
  updated_at: string;
  custom_fields?: Record<string, unknown> | null;
  jobs_opening?: JobOpeningData;
}

export interface JobOpeningApplication {
  id: string;
  job_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  resume_url?: string | null;
  status?: string | null;
  created_at: string;
  updated_at: string;
  custom_fields?: Record<string, unknown> | null;
  // Joined job data
  job_role?: string;
  job_department?: string;
  job_locations?: string[];
  job_remote_status?: string;
}

export const useJobOpeningApplications = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Get all applications for a specific job posting with custom questions
   * @param {string} jobId - The job posting ID
   * @returns {Promise<JobOpeningApplication[]>} - List of applications for the job
   */
  const getApplicationsByJobId = async (jobId: string): Promise<JobOpeningApplication[]> => {
    setLoading(true);
    setError(null);
    
    try {
      // First get the applications
      const { data: applicationsData, error: appError } = await supabase
        .from('job_opening_applications')
        .select(`
          id,
          job_id,
          first_name,
          last_name,
          email,
          phone,
          resume_url,
          created_at,
          updated_at,
          custom_fields,
          jobs_opening (
            role,
            department,
            locations,
            remote_status
          )
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (appError) throw appError;

      // Get custom questions for this job
      const { data: questionsData, error: questionsError } = await supabase
        .from('job_custom_questions')
        .select('id, question_text, question_type')
        .eq('job_id', jobId);

      if (questionsError) {
        console.warn('Failed to fetch custom questions:', questionsError);
      }

      // Create a map of question ID to question text
      const questionsMap = (questionsData || []).reduce((map, q) => {
        map[q.id] = q.question_text;
        return map;
      }, {} as Record<string, string>);

      // Transform the data to flatten the job information and resolve custom questions
      const transformedData: JobOpeningApplication[] = (applicationsData as ApplicationWithJoinedData[] || []).map(app => {
        let resolvedCustomFields = {};
        
        // If there are custom fields, try to resolve question IDs to question text
        if (app.custom_fields && typeof app.custom_fields === 'object') {
          resolvedCustomFields = Object.entries(app.custom_fields).reduce((resolved, [key, value]) => {
            // Try to find the question text for this key (assuming key might be question ID)
            const questionText = questionsMap[key] || key; // Use question text if found, otherwise use the key
            resolved[questionText] = value;
            return resolved;
          }, {} as Record<string, unknown>);
        }

        return {
          id: app.id,
          job_id: app.job_id,
          first_name: app.first_name,
          last_name: app.last_name,
          email: app.email,
          phone: app.phone,
          resume_url: app.resume_url,
          created_at: app.created_at,
          updated_at: app.updated_at,
          custom_fields: resolvedCustomFields,
          job_role: app.jobs_opening?.role,
          job_department: app.jobs_opening?.department,
          job_locations: app.jobs_opening?.locations,
          job_remote_status: app.jobs_opening?.remote_status
        };
      });

      return transformedData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Error in getApplicationsByJobId:', err);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get all job opening applications across all jobs
   * @returns {Promise<JobOpeningApplication[]>} - List of all applications
   */
  const getAllJobOpeningApplications = async (): Promise<JobOpeningApplication[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('job_opening_applications')
        .select(`
          id,
          job_id,
          first_name,
          last_name,
          email,
          phone,
          resume_url,
          created_at,
          updated_at,
          custom_fields,
          jobs_opening (
            role,
            department,
            locations,
            remote_status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to flatten the job information
      const transformedData: JobOpeningApplication[] = (data as ApplicationWithJoinedData[] || []).map(app => ({
        id: app.id,
        job_id: app.job_id,
        first_name: app.first_name,
        last_name: app.last_name,
        email: app.email,
        phone: app.phone,
        resume_url: app.resume_url,
        created_at: app.created_at,
        updated_at: app.updated_at,
        custom_fields: app.custom_fields,
        job_role: app.jobs_opening?.role,
        job_department: app.jobs_opening?.department,
        job_locations: app.jobs_opening?.locations,
        job_remote_status: app.jobs_opening?.remote_status
      }));

      return transformedData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get application count for a specific job
   * @param {string} jobId - The job posting ID
   * @returns {Promise<number>} - Number of applications for the job
   */
  const getApplicationCountByJobId = async (jobId: string): Promise<number> => {
    setLoading(true);
    setError(null);
    
    try {
      const { count, error } = await supabase
        .from('job_opening_applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', jobId);

      if (error) throw error;

      return count || 0;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a job opening application
   * @param {string} applicationId - The application ID to delete
   * @returns {Promise<void>}
   */
  const deleteJobOpeningApplication = async (applicationId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('job_opening_applications')
        .delete()
        .eq('id', applicationId);

      if (error) throw error;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get a signed URL for a resume file
   * @param {string} resumeUrl - The storage path or URL of the resume file
   * @returns {Promise<string>} - The signed URL or direct URL
   */
  const getResumeSignedUrl = async (resumeUrl: string): Promise<string> => {
    if (!resumeUrl) {
      throw new Error('No resume URL provided');
    }

    console.log('Processing resume URL:', resumeUrl);

    // Check if it's already a full URL (http/https)
    if (resumeUrl.startsWith('http://') || resumeUrl.startsWith('https://')) {
      console.log('Resume URL is already a full URL, returning as-is');
      return resumeUrl;
    }

    // If it's a storage path, get a presigned download URL from R2
    try {
      console.log(`Getting presigned URL for path: ${resumeUrl}`);
      return await getPresignedDownloadUrl('attachments', resumeUrl);
    } catch (err) {
      console.error('Error getting signed URL for resume:', err);
      throw err;
    }
  };

  return {
    loading,
    error,
    getApplicationsByJobId,
    getAllJobOpeningApplications,
    getApplicationCountByJobId,
    deleteJobOpeningApplication,
    getResumeSignedUrl
  };
};

export default useJobOpeningApplications;