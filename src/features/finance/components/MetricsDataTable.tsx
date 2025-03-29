import React from 'react';
import { Platform } from './PlatformSelector';
import { ShopeeMetric } from '../services/useShopeeMetrics';
import { LazadaMetric } from '../services/useLazadaMetrics';
import { ShopifyMetric } from '../services/useShopifyMetrics';

interface MetricsDataTableProps {
  data: (ShopeeMetric | LazadaMetric | ShopifyMetric)[];
  platform: Platform;
}

/**
 * Component to display detailed metrics data in a table format
 */
const MetricsDataTable: React.FC<MetricsDataTableProps> = ({ data, platform }) => {
  // Helper to safely convert string/number to formatted currency
  const formatCurrency = (value: string | number | undefined) => {
    if (value === undefined) return '$0.00';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `$${numValue.toFixed(2)}`;
  };

  // Get the platform-specific styling for the table header
  const getHeaderStyle = () => {
    switch (platform) {
      case 'shopee': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'lazada': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'shopify': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Determine the ID field name based on the platform
  const getIdFieldName = () => {
    switch (platform) {
      case 'shopee': return 'Shop ID';
      case 'lazada': return 'Account';
      case 'shopify': return 'Store';
      default: return 'ID';
    }
  };

  // Get the ID value from the data item
  const getIdFieldValue = (item: ShopeeMetric | LazadaMetric | ShopifyMetric) => {
    if (platform === 'shopee') {
      return (item as ShopeeMetric).shop_id;
    } else if (platform === 'lazada') {
      return (item as LazadaMetric).account_id;
    } else if (platform === 'shopify') {
      return (item as ShopifyMetric).store_id;
    }
    return '-';
  };

  // Format the ID value for display
  const formatIdFieldValue = (value: string | number) => {
    if (platform === 'lazada' && typeof value === 'string') {
      return value.length > 10 ? value.substring(0, 10) + '...' : value;
    }
    return value;
  };

  // Get revenue value based on platform
  const getRevenue = (item: ShopeeMetric | LazadaMetric | ShopifyMetric) => {
    if (platform === 'shopify') {
      const shopifyItem = item as ShopifyMetric;
      return Number(shopifyItem.new_customer_sales) + Number(shopifyItem.existing_customer_sales);
    }
    return item.revenue;
  };

  // Get ad expense value based on platform
  const getAdsExpense = (item: ShopeeMetric | LazadaMetric | ShopifyMetric) => {
    if (platform === 'shopify') {
      return '0.00'; // Shopify doesn't have ads_expense in API
    }
    return item.ads_expense;
  };

  // Get orders count based on platform
  const getOrdersCount = (item: ShopeeMetric | LazadaMetric | ShopifyMetric) => {
    if (platform === 'shopify') {
      return (item as ShopifyMetric).session_completed_checkout_count;
    }
    return item.total_orders;
  };

  // Get new buyer count based on platform
  const getNewBuyerCount = (item: ShopeeMetric | LazadaMetric | ShopifyMetric) => {
    if (platform === 'shopify') {
      return (item as ShopifyMetric).new_customer_count;
    }
    return item.new_buyer_count;
  };

  // Get existing buyer count based on platform
  const getExistingBuyerCount = (item: ShopeeMetric | LazadaMetric | ShopifyMetric) => {
    if (platform === 'shopify') {
      return (item as ShopifyMetric).existing_customer_count;
    }
    return item.existing_buyer_count;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <h3 className={`text-lg font-medium p-4 border-b ${getHeaderStyle()}`}>
        {platform.charAt(0).toUpperCase() + platform.slice(1)} Metrics Data
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {getIdFieldName()}
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
              {platform === 'shopify' && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bounce Rate
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatIdFieldValue(getIdFieldValue(item))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(getRevenue(item))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(getAdsExpense(item))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getOrdersCount(item)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getNewBuyerCount(item)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getExistingBuyerCount(item)}
                </td>
                {platform === 'shopify' && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(item as ShopifyMetric).session}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(item as ShopifyMetric).bounce_rate}%
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MetricsDataTable; 