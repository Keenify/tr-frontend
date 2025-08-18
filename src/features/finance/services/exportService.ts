import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { Platform } from '../components/platform/PlatformSelector';
import { ExportConfig } from '../components/export/ExportModal';

// Metric types
interface BaseMetric {
  date: string;
  revenue: number;
  currency: string;
}

interface ShopeeMetric extends BaseMetric {
  shop_id: number;
  ads_expense: number;
  total_orders: number;
}

interface LazadaMetric extends BaseMetric {
  account_id: string;
  ads_expense: number;
  total_orders: number;
}

interface ShopifyMetric extends BaseMetric {
  store_id: string;
  ads_expense: number;
  total_orders: number;
}

interface FoodpandaMetric extends BaseMetric {
  shop_id: string;
  total_orders: number;
}

interface GrabMetric extends BaseMetric {
  store_name: string;
  completed_order: number;
  cancelled_order: number;
}

type AllMetric = ShopeeMetric | LazadaMetric | ShopifyMetric | FoodpandaMetric | GrabMetric;

interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
  ads_expense?: number;
}

interface ExportData {
  platform: Platform;
  metrics: AllMetric[];
  chartData: ChartDataPoint[];
  totalRevenue: number;
  totalOrders: number;
  totalAdsExpense?: number;
  currency: string;
}

