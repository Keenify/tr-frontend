import React, { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { subDays, startOfMonth, startOfYear, startOfDay, endOfDay } from "date-fns";
import { useUserAndCompanyData } from "../../../shared/hooks/useUserAndCompanyData";
import { SHOPEE_SHOP_NAMES, LAZADA_ACCOUNT_NAMES } from '../constant/Shopname';

// Import custom hook
import { useMetricsData } from "../hooks/useMetricsData";

// Import components
import PlatformSelector, { Platform } from "./PlatformSelector";
import DateRangeSelector from "./DateRangeSelector";
import PlatformEntitySelector from "./PlatformEntitySelector";
import PlatformInfoHeader from "./PlatformInfoHeader";
import MetricsSummary from "./MetricsSummary";
import RevenueChart from "./charts/RevenueChart";
import OrdersChart from "./charts/OrdersChart";
import MetricsDataTable from "./MetricsDataTable";
import EmptyStateMessage from "./EmptyStateMessage";

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
    if ((selectedPlatform === 'shopee' || selectedPlatform === 'lazada') && !selectedEntityId && entities.length > 0) {
      setSelectedEntityId(entities[0].id);
    }
    // eslint-disable-next-line
  }, [selectedPlatform, entities]);

  // Determine currency
  let currency = 'SGD';
  if (selectedPlatform === 'shopee') {
    if (selectedEntityId === 976040827 || selectedEntityId === '976040827') {
      currency = 'MYR';
    } else if (selectedEntityId === 2421911 || selectedEntityId === '2421911') {
      currency = 'SGD';
    }
  } else if (selectedPlatform === 'lazada') {
    if (selectedEntityId === 'leon@thekettlegourmet.com') {
      currency = 'MYR';
    } else if (selectedEntityId === 'flo@thekettlegourmet.com') {
      currency = 'SGD';
    }
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
  const enabledPlatforms: Platform[] = ["shopee", "lazada", "shopify"];

  let shopName: string | undefined = undefined;
  if (selectedPlatform === 'shopee') {
    shopName = SHOPEE_SHOP_NAMES[selectedEntityId as string] || selectedEntityId as string;
  } else if (selectedPlatform === 'lazada') {
    shopName = LAZADA_ACCOUNT_NAMES[selectedEntityId as string] || selectedEntityId as string;
  }

  return (
    <div className="flex flex-col w-full p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Online Sales Dashboard
      </h1>

      {/* Platform indicator */}
      <div className="mb-4">
        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
          selectedPlatform === "shopee" ? "bg-orange-100 text-orange-800" : 
          selectedPlatform === "lazada" ? "bg-blue-100 text-blue-800" : 
          "bg-green-100 text-green-800"
        }`}>
          {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Data
        </span>
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
            "border-green-500"
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
        filteredMetrics && filteredMetrics.length > 0 ? (
          <>
            {/* Platform info header */}
            <PlatformInfoHeader
              platform={selectedPlatform}
              companyId={companyInfo?.id}
              selectedEntityId={selectedEntityId}
            />
          
            {/* Summary cards */}
            <MetricsSummary
              totalRevenue={totalRevenue}
              totalOrders={totalOrders}
              totalAdsExpense={totalAdsExpense}
              currency={currency}
            />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Revenue Chart */}
              <RevenueChart data={chartData} platform={selectedPlatform} />

              {/* Orders Chart */}
              <OrdersChart data={chartData} platform={selectedPlatform} />
            </div>

            {/* Data table */}
            <MetricsDataTable data={filteredMetrics} platform={selectedPlatform} currency={currency} shopName={shopName} />

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
    </div>
  );
};

export default OnlineSales;
