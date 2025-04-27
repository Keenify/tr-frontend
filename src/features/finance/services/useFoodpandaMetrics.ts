import { useQuery } from "@tanstack/react-query";

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

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
    // console.log('[Foodpanda API] Payload:', {
    //   companyId,
    //   shopId,
    //   startDate,
    //   endDate,
    //   endpoint
    // });
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    console.log('🍔 Foodpanda metrics endpoint:', endpoint);
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
    // console.log('[Foodpanda API] Response:', data);
    return data as FoodpandaMetric[];
  } catch (error) {
    console.error('Foodpanda metrics fetch error:', error);
    throw error;
  }
}

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
