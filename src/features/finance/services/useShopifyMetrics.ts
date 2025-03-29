/**
 * Shopify Metrics Service Module
 * 
 * This module provides functionality for fetching Shopify metrics for a company.
 * 
 * @module ShopifyMetricsService
 */

import { useQuery } from "@tanstack/react-query";

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
