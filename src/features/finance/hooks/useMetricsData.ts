import { useState, useEffect, useMemo, useCallback } from 'react';
import { useShopeeMetrics } from '../services/useShopeeMetrics';
import { useLazadaMetrics } from '../services/useLazadaMetrics';
import { format } from 'date-fns';
import { Platform } from '../components/PlatformSelector';
import { Entity } from '../components/PlatformEntitySelector';
import { ChartDataPoint } from '../components/charts/RevenueChart';

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
  metrics: any[];
  filteredMetrics: any[];
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
    platform === 'shopee' ? companyId : undefined,
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
    platform === 'lazada' ? companyId : undefined,
    formattedStartDate,
    formattedEndDate
  );

  // Get appropriate data, loading state, and error based on selected platform
  const metrics = useMemo(() => {
    switch (platform) {
      case 'shopee': return shopeeMetrics || [];
      case 'lazada': return lazadaMetrics || [];
      default: return [];
    }
  }, [platform, shopeeMetrics, lazadaMetrics]);

  const isLoading = useMemo(() => {
    switch (platform) {
      case 'shopee': return shopeeLoading;
      case 'lazada': return lazadaLoading;
      default: return false;
    }
  }, [platform, shopeeLoading, lazadaLoading]);

  const error = useMemo(() => {
    switch (platform) {
      case 'shopee': return shopeeError;
      case 'lazada': return lazadaError;
      default: return null;
    }
  }, [platform, shopeeError, lazadaError]);

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
    }
    return [];
  }, [platform, shopeeMetrics, lazadaMetrics]);

  // Filter metrics by selected entity
  const filteredMetrics = useMemo(() => {
    if (platform === 'shopee') {
      return metrics.filter(metric => 
        selectedEntityId ? metric.shop_id === selectedEntityId : true
      );
    } else if (platform === 'lazada') {
      return metrics.filter(metric => 
        selectedEntityId ? metric.account_id === selectedEntityId : true
      );
    }
    return metrics;
  }, [platform, metrics, selectedEntityId]);

  // Format data for charts
  const chartData: ChartDataPoint[] = useMemo(() => {
    const data = filteredMetrics.map(metric => ({
      date: metric.date,
      revenue: Number(metric.revenue) || 0,
      adsExpense: Number(metric.ads_expense) || 0,
      totalOrders: Number(metric.total_orders) || 0,
      newBuyers: Number(metric.new_buyer_count) || 0,
      existingBuyers: Number(metric.existing_buyer_count) || 0,
    }));
    
    // Sort the data by date in ascending order (oldest to newest)
    return data.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
  }, [filteredMetrics]);

  // Calculate summary metrics
  const totalRevenue = useMemo(() => 
    filteredMetrics.reduce((sum, metric) => sum + (Number(metric.revenue) || 0), 0)
  , [filteredMetrics]);
  
  const totalOrders = useMemo(() => 
    filteredMetrics.reduce((sum, metric) => sum + (Number(metric.total_orders) || 0), 0)
  , [filteredMetrics]);
  
  const totalAdsExpense = useMemo(() => 
    filteredMetrics.reduce((sum, metric) => sum + (Number(metric.ads_expense) || 0), 0)
  , [filteredMetrics]);

  // Function to refresh data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (platform === 'shopee') {
        await refetchShopee();
      } else if (platform === 'lazada') {
        await refetchLazada();
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [platform, refetchShopee, refetchLazada]);

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