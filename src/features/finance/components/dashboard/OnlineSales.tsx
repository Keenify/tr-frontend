import React, { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { subDays, startOfMonth, startOfYear, startOfDay, endOfDay } from "date-fns";
import { useUserAndCompanyData } from "../../../../shared/hooks/useUserAndCompanyData";
import { SHOPEE_SHOP_NAMES, LAZADA_ACCOUNT_NAMES, FOODPANDA_SHOP_NAMES, REDMART_SHOP_NAMES } from '../../constant/Shopname';

// Import custom hook
import { useMetricsData } from "../../hooks/useMetricsData";

// Import components
import PlatformSelector, { Platform } from "../platform/PlatformSelector";
import DateRangeSelector from "./DateRangeSelector";
import PlatformEntitySelector from "../platform/PlatformEntitySelector";
import PlatformInfoHeader from "../platform/PlatformInfoHeader";
import MetricsSummary from "../metrics/MetricsSummary";
import RevenueChart from "../charts/RevenueChart";
import OrdersChart from "../charts/OrdersChart";
import MetricsDataTable from "../metrics/MetricsDataTable";
import EmptyStateMessage from "./EmptyStateMessage";
import LazadaManualEntryModal from "../manual-entry/LazadaManualEntryModal";
import ShopifyManualEntryModal from "../manual-entry/ShopifyManualEntryModal";
import GrabManualEntryModal from "../manual-entry/GrabManualEntryModal";
import RedmartManualEntryModal from "../manual-entry/RedmartManualEntryModal";

// Import types
import { ShopeeMetric } from '../../services/useShopeeMetrics';
import { LazadaMetric } from '../../services/useLazadaMetrics';
import { ShopifyMetric } from '../../services/useShopifyMetrics';
import { FoodpandaMetric } from '../../services/useFoodpandaMetrics';
import { GrabMetric } from '../../services/useGrabMetrics';

interface OnlineSalesProps {
  session: Session;
}

/**
 * Online Sales Dashboard component
 * Displays sales metrics from multiple e-commerce platforms
 */
const OnlineSales: React.FC<OnlineSalesProps> = ({ session }) => {
  // Default to 7 days ago for start date
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("shopee");
  const [selectedEntityId, setSelectedEntityId] = useState<string | number | null>(null);
  const [isLazadaManualEntryOpen, setIsLazadaManualEntryOpen] = useState<boolean>(false);
  const [isShopifyManualEntryOpen, setIsShopifyManualEntryOpen] = useState<boolean>(false);
  const [isGrabManualEntryOpen, setIsGrabManualEntryOpen] = useState<boolean>(false);
  const [isRedmartManualEntryOpen, setIsRedmartManualEntryOpen] = useState<boolean>(false);

  // Get user and company data
  const { companyInfo, error: userDataError, isLoading: userDataLoading } = 
    useUserAndCompanyData(session.user.id);

  // Use custom hook for metrics data
  const {
    isLoading,
    error,
    filteredMetrics,
    chartData,
    entities,
    totalRevenue,
    totalOrders,
    totalAdsExpense,
    refreshData,
    isRefreshing
  } = useMetricsData({
    platform: selectedPlatform,
    companyId: companyInfo?.id,
    startDate,
    endDate,
    selectedEntityId
  });

  // After entities are loaded, set default Shopee shop if not set
  useEffect(() => {
    if ((selectedPlatform === 'shopee' || selectedPlatform === 'lazada' || selectedPlatform === 'foodpanda' || selectedPlatform === 'redmart') && !selectedEntityId && entities.length > 0) {
      setSelectedEntityId(entities[0].id);
    }
    // eslint-disable-next-line
  }, [selectedPlatform, entities]);

  // Set default Foodpanda shopId if not set
  useEffect(() => {
    if (selectedPlatform === 'foodpanda' && !selectedEntityId) {
      const shopIds = Object.keys(FOODPANDA_SHOP_NAMES);
      if (shopIds.length > 0) setSelectedEntityId(shopIds[0]);
    }
  }, [selectedPlatform, selectedEntityId]);

  // Set default Redmart shopId if not set
  useEffect(() => {
    if (selectedPlatform === 'redmart' && !selectedEntityId) {
      const shopIds = Object.keys(REDMART_SHOP_NAMES);
      if (shopIds.length > 0) setSelectedEntityId(shopIds[0]);
    }
  }, [selectedPlatform, selectedEntityId]);

  // Determine currency
  let currency = 'SGD';
  if (selectedPlatform === 'shopee') {
    if (selectedEntityId === 976040827 || selectedEntityId === '976040827') {
      currency = 'MYR';
    } else if (selectedEntityId === 2421911 || selectedEntityId === '2421911') {
      currency = 'SGD';
    }
  } else if (selectedPlatform === 'lazada' || selectedPlatform === 'redmart') {
    if (selectedEntityId === 'leon@thekettlegourmet.com') {
      currency = 'MYR';
    } else if (selectedEntityId === 'flo@thekettlegourmet.com' || selectedEntityId === 'czy199162@gmail.com') {
      currency = 'SGD';
    }
  } else if (selectedPlatform === 'foodpanda') {
    currency = 'SGD'; // Or set per shop if needed
  }

  // Handle date changes
  const handleStartDateChange = (date: Date) => {
    setStartDate(date);
    refreshData();
  };

  const handleEndDateChange = (date: Date) => {
    setEndDate(date);
    refreshData();
  };

  // Date range preset handlers
  const handleMonthTillDate = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(new Date());
    // We'll trigger a refresh in the next render cycle
    setTimeout(() => refreshData(), 0);
  };

  const handleYearTillDate = () => {
    setStartDate(startOfYear(new Date()));
    setEndDate(new Date());
    // We'll trigger a refresh in the next render cycle
    setTimeout(() => refreshData(), 0);
  };

  const handleYesterday = () => {
    const yesterday = subDays(new Date(), 1);
    setStartDate(startOfDay(yesterday));
    setEndDate(endOfDay(yesterday));
    // We'll trigger a refresh in the next render cycle
    setTimeout(() => refreshData(), 0);
  };

  // Handle platform selection
  const handlePlatformChange = (platform: Platform) => {
    setSelectedPlatform(platform);
    setSelectedEntityId(null); // Reset the entity selection when changing platforms
  };

  // Handle entity selection
  const handleEntityChange = (entityId: string | number) => {
    setSelectedEntityId(entityId);
  };

  // Handle manual entry for Lazada
  const handleOpenLazadaManualEntry = () => {
    if (!companyInfo?.id) {
      alert('Company information is required for manual entry');
      return;
    }
    setIsLazadaManualEntryOpen(true);
  };

  const handleLazadaManualEntryClose = () => {
    setIsLazadaManualEntryOpen(false);
    refreshData();
  };

  // Handle manual entry for Shopify
  const handleOpenShopifyManualEntry = () => {
    if (!companyInfo?.id) {
      alert('Company information is required for manual entry');
      return;
    }
    setIsShopifyManualEntryOpen(true);
  };

  const handleShopifyManualEntryClose = () => {
    setIsShopifyManualEntryOpen(false);
    refreshData();
  };

  // Handle manual entry for Grab
  const handleOpenGrabManualEntry = () => {
    if (!companyInfo?.id) {
      alert('Company information is required for manual entry');
      return;
    }
    setIsGrabManualEntryOpen(true);
  };

  const handleGrabManualEntryClose = () => {
    setIsGrabManualEntryOpen(false);
    refreshData();
  };

  // Handle manual entry for Redmart
  const handleOpenRedmartManualEntry = () => {
    if (!companyInfo?.id) {
      alert('Company information is required for manual entry');
      return;
    }
    setIsRedmartManualEntryOpen(true);
  };

  const handleRedmartManualEntryClose = () => {
    setIsRedmartManualEntryOpen(false);
    refreshData();
  };

  // Determine if manual entry should be shown
  const showManualEntry = () => {
    if (selectedPlatform === 'lazada') {
      return (
        <button 
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={handleOpenLazadaManualEntry}
        >
          Manual Entry
        </button>
      );
    } else if (selectedPlatform === 'redmart') {
      return (
        <button 
          className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          onClick={handleOpenRedmartManualEntry}
        >
          Manual Entry
        </button>
      );
    } else if (selectedPlatform === 'shopify') {
      return (
        <button 
          className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          onClick={handleOpenShopifyManualEntry}
        >
          Manual Entry
        </button>
      );
    } else if (selectedPlatform === 'grab') {
      return (
        <button 
          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600"
          onClick={handleOpenGrabManualEntry}
        >
          Manual Entry
        </button>
      );
    } else if (selectedPlatform === 'all_sg' || selectedPlatform === 'all_my') {
      return (
        <div className="flex space-x-2">
          <button 
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={handleOpenLazadaManualEntry}
          >
            Lazada Entry
          </button>
          <button 
            className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={handleOpenRedmartManualEntry}
          >
            Redmart Entry
          </button>
          <button 
            className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            onClick={handleOpenShopifyManualEntry}
          >
            Shopify Entry
          </button>
          <button 
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600"
            onClick={handleOpenGrabManualEntry}
          >
            Grab Entry
          </button>
        </div>
      );
    }
    return null;
  };

  // Handle loading state for user data
  if (userDataLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2">Loading user data...</p>
      </div>
    );
  }

  // Handle user data error
  if (userDataError) {
    return (
      <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-md">
        <p>Error: Failed to load user and company data</p>
      </div>
    );
  }

  // Determine enabled platforms
  const enabledPlatforms: Platform[] = ["shopee", "lazada", "redmart", "shopify", "foodpanda", "grab", "all_sg", "all_my"];

  // Determine if we're in all_sg or all_my mode
  const isAllSG = selectedPlatform === 'all_sg';
  const isAllMY = selectedPlatform === 'all_my';
  const allCurrency = isAllSG ? 'SGD' : isAllMY ? 'MYR' : undefined;

  type AllMetric = ShopeeMetric | LazadaMetric | ShopifyMetric | FoodpandaMetric | GrabMetric;

  // Filter metrics for all_sg/all_my
  let filteredAllMetrics = filteredMetrics;
  if (isAllSG || isAllMY) {
    filteredAllMetrics = filteredMetrics.filter((item: AllMetric) => {
      // Shopee, Lazada, Shopify all have currency field or can be inferred
      if ('currency' in item) return item.currency === allCurrency;
      // Fallback: Shopee/Lazada by shop/account id
      if ('shop_id' in item && 'ads_expense' in item) {
        if (allCurrency === 'SGD') return item.shop_id === 2421911;
        if (allCurrency === 'MYR') return item.shop_id === 976040827;
      }
      if ('account_id' in item) {
        if (allCurrency === 'SGD') return item.account_id === 'flo@thekettlegourmet.com';
        if (allCurrency === 'MYR') return item.account_id === 'leon@thekettlegourmet.com';
      }
      // Shopify: for all_sg, include all store_id; for all_my, exclude
      if ('store_id' in item) {
        return isAllSG;
      }
      // Foodpanda: for all_sg, include all foodpanda with SGD; for all_my, include all foodpanda with MYR
      if ('shop_id' in item && 'total_orders' in item && 'revenue' in item && !('ads_expense' in item)) {
        if (isAllSG) return true; // include all Foodpanda for SG
        if (isAllMY) return false; // adjust if you have MYR foodpanda
      }
      // Grab: include in all_sg, exclude from all_my (or adjust per your currency requirements)
      if ('store_name' in item && 'completed_order' in item && 'cancelled_order' in item) {
        if (isAllSG) return true; // include all Grab for SG
        if (isAllMY) return false; // adjust if you have MYR grab
      }
      return false;
    });
  }

  // For PlatformInfoHeader, collect included stores
  let includedStores: string[] = [];
  if (isAllSG || isAllMY) {
    const seen = new Set();
    includedStores = filteredAllMetrics.map((item: AllMetric) => {
      if ('shop_id' in item && 'total_orders' in item && 'revenue' in item && !('ads_expense' in item)) {
        // Foodpanda
        return `Foodpanda: ${FOODPANDA_SHOP_NAMES[item.shop_id] || item.shop_id}`;
      }
      if ('store_name' in item && 'completed_order' in item && 'cancelled_order' in item) {
        // Grab
        return `Grab: ${item.store_name}`;
      }
      if ('shop_id' in item) return `Shopee: ${SHOPEE_SHOP_NAMES[item.shop_id] || item.shop_id}`;
      if ('account_id' in item) return `Lazada: ${LAZADA_ACCOUNT_NAMES[item.account_id] || item.account_id}`;
      if ('store_id' in item) return `Shopify: ${item.store_id}`;
      return '';
    }).filter(store => {
      if (!store || seen.has(store)) return false;
      seen.add(store);
      return true;
    });
  }

  let shopName: string | undefined = undefined;
  if (selectedPlatform === 'shopee') {
    shopName = SHOPEE_SHOP_NAMES[selectedEntityId as string] || selectedEntityId as string;
  } else if (selectedPlatform === 'lazada') {
    shopName = LAZADA_ACCOUNT_NAMES[selectedEntityId as string] || selectedEntityId as string;
  } else if (selectedPlatform === 'redmart') {
    shopName = REDMART_SHOP_NAMES[selectedEntityId as string] || selectedEntityId as string;
  } else if (selectedPlatform === 'foodpanda') {
    shopName = FOODPANDA_SHOP_NAMES[selectedEntityId as string] || selectedEntityId as string;
  }

  return (
    <div className="flex flex-col w-full p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Online Sales Dashboard
      </h1>

      {/* Platform indicator */}
      <div className="mb-4 flex justify-between items-center">
        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
          selectedPlatform === "shopee" ? "bg-orange-100 text-orange-800" : 
          selectedPlatform === "lazada" ? "bg-blue-100 text-blue-800" : 
          selectedPlatform === "shopify" ? "bg-green-100 text-green-800" :
          selectedPlatform === "all_sg" ? "bg-gray-800 text-white" :
          selectedPlatform === "all_my" ? "bg-yellow-800 text-white" :
          "bg-gray-100 text-gray-800"
        }`}>
          {isAllSG ? 'All (SG)' : isAllMY ? 'All (MY)' : selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Data
        </span>

        {/* Manual Entry Buttons */}
        {showManualEntry()}
      </div>

      {/* Controls section - reorganized into two main sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left section: Date Range Controls */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Date Range</h3>
          <div className="flex flex-col gap-4">
            {/* Date selector with YESTERDAY button beside tick */}
            <DateRangeSelector
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
              onSubmit={refreshData}
              isRefreshing={isRefreshing}
              extraButton={
                <button
                  onClick={handleYesterday}
                  className="py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-md transition shadow-sm border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  title="Set date range to yesterday"
                >
                  YESTERDAY
                </button>
              }
              hideLabel={true}
            />
            
            {/* Date range presets */}
            <div className="flex gap-3">
              <button
                onClick={handleMonthTillDate}
                className="flex-1 py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-md transition shadow-sm border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                MONTH TILL DATE
              </button>
              <button
                onClick={handleYearTillDate}
                className="flex-1 py-2 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium rounded-md transition shadow-sm border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                YEAR TILL DATE
              </button>
            </div>
          </div>
        </div>

        {/* Right section: Platform Controls */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Platform</h3>
          <div className="flex flex-col gap-4">
            {/* Platform selector */}
            <PlatformSelector
              selectedPlatform={selectedPlatform}
              onPlatformChange={handlePlatformChange}
              enabledPlatforms={enabledPlatforms}
              hideLabel={true}
            />

            {/* Entity selector (shop/account/store) */}
            <PlatformEntitySelector
              platform={selectedPlatform}
              entities={entities}
              selectedEntityId={selectedEntityId}
              onEntityChange={handleEntityChange}
            />
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && !isRefreshing && (
        <div className="flex justify-center items-center h-64">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
            selectedPlatform === "shopee" ? "border-orange-500" : 
            selectedPlatform === "lazada" ? "border-blue-500" : 
            selectedPlatform === "shopify" ? "border-green-500" :
            selectedPlatform === "all_sg" ? "border-gray-800" :
            selectedPlatform === "all_my" ? "border-yellow-800" :
            "border-gray-500"
          }`}></div>
        </div>
      )}

      {/* Refreshing indicator */}
      {isRefreshing && (
        <div className="flex justify-center items-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          <span className="text-blue-500">Refreshing data...</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-md">
          <p>Error: {error instanceof Error ? error.message : "Failed to load metrics"}</p>
        </div>
      )}

      {/* Dashboard content */}
      {!isLoading && !error ? (
        filteredAllMetrics && filteredAllMetrics.length > 0 ? (
          <>
            {/* Platform info header */}
            <PlatformInfoHeader
              platform={selectedPlatform}
              companyId={companyInfo?.id}
              selectedEntityId={selectedEntityId}
              includedStores={includedStores}
            />
          
            {/* Summary cards */}
            <MetricsSummary
              totalRevenue={totalRevenue}
              totalOrders={totalOrders}
              totalAdsExpense={totalAdsExpense}
              currency={allCurrency || currency}
            />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Revenue Chart */}
              <RevenueChart data={chartData} platform={selectedPlatform} />

              {/* Orders Chart */}
              <OrdersChart data={chartData} platform={selectedPlatform} />
            </div>

            {/* Data table */}
            <MetricsDataTable data={filteredAllMetrics} platform={selectedPlatform} currency={allCurrency || currency} shopName={isAllSG || isAllMY ? includedStores.join(', ') : shopName} isFoodpanda={selectedPlatform === 'foodpanda' || isAllSG} />

            {/* Refresh button */}
            <button 
              onClick={refreshData} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>Refreshing...</span>
                </>
              ) : (
                "Refresh Data"
              )}
            </button>
          </>
        ) : (
          <EmptyStateMessage
            platform={selectedPlatform}
            companyId={companyInfo?.id}
            startDate={startDate}
            endDate={endDate}
            selectedEntityId={selectedEntityId}
            onRefresh={refreshData}
            isRefreshing={isRefreshing}
          />
        )
      ) : null}

      {/* Manual Entry Modals */}
      {companyInfo?.id && isLazadaManualEntryOpen && (
        <LazadaManualEntryModal
          isOpen={isLazadaManualEntryOpen}
          onClose={handleLazadaManualEntryClose}
          companyId={companyInfo.id}
        />
      )}

      {companyInfo?.id && isRedmartManualEntryOpen && (
        <RedmartManualEntryModal
          isOpen={isRedmartManualEntryOpen}
          onClose={handleRedmartManualEntryClose}
          companyId={companyInfo.id}
        />
      )}

      {companyInfo?.id && isShopifyManualEntryOpen && (
        <ShopifyManualEntryModal
          isOpen={isShopifyManualEntryOpen}
          onClose={handleShopifyManualEntryClose}
          companyId={companyInfo.id}
        />
      )}

      {companyInfo?.id && isGrabManualEntryOpen && (
        <GrabManualEntryModal
          isOpen={isGrabManualEntryOpen}
          onClose={handleGrabManualEntryClose}
          companyId={companyInfo.id}
        />
      )}
    </div>
  );
};

export default OnlineSales;
