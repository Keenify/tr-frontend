import { useState, useEffect, useMemo, useCallback } from 'react';
import { useShopeeMetrics, ShopeeMetric } from '../services/useShopeeMetrics';
import { useLazadaMetrics, LazadaMetric } from '../services/useLazadaMetrics';
import { useShopifyMetrics, ShopifyMetric } from '../services/useShopifyMetrics';
import { useFoodpandaMetrics, FoodpandaMetric } from '../services/useFoodpandaMetrics';
import { useGrabMetrics, GrabMetric } from '../services/useGrabMetrics';
import { format } from 'date-fns';
import { Platform } from '../components/platform/PlatformSelector';
import { Entity } from '../components/platform/PlatformEntitySelector';
import { ChartDataPoint } from '../components/charts/RevenueChart';
import { FOODPANDA_SHOP_NAMES, REDMART_SHOP_NAMES } from '../constant/Shopname';
import { useQueries } from '@tanstack/react-query';
import { getFoodpandaMetrics } from '../services/useFoodpandaMetrics';

// Union type for all metric types
type MetricType = ShopeeMetric | LazadaMetric | ShopifyMetric | FoodpandaMetric | GrabMetric;

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
    platform === 'lazada' || platform === 'redmart' || platform === 'all_sg' || platform === 'all_my' ? companyId : undefined,
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

  if (platform === 'all_sg' || platform === 'all_my') {
    foodpandaMetrics = foodpandaQueries.flatMap(q => q.data || []);
    foodpandaLoading = foodpandaQueries.some(q => q.isLoading);
    foodpandaError = foodpandaQueries.find(q => q.error)?.error || null;
  } else {
    foodpandaMetrics = singleFoodpanda.data;
    foodpandaLoading = singleFoodpanda.isLoading;
    foodpandaError = singleFoodpanda.error as Error | null;
  }

  // --- FIX: Move refetchFoodpanda logic above refreshData ---
  const refetchFoodpandaAll = useCallback(
    async () => { await Promise.all(foodpandaQueries.map(q => q.refetch())); },
    [foodpandaQueries]
  );
  const refetchFoodpandaSingle = useCallback(
    () => singleFoodpanda.refetch(),
    [singleFoodpanda]
  );

  let refetchFoodpanda: () => Promise<unknown>;
  if (platform === 'all_sg' || platform === 'all_my') {
    refetchFoodpanda = refetchFoodpandaAll;
  } else {
    refetchFoodpanda = refetchFoodpandaSingle;
  }
  // --- END FIX ---

  // Fetch Grab metrics
  const {
    data: grabMetrics,
    isLoading: grabLoading,
    error: grabError,
    refetch: refetchGrab
  } = useGrabMetrics(
    platform === 'grab' || platform === 'all_sg' || platform === 'all_my' ? companyId : undefined,
    {
      enabled: (platform === 'grab' || platform === 'all_sg' || platform === 'all_my') && !!companyId
    }
  );

  // Get appropriate data, loading state, and error based on selected platform
  const metrics = useMemo((): MetricType[] => {
    if (platform === 'all_sg' || platform === 'all_my') {
      return [
        ...(shopeeMetrics || []),
        ...(lazadaMetrics || []),
        ...(shopifyMetrics || []),
        ...(foodpandaMetrics || []),
        ...(grabMetrics || [])
      ];
    }
    switch (platform) {
      case 'shopee': return shopeeMetrics || [];
      case 'lazada': return lazadaMetrics || [];
      case 'redmart': {
        // Filter Lazada metrics for Redmart accounts
        return (lazadaMetrics || []).filter(metric => 
          Object.keys(REDMART_SHOP_NAMES).includes(metric.account_id)
        );
      }
      case 'shopify': return shopifyMetrics || [];
      case 'foodpanda': return foodpandaMetrics || [];
      case 'grab': return grabMetrics || [];
      default: return [];
    }
  }, [platform, shopeeMetrics, lazadaMetrics, shopifyMetrics, foodpandaMetrics, grabMetrics]);

  const isLoading = useMemo(() => {
    if (platform === 'all_sg' || platform === 'all_my') {
      return shopeeLoading || lazadaLoading || shopifyLoading || grabLoading;
    }
    switch (platform) {
      case 'shopee': return shopeeLoading;
      case 'lazada': return lazadaLoading;
      case 'redmart': return lazadaLoading; // Redmart uses Lazada loading state
      case 'shopify': return shopifyLoading;
      case 'foodpanda': return foodpandaLoading;
      case 'grab': return grabLoading;
      default: return false;
    }
  }, [platform, shopeeLoading, lazadaLoading, shopifyLoading, foodpandaLoading, grabLoading]);

  const error = useMemo(() => {
    if (platform === 'all_sg' || platform === 'all_my') {
      return shopeeError || lazadaError || shopifyError || grabError || null;
    }
    switch (platform) {
      case 'shopee': return shopeeError;
      case 'lazada': return lazadaError;
      case 'redmart': return lazadaError; // Redmart uses Lazada error state
      case 'shopify': return shopifyError;
      case 'foodpanda': return foodpandaError;
      case 'grab': return grabError;
      default: return null;
    }
  }, [platform, shopeeError, lazadaError, shopifyError, foodpandaError, grabError]);

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
    } else if (platform === 'redmart' && lazadaMetrics) {
      // Filter for Redmart accounts from Lazada metrics
      const redmartAccountIds = Object.keys(REDMART_SHOP_NAMES);
      
      // First try to get from metrics
      const accountsFromMetrics = [...new Set(lazadaMetrics
        .filter(metric => redmartAccountIds.includes(metric.account_id))
        .map(item => item.account_id)
      )];
      
      // If no accounts found in metrics, use the ones from REDMART_SHOP_NAMES
      const accountIds = accountsFromMetrics.length > 0 ? 
        accountsFromMetrics : redmartAccountIds;
      
      return accountIds.map(accountId => ({
        id: accountId,
        name: REDMART_SHOP_NAMES[accountId] || accountId
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
    } else if (platform === 'grab' && grabMetrics) {
      return [...new Set(grabMetrics.map(item => item.store_name))]
        .map(storeName => ({
          id: storeName,
          name: storeName
        }));
    }
    return [];
  }, [platform, shopeeMetrics, lazadaMetrics, shopifyMetrics, foodpandaMetrics, grabMetrics]);

  // Filter metrics by selected entity
  const filteredMetrics = useMemo((): MetricType[] => {
    if (platform === 'shopee' && Array.isArray(metrics)) {
      return metrics.filter(metric => {
        const shopeeMetric = metric as ShopeeMetric;
        return selectedEntityId ? shopeeMetric.shop_id === selectedEntityId : true;
      });
    } else if ((platform === 'lazada' || platform === 'redmart') && Array.isArray(metrics)) {
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
    } else if (platform === 'grab' && Array.isArray(metrics)) {
      return metrics.filter(metric => {
        const grabMetric = metric as GrabMetric;
        return selectedEntityId ? grabMetric.store_name === selectedEntityId : true;
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
    } else if (platform === 'grab') {
      const data = filteredMetrics.map(metric => {
        const grabMetric = metric as GrabMetric;
        return {
          date: grabMetric.date,
          revenue: Number(grabMetric.revenue) || 0,
          adsExpense: 0, // Grab doesn't provide ads expense
          totalOrders: Number(grabMetric.completed_order) || 0,
          newBuyers: 0, // Grab doesn't provide this info
          existingBuyers: 0, // Grab doesn't provide this info
          cancelledOrders: Number(grabMetric.cancelled_order) || 0 // Extra field for Grab
        };
      });
      return data.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
    } else {
      // Lazada, Redmart and any other platforms
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
    } else if (platform === 'grab') {
      return filteredMetrics.reduce((sum, metric) => {
        const grabMetric = metric as GrabMetric;
        return sum + (Number(grabMetric.revenue) || 0);
      }, 0);
    } else {
      // Lazada and Redmart
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
    } else if (platform === 'grab') {
      return filteredMetrics.reduce((sum, metric) => {
        const grabMetric = metric as GrabMetric;
        return sum + (Number(grabMetric.completed_order) || 0);
      }, 0);
    } else {
      // Lazada and Redmart
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
      // Lazada, Redmart, and other platforms
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
      } else if (platform === 'lazada' || platform === 'redmart') {
        await refetchLazada();
      } else if (platform === 'shopify') {
        await refetchShopify();
      } else if (platform === 'foodpanda') {
        await refetchFoodpanda();
      } else if (platform === 'grab') {
        await refetchGrab();
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [platform, refetchShopee, refetchLazada, refetchShopify, refetchFoodpanda, refetchGrab]);

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