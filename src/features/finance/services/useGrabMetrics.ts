/**
 * Grab Metrics Service Module
 * 
 * This module provides functionality for fetching Grab metrics for a company.
 * 
 * @module GrabMetricsService
 */

import { useQuery, useMutation } from "@tanstack/react-query";

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Represents a Grab Metrics record as returned by the API
 */
export interface GrabMetric {
  store_name: string;
  date: string;
  completed_order: number;
  cancelled_order: number;
  revenue: string;
  id: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for manually updating Grab metrics
 */
export interface GrabMetricUpsertPayload {
  store_name: string;
  date?: string;
  completed_order?: number | null;
  cancelled_order?: number | null;
  revenue?: string | number | null;
}

/**
 * Interface for Grab performance summary
 */
export interface GrabPerformanceSummary {
  total_completed_orders: number;
  total_cancelled_orders: number;
  total_revenue: number;
  overall_cancellation_rate: number;
  store_statistics: Array<{
    store_name: string;
    completed_orders: number;
    cancelled_orders: number;
    revenue: number;
    order_cancellation_rate: number;
  }>;
}

/**
 * Fetches Grab metrics for a specific company
 * 
 * @param {string} companyId - The ID of the company
 * @returns {Promise<GrabMetric[]>} - A promise that resolves to an array of Grab metrics
 * @throws {Error} If company ID is missing or API request fails
 */
export async function getGrabMetrics(companyId: string): Promise<GrabMetric[]> {
  if (!companyId) {
    throw new Error('Company ID is required');
  }

  const endpoint = `${API_DOMAIN}/grab-metrics/?company_id=${encodeURIComponent(companyId)}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.message || 'Failed to fetch Grab metrics');
    }

    const data = await response.json();
    return data as GrabMetric[];
  } catch (error) {
    console.error('Grab metrics fetch error:', error);
    throw error;
  }
}

/**
 * Gets metrics for a specific store
 * 
 * @param {string} companyId - The ID of the company
 * @param {string} storeName - Store name to get metrics for
 * @returns {Promise<GrabMetric[]>} - A promise that resolves to an array of Grab metrics for the store
 * @throws {Error} If company ID or store name is missing or API request fails
 */
export async function getGrabMetricsByStore(
  companyId: string,
  storeName: string
): Promise<GrabMetric[]> {
  if (!companyId) {
    throw new Error('Company ID is required');
  }
  
  if (!storeName) {
    throw new Error('Store name is required');
  }

  const endpoint = `${API_DOMAIN}/grab-metrics/store/${encodeURIComponent(storeName)}?company_id=${encodeURIComponent(companyId)}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.detail || 'Failed to fetch Grab metrics for store');
    }

    const data = await response.json();
    return data as GrabMetric[];
  } catch (error) {
    console.error('Grab metrics fetch error for store:', error);
    throw error;
  }
}

/**
 * Manually upserts (insert or update) Grab metrics for a specific company and store
 * 
 * @param {string} companyId - The ID of the company
 * @param {string} storeName - The name of the store
 * @param {GrabMetricUpsertPayload} payload - Metrics data to upsert
 * @returns {Promise<GrabMetric>} - A promise that resolves to the upserted Grab metric
 * @throws {Error} If company ID is missing or API request fails
 */
export async function upsertGrabMetrics(
  companyId: string,
  storeName: string,
  payload: GrabMetricUpsertPayload
): Promise<GrabMetric> {
  if (!companyId) {
    throw new Error('Company ID is required');
  }

  if (!storeName) {
    throw new Error('Store name is required');
  }
  
  // Create a copy of the payload to modify
  const payloadCopy = { ...payload };
  
  // Extract the date from payload to use as a query parameter
  const dateStr = payloadCopy.date;
  delete payloadCopy.date; // Remove date from the request body
  
  // Build endpoint with date as query parameter if provided
  let endpoint = `${API_DOMAIN}/grab-metrics/upsert/${encodeURIComponent(storeName)}?company_id=${encodeURIComponent(companyId)}`;
  if (dateStr) {
    endpoint += `&date_str=${encodeURIComponent(dateStr)}`;
  }

  try {
    console.log(`Sending request to ${endpoint} with payload:`, payloadCopy);
    
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payloadCopy),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      // Create a more detailed error
      const errorMessage = typeof errorData === 'object' && errorData !== null 
        ? JSON.stringify(errorData) 
        : String(errorData);
        
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data as GrabMetric;
  } catch (error) {
    console.error('Grab metrics upsert error:', error);
    throw error;
  }
}

