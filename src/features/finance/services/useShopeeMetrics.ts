/**
 * Shopee Metrics Service Module
 * 
 * This module provides functionality for fetching Shopee metrics for a company.
 * 
 * @module ShopeeMetricsService
 */

import { useQuery, useMutation } from "@tanstack/react-query";

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Represents a Shopee Metrics record as returned by the API
 */
export interface ShopeeMetric {
  shop_id: number;
  date: string;
  revenue: number;
  ads_expense: number;
  total_orders: number;
  new_buyer_count: number;
  existing_buyer_count: number;
  id: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for manually updating Shopee metrics
 */
export interface ShopeeMetricUpsertPayload {
  shop_id: number;
  date: string;
  revenue?: string;
  ads_expense?: string;
  total_orders?: number;
  new_buyer_count?: number;
  existing_buyer_count?: number;
}

/**
 * Fetches Shopee metrics for a specific company within a date range
 * 
 * @param {string} companyId - The ID of the company
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<ShopeeMetric[]>} - A promise that resolves to an array of Shopee metrics
 * @throws {Error} If company ID is missing or API request fails
 */
export async function getShopeeMetrics(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<ShopeeMetric[]> {
  if (!companyId) {
    throw new Error('Company ID is required');
  }

  const endpoint = `${API_DOMAIN}/shopee-metrics/company/${encodeURIComponent(companyId)}?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;

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
      throw new Error(errorData.message || 'Failed to fetch Shopee metrics');
    }

    const data = await response.json();
    return data as ShopeeMetric[];
  } catch (error) {
    console.error('Shopee metrics fetch error:', error);
    throw error;
  }
}

/**
 * Manually upserts (insert or update) Shopee metrics for a specific company
 * 
 * @param {string} companyId - The ID of the company
 * @param {ShopeeMetricUpsertPayload} payload - Metrics data to upsert
 * @returns {Promise<ShopeeMetric>} - A promise that resolves to the upserted Shopee metric
 * @throws {Error} If company ID is missing or API request fails
 */
export async function upsertShopeeMetrics(
  companyId: string,
  payload: ShopeeMetricUpsertPayload
): Promise<ShopeeMetric> {
  if (!companyId) {
    throw new Error('Company ID is required');
  }

  const endpoint = `${API_DOMAIN}/shopee-metrics/company/${encodeURIComponent(companyId)}/manual-upsert`;

  console.log('🌐 Making API request:', {
    method: 'PUT',
    endpoint,
    payload,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  });

  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('📥 API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.detail || 'Failed to update Shopee metrics');
    }

    const data = await response.json();
    console.log('✅ API Success response:', data);
    return data as ShopeeMetric;
  } catch (error) {
    console.error('💥 Shopee metrics upsert error:', error);
    throw error;
  }
}

/**
 * React Query hook for fetching Shopee metrics
 * 
 * @param {string} companyId - The ID of the company
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {object} options - Additional options to pass to useQuery
 * @returns {UseQueryResult<ShopeeMetric[]>} - The query result
 */
export function useShopeeMetrics(
  companyId: string | undefined,
  startDate: string,
  endDate: string,
  options = {}
) {
  return useQuery({
    queryKey: ['shopee-metrics', companyId, startDate, endDate],
    queryFn: () => companyId ? getShopeeMetrics(companyId, startDate, endDate) : Promise.resolve([]),
    enabled: !!companyId,
    ...options,
  });
}

/**
 * React Query mutation hook for upserting Shopee metrics
 * 
 * @param {string} companyId - The ID of the company
 * @param {object} options - Additional options to pass to useMutation
 * @returns {UseMutationResult} - The mutation result
 */
export function useShopeeMetricsUpsert(
  companyId: string,
  options = {}
) {
  return useMutation({
    mutationFn: (payload: ShopeeMetricUpsertPayload) => upsertShopeeMetrics(companyId, payload),
    ...options,
  });
}
