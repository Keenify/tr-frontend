import { useState, useEffect } from 'react';
import { BusinessQuadrant } from '../types/company';
import { getCompany, updateBusinessQuadrant } from '../services/useBusinessQuadrant';

export interface QuadrantData extends BusinessQuadrant {
  notes?: string;
}

// Custom error type for better error handling
interface ApiError extends Error {
  status?: number;
  code?: string;
}

export const useBusinessQuadrant = (companyId: string) => {
  const [quadrantData, setQuadrantData] = useState<QuadrantData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuadrantData = async () => {
      try {
        setLoading(true);
        
        if (!companyId) {
          throw new Error('Company ID is required');
        }
        
        const company = await getCompany(companyId);
        
        if (company && company.business_quadrant) {
          setQuadrantData({
            ...company.business_quadrant,
            notes: '' // Notes aren't part of the API response, so we initialize with empty string
          });
        } else {
          // Initialize with empty data if no business quadrant exists
          setQuadrantData({
            create_value: '',
            deliver_value: '',
            capture_value: '',
            defend_value: '',
            notes: ''
          });
        }
      } catch (error: unknown) {
        const apiError = error as ApiError;
        console.error('Error fetching quadrant data:', apiError);
        setError(apiError.message || 'Unknown error occurred');
        
        // Initialize with empty data on error
        setQuadrantData({
          create_value: '',
          deliver_value: '',
          capture_value: '',
          defend_value: '',
          notes: ''
        });
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchQuadrantData();
    } else {
      // Set empty data if no company ID
      setQuadrantData({
        create_value: '',
        deliver_value: '',
        capture_value: '',
        defend_value: '',
        notes: ''
      });
      setLoading(false);
    }
  }, [companyId]);

  const updateQuadrantData = async (data: Partial<QuadrantData>) => {
    try {
      setLoading(true);
      
      if (!companyId) {
        throw new Error('Company ID is required for update');
      }
      
      // Prepare payload for API
      const payload = {
        business_quadrant: {
          create_value: data.create_value !== undefined ? data.create_value : quadrantData?.create_value || '',
          deliver_value: data.deliver_value !== undefined ? data.deliver_value : quadrantData?.deliver_value || '',
          capture_value: data.capture_value !== undefined ? data.capture_value : quadrantData?.capture_value || '',
          defend_value: data.defend_value !== undefined ? data.defend_value : quadrantData?.defend_value || ''
        }
      };
      
      // Update using API service
      const updatedCompany = await updateBusinessQuadrant(companyId, payload);
      
      if (updatedCompany && updatedCompany.business_quadrant) {
        setQuadrantData({
          ...updatedCompany.business_quadrant,
          notes: data.notes !== undefined ? data.notes : quadrantData?.notes || ''
        });
      }
      
      return { success: true };
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error updating quadrant data:', apiError);
      setError(apiError.message || 'Unknown error occurred');
      return { success: false, error: apiError.message || 'Failed to update' };
    } finally {
      setLoading(false);
    }
  };

  return {
    quadrantData,
    loading,
    error,
    updateQuadrantData
  };
}; 