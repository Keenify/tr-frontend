/**
 * Lazada Metrics Service Module
 * 
 * This module provides functionality for fetching Lazada metrics for a company.
 * 
 * @module LazadaMetricsService
 */

import { useQuery } from "@tanstack/react-query";

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Represents a Lazada Metrics record as returned by the API
 */
export interface LazadaMetric {
  account_id: string;
  date: string;
  revenue: string;
  ads_expense: string;
  total_orders: number;
  new_buyer_count: number;
  existing_buyer_count: number;
  id: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches Lazada metrics for a specific company within a date range
 * 
 * @param {string} companyId - The ID of the company
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<LazadaMetric[]>} - A promise that resolves to an array of Lazada metrics
 * @throws {Error} If company ID is missing or API request fails
 */
export async function getLazadaMetrics(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<LazadaMetric[]> {
  if (!companyId) {
    throw new Error('Company ID is required');
  }

  const endpoint = `${API_DOMAIN}/lazada-metrics/company/${encodeURIComponent(companyId)}?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;

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
      throw new Error(errorData.message || 'Failed to fetch Lazada metrics');
    }

    const data = await response.json();
    return data as LazadaMetric[];
  } catch (error) {
    console.error('Lazada metrics fetch error:', error);
    throw error;
  }
}

/**
 * React Query hook for fetching Lazada metrics
 * 
 * @param {string} companyId - The ID of the company
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {object} options - Additional options to pass to useQuery
 * @returns {UseQueryResult<LazadaMetric[]>} - The query result
 */
export function useLazadaMetrics(
  companyId: string | undefined,
  startDate: string,
  endDate: string,
  options = {}
) {
  return useQuery({
    queryKey: ['lazada-metrics', companyId, startDate, endDate],
    queryFn: () => companyId ? getLazadaMetrics(companyId, startDate, endDate) : Promise.resolve([]),
    enabled: !!companyId,
    ...options,
  });
}
