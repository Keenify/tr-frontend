import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { Platform } from '../platform/PlatformSelector';
import { calculateConsistentYAxisDomain, formatYAxisTick, generateYAxisTicks } from './chartUtils';

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
}

// Custom tooltip component
const CustomTooltip: React.FC<TooltipProps<any, any>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-gray-600 font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
          const value = entry.value;
          const name = entry.name;
          const color = entry.color;
          
          // Handle null, undefined, or invalid values
          if (value === null || value === undefined || isNaN(Number(value))) {
            return (
              <p key={index} style={{ color: color }} className="text-sm">
                {name}: $0.00
              </p>
            );
          }
          
          // Format the value with dollar symbol
          const formattedValue = Number(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          
          return (
            <p key={index} style={{ color: color }} className="text-sm">
              {name}: ${formattedValue}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

/**
 * Enhanced component for rendering the Revenue & Ads Expense line chart
 * Shows revenue and ads expense trends over time with platform-specific styling
 */
const RevenueChart: React.FC<RevenueChartProps> = ({ data, platform }) => {
  // Platform-specific colors and styling
  const getRevenueColor = () => {
    return '#10B981'; // Green - consistent across all platforms
  };
  
  const getAdsExpenseColor = () => {
    return '#F97316'; // Orange - consistent across all platforms
  };

  // Custom date formatter for X-axis
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }).replace('/', '-');
  };



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
              domain={calculateConsistentYAxisDomain(data)}
              ticks={generateYAxisTicks(calculateConsistentYAxisDomain(data)[1])}
              tickFormatter={(value) => formatYAxisTick(value, false)}
            />
            <Tooltip 
              content={<CustomTooltip />}
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
              dot={{ r: 4, fill: 'white', stroke: getRevenueColor(), strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="adsExpense"
              stroke={getAdsExpenseColor()}
              strokeWidth={3}
              activeDot={{ r: 8, stroke: getAdsExpenseColor(), strokeWidth: 2, fill: 'white' }}
              name="Ads Expense"
              dot={{ r: 4, fill: 'white', stroke: getAdsExpenseColor(), strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      

    </div>
  );
};

export default RevenueChart;
export type { ChartDataPoint }; 