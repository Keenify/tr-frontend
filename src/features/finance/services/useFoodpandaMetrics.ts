/**
 * Foodpanda Metrics Service Module
 * 
 * This module provides functionality for fetching and updating Foodpanda metrics for a company.
 * 
 * @module FoodpandaMetricsService
 */

import { useQuery, useMutation } from "@tanstack/react-query";

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Represents a Foodpanda Metrics record as returned by the API
 */
export interface FoodpandaMetric {
  shop_id: string;
  date: string;
  revenue: string;
  total_orders: number;
  id: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for manually updating Foodpanda metrics
 */
export interface FoodpandaMetricUpsertPayload {
  shop_id: string;
  date: string;
  revenue?: string;
  total_orders?: number;
}

/**
 * Fetches Foodpanda metrics for a specific company and shop within a date range
 * 
 * @param {string} companyId - The ID of the company
 * @param {string} shopId - The ID of the Foodpanda shop
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<FoodpandaMetric[]>} - A promise that resolves to an array of Foodpanda metrics
 * @throws {Error} If company ID or shop ID is missing or API request fails
 */
export async function getFoodpandaMetrics(
  companyId: string,
  shopId: string,
  startDate: string,
  endDate: string
): Promise<FoodpandaMetric[]> {
  if (!companyId) {
    throw new Error('Company ID is required');
  }
  if (!shopId) {
    throw new Error('Shop ID is required');
  }
  
  const endpoint = `${API_DOMAIN}/foodpanda-metrics/?company_id=${encodeURIComponent(companyId)}&shop_id=${encodeURIComponent(shopId)}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
  
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
      throw new Error(errorData.message || 'Failed to fetch Foodpanda metrics');
    }
    
    const data = await response.json();
    return data as FoodpandaMetric[];
  } catch (error) {
    console.error('Foodpanda metrics fetch error:', error);
    throw error;
  }
}

/**
 * Manually upserts (insert or update) Foodpanda metrics for a specific company
 * 
 * @param {string} companyId - The ID of the company
 * @param {FoodpandaMetricUpsertPayload} payload - Metrics data to upsert
 * @returns {Promise<FoodpandaMetric>} - A promise that resolves to the upserted Foodpanda metric
 * @throws {Error} If company ID is missing or API request fails
 */
export async function upsertFoodpandaMetrics(
  companyId: string,
  payload: FoodpandaMetricUpsertPayload
): Promise<FoodpandaMetric> {
  if (!companyId) {
    throw new Error('Company ID is required');
  }

  const endpoint = `${API_DOMAIN}/foodpanda-metrics/?company_id=${encodeURIComponent(companyId)}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.detail || 'Failed to update Foodpanda metrics');
    }

    const data = await response.json();
    return data as FoodpandaMetric;
  } catch (error) {
    console.error('Foodpanda metrics upsert error:', error);
    throw error;
  }
}

/**
 * React Query hook for fetching Foodpanda metrics
 * 
 * @param {string} companyId - The ID of the company
 * @param {string} shopId - The ID of the Foodpanda shop
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {object} options - Additional options to pass to useQuery
 * @returns {UseQueryResult<FoodpandaMetric[]>} - The query result
 */
export function useFoodpandaMetrics(
  companyId: string | undefined,
  shopId: string | undefined,
  startDate: string,
  endDate: string,
  options = {}
) {
  return useQuery({
    queryKey: ['foodpanda-metrics', companyId, shopId, startDate, endDate],
    queryFn: () => (companyId && shopId) ? getFoodpandaMetrics(companyId, shopId, startDate, endDate) : Promise.resolve([]),
    enabled: !!companyId && !!shopId,
    ...options,
  });
}

/**
 * React Query mutation hook for upserting Foodpanda metrics
 * 
 * @param {string} companyId - The ID of the company
 * @param {object} options - Additional options to pass to useMutation
 * @returns {UseMutationResult} - The mutation result
 */
export function useFoodpandaMetricsUpsert(
  companyId: string | undefined,
  options = {}
) {
  return useMutation({
    mutationFn: (payload: FoodpandaMetricUpsertPayload) => 
      companyId ? upsertFoodpandaMetrics(companyId, payload) : Promise.reject('Company ID is required'),
    ...options,
  });
}
