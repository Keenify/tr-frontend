import { useState } from 'react';
import { Platform } from '../components/platform/PlatformSelector';
import { useShopeeMetrics } from '../services/useShopeeMetrics';
import { useLazadaMetrics } from '../services/useLazadaMetrics';
import { useShopifyMetrics } from '../services/useShopifyMetrics';
import { useFoodpandaMetrics } from '../services/useFoodpandaMetrics';
import { useGrabMetrics } from '../services/useGrabMetrics';
import { SHOPEE_SHOP_NAMES, LAZADA_ACCOUNT_NAMES, FOODPANDA_SHOP_NAMES, REDMART_SHOP_NAMES } from '../constant/Shopname';

interface ExportDataHookProps {
  companyId: string | undefined;
}

interface ExportMetric {
  date: string;
  revenue: number;
  total_orders?: number;
  completed_order?: number;
  cancelled_order?: number;
  ads_expense?: number;
  shop_id?: number | string;
  account_id?: string;
  store_id?: string;
  store_name?: string;
  currency: string;
}

interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
  ads_expense?: number;
}

interface PlatformData {
  metrics: ExportMetric[];
  chartData: ChartDataPoint[];
  totalRevenue: number;
  totalOrders: number;
  totalAdsExpense?: number;
  currency: string;
  entities: Array<{ id: string | number; name: string }>;
}

