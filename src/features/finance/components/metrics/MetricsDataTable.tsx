import React from 'react';
import { Platform } from './PlatformSelector';
import { ShopeeMetric } from '../services/useShopeeMetrics';
import { LazadaMetric } from '../services/useLazadaMetrics';
import { ShopifyMetric } from '../services/useShopifyMetrics';
import { FoodpandaMetric } from '../services/useFoodpandaMetrics';
import { SHOPEE_SHOP_NAMES, LAZADA_ACCOUNT_NAMES, FOODPANDA_SHOP_NAMES } from "../../constant/Shopname";

type AllMetric = ShopeeMetric | LazadaMetric | ShopifyMetric | FoodpandaMetric;

interface MetricsDataTableProps {
  data: AllMetric[];
  platform: Platform;
  currency?: string;
  shopName?: string | number | null;
  isFoodpanda?: boolean;
}

/**
 * Component to display detailed metrics data in a table format
 */
const MetricsDataTable: React.FC<MetricsDataTableProps> = ({ data, platform, currency = 'SGD', shopName, isFoodpanda }) => {
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

  // Helper to get store label
  const getStoreLabel = (item: AllMetric) => {
    if ('shop_id' in item && 'total_orders' in item && 'revenue' in item && !('ads_expense' in item)) {
      // Foodpanda
      return `Foodpanda: ${FOODPANDA_SHOP_NAMES[item.shop_id] || item.shop_id}`;
    }
    if ('shop_id' in item) return `Shopee: ${SHOPEE_SHOP_NAMES[item.shop_id] || item.shop_id}`;
    if ('account_id' in item) return `Lazada: ${LAZADA_ACCOUNT_NAMES[item.account_id] || item.account_id}`;
    if ('store_id' in item) return `Shopify: ${item.store_id}`;
    return '-';
  };

  // Get the ID value from the data item
  const getIdFieldValue = (item: AllMetric) => {
    if (platform === 'shopee' && 'shop_id' in item) {
      return item.shop_id;
    } else if (platform === 'lazada' && 'account_id' in item) {
      return item.account_id;
    } else if (platform === 'shopify' && 'store_id' in item) {
      return item.store_id;
    } else if (platform === 'foodpanda' && 'shop_id' in item) {
      return item.shop_id;
    }
    return '-';
  };

  // Format the ID value for display
  const formatIdFieldValue = (value: string | number) => {
    // For Lazada, always show the full account id
    return value;
  };

  // Get revenue value based on row type
  const getRevenue = (item: AllMetric) => {
    if ('shop_id' in item && 'total_orders' in item && 'revenue' in item && !('ads_expense' in item)) {
      return Number(item.revenue);
    }
    if ('store_id' in item) {
      return Number(item.new_customer_sales) + Number(item.existing_customer_sales);
    }
    if ('shop_id' in item) {
      return item.revenue;
    }
    if ('account_id' in item) {
      return item.revenue;
    }
    return 0;
  };

  // Get ad expense value based on row type
  const getAdsExpense = (item: AllMetric) => {
    if ('shop_id' in item && 'total_orders' in item && 'revenue' in item && !('ads_expense' in item)) {
      return '0.00'; // Foodpanda doesn't have ads_expense
    }
    if ('store_id' in item) {
      return '0.00'; // Shopify doesn't have ads_expense in API
    }
    if ('shop_id' in item && 'ads_expense' in item) {
      return item.ads_expense;
    }
    if ('account_id' in item) {
      return item.ads_expense;
    }
    return '0.00';
  };

  // Get orders count based on row type
  const getOrdersCount = (item: AllMetric) => {
    if ('shop_id' in item && 'total_orders' in item && 'revenue' in item && !('ads_expense' in item)) {
      return item.total_orders;
    }
    if ('store_id' in item) {
      return item.session_completed_checkout_count;
    }
    if ('shop_id' in item && 'ads_expense' in item) {
      return item.total_orders;
    }
    if ('account_id' in item) {
      return item.total_orders;
    }
    return 0;
  };

  // Get new buyer count based on row type
  const getNewBuyerCount = (item: AllMetric) => {
    if ('store_id' in item) {
      return item.new_customer_count;
    }
    if ('shop_id' in item && 'ads_expense' in item) {
      return item.new_buyer_count;
    }
    if ('account_id' in item) {
      return item.new_buyer_count;
    }
    return 0;
  };

  // Get existing buyer count based on row type
  const getExistingBuyerCount = (item: AllMetric) => {
    if ('store_id' in item) {
      return item.existing_customer_count;
    }
    if ('shop_id' in item && 'ads_expense' in item) {
      return item.existing_buyer_count;
    }
    if ('account_id' in item) {
      return item.existing_buyer_count;
    }
    return 0;
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

  // For all_sg/all_my, add a Store column and deduplicate rows
  const isAllMode = platform === 'all_sg' || platform === 'all_my';

  // Deduplicate rows for all_sg/all_my by date+store+id, and sort by date descending
  let dedupedData = data;
  if (isAllMode) {
    const seen = new Set();
    dedupedData = data.filter(item => {
      const key = `${item.date}|${getStoreLabel(item)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    dedupedData = dedupedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Helper to format platform name for display
  const getPlatformDisplayName = () => {
    if (platform === 'all_sg') return 'All (SG)';
    if (platform === 'all_my') return 'All (MY)';
    return platform.charAt(0).toUpperCase() + platform.slice(1);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
      <h3 className={`text-lg font-medium p-4 border-b sticky top-0 z-20 ${getHeaderStyle()}`}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {getPlatformDisplayName()} Metrics Data
        {isAllMode && typeof shopName === 'string' && shopName ? (
          <div className="mt-1 text-sm text-gray-500">
            <span className="font-medium">Stores Included:</span>
            <ul className="list-disc list-inside text-xs text-gray-700 mt-1">
              {shopName.split(',').map((store: string, idx: number) => (
                <li key={idx}>{store.trim()}</li>
              ))}
            </ul>
          </div>
        ) : shopName ? (
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
              {isAllMode && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Store
                </th>
              )}
              {isFoodpanda ? (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Order Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Revenue
                  </th>
                </>
              ) : (
                <>
                  {!isAllMode && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      {getIdFieldName()}
                    </th>
                  )}
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
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dedupedData.map((item: AllMetric) => (
              <tr key={item.id + '-' + item.date + '-' + getStoreLabel(item)} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.date}
                </td>
                {isAllMode && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getStoreLabel(item)}
                  </td>
                )}
                {isFoodpanda ? (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {'total_orders' in item ? item.total_orders : 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency('revenue' in item ? item.revenue : 0)}
                    </td>
                  </>
                ) : (
                  <>
                    {!isAllMode && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatIdFieldValue(getIdFieldValue(item))}
                      </td>
                    )}
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