import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Platform } from '../platform/PlatformSelector';

interface ChartDataPoint {
  date: string;
  revenue: number;
  adsExpense: number;
  totalOrders?: number;
  newBuyers?: number;
  existingBuyers?: number;
  cancelledOrders?: number;
  [key: string]: any;
}

interface RevenueChartProps {
  data: ChartDataPoint[];
  platform: Platform;
  shopIdentifier?: string;
}

/**
 * Enhanced component for rendering the Revenue & Ads Expense line chart
 * Shows revenue and ads expense trends over time with platform-specific styling
 */
const RevenueChart: React.FC<RevenueChartProps> = ({ data, platform, shopIdentifier }) => {
  // Platform-specific colors and styling
  const getRevenueColor = () => {
    return '#10B981'; // Green - consistent across all platforms
  };
  
  const getAdsExpenseColor = () => {
    return '#F97316'; // Orange - consistent across all platforms
  };

  // Custom tooltip formatter
  const formatTooltipValue = (value: any, name: string) => {
    if (name === 'revenue' || name === 'adsExpense') {
      return [`$${Number(value).toLocaleString()}`, name === 'revenue' ? 'Revenue' : 'Ads Expense'];
    }
    return [value, name];
  };

  // Custom date formatter for X-axis
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }).replace('/', '-');
  };

  // Custom date formatter for tooltip
  const formatTooltipDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  };

  // Calculate chart statistics
  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalAdsExpense = data.reduce((sum, item) => sum + (item.adsExpense || 0), 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          Revenue & Ads Expense
        </h3>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              domain={[0, 800]}
              ticks={[0, 200, 400, 600, 800]}
            />
            <Tooltip 
              formatter={formatTooltipValue}
              labelFormatter={formatTooltipDate}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              wrapperStyle={{ paddingTop: '10px' }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={getRevenueColor()}
              strokeWidth={3}
              activeDot={{ r: 8, stroke: getRevenueColor(), strokeWidth: 2, fill: 'white' }}
              name="Revenue"
              dot={{ r: 4, fill: getRevenueColor() }}
            />
            <Line
              type="monotone"
              dataKey="adsExpense"
              stroke={getAdsExpenseColor()}
              strokeWidth={3}
              activeDot={{ r: 8, stroke: getAdsExpenseColor(), strokeWidth: 2, fill: 'white' }}
              name="Ads Expense"
              dot={{ r: 4, fill: getAdsExpenseColor() }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      

    </div>
  );
};

export default RevenueChart;
export type { ChartDataPoint }; 