export const useExportData = ({ companyId }: ExportDataHookProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get individual platform hooks
  const shopeeHook = useShopeeMetrics({ companyId, startDate: new Date(), endDate: new Date() });
  const lazadaHook = useLazadaMetrics({ companyId, startDate: new Date(), endDate: new Date() });
  const shopifyHook = useShopifyMetrics({ companyId, startDate: new Date(), endDate: new Date() });
  const foodpandaHook = useFoodpandaMetrics({ companyId, startDate: new Date(), endDate: new Date() });
  const grabHook = useGrabMetrics({ companyId, startDate: new Date(), endDate: new Date() });

  const fetchPlatformData = async (
    platform: Platform,
    startDate: Date,
    endDate: Date
  ): Promise<PlatformData> => {
    try {
      setIsLoading(true);
      setError(null);

      switch (platform) {
        case 'shopee':
          return await fetchShopeeData(startDate, endDate);
        case 'lazada':
          return await fetchLazadaData(startDate, endDate);
        case 'redmart':
          return await fetchRedmartData(startDate, endDate);
        case 'shopify':
          return await fetchShopifyData(startDate, endDate);
        case 'foodpanda':
          return await fetchFoodpandaData(startDate, endDate);
        case 'grab':
          return await fetchGrabData(startDate, endDate);
        case 'all_sg':
          return await fetchAllSGData(startDate, endDate);
        case 'all_my':
          return await fetchAllMYData(startDate, endDate);
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShopeeData = async (startDate: Date, endDate: Date): Promise<PlatformData> => {
    const { refetch } = shopeeHook;
    const result = await refetch();
    
    if (!result.data) throw new Error('No Shopee data available');

    const metrics = result.data.map((item): ExportMetric => ({
      date: item.date,
      revenue: item.revenue,
      total_orders: item.total_orders,
      ads_expense: item.ads_expense,
      shop_id: item.shop_id,
      currency: item.shop_id === 976040827 ? 'MYR' : 'SGD'
    }));

    const chartData = result.data.map((item): ChartDataPoint => ({
      date: item.date,
      revenue: item.revenue,
      orders: item.total_orders,
      ads_expense: item.ads_expense
    }));

    const totalRevenue = metrics.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = metrics.reduce((sum, item) => sum + (item.total_orders || 0), 0);
    const totalAdsExpense = metrics.reduce((sum, item) => sum + (item.ads_expense || 0), 0);

    const entities = Object.entries(SHOPEE_SHOP_NAMES).map(([id, name]) => ({
      id: parseInt(id),
      name
    }));

    return {
      metrics,
      chartData,
      totalRevenue,
      totalOrders,
      totalAdsExpense,
      currency: 'SGD', // Default, varies by shop
      entities
    };
  };

  const fetchLazadaData = async (startDate: Date, endDate: Date): Promise<PlatformData> => {
    const { refetch } = lazadaHook;
    const result = await refetch();
    
    if (!result.data) throw new Error('No Lazada data available');

    const metrics = result.data.map((item): ExportMetric => ({
      date: item.date,
      revenue: item.revenue,
      total_orders: item.total_orders,
      ads_expense: item.ads_expense,
      account_id: item.account_id,
      currency: item.account_id === 'leon@thekettlegourmet.com' ? 'MYR' : 'SGD'
    }));

    const chartData = result.data.map((item): ChartDataPoint => ({
      date: item.date,
      revenue: item.revenue,
      orders: item.total_orders,
      ads_expense: item.ads_expense
    }));

    const totalRevenue = metrics.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = metrics.reduce((sum, item) => sum + (item.total_orders || 0), 0);
    const totalAdsExpense = metrics.reduce((sum, item) => sum + (item.ads_expense || 0), 0);

    const entities = Object.entries(LAZADA_ACCOUNT_NAMES).map(([id, name]) => ({
      id,
      name
    }));

    return {
      metrics,
      chartData,
      totalRevenue,
      totalOrders,
      totalAdsExpense,
      currency: 'SGD', // Default, varies by account
      entities
    };
  };

  const fetchRedmartData = async (startDate: Date, endDate: Date): Promise<PlatformData> => {
    // Redmart uses similar structure to Lazada
    const { refetch } = lazadaHook;
    const result = await refetch();
    
    if (!result.data) throw new Error('No Redmart data available');

    // Filter for Redmart accounts only
    const redmartData = result.data.filter(item => 
      Object.keys(REDMART_SHOP_NAMES).includes(item.account_id)
    );

    const metrics = redmartData.map((item): ExportMetric => ({
      date: item.date,
      revenue: item.revenue,
      total_orders: item.total_orders,
      ads_expense: item.ads_expense,
      account_id: item.account_id,
      currency: item.account_id === 'leon@thekettlegourmet.com' ? 'MYR' : 'SGD'
    }));

    const chartData = redmartData.map((item): ChartDataPoint => ({
      date: item.date,
      revenue: item.revenue,
      orders: item.total_orders,
      ads_expense: item.ads_expense
    }));

    const totalRevenue = metrics.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = metrics.reduce((sum, item) => sum + (item.total_orders || 0), 0);
    const totalAdsExpense = metrics.reduce((sum, item) => sum + (item.ads_expense || 0), 0);

    const entities = Object.entries(REDMART_SHOP_NAMES).map(([id, name]) => ({
      id,
      name
    }));

    return {
      metrics,
      chartData,
      totalRevenue,
      totalOrders,
      totalAdsExpense,
      currency: 'SGD',
      entities
    };
  };

  const fetchShopifyData = async (startDate: Date, endDate: Date): Promise<PlatformData> => {
    const { refetch } = shopifyHook;
    const result = await refetch();
    
    if (!result.data) throw new Error('No Shopify data available');

    const metrics = result.data.map((item): ExportMetric => ({
      date: item.date,
      revenue: item.revenue,
      total_orders: item.total_orders,
      ads_expense: item.ads_expense,
      store_id: item.store_id,
      currency: item.store_id === 'thekettlegourmet_my' ? 'MYR' : 'SGD'
    }));

    const chartData = result.data.map((item): ChartDataPoint => ({
      date: item.date,
      revenue: item.revenue,
      orders: item.total_orders,
      ads_expense: item.ads_expense
    }));

    const totalRevenue = metrics.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = metrics.reduce((sum, item) => sum + (item.total_orders || 0), 0);
    const totalAdsExpense = metrics.reduce((sum, item) => sum + (item.ads_expense || 0), 0);

    const entities = [
      { id: 'thekettlegourmet_sg', name: 'The Kettle Gourmet SG' },
      { id: 'thekettlegourmet_my', name: 'The Kettle Gourmet MY' }
    ];

    return {
      metrics,
      chartData,
      totalRevenue,
      totalOrders,
      totalAdsExpense,
      currency: 'SGD',
      entities
    };
  };

  const fetchFoodpandaData = async (startDate: Date, endDate: Date): Promise<PlatformData> => {
    const { refetch } = foodpandaHook;
    const result = await refetch();
    
    if (!result.data) throw new Error('No Foodpanda data available');

    const metrics = result.data.map((item): ExportMetric => ({
      date: item.date,
      revenue: item.revenue,
      total_orders: item.total_orders,
      shop_id: item.shop_id,
      currency: 'SGD'
    }));

    const chartData = result.data.map((item): ChartDataPoint => ({
      date: item.date,
      revenue: item.revenue,
      orders: item.total_orders
    }));

    const totalRevenue = metrics.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = metrics.reduce((sum, item) => sum + (item.total_orders || 0), 0);

    const entities = Object.entries(FOODPANDA_SHOP_NAMES).map(([id, name]) => ({
      id,
      name
    }));

    return {
      metrics,
      chartData,
      totalRevenue,
      totalOrders,
      currency: 'SGD',
      entities
    };
  };

  const fetchGrabData = async (startDate: Date, endDate: Date): Promise<PlatformData> => {
    const { refetch } = grabHook;
    const result = await refetch();
    
    if (!result.data) throw new Error('No Grab data available');

    const metrics = result.data.map((item): ExportMetric => ({
      date: item.date,
      revenue: item.revenue,
      completed_order: item.completed_order,
      cancelled_order: item.cancelled_order,
      store_name: item.store_name,
      currency: 'SGD'
    }));

    const chartData = result.data.map((item): ChartDataPoint => ({
      date: item.date,
      revenue: item.revenue,
      orders: item.completed_order
    }));

    const totalRevenue = metrics.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = metrics.reduce((sum, item) => sum + (item.completed_order || 0), 0);

    const entities = [
      { id: 'grab_default', name: 'Grab Store' }
    ];

    return {
      metrics,
      chartData,
      totalRevenue,
      totalOrders,
      currency: 'SGD',
      entities
    };
  };

  const fetchAllSGData = async (startDate: Date, endDate: Date): Promise<PlatformData> => {
    // Combine all Singapore data
    const [shopee, lazada, shopify, foodpanda, grab] = await Promise.all([
      fetchShopeeData(startDate, endDate),
      fetchLazadaData(startDate, endDate),
      fetchShopifyData(startDate, endDate),
      fetchFoodpandaData(startDate, endDate),
      fetchGrabData(startDate, endDate)
    ]);

    // Filter for SGD only
    const allMetrics = [
      ...shopee.metrics.filter(m => m.currency === 'SGD'),
      ...lazada.metrics.filter(m => m.currency === 'SGD'),
      ...shopify.metrics.filter(m => m.currency === 'SGD'),
      ...foodpanda.metrics,
      ...grab.metrics
    ];

    const allChartData = [
      ...shopee.chartData,
      ...lazada.chartData,
      ...shopify.chartData,
      ...foodpanda.chartData,
      ...grab.chartData
    ];

    const totalRevenue = allMetrics.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = allMetrics.reduce((sum, item) => sum + (item.total_orders || item.completed_order || 0), 0);
    const totalAdsExpense = allMetrics.reduce((sum, item) => sum + (item.ads_expense || 0), 0);

    return {
      metrics: allMetrics,
      chartData: allChartData,
      totalRevenue,
      totalOrders,
      totalAdsExpense,
      currency: 'SGD',
      entities: []
    };
  };

  const fetchAllMYData = async (startDate: Date, endDate: Date): Promise<PlatformData> => {
    // Combine all Malaysia data
    const [shopee, lazada, shopify] = await Promise.all([
      fetchShopeeData(startDate, endDate),
      fetchLazadaData(startDate, endDate),
      fetchShopifyData(startDate, endDate)
    ]);

    // Filter for MYR only
    const allMetrics = [
      ...shopee.metrics.filter(m => m.currency === 'MYR'),
      ...lazada.metrics.filter(m => m.currency === 'MYR'),
      ...shopify.metrics.filter(m => m.currency === 'MYR')
    ];

    const allChartData = [
      ...shopee.chartData,
      ...lazada.chartData,
      ...shopify.chartData
    ];

    const totalRevenue = allMetrics.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = allMetrics.reduce((sum, item) => sum + (item.total_orders || 0), 0);
    const totalAdsExpense = allMetrics.reduce((sum, item) => sum + (item.ads_expense || 0), 0);

    return {
      metrics: allMetrics,
      chartData: allChartData,
      totalRevenue,
      totalOrders,
      totalAdsExpense,
      currency: 'MYR',
      entities: []
    };
  };

  return {
    fetchPlatformData,
    isLoading,
    error
  };
};