/**
 * Get performance summary across all stores
 * 
 * @param {string} companyId - The ID of the company
 * @returns {Promise<GrabPerformanceSummary>} - A promise that resolves to the store performance summary
 * @throws {Error} If company ID is missing or API request fails
 */
export async function getGrabPerformanceSummary(companyId: string): Promise<GrabPerformanceSummary> {
  if (!companyId) {
    throw new Error('Company ID is required');
  }

  const endpoint = `${API_DOMAIN}/grab-metrics/summary?company_id=${encodeURIComponent(companyId)}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.detail || 'Failed to fetch Grab performance summary');
    }

    return await response.json();
  } catch (error) {
    console.error('Grab performance summary fetch error:', error);
    throw error;
  }
}

/**
 * React Query hook for fetching Grab metrics
 * 
 * @param {string} companyId - The ID of the company
 * @param {object} options - Additional options to pass to useQuery
 * @returns {UseQueryResult<GrabMetric[]>} - The query result
 */
export function useGrabMetrics(
  companyId: string | undefined,
  options = {}
) {
  return useQuery({
    queryKey: ['grab-metrics', companyId],
    queryFn: () => companyId ? getGrabMetrics(companyId) : Promise.resolve([]),
    enabled: !!companyId,
    ...options,
  });
}

/**
 * React Query hook for fetching Grab metrics for a specific store
 * 
 * @param {string} companyId - The ID of the company
 * @param {string} storeName - The name of the store
 * @param {object} options - Additional options to pass to useQuery
 * @returns {UseQueryResult<GrabMetric[]>} - The query result
 */
export function useGrabMetricsByStore(
  companyId: string | undefined,
  storeName: string | undefined,
  options = {}
) {
  return useQuery({
    queryKey: ['grab-metrics', companyId, storeName],
    queryFn: () => companyId && storeName ? getGrabMetricsByStore(companyId, storeName) : Promise.resolve([]),
    enabled: !!companyId && !!storeName,
    ...options,
  });
}

/**
 * React Query hook for fetching Grab performance summary
 * 
 * @param {string} companyId - The ID of the company
 * @param {object} options - Additional options to pass to useQuery
 * @returns {UseQueryResult<GrabPerformanceSummary>} - The query result
 */
export function useGrabPerformanceSummary(
  companyId: string | undefined,
  options = {}
) {
  return useQuery({
    queryKey: ['grab-metrics-summary', companyId],
    queryFn: () => companyId ? getGrabPerformanceSummary(companyId) : Promise.resolve({}),
    enabled: !!companyId,
    ...options,
  });
}

/**
 * React Query mutation hook for upserting Grab metrics
 * 
 * @param {string} companyId - The ID of the company
 * @param {string} storeName - The name of the store
 * @param {object} options - Additional options to pass to useMutation
 * @returns {UseMutationResult} - The mutation result
 */
export function useGrabMetricsUpsert(
  companyId: string | undefined,
  storeName: string | undefined,
  options = {}
) {
  return useMutation({
    mutationFn: (payload: GrabMetricUpsertPayload) => {
      if (!companyId) {
        return Promise.reject(new Error('Company ID is required'));
      }
      if (!storeName && !payload.store_name) {
        return Promise.reject(new Error('Store Name is required'));
      }
      
      // Use the store name from the payload if provided, otherwise use the storeName parameter
      const actualStoreName = payload.store_name || storeName;
      
      return upsertGrabMetrics(companyId, actualStoreName as string, payload);
    },
    ...options,
  });
} 