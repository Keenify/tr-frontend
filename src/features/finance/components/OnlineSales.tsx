import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { format, subDays } from "date-fns";
import { useShopeeMetrics } from "../services/useShopeeMetrics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface OnlineSalesProps {
  session: Session;
}

type Platform = "shopee" | "lazada" | "shopify";

const OnlineSales: React.FC<OnlineSalesProps> = ({ session }) => {
  // Default to 7 days ago for start date
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("shopee");
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  
  // Extract company ID from session properly
  const companyId = useMemo(() => {
    return session?.user?.user_metadata?.company_id || 
           session?.user?.app_metadata?.company_id || 
           // Use type assertion with a more specific type
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
           ((session?.user as any)?.company_id) || 
           "88c966e3-ec86-4431-80fb-5b3a0e7af1e5"; // Fallback to example ID
  }, [session]);

  // Log company ID to help debug
  useEffect(() => {
    console.log("Company ID from session:", companyId);
    console.log("Full session:", session);
  }, [companyId, session]);
  
  // Fetch Shopee metrics using the hook
  const {
    data: shopeeMetrics,
    isLoading,
    error,
    refetch,
  } = useShopeeMetrics(
    companyId,
    format(startDate, "yyyy-MM-dd"),
    format(endDate, "yyyy-MM-dd")
  );

  // Memoize available shops to prevent recreating the array on every render
  const availableShops = useMemo(() => 
    shopeeMetrics ? [...new Set(shopeeMetrics.map(item => item.shop_id))].map(shopId => ({
      id: shopId,
      name: `Shop ${shopId}` // In a real implementation, you'd have actual shop names
    })) : []
  , [shopeeMetrics]);
  
  // Handle date changes with direct Date objects
  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newDate = new Date(e.target.value);
      if (!isNaN(newDate.getTime())) {
        setStartDate(newDate);
        // Automatically refetch data when date changes
        setTimeout(() => refetch(), 100);
      }
    }
  }, [refetch]);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newDate = new Date(e.target.value);
      if (!isNaN(newDate.getTime())) {
        setEndDate(newDate);
        // Automatically refetch data when date changes
        setTimeout(() => refetch(), 100);
      }
    }
  }, [refetch]);

  // Apply date range and fetch data - keep this for direct refresh calls elsewhere
  const handleDateRangeSubmit = useCallback(() => {
    console.log("Refreshing data for date range:", 
      format(startDate, "yyyy-MM-dd"), "to", format(endDate, "yyyy-MM-dd"));
    refetch();
  }, [startDate, endDate, refetch]);

  // Set the first shop as selected by default when data loads
  useEffect(() => {
    if (availableShops.length > 0 && !selectedShopId) {
      setSelectedShopId(availableShops[0].id);
    }
  }, [availableShops, selectedShopId]);

  // Filter metrics by selected shop
  const filteredMetrics = shopeeMetrics?.filter(metric => 
    selectedShopId ? metric.shop_id === selectedShopId : true
  );

  // Format data for charts - sort by date chronologically
  const chartData = useMemo(() => {
    const data = filteredMetrics?.map(metric => ({
      date: metric.date,
      revenue: metric.revenue,
      adsExpense: metric.ads_expense,
      totalOrders: metric.total_orders,
      newBuyers: metric.new_buyer_count,
      existingBuyers: metric.existing_buyer_count,
    })) || [];
    
    // Sort the data by date in ascending order (oldest to newest)
    return data.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
  }, [filteredMetrics]);

  // Calculate summary metrics
  const totalRevenue = filteredMetrics?.reduce((sum, metric) => sum + metric.revenue, 0) || 0;
  const totalOrders = filteredMetrics?.reduce((sum, metric) => sum + metric.total_orders, 0) || 0;
  const totalAdsExpense = filteredMetrics?.reduce((sum, metric) => sum + metric.ads_expense, 0) || 0;

  return (
    <div className="flex flex-col w-full p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Online Sales Dashboard
      </h1>

      {/* Date Range Indicator at the top */}
      <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-lg shadow">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">
            Showing data from {format(startDate, "MMM dd, yyyy")} to {format(endDate, "MMM dd, yyyy")}
          </h2>
          <p className="text-sm text-gray-500">
            Select different dates to update the dashboard
          </p>
        </div>
        <button
          onClick={handleDateRangeSubmit}
          className="text-blue-500 hover:text-blue-700"
          title="Refresh data"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Controls section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white rounded-lg shadow">
        <div className="flex flex-col flex-grow">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
            <div className="w-full md:w-auto">
              <label htmlFor="start-date" className="sr-only">Start Date</label>
              <input
                type="date"
                id="start-date"
                value={format(startDate, "yyyy-MM-dd")}
                onChange={handleStartDateChange}
                className="p-2 border border-gray-300 rounded-md w-full"
                data-testid="start-date-picker"
                aria-label="Start Date"
              />
            </div>
            <span className="text-gray-500">to</span>
            <div className="w-full md:w-auto">
              <label htmlFor="end-date" className="sr-only">End Date</label>
              <input
                type="date"
                id="end-date"
                value={format(endDate, "yyyy-MM-dd")}
                onChange={handleEndDateChange}
                className="p-2 border border-gray-300 rounded-md w-full"
                data-testid="end-date-picker"
                aria-label="End Date"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-md ${
                selectedPlatform === "shopee"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setSelectedPlatform("shopee")}
            >
              Shopee
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                selectedPlatform === "lazada"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setSelectedPlatform("lazada")}
              disabled
              title="Coming soon"
            >
              Lazada
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                selectedPlatform === "shopify"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setSelectedPlatform("shopify")}
              disabled
              title="Coming soon"
            >
              Shopify
            </button>
          </div>
        </div>

        {/* Shop selection (only shown when there are multiple shops) */}
        {availableShops.length > 1 && (
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Shopee Shop</label>
            <select
              className="p-2 border border-gray-300 rounded-md"
              value={selectedShopId || ""}
              onChange={(e) => setSelectedShopId(Number(e.target.value))}
              aria-label="Select Shopee Shop"
            >
              {availableShops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Loading and error states */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-md">
          <p>Error: {error instanceof Error ? error.message : "Failed to load metrics"}</p>
        </div>
      )}

      {/* Dashboard content - only shown for Shopee for now */}
      {selectedPlatform === "shopee" && !isLoading && !error ? (
        filteredMetrics && filteredMetrics.length > 0 ? (
          <>
            {/* Display shop info at the top */}
            <div className="mb-4 bg-white p-3 rounded-lg shadow">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Company ID:</span> {companyId}
                {selectedShopId && <> | <span className="font-medium">Shop ID:</span> {selectedShopId}</>}
              </p>
            </div>
          
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                <p className="text-2xl font-semibold text-gray-800">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
                <p className="text-2xl font-semibold text-gray-800">{totalOrders}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Ads Expense</h3>
                <p className="text-2xl font-semibold text-gray-800">${totalAdsExpense.toFixed(2)}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Revenue and Ads Expense Chart */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Revenue & Ads Expense</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => value.substring(5)} // Show MM-DD format
                        angle={-45} 
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value}`} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10B981"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                        name="Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="adsExpense"
                        stroke="#F97316"
                        strokeWidth={2}
                        name="Ads Expense"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Orders Chart */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Orders</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => value.substring(5)} // Show MM-DD format
                        angle={-45} 
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="newBuyers"
                        name="New Buyers"
                        stackId="a"
                        fill="#3B82F6"
                      />
                      <Bar
                        dataKey="existingBuyers"
                        name="Existing Buyers"
                        stackId="a"
                        fill="#EC4899"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Data table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <h3 className="text-lg font-medium text-gray-700 p-4 border-b">Metrics Data</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ads Expense
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        New Buyers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Existing Buyers
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMetrics?.map((metric) => (
                      <tr key={metric.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metric.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${metric.revenue.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${metric.ads_expense.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metric.total_orders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metric.new_buyer_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metric.existing_buyer_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gray-50 border border-gray-300 text-gray-700 p-8 rounded-md text-center">
            <p className="text-lg">No metrics data available for the selected period.</p>
            <p className="mt-2">Try selecting a different date range.</p>
            <p className="mt-4 text-sm text-gray-500">Current query: 
              <br />Company ID: {companyId || 'Not set'}
              <br />Date range: {format(startDate, "yyyy-MM-dd")} to {format(endDate, "yyyy-MM-dd")}
              {selectedShopId && <><br />Shop ID: {selectedShopId}</>}
            </p>
            <button 
              onClick={handleDateRangeSubmit} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Refresh Data
            </button>
          </div>
        )
      ) : selectedPlatform !== "shopee" ? (
        <div className="bg-gray-50 border border-gray-300 text-gray-700 p-8 rounded-md text-center">
          <p className="text-lg">Support for {selectedPlatform} is coming soon!</p>
          <p className="mt-2">We're currently working on integrating this platform.</p>
        </div>
      ) : null}
    </div>
  );
};

export default OnlineSales;
