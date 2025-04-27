import { useState, useEffect, useMemo, useCallback } from 'react';
import { useShopeeMetrics, ShopeeMetric } from '../services/useShopeeMetrics';
import { useLazadaMetrics, LazadaMetric } from '../services/useLazadaMetrics';
import { useShopifyMetrics, ShopifyMetric } from '../services/useShopifyMetrics';
import { useFoodpandaMetrics, FoodpandaMetric } from '../services/useFoodpandaMetrics';
import { format } from 'date-fns';
import { Platform } from '../components/PlatformSelector';
import { Entity } from '../components/PlatformEntitySelector';
import { ChartDataPoint } from '../components/charts/RevenueChart';
import { FOODPANDA_SHOP_NAMES } from '../constant/Shopname';
import { useQueries } from '@tanstack/react-query';
import { getFoodpandaMetrics } from '../services/useFoodpandaMetrics';

// Union type for all metric types
type MetricType = ShopeeMetric | LazadaMetric | ShopifyMetric | FoodpandaMetric;

interface UseMetricsDataProps {
  platform: Platform;
  companyId?: string;
  startDate: Date;
  endDate: Date;
  selectedEntityId: string | number | null;
}

interface UseMetricsDataResult {
  isLoading: boolean;
  error: Error | null;
  metrics: MetricType[];
  filteredMetrics: MetricType[];
  chartData: ChartDataPoint[];
  entities: Entity[];
  totalRevenue: number;
  totalOrders: number;
  totalAdsExpense: number;
  refreshData: () => Promise<void>;
  isRefreshing: boolean;
}

/**
 * Custom hook for fetching and processing metrics data
 */
