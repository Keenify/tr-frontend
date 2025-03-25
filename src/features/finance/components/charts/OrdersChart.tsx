import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Platform } from '../PlatformSelector';
import { ChartDataPoint } from './RevenueChart';

interface OrdersChartProps {
  data: ChartDataPoint[];
  platform: Platform;
}

/**
 * Component for rendering the Orders chart showing new and existing buyers
 */
const OrdersChart: React.FC<OrdersChartProps> = ({ data, platform }) => {
  // Platform-specific colors
  const getNewBuyersColor = () => {
    switch (platform) {
      case 'shopee': return '#3B82F6';
      case 'lazada': return '#60A5FA';
      case 'shopify': return '#93C5FD';
      default: return '#3B82F6';
    }
  };
  
  const getExistingBuyersColor = () => {
    switch (platform) {
      case 'shopee': return '#EC4899';
      case 'lazada': return '#DB2777';
      case 'shopify': return '#BE185D';
      default: return '#EC4899';
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-700 mb-2">Orders</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
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
            <Tooltip />
            <Legend />
            <Bar
              dataKey="newBuyers"
              name="New Buyers"
              stackId="a"
              fill={getNewBuyersColor()}
            />
            <Bar
              dataKey="existingBuyers"
              name="Existing Buyers"
              stackId="a"
              fill={getExistingBuyersColor()}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OrdersChart; 