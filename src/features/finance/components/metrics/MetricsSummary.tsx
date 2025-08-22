import React from 'react';

interface MetricsSummaryProps {
  totalRevenue: number;
  totalOrders: number;
  totalAdsExpense: number;
  currency?: string;
}

/**
 * Simplified component to display basic summary metrics cards
 * Shows only revenue, orders, and ads expense on the dashboard
 * Detailed statistics are available in CSV/PDF downloads
 */
const MetricsSummary: React.FC<MetricsSummaryProps> = ({
  totalRevenue,
  totalOrders,
  totalAdsExpense,
  currency = 'SGD',
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Revenue Card */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500 mb-1">Total Revenue</h3>
        <p className="text-xl font-bold text-black">
          {currency} {totalRevenue.toFixed(2)}
        </p>
      </div>

      {/* Orders Card */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500 mb-1">Total Orders</h3>
        <p className="text-xl font-bold text-black">
          {totalOrders}
        </p>
      </div>

      {/* Ads Expense Card */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500 mb-1">Total Ads Expense</h3>
        <p className="text-xl font-bold text-black">
          {currency} {totalAdsExpense.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default MetricsSummary; 