export function useMetricsData({
  platform,
  companyId,
  startDate,
  endDate,
  selectedEntityId
}: UseMetricsDataProps): UseMetricsDataResult {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Format dates for API calls
  const formattedStartDate = format(startDate, "yyyy-MM-dd");
  const formattedEndDate = format(endDate, "yyyy-MM-dd");

  // Fetch Shopee metrics
  const {
    data: shopeeMetrics,
    isLoading: shopeeLoading,
    error: shopeeError,
    refetch: refetchShopee
  } = useShopeeMetrics(
    platform === 'shopee' || platform === 'all_sg' || platform === 'all_my' ? companyId : undefined,
    formattedStartDate,
    formattedEndDate
  );

  // Fetch Lazada metrics
  const {
    data: lazadaMetrics,
    isLoading: lazadaLoading,
    error: lazadaError,
    refetch: refetchLazada
  } = useLazadaMetrics(
    platform === 'lazada' || platform === 'all_sg' || platform === 'all_my' ? companyId : undefined,
    formattedStartDate,
    formattedEndDate
  );

  // Fetch Shopify metrics
  const {
    data: shopifyMetrics,
    isLoading: shopifyLoading,
    error: shopifyError,
    refetch: refetchShopify
  } = useShopifyMetrics(
    platform === 'shopify' || platform === 'all_sg' || platform === 'all_my' ? companyId : undefined,
    formattedStartDate,
    formattedEndDate
  );

  // Always call both hooks, but only use the results as needed
  const foodpandaShopIds = Object.keys(FOODPANDA_SHOP_NAMES);
  const foodpandaQueries = useQueries({
    queries: foodpandaShopIds.map(shopId => ({
      queryKey: ['foodpanda-metrics', companyId, shopId, formattedStartDate, formattedEndDate],
      queryFn: () => companyId && shopId ? getFoodpandaMetrics(companyId, shopId, formattedStartDate, formattedEndDate) : Promise.resolve([]),
      enabled: !!companyId && !!shopId && (platform === 'all_sg' || platform === 'all_my'),
    }))
  });
  const singleFoodpanda = useFoodpandaMetrics(
    platform === 'foodpanda' ? companyId : undefined,
    platform === 'foodpanda' ? (selectedEntityId as string | undefined) : undefined,
    formattedStartDate,
    formattedEndDate
  );

  let foodpandaMetrics: FoodpandaMetric[] | undefined = undefined;
  let foodpandaLoading = false;
  let foodpandaError: Error | null = null;
  let refetchFoodpanda: () => Promise<unknown> = async () => {};

  if (platform === 'all_sg' || platform === 'all_my') {
    foodpandaMetrics = foodpandaQueries.flatMap(q => q.data || []);
    foodpandaLoading = foodpandaQueries.some(q => q.isLoading);
    foodpandaError = foodpandaQueries.find(q => q.error)?.error || null;
    refetchFoodpanda = async () => { await Promise.all(foodpandaQueries.map(q => q.refetch())); };
  } else {
    foodpandaMetrics = singleFoodpanda.data;
    foodpandaLoading = singleFoodpanda.isLoading;
    foodpandaError = singleFoodpanda.error as Error | null;
    refetchFoodpanda = singleFoodpanda.refetch;
  }

  // Get appropriate data, loading state, and error based on selected platform
  const metrics = useMemo((): MetricType[] => {
    if (platform === 'all_sg' || platform === 'all_my') {
      return [
        ...(shopeeMetrics || []),
        ...(lazadaMetrics || []),
        ...(shopifyMetrics || []),
        ...(foodpandaMetrics || [])
      ];
    }
    switch (platform) {
      case 'shopee': return shopeeMetrics || [];
      case 'lazada': return lazadaMetrics || [];
      case 'shopify': return shopifyMetrics || [];
      case 'foodpanda': return foodpandaMetrics || [];
      default: return [];
    }
  }, [platform, shopeeMetrics, lazadaMetrics, shopifyMetrics, foodpandaMetrics]);

  const isLoading = useMemo(() => {
    if (platform === 'all_sg' || platform === 'all_my') {
      return shopeeLoading || lazadaLoading || shopifyLoading;
    }
    switch (platform) {
      case 'shopee': return shopeeLoading;
      case 'lazada': return lazadaLoading;
      case 'shopify': return shopifyLoading;
      case 'foodpanda': return foodpandaLoading;
      default: return false;
    }
  }, [platform, shopeeLoading, lazadaLoading, shopifyLoading, foodpandaLoading]);

  const error = useMemo(() => {
    if (platform === 'all_sg' || platform === 'all_my') {
      return shopeeError || lazadaError || shopifyError || null;
    }
    switch (platform) {
      case 'shopee': return shopeeError;
      case 'lazada': return lazadaError;
      case 'shopify': return shopifyError;
      case 'foodpanda': return foodpandaError;
      default: return null;
    }
  }, [platform, shopeeError, lazadaError, shopifyError, foodpandaError]);

  // Extract entities (shops/accounts) from metrics data
  const entities = useMemo(() => {
    if (platform === 'shopee' && shopeeMetrics) {
      return [...new Set(shopeeMetrics.map(item => item.shop_id))]
        .map(shopId => ({
          id: shopId,
          name: `Shop ${shopId}`
        }));
    } else if (platform === 'lazada' && lazadaMetrics) {
      return [...new Set(lazadaMetrics.map(item => item.account_id))]
        .map(accountId => ({
          id: accountId,
          name: accountId
        }));
    } else if (platform === 'shopify' && shopifyMetrics) {
      return [...new Set(shopifyMetrics.map(item => item.store_id))]
        .map(storeId => ({
          id: storeId,
          name: storeId
        }));
    } else if (platform === 'foodpanda' && foodpandaMetrics) {
      return [...new Set(foodpandaMetrics.map(item => item.shop_id))]
        .map(shopId => ({
          id: shopId,
          name: shopId
        }));
    }
    return [];
  }, [platform, shopeeMetrics, lazadaMetrics, shopifyMetrics, foodpandaMetrics]);

  // Filter metrics by selected entity
  const filteredMetrics = useMemo((): MetricType[] => {
    if (platform === 'shopee' && Array.isArray(metrics)) {
      return metrics.filter(metric => {
        const shopeeMetric = metric as ShopeeMetric;
        return selectedEntityId ? shopeeMetric.shop_id === selectedEntityId : true;
      });
    } else if (platform === 'lazada' && Array.isArray(metrics)) {
      return metrics.filter(metric => {
        const lazadaMetric = metric as LazadaMetric;
        return selectedEntityId ? lazadaMetric.account_id === selectedEntityId : true;
      });
    } else if (platform === 'shopify' && Array.isArray(metrics)) {
      return metrics.filter(metric => {
        const shopifyMetric = metric as ShopifyMetric;
        return selectedEntityId ? shopifyMetric.store_id === selectedEntityId : true;
      });
    } else if (platform === 'foodpanda' && Array.isArray(metrics)) {
      return metrics.filter(metric => {
        const foodpandaMetric = metric as FoodpandaMetric;
        return selectedEntityId ? foodpandaMetric.shop_id === selectedEntityId : true;
      });
    }
    return metrics;
  }, [platform, metrics, selectedEntityId]);

  // Format data for charts
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (platform === 'shopify') {
      const data = filteredMetrics.map(metric => {
        const shopifyMetric = metric as ShopifyMetric;
        return {
          date: shopifyMetric.date,
          revenue: Number(shopifyMetric.new_customer_sales) + Number(shopifyMetric.existing_customer_sales) || 0,
          adsExpense: 0, // Shopify doesn't provide ads_expense in the API
          totalOrders: Number(shopifyMetric.session_completed_checkout_count) || 0,
          newBuyers: Number(shopifyMetric.new_customer_count) || 0,
          existingBuyers: Number(shopifyMetric.existing_customer_count) || 0,
        };
      });
      
      // Sort the data by date in ascending order (oldest to newest)
      return data.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
    } else if (platform === 'shopee') {
      const data = filteredMetrics.map(metric => {
        const shopeeMetric = metric as ShopeeMetric;
        return {
          date: shopeeMetric.date,
          revenue: Number(shopeeMetric.revenue) || 0,
          adsExpense: Number(shopeeMetric.ads_expense) || 0,
          totalOrders: Number(shopeeMetric.total_orders) || 0,
          newBuyers: Number(shopeeMetric.new_buyer_count) || 0,
          existingBuyers: Number(shopeeMetric.existing_buyer_count) || 0,
        };
      });
      
      // Sort the data by date in ascending order (oldest to newest)
      return data.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
    } else if (platform === 'foodpanda') {
      const data = filteredMetrics.map(metric => {
        const foodpandaMetric = metric as FoodpandaMetric;
        return {
          date: foodpandaMetric.date,
          revenue: Number(foodpandaMetric.revenue) || 0,
          adsExpense: 0, // Foodpanda doesn't provide ads_expense
          totalOrders: Number(foodpandaMetric.total_orders) || 0,
          newBuyers: 0,
          existingBuyers: 0,
        };
      });
      return data.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
    } else {
      // Lazada and any other platforms
      const data = filteredMetrics.map(metric => {
        const lazadaMetric = metric as LazadaMetric;
        return {
          date: lazadaMetric.date,
          revenue: Number(lazadaMetric.revenue) || 0,
          adsExpense: Number(lazadaMetric.ads_expense) || 0,
          totalOrders: Number(lazadaMetric.total_orders) || 0,
          newBuyers: Number(lazadaMetric.new_buyer_count) || 0,
          existingBuyers: Number(lazadaMetric.existing_buyer_count) || 0,
        };
      });
      
      // Sort the data by date in ascending order (oldest to newest)
      return data.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
    }
  }, [filteredMetrics, platform]);

  // Calculate summary metrics
  const totalRevenue = useMemo(() => {
    if (platform === 'shopify') {
      return filteredMetrics.reduce((sum, metric) => {
        const shopifyMetric = metric as ShopifyMetric;
        return sum + (Number(shopifyMetric.new_customer_sales) + Number(shopifyMetric.existing_customer_sales) || 0);
      }, 0);
    } else if (platform === 'shopee') {
      return filteredMetrics.reduce((sum, metric) => {
        const shopeeMetric = metric as ShopeeMetric;
        return sum + (Number(shopeeMetric.revenue) || 0);
      }, 0);
    } else if (platform === 'foodpanda') {
      return filteredMetrics.reduce((sum, metric) => {
        const foodpandaMetric = metric as FoodpandaMetric;
        return sum + (Number(foodpandaMetric.revenue) || 0);
      }, 0);
    } else {
      return filteredMetrics.reduce((sum, metric) => {
        const lazadaMetric = metric as LazadaMetric;
        return sum + (Number(lazadaMetric.revenue) || 0);
      }, 0);
    }
  }, [filteredMetrics, platform]);
  
  const totalOrders = useMemo(() => {
    if (platform === 'shopify') {
      return filteredMetrics.reduce((sum, metric) => {
        const shopifyMetric = metric as ShopifyMetric;
        return sum + (Number(shopifyMetric.session_completed_checkout_count) || 0);
      }, 0);
    } else if (platform === 'shopee') {
      return filteredMetrics.reduce((sum, metric) => {
        const shopeeMetric = metric as ShopeeMetric;
        return sum + (Number(shopeeMetric.total_orders) || 0);
      }, 0);
    } else if (platform === 'foodpanda') {
      return filteredMetrics.reduce((sum, metric) => {
        const foodpandaMetric = metric as FoodpandaMetric;
        return sum + (Number(foodpandaMetric.total_orders) || 0);
      }, 0);
    } else {
      return filteredMetrics.reduce((sum, metric) => {
        const lazadaMetric = metric as LazadaMetric;
        return sum + (Number(lazadaMetric.total_orders) || 0);
      }, 0);
    }
  }, [filteredMetrics, platform]);
  
  const totalAdsExpense = useMemo(() => {
    if (platform === 'shopify' || platform === 'foodpanda') {
      return 0; // Shopify and Foodpanda don't provide ads expense in the API
    } else if (platform === 'shopee') {
      return filteredMetrics.reduce((sum, metric) => {
        const shopeeMetric = metric as ShopeeMetric;
        return sum + (Number(shopeeMetric.ads_expense) || 0);
      }, 0);
    } else {
      return filteredMetrics.reduce((sum, metric) => {
        const lazadaMetric = metric as LazadaMetric;
        return sum + (Number(lazadaMetric.ads_expense) || 0);
      }, 0);
    }
  }, [filteredMetrics, platform]);

  // Function to refresh data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (platform === 'shopee') {
        await refetchShopee();
      } else if (platform === 'lazada') {
        await refetchLazada();
      } else if (platform === 'shopify') {
        await refetchShopify();
      } else if (platform === 'foodpanda') {
        await refetchFoodpanda();
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [platform, refetchShopee, refetchLazada, refetchShopify, refetchFoodpanda]);

  // Reset refreshing state when data or error changes
  useEffect(() => {
    if (isRefreshing) {
      setIsRefreshing(false);
    }
  }, [metrics, error, isRefreshing]);

  return {
    isLoading,
    error,
    metrics,
    filteredMetrics,
    chartData,
    entities,
    totalRevenue,
    totalOrders,
    totalAdsExpense,
    refreshData,
    isRefreshing
  };
} 