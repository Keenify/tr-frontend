/**
 * Shopee Metrics Service Module
 * 
 * This module provides functionality for fetching Shopee metrics for a company.
 * 
 * @module ShopeeMetricsService
 */

import { useQuery } from "@tanstack/react-query";

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
