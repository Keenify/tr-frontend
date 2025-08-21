import { ChartDataPoint } from './RevenueChart';

/**
 * Calculate consistent Y-axis domain for both Revenue and Orders charts
 * This ensures both charts have the same scale for easy comparison
 */
export const calculateConsistentYAxisDomain = (data: ChartDataPoint[]) => {
  if (!data || data.length === 0) return [0, 100];
  
  // Calculate max values for revenue and ads expense
  const maxRevenue = Math.max(...data.map(item => item.revenue || 0));
  const maxAdsExpense = Math.max(...data.map(item => item.adsExpense || 0));
  
  // Calculate max values for orders
  const maxTotalOrders = Math.max(...data.map(item => item.totalOrders || 0));
  const maxNewBuyers = Math.max(...data.map(item => item.newBuyers || 0));
  const maxExistingBuyers = Math.max(...data.map(item => item.existingBuyers || 0));
  const maxCancelledOrders = Math.max(...data.map(item => item.cancelledOrders || 0));
  
  // Find the overall maximum value across all metrics
  const maxValue = Math.max(
    maxRevenue,
    maxAdsExpense,
    maxTotalOrders,
    maxNewBuyers,
    maxExistingBuyers,
    maxCancelledOrders
  );
  
  // Generate ticks and use the highest tick as the domain maximum
  const ticks = generateYAxisTicks(maxValue);
  const domainMax = Math.max(...ticks);
  
  return [0, domainMax];
};

/**
 * Generate dynamic tick intervals for Y-axis based on the actual data
 * Creates optimal intervals with minimal gap above the highest value
 */
export const generateYAxisTicks = (maxValue: number) => {
  if (maxValue <= 0) return [0, 100, 200];
  
  // Find the optimal interval that creates minimal gap
  const niceIntervals = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000];
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
  
  let optimalInterval = magnitude;
  let minGap = Infinity;
  let bestTicks: number[] = [];
  
  // Try different intervals to find the one with minimal gap
  for (const niceInterval of niceIntervals) {
    const candidateInterval = magnitude * niceInterval;
    
    // Generate ticks with this interval
    const ticks: number[] = [];
    for (let i = 0; i <= maxValue + candidateInterval; i += candidateInterval) {
      ticks.push(i);
    }
    
    // Calculate the gap between maxValue and the highest tick
    const highestTick = Math.max(...ticks);
    const gap = highestTick - maxValue;
    
    // Prefer intervals that create smaller gaps
    if (gap < minGap && gap >= 0) {
      minGap = gap;
      optimalInterval = candidateInterval;
      bestTicks = ticks;
    }
  }
  
  return bestTicks;
};

/**
 * Format Y-axis tick labels with appropriate symbols
 */
export const formatYAxisTick = (value: number, isCurrency: boolean = false) => {
  if (isCurrency) {
    return `$${value.toLocaleString()}`;
  }
  return value.toLocaleString();
};
