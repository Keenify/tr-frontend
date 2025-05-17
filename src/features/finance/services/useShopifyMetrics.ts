/**
 * Shopify Metrics Service Module
 * 
 * This module provides functionality for fetching Shopify metrics for a company.
 * 
 * @module ShopifyMetricsService
 */

import { useQuery, useMutation } from "@tanstack/react-query";

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Represents a Shopify Metrics record as returned by the API
 */
export interface ShopifyMetric {
  store_id: string;
  date: string;
  session: number;
  bounce_rate: string;
  add_to_cart_count: number;
  session_completed_checkout_count: number;
  new_customer_count: number;
  existing_customer_count: number;
  new_customer_sales: string;
  existing_customer_sales: string;
  id: string;
  company_id: string;
  created_at: string;
}

/**
 * Interface for manually updating Shopify metrics
 */
export interface ShopifyMetricUpsertPayload {
  store_id: string;
  date: string;
  session?: number;
  bounce_rate?: string;
  add_to_cart_count?: number;
  session_completed_checkout_count?: number;
  new_customer_count?: number;
  existing_customer_count?: number;
  new_customer_sales?: string;
  existing_customer_sales?: string;
}

/**
 * Fetches Shopify metrics for a specific company within a date range
 * 
 * @param {string} companyId - The ID of the company
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<ShopifyMetric[]>} - A promise that resolves to an array of Shopify metrics
 * @throws {Error} If company ID is missing or API request fails
 */
export async function getShopifyMetrics(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<ShopifyMetric[]> {
  if (!companyId) {
    throw new Error('Company ID is required');
  }

  const endpoint = `${API_DOMAIN}/shopify-metrics/period?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&company_id=${encodeURIComponent(companyId)}`;

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
      throw new Error(errorData.message || 'Failed to fetch Shopify metrics');
    }

    const data = await response.json();
    return data as ShopifyMetric[];
  } catch (error) {
    console.error('Shopify metrics fetch error:', error);
    throw error;
  }
}

/**
 * Manually upserts (insert or update) Shopify metrics for a specific company and store
 * 
 * @param {string} companyId - The ID of the company
 * @param {ShopifyMetricUpsertPayload} payload - Metrics data to upsert
 * @returns {Promise<ShopifyMetric>} - A promise that resolves to the upserted Shopify metric
 * @throws {Error} If company ID is missing or API request fails
 */
export async function upsertShopifyMetrics(
  companyId: string,
  payload: ShopifyMetricUpsertPayload
): Promise<ShopifyMetric> {
  if (!companyId) {
    throw new Error('Company ID is required');
  }

  if (!payload.store_id) {
    throw new Error('Store ID is required');
  }

  if (!payload.date) {
    throw new Error('Date is required');
  }

  const { store_id, date, ...updateData } = payload;

  const endpoint = `${API_DOMAIN}/shopify-metrics/by-store-date?company_id=${encodeURIComponent(companyId)}&store_id=${encodeURIComponent(store_id)}&date=${encodeURIComponent(date)}`;

  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.detail || 'Failed to update Shopify metrics');
    }

    const data = await response.json();
    return data as ShopifyMetric;
  } catch (error) {
    console.error('Shopify metrics upsert error:', error);
    throw error;
  }
}

/**
 * React Query hook for fetching Shopify metrics
 * 
 * @param {string} companyId - The ID of the company
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {object} options - Additional options to pass to useQuery
 * @returns {UseQueryResult<ShopifyMetric[]>} - The query result
 */
export function useShopifyMetrics(
  companyId: string | undefined,
  startDate: string,
  endDate: string,
  options = {}
) {
  return useQuery({
    queryKey: ['shopify-metrics', companyId, startDate, endDate],
    queryFn: () => companyId ? getShopifyMetrics(companyId, startDate, endDate) : Promise.resolve([]),
    enabled: !!companyId,
    ...options,
  });
}

/**
 * React Query mutation hook for upserting Shopify metrics
 * 
 * @param {string} companyId - The ID of the company
 * @param {object} options - Additional options to pass to useMutation
 * @returns {UseMutationResult} - The mutation result
 */
export function useShopifyMetricsUpsert(
  companyId: string | undefined,
  options = {}
) {
  return useMutation({
    mutationFn: (payload: ShopifyMetricUpsertPayload) => 
      companyId ? upsertShopifyMetrics(companyId, payload) : Promise.reject('Company ID is required'),
    ...options,
  });
}
