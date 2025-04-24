import React from 'react';
import { Platform } from './PlatformSelector';
import { ShopeeMetric } from '../services/useShopeeMetrics';
import { LazadaMetric } from '../services/useLazadaMetrics';
import { ShopifyMetric } from '../services/useShopifyMetrics';

interface MetricsDataTableProps {
  data: (ShopeeMetric | LazadaMetric | ShopifyMetric)[];
  platform: Platform;
  currency?: string;
  shopName?: string | number | null;
}

/**
 * Component to display detailed metrics data in a table format
 */
const MetricsDataTable: React.FC<MetricsDataTableProps> = ({ data, platform, currency = 'SGD', shopName }) => {
  // Helper to safely convert string/number to formatted currency
  const formatCurrency = (value: string | number | undefined) => {
    if (value === undefined) return `${currency} 0.00`;
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${currency} ${numValue.toFixed(2)}`;
  };

  // Helper to safely convert string/number to number
  const parseNumber = (value: string | number | undefined): number => {
    if (value === undefined) return 0;
    return typeof value === 'string' ? parseFloat(value) : value;
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
    return platform === 'shopee' 
      ? (item as ShopeeMetric).revenue 
      : (item as LazadaMetric).revenue;
  };

  // Get ad expense value based on platform
  const getAdsExpense = (item: ShopeeMetric | LazadaMetric | ShopifyMetric) => {
    if (platform === 'shopify') {
      return '0.00'; // Shopify doesn't have ads_expense in API
    }
    return platform === 'shopee'
      ? (item as ShopeeMetric).ads_expense
      : (item as LazadaMetric).ads_expense;
  };

  // Get orders count based on platform
  const getOrdersCount = (item: ShopeeMetric | LazadaMetric | ShopifyMetric) => {
    if (platform === 'shopify') {
      return (item as ShopifyMetric).session_completed_checkout_count;
    }
    return platform === 'shopee'
      ? (item as ShopeeMetric).total_orders
      : (item as LazadaMetric).total_orders;
  };

  // Get new buyer count based on platform
  const getNewBuyerCount = (item: ShopeeMetric | LazadaMetric | ShopifyMetric) => {
    if (platform === 'shopify') {
      return (item as ShopifyMetric).new_customer_count;
    }
    return platform === 'shopee'
      ? (item as ShopeeMetric).new_buyer_count
      : (item as LazadaMetric).new_buyer_count;
  };

  // Get existing buyer count based on platform
  const getExistingBuyerCount = (item: ShopeeMetric | LazadaMetric | ShopifyMetric) => {
    if (platform === 'shopify') {
      return (item as ShopifyMetric).existing_customer_count;
    }
    return platform === 'shopee'
      ? (item as ShopeeMetric).existing_buyer_count
      : (item as LazadaMetric).existing_buyer_count;
  };

  // Calculate summary totals
  const calculateSummary = () => {
    const totals = {
      revenue: 0,
      adsExpense: 0,
      totalOrders: 0,
      newBuyers: 0,
      existingBuyers: 0,
      sessions: 0,
      addToCart: 0,
      completedCheckout: 0,
      newCustomerSales: 0,
      existingCustomerSales: 0
    };

    data.forEach(item => {
      // Common metrics across platforms
      totals.revenue += parseNumber(getRevenue(item));
      totals.adsExpense += parseNumber(getAdsExpense(item));
      totals.totalOrders += parseNumber(getOrdersCount(item));
      totals.newBuyers += parseNumber(getNewBuyerCount(item));
      totals.existingBuyers += parseNumber(getExistingBuyerCount(item));

      // Shopify specific metrics
      if (platform === 'shopify') {
        const shopifyItem = item as ShopifyMetric;
        totals.sessions += parseNumber(shopifyItem.session);
        totals.addToCart += parseNumber(shopifyItem.add_to_cart_count);
        totals.completedCheckout += parseNumber(shopifyItem.session_completed_checkout_count);
        totals.newCustomerSales += parseNumber(shopifyItem.new_customer_sales);
        totals.existingCustomerSales += parseNumber(shopifyItem.existing_customer_sales);
      }
    });

    return totals;
  };

  const summaryTotals = calculateSummary();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
      <h3 className={`text-lg font-medium p-4 border-b sticky top-0 z-20 ${getHeaderStyle()}`}>
        {platform.charAt(0).toUpperCase() + platform.slice(1)} Metrics Data
        {shopName ? (
          <span className="ml-2 text-sm text-gray-500">{shopName}</span>
        ) : null}
      </h3>
      <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                {getIdFieldName()}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Ads Expense
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Total Orders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                New Buyers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Existing Buyers
              </th>
              {platform === 'shopify' && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Bounce Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Add to Cart
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Completed Checkout
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    New Customer Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Existing Customer Sales
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(item as ShopifyMetric).add_to_cart_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(item as ShopifyMetric).session_completed_checkout_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency((item as ShopifyMetric).new_customer_sales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency((item as ShopifyMetric).existing_customer_sales)}
                    </td>
                  </>
                )}
              </tr>
            ))}
            
            {/* Summary row */}
            <tr className="bg-gray-50 font-medium sticky bottom-0 shadow-sm">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <strong>Total</strong>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                —
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <strong>{formatCurrency(summaryTotals.revenue)}</strong>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <strong>{formatCurrency(summaryTotals.adsExpense)}</strong>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <strong>{summaryTotals.totalOrders}</strong>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <strong>{summaryTotals.newBuyers}</strong>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <strong>{summaryTotals.existingBuyers}</strong>
              </td>
              {platform === 'shopify' && (
                <>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <strong>{summaryTotals.sessions}</strong>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    —
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <strong>{summaryTotals.addToCart}</strong>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <strong>{summaryTotals.completedCheckout}</strong>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <strong>{formatCurrency(summaryTotals.newCustomerSales)}</strong>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <strong>{formatCurrency(summaryTotals.existingCustomerSales)}</strong>
                  </td>
                </>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MetricsDataTable; 