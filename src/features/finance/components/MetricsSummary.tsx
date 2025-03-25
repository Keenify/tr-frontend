import React from 'react';

interface MetricsSummaryProps {
  totalRevenue: number;
  totalOrders: number;
  totalAdsExpense: number;
}

/**
 * Component to display summary metrics cards for revenue, orders, and ad expenses
 */
const MetricsSummary: React.FC<MetricsSummaryProps> = ({
  totalRevenue,
  totalOrders,
  totalAdsExpense
}) => {
  return (
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
  );
};

export default MetricsSummary; 