export class ExportService {
  /**
   * Export data based on configuration
   */
  static async exportData(
    config: ExportConfig,
    allData: Map<Platform, ExportData>
  ): Promise<void> {
    try {
      if (config.format === 'pdf') {
        await this.exportToPDF(config, allData);
      } else {
        this.exportToCSV(config, allData);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  /**
   * Export to PDF with optional charts
   */
  private static async exportToPDF(
    config: ExportConfig,
    allData: Map<Platform, ExportData>
  ): Promise<void> {
    const pdf = new jsPDF();
    let yPosition = 20;

    // Title
    pdf.setFontSize(20);
    pdf.text('Sales Data Export', 20, yPosition);
    yPosition += 15;

    // Date range
    pdf.setFontSize(12);
    pdf.text(
      `Period: ${format(config.startDate, 'MMM dd, yyyy')} - ${format(config.endDate, 'MMM dd, yyyy')}`,
      20,
      yPosition
    );
    yPosition += 15;

    // Summary section
    pdf.setFontSize(14);
    pdf.text('Summary', 20, yPosition);
    yPosition += 10;

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalAdsExpense = 0;

    config.platforms.forEach(platform => {
      const data = allData.get(platform);
      if (data) {
        totalRevenue += data.totalRevenue;
        totalOrders += data.totalOrders;
        totalAdsExpense += data.totalAdsExpense || 0;
      }
    });

    // Summary table
    const summaryData = [
      ['Total Revenue', `${totalRevenue.toLocaleString()} SGD`],
      ['Total Orders', totalOrders.toLocaleString()],
      ['Total Ads Expense', `${totalAdsExpense.toLocaleString()} SGD`],
      ['Platforms', config.platforms.join(', ')]
    ];

    autoTable(pdf, {
      head: [['Metric', 'Value']],
      body: summaryData,
      startY: yPosition,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 20 }
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 20;

    // Platform-wise data
    for (const platform of config.platforms) {
      const data = allData.get(platform);
      if (!data || data.metrics.length === 0) continue;

      // Check if we need a new page
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      // Platform header
      pdf.setFontSize(14);
      pdf.text(`${platform.toUpperCase()} Data`, 20, yPosition);
      yPosition += 10;

      // Platform metrics table
      const headers = this.getTableHeaders(platform);
      const tableData = this.prepareTableData(data.metrics, platform);

      autoTable(pdf, {
        head: [headers],
        body: tableData,
        startY: yPosition,
        theme: 'striped',
        headStyles: { fillColor: this.getPlatformColor(platform) },
        margin: { left: 20 },
        styles: { fontSize: 8 }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;
    }

    // Include charts if requested
    if (config.includeGraphs && config.platforms.length > 0) {
      await this.addChartsToPDF(pdf, config, allData);
    }

    // Save PDF
    const filename = `sales-export-${format(config.startDate, 'yyyy-MM-dd')}-to-${format(config.endDate, 'yyyy-MM-dd')}.pdf`;
    pdf.save(filename);
  }

  /**
   * Add charts to PDF
   */
  private static async addChartsToPDF(
    pdf: jsPDF,
    config: ExportConfig,
    allData: Map<Platform, ExportData>
  ): Promise<void> {
    // Create temporary canvas for chart generation
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    pdf.addPage();
    let yPosition = 20;

    pdf.setFontSize(16);
    pdf.text('Charts & Graphs', 20, yPosition);
    yPosition += 20;

    // Combine all chart data
    const combinedChartData = this.combineChartData(config.platforms, allData);
    
    // Revenue trend chart (simplified line chart representation)
    if (combinedChartData.length > 0) {
      pdf.setFontSize(12);
      pdf.text('Revenue Trend', 20, yPosition);
      yPosition += 15;

      // Create a simple text-based chart representation
      const maxRevenue = Math.max(...combinedChartData.map(d => d.revenue));
      const chartHeight = 50;
      
      combinedChartData.slice(0, 10).forEach((dataPoint, index) => {
        const barHeight = (dataPoint.revenue / maxRevenue) * chartHeight;
        const date = format(new Date(dataPoint.date), 'MM/dd');
        
        // Draw simple bar representation
        pdf.setDrawColor(59, 130, 246);
        pdf.setFillColor(59, 130, 246);
        pdf.rect(30 + index * 15, yPosition + chartHeight - barHeight, 10, barHeight, 'F');
        
        // Add date label
        pdf.setFontSize(6);
        pdf.text(date, 28 + index * 15, yPosition + chartHeight + 8);
        
        // Add revenue value
        pdf.text(`$${Math.round(dataPoint.revenue)}`, 25 + index * 15, yPosition + chartHeight - barHeight - 2);
      });

      yPosition += chartHeight + 20;
    }

    // Orders trend (similar approach)
    if (combinedChartData.length > 0) {
      pdf.setFontSize(12);
      pdf.text('Orders Trend', 20, yPosition);
      yPosition += 15;

      const maxOrders = Math.max(...combinedChartData.map(d => d.orders));
      const chartHeight = 50;
      
      combinedChartData.slice(0, 10).forEach((dataPoint, index) => {
        const barHeight = (dataPoint.orders / maxOrders) * chartHeight;
        
        // Draw simple bar representation
        pdf.setDrawColor(16, 185, 129);
        pdf.setFillColor(16, 185, 129);
        pdf.rect(30 + index * 15, yPosition + chartHeight - barHeight, 10, barHeight, 'F');
        
        // Add orders value
        pdf.setFontSize(6);
        pdf.text(`${dataPoint.orders}`, 28 + index * 15, yPosition + chartHeight - barHeight - 2);
      });
    }
  }

  /**
   * Export to CSV
   */
  private static exportToCSV(
    config: ExportConfig,
    allData: Map<Platform, ExportData>
  ): void {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Add header
    csvContent += `Sales Data Export\n`;
    csvContent += `Period: ${format(config.startDate, 'yyyy-MM-dd')} to ${format(config.endDate, 'yyyy-MM-dd')}\n`;
    csvContent += `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n\n`;

    // Add summary
    csvContent += `SUMMARY\n`;
    csvContent += `Platform,Total Revenue,Total Orders,Total Ads Expense,Currency\n`;

    config.platforms.forEach(platform => {
      const data = allData.get(platform);
      if (data) {
        csvContent += `${platform},${data.totalRevenue},${data.totalOrders},${data.totalAdsExpense || 0},${data.currency}\n`;
      }
    });

    csvContent += '\n';

    // Add detailed data for each platform
    config.platforms.forEach(platform => {
      const data = allData.get(platform);
      if (!data || data.metrics.length === 0) return;

      csvContent += `${platform.toUpperCase()} DETAILED DATA\n`;
      
      // Headers
      const headers = this.getCSVHeaders(platform);
      csvContent += headers.join(',') + '\n';

      // Data rows
      data.metrics.forEach(metric => {
        const row = this.prepareCSVRow(metric, platform);
        csvContent += row.join(',') + '\n';
      });

      csvContent += '\n';
    });

    // Download CSV
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = `sales-export-${format(config.startDate, 'yyyy-MM-dd')}-to-${format(config.endDate, 'yyyy-MM-dd')}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Get table headers for different platforms
   */
  private static getTableHeaders(platform: Platform): string[] {
    const baseHeaders = ['Date', 'Revenue', 'Currency'];
    
    switch (platform) {
      case 'shopee':
        return [...baseHeaders, 'Shop ID', 'Orders', 'Ads Expense'];
      case 'lazada':
        return [...baseHeaders, 'Account ID', 'Orders', 'Ads Expense'];
      case 'shopify':
        return [...baseHeaders, 'Store ID', 'Orders', 'Ads Expense'];
      case 'foodpanda':
        return [...baseHeaders, 'Shop ID', 'Orders'];
      case 'grab':
        return [...baseHeaders, 'Store Name', 'Completed Orders', 'Cancelled Orders'];
      default:
        return baseHeaders;
    }
  }

  /**
   * Get CSV headers for different platforms
   */
  private static getCSVHeaders(platform: Platform): string[] {
    return this.getTableHeaders(platform);
  }

  /**
   * Prepare table data for PDF
   */
  private static prepareTableData(metrics: AllMetric[], platform: Platform): string[][] {
    return metrics.map(metric => this.prepareCSVRow(metric, platform));
  }

  /**
   * Prepare CSV row data
   */
  private static prepareCSVRow(metric: AllMetric, platform: Platform): string[] {
    const baseRow = [
      format(new Date(metric.date), 'yyyy-MM-dd'),
      metric.revenue.toFixed(2),
      metric.currency
    ];

    if ('shop_id' in metric && 'ads_expense' in metric) {
      // Shopee
      return [...baseRow, metric.shop_id.toString(), metric.total_orders.toString(), metric.ads_expense.toFixed(2)];
    } else if ('account_id' in metric) {
      // Lazada
      return [...baseRow, metric.account_id, metric.total_orders.toString(), metric.ads_expense.toFixed(2)];
    } else if ('store_id' in metric) {
      // Shopify
      return [...baseRow, metric.store_id, metric.total_orders.toString(), metric.ads_expense.toFixed(2)];
    } else if ('shop_id' in metric && 'total_orders' in metric) {
      // Foodpanda
      return [...baseRow, metric.shop_id, metric.total_orders.toString()];
    } else if ('store_name' in metric) {
      // Grab
      return [...baseRow, metric.store_name, metric.completed_order.toString(), metric.cancelled_order.toString()];
    }

    return baseRow;
  }

  /**
   * Get platform-specific colors for PDF
   */
  private static getPlatformColor(platform: Platform): [number, number, number] {
    const colors: Record<Platform, [number, number, number]> = {
      'shopee': [255, 87, 34],
      'lazada': [33, 150, 243],
      'redmart': [244, 67, 54],
      'shopify': [76, 175, 80],
      'foodpanda': [156, 39, 176],
      'grab': [102, 187, 106],
      'all_sg': [96, 125, 139],
      'all_my': [255, 193, 7]
    };
    
    return colors[platform] || [128, 128, 128];
  }

  /**
   * Combine chart data from multiple platforms
   */
  private static combineChartData(
    platforms: Platform[],
    allData: Map<Platform, ExportData>
  ): ChartDataPoint[] {
    const combined = new Map<string, ChartDataPoint>();

    platforms.forEach(platform => {
      const data = allData.get(platform);
      if (data) {
        data.chartData.forEach(point => {
          const existing = combined.get(point.date);
          if (existing) {
            existing.revenue += point.revenue;
            existing.orders += point.orders;
            if (point.ads_expense) {
              existing.ads_expense = (existing.ads_expense || 0) + point.ads_expense;
            }
          } else {
            combined.set(point.date, { ...point });
          }
        });
      }
    });

    return Array.from(combined.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }
}

export default ExportService;