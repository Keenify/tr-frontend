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
import { Platform } from '../PlatformSelector';

interface ChartDataPoint {
  date: string;
  revenue: number;
  adsExpense: number;
  [key: string]: any;
}

interface RevenueChartProps {
  data: ChartDataPoint[];
  platform: Platform;
}

/**
 * Component for rendering the Revenue & Ads Expense chart
 */
const RevenueChart: React.FC<RevenueChartProps> = ({ data, platform }) => {
  // Platform-specific colors
  const getRevenueColor = () => {
    switch (platform) {
      case 'shopee': return '#10B981';
      case 'lazada': return '#3B82F6';
      case 'shopify': return '#059669';
      default: return '#10B981';
    }
  };
  
  const getAdsExpenseColor = () => {
    switch (platform) {
      case 'shopee': return '#F97316';
      case 'lazada': return '#8B5CF6';
      case 'shopify': return '#4F46E5';
      default: return '#F97316';
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-700 mb-2">Revenue & Ads Expense</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
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
              stroke={getRevenueColor()}
              strokeWidth={2}
              activeDot={{ r: 8 }}
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="adsExpense"
              stroke={getAdsExpenseColor()}
              strokeWidth={2}
              name="Ads Expense"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
export type { ChartDataPoint }; 