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
import { Platform } from '../platform/PlatformSelector';
import { ChartDataPoint } from './RevenueChart';

interface OrdersChartProps {
  data: ChartDataPoint[];
  platform: Platform;
  shopIdentifier?: string;
}

/**
 * Enhanced component for rendering the Orders & Buyer Analytics bar chart
 * Shows new buyers, existing buyers, and total orders with platform-specific styling
 */
const OrdersChart: React.FC<OrdersChartProps> = ({ data, platform, shopIdentifier }) => {
  // Platform-specific colors and styling
  const getNewBuyersColor = () => {
    return '#3B82F6'; // Blue - consistent across all platforms
  };
  
  const getExistingBuyersColor = () => {
    return '#EC4899'; // Pink - consistent across all platforms
  };

  const getTotalOrdersColor = () => {
    return '#3B82F6'; // Blue - consistent with new buyers
  };

  const getCancelledOrdersColor = () => {
    return '#EF4444'; // Red color for cancelled orders
  };

  // Custom tooltip formatter
  const formatTooltipValue = (value: any, name: string) => {
    if (typeof value === 'number') {
      return [value.toLocaleString(), name];
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
  const totalOrders = data.reduce((sum, item) => sum + (item.totalOrders || 0), 0);

  const isGrabPlatform = platform === 'grab';

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          Orders
        </h3>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
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
              tickFormatter={(value) => value.toLocaleString()}
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
            {isGrabPlatform ? (
              // For Grab platform - show completed vs cancelled orders
              <>
                <Bar
                  dataKey="totalOrders"
                  name="Completed Orders"
                  fill={getTotalOrdersColor()}
                  stackId="a"
                />
                <Bar
                  dataKey="cancelledOrders"
                  name="Cancelled Orders"
                  fill={getCancelledOrdersColor()}
                  stackId="a"
                />
              </>
            ) : (
              // For other platforms - show new buyers and existing buyers (stacked)
              <>
                <Bar
                  dataKey="newBuyers"
                  name="New Buyers"
                  fill={getNewBuyersColor()}
                  stackId="a"
                />
                <Bar
                  dataKey="existingBuyers"
                  name="Existing Buyers"
                  fill={getExistingBuyersColor()}
                  stackId="a"
                />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
      

    </div>
  );
};

export default OrdersChart; 