import React, { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { subDays, startOfMonth, startOfYear, startOfDay, endOfDay } from "date-fns";
import { useUserAndCompanyData } from "../../../../shared/hooks/useUserAndCompanyData";
import { SHOPEE_SHOP_NAMES, LAZADA_ACCOUNT_NAMES, FOODPANDA_SHOP_NAMES, REDMART_SHOP_NAMES} from '../../constant/Shopname';

// Import custom hook
import { useMetricsData } from "../../hooks/useMetricsData";

// Import components
import PlatformSelector, { Platform } from "../platform/PlatformSelector";
import DateRangeSelector from "./DateRangeSelector";
import PlatformEntitySelector from "../platform/PlatformEntitySelector";
import PlatformInfoHeader from "../platform/PlatformInfoHeader";
import MetricsSummary from "../metrics/MetricsSummary";
import RevenueChart from "../charts/RevenueChart";
import OrdersChart from "../charts/OrdersChart";
import MetricsDataTable from "../metrics/MetricsDataTable";
import EmptyStateMessage from "./EmptyStateMessage";
import LazadaManualEntryModal from "../manual-entry/LazadaManualEntryModal";
import ShopifyManualEntryModal from "../manual-entry/ShopifyManualEntryModal";
import GrabManualEntryModal from "../manual-entry/GrabManualEntryModal";
import RedmartManualEntryModal from "../manual-entry/RedmartManualEntryModal";
import FoodpandaManualEntryModal from "../manual-entry/FoodpandaManualEntryModal";
import ShopeeManualEntryModal from "../manual-entry/ShopeeManualEntryModal";
import CompileSalesModal, { CompileParams } from "../CompileSalesModal";
import { PlatformCompilationService } from "../../services/platformCompilationService";

// Import types
import { ShopeeMetric } from '../../services/useShopeeMetrics';
import { LazadaMetric } from '../../services/useLazadaMetrics';
import { ShopifyMetric } from '../../services/useShopifyMetrics';
import { FoodpandaMetric } from '../../services/useFoodpandaMetrics';
import { GrabMetric } from '../../services/useGrabMetrics';

// Add toast notification component
const ToastNotification = ({ message, type, isVisible, onClose }: {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
  onClose: () => void;
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto close after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? '✓' : '✕';

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full ${bgColor} text-white p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <span className="text-xl mr-3 mt-0.5">{icon}</span>
          <div className="text-sm flex-1">
            <div className="font-semibold">{type === 'success' ? 'Success!' : 'Error!'}</div>
            <div className="mt-1 whitespace-pre-line">{message}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 focus:outline-none ml-3 flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

interface OnlineSalesProps {
  session: Session;
}

/**
 * Online Sales Dashboard component
 * Displays sales metrics from multiple e-commerce platforms
 */
const OnlineSales: React.FC<OnlineSalesProps> = ({ session }) => {
  // Default to 7 days ago for start date
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("shopee");
  const [selectedEntityId, setSelectedEntityId] = useState<string | number | null>(null);
  const [isLazadaManualEntryOpen, setIsLazadaManualEntryOpen] = useState<boolean>(false);
  const [isShopifyManualEntryOpen, setIsShopifyManualEntryOpen] = useState<boolean>(false);
  const [isGrabManualEntryOpen, setIsGrabManualEntryOpen] = useState<boolean>(false);
  const [isRedmartManualEntryOpen, setIsRedmartManualEntryOpen] = useState<boolean>(false);
  const [isFoodpandaManualEntryOpen, setIsFoodpandaManualEntryOpen] = useState<boolean>(false);
  const [isShopeeManualEntryOpen, setIsShopeeManualEntryOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [isCompileSalesModalOpen, setIsCompileSalesModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    isVisible: boolean;
  }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  // Get user and company data
  const { companyInfo, error: userDataError, isLoading: userDataLoading } = 
    useUserAndCompanyData(session.user.id);

  // Use custom hook for metrics data
  const {
    isLoading,
    error,
    filteredMetrics,
    chartData,
    entities,
    totalRevenue,
    totalOrders,
    totalAdsExpense,
    refreshData,
    isRefreshing
  } = useMetricsData({
    platform: selectedPlatform,
    companyId: companyInfo?.id,
    startDate,
    endDate,
    selectedEntityId
  });

  // After entities are loaded, set default Shopee shop if not set
  useEffect(() => {
    if ((selectedPlatform === 'shopee' || selectedPlatform === 'lazada' || selectedPlatform === 'foodpanda' || selectedPlatform === 'redmart') && !selectedEntityId && entities.length > 0) {
      setSelectedEntityId(entities[0].id);
    }
    // eslint-disable-next-line
  }, [selectedPlatform, entities]);

  // Set default Foodpanda shopId if not set
  useEffect(() => {
    if (selectedPlatform === 'foodpanda' && !selectedEntityId) {
      const shopIds = Object.keys(FOODPANDA_SHOP_NAMES);
      if (shopIds.length > 0) setSelectedEntityId(shopIds[0]);
    }
  }, [selectedPlatform, selectedEntityId]);

  // Set default Redmart shopId if not set
  useEffect(() => {
    if (selectedPlatform === 'redmart' && !selectedEntityId) {
      const shopIds = Object.keys(REDMART_SHOP_NAMES);
      if (shopIds.length > 0) setSelectedEntityId(shopIds[0]);
    }
  }, [selectedPlatform, selectedEntityId]);

  // Determine currency
  let currency = 'SGD';
  if (selectedPlatform === 'shopee') {
    if (selectedEntityId === 976040827 || selectedEntityId === '976040827') {
      currency = 'MYR';
    } else if (selectedEntityId === 2421911 || selectedEntityId === '2421911') {
      currency = 'SGD';
    }
  } else if (selectedPlatform === 'lazada' || selectedPlatform === 'redmart') {
    if (selectedEntityId === 'leon@thekettlegourmet.com') {
      currency = 'MYR';
    } else if (selectedEntityId === 'flo@thekettlegourmet.com' || selectedEntityId === 'czy199162@gmail.com') {
      currency = 'SGD';
    }
  } else if (selectedPlatform === 'foodpanda') {
    currency = 'SGD'; // Or set per shop if needed
  } else if (selectedPlatform === 'shopify') {
    if (selectedEntityId === 'thekettlegourmet_my') {
      currency = 'MYR';
    } else if (selectedEntityId === 'thekettlegourmet_sg') {
      currency = 'SGD';
    }
  }

  // Handle date changes
  const handleStartDateChange = (date: Date) => {
    setStartDate(date);
    refreshData();
  };

  const handleEndDateChange = (date: Date) => {
    setEndDate(date);
    refreshData();
  };

  // Date range preset handlers
  const handleMonthTillDate = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(new Date());
    // We'll trigger a refresh in the next render cycle
    setTimeout(() => refreshData(), 0);
  };

  const handleYearTillDate = () => {
    setStartDate(startOfYear(new Date()));
    setEndDate(new Date());
    // We'll trigger a refresh in the next render cycle
    setTimeout(() => refreshData(), 0);
  };

  const handleYesterday = () => {
    const yesterday = subDays(new Date(), 1);
    setStartDate(startOfDay(yesterday));
    setEndDate(endOfDay(yesterday));
    // We'll trigger a refresh in the next render cycle
    setTimeout(() => refreshData(), 0);
  };

  // Handle platform selection
  const handlePlatformChange = (platform: Platform) => {
    setSelectedPlatform(platform);
    setSelectedEntityId(null); // Reset the entity selection when changing platforms
  };

  // Handle entity selection
  const handleEntityChange = (entityId: string | number) => {
    setSelectedEntityId(entityId);
  };

  // Handle manual entry for Lazada
  const handleOpenLazadaManualEntry = () => {
    if (!companyInfo?.id) {
      alert('Company information is required for manual entry');
      return;
    }
    setIsLazadaManualEntryOpen(true);
  };

  const handleLazadaManualEntryClose = () => {
    setIsLazadaManualEntryOpen(false);
    refreshData();
  };

  // Handle manual entry for Shopify
  const handleOpenShopifyManualEntry = () => {
    if (!companyInfo?.id) {
      alert('Company information is required for manual entry');
      return;
    }
    setIsShopifyManualEntryOpen(true);
  };

  const handleShopifyManualEntryClose = () => {
    setIsShopifyManualEntryOpen(false);
    refreshData();
  };

  // Handle manual entry for Grab
  const handleOpenGrabManualEntry = () => {
    if (!companyInfo?.id) {
      alert('Company information is required for manual entry');
      return;
    }
    setIsGrabManualEntryOpen(true);
  };

  const handleGrabManualEntryClose = () => {
    setIsGrabManualEntryOpen(false);
    refreshData();
  };

  // Handle manual entry for Redmart
  const handleOpenRedmartManualEntry = () => {
    if (!companyInfo?.id) {
      alert('Company information is required for manual entry');
      return;
    }
    setIsRedmartManualEntryOpen(true);
  };

  const handleRedmartManualEntryClose = () => {
    setIsRedmartManualEntryOpen(false);
    refreshData();
  };

  // Handle manual entry for Foodpanda
  const handleOpenFoodpandaManualEntry = () => {
    if (!companyInfo?.id) {
      alert('Company information is required for manual entry');
      return;
    }
    setIsFoodpandaManualEntryOpen(true);
  };

  const handleFoodpandaManualEntryClose = () => {
    setIsFoodpandaManualEntryOpen(false);
    refreshData();
  };

  // Handle manual entry for Shopee
  const handleOpenShopeeManualEntry = () => {
    if (!companyInfo?.id) {
      alert('Company information is required for manual entry');
      return;
    }
    setIsShopeeManualEntryOpen(true);
  };

  const handleShopeeManualEntryClose = () => {
    setIsShopeeManualEntryOpen(false);
    refreshData();
  };

  // Handle compile sales data
  const handleCompileSales = () => {
    if (!companyInfo?.id) {
      alert('Company information is required for compiling sales data');
      return;
    }
    setIsCompileSalesModalOpen(true);
  };

  const handleCompileSalesModalClose = () => {
    setIsCompileSalesModalOpen(false);
    setIsCompiling(false);
  };

  // Enhanced download function with better error handling and user feedback
  const handleDownloadPlatformData = async (params: CompileParams) => {
    setIsCompiling(true);
    
    try {
      // Show loading message to user
      console.log('Starting download for platforms:', params.platforms, 'format:', params.format);
      
      // Download platform data directly
      const { blob, contentType, filename } = await PlatformCompilationService.downloadPlatformData(
        params.platforms,
        params.startDate.toISOString().split('T')[0],
        params.endDate.toISOString().split('T')[0],
        params.format,
        companyInfo?.name,
        companyInfo?.id ? Number(companyInfo.id) : undefined
      );
      
      console.log('Download completed successfully:', {
        blobSize: blob.size,
        contentType,
        filename
      });
      
      // Create download link for both CSV and PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.style.display = 'none';
      
      // Use filename from backend if available, otherwise generate one
      if (filename) {
        link.download = filename;
      } else {
        // Fallback filename generation
        const dateRange = `${params.startDate.toISOString().split('T')[0]}_to_${params.endDate.toISOString().split('T')[0]}`;
        const platformNames = params.platforms.join('_');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        
        // Generate appropriate filename based on format with timestamp to ensure uniqueness
        if (params.format === 'csv') {
          link.download = `sales_data_${platformNames}_${dateRange}_${timestamp}.csv`;
        } else {
          link.download = `sales_report_${platformNames}_${dateRange}_${timestamp}.pdf`;
        }
      }
      
      console.log('Triggering download with filename:', link.download);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      // Determine file type for user message
      const fileTypeText = params.format === 'csv' ? 'Filtered CSV file' : 'Filtered PDF report';
      const platformText = params.platforms.length === 1 ? params.platforms[0] : `${params.platforms.length} platforms`;
      
      // Success message with filtered and consolidated data details
      const successMessage = `${fileTypeText} downloaded successfully!\n` +
        `📊 Data: date, ads_expense, revenue, total_orders, new_buyer_count, existing_buyer_count\n` +
        `📈 Graphs embedded directly in file (no separate folders)\n` +
        `🏪 Platforms: ${params.platforms.join(', ')}\n` +
        `📅 Date range: ${params.startDate.toISOString().split('T')[0]} to ${params.endDate.toISOString().split('T')[0]}\n` +
        `💾 File size: ${(blob.size / 1024).toFixed(1)} KB`;
      
      // Show success toast instead of alert
      setToast({
        message: successMessage,
        type: 'success',
        isVisible: true
      });
      
      // Close modal and refresh data
      setIsCompileSalesModalOpen(false);
      refreshData();
    } catch (error) {
      console.error('Error downloading platform data:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Provide more helpful error messages
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = 'Network error: Please check your internet connection and try again.';
      } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
        errorMessage = 'Server error: Please try again later or contact support if the problem persists.';
      } else if (errorMessage.includes('404')) {
        errorMessage = 'Service not found: The download service may be temporarily unavailable.';
      }
      
      // Show error toast instead of alert
      setToast({
        message: `Failed to download platform data: ${errorMessage}`,
        type: 'error',
        isVisible: true
      });
    } finally {
      setIsCompiling(false);
    }
  };

  // Enhanced chart data processing for better visualization
  const getEnhancedChartData = () => {
    if (!chartData || chartData.length === 0) return [];
    
    return chartData.map(item => ({
      ...item,
      // Ensure proper formatting for charts
      revenue: Number(item.revenue) || 0,
      adsExpense: Number(item.adsExpense) || 0,
      totalOrders: Number(item.totalOrders) || 0,
      newBuyers: Number(item.newBuyers) || 0,
      existingBuyers: Number(item.existingBuyers) || 0,
      // Add calculated metrics
      totalBuyers: (Number(item.newBuyers) || 0) + (Number(item.existingBuyers) || 0),
      revenuePerOrder: (Number(item.revenue) || 0) / (Number(item.totalOrders) || 1),
      roas: (Number(item.revenue) || 0) / (Number(item.adsExpense) || 1)
    }));
  };



  // Note: CSV and PDF generation is now handled by the backend platform compilation service
  // The backend generates proper CSV files with platform identification and includes graphs

  // Note: PDF generation is now handled by the backend platform compilation service
  // The backend generates proper PDF reports with platform identification and includes graphs

  // Determine if manual entry should be shown
  const showManualEntry = () => {
    if (selectedPlatform === 'shopee') {
      return (
        <button 
          className="px-3 py-1 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
          onClick={handleOpenShopeeManualEntry}
        >
          Manual Entry
        </button>
      );
    } else if (selectedPlatform === 'lazada') {
      return (
        <button 
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={handleOpenLazadaManualEntry}
        >
          Manual Entry
        </button>
      );
    } else if (selectedPlatform === 'redmart') {
      return (
        <button 
          className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          onClick={handleOpenRedmartManualEntry}
        >
          Manual Entry
        </button>
      );
    } else if (selectedPlatform === 'shopify') {
      return (
        <button 
          className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          onClick={handleOpenShopifyManualEntry}
        >
          Manual Entry
        </button>
      );
    } else if (selectedPlatform === 'grab') {
      return (
        <button 
          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600"
          onClick={handleOpenGrabManualEntry}
        >
          Manual Entry
        </button>
      );
    } else if (selectedPlatform === 'foodpanda') {
      return (
        <button 
          className="px-3 py-1 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          onClick={handleOpenFoodpandaManualEntry}
        >
          Manual Entry
        </button>
      );
    } else if (selectedPlatform === 'all_sg' || selectedPlatform === 'all_my') {
      return (
        <div className="flex space-x-2">
          <button 
            className="px-3 py-1 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
            onClick={handleOpenShopeeManualEntry}
          >
            Shopee Entry
          </button>
          <button 
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={handleOpenLazadaManualEntry}
          >
            Lazada Entry
          </button>
          <button 
            className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={handleOpenRedmartManualEntry}
          >
            Redmart Entry
          </button>
          <button 
            className="px-3 py-1 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onClick={handleOpenFoodpandaManualEntry}
          >
            Foodpanda Entry
          </button>
          <button 
            className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            onClick={handleOpenShopifyManualEntry}
          >
            Shopify Entry
          </button>
          <button 
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600"
            onClick={handleOpenGrabManualEntry}
          >
            Grab Entry
          </button>
        </div>
      );
    }
    return null;
  };

  // Handle loading state for user data
  if (userDataLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2">Loading user data...</p>
      </div>
    );
  }

  // Handle user data error
  if (userDataError) {
    return (
      <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-md">
        <p>Error: Failed to load user and company data</p>
      </div>
    );
  }

  // Determine enabled platforms
  const enabledPlatforms: Platform[] = ["shopee", "lazada", "redmart", "shopify", "foodpanda", "grab", "all_sg", "all_my"];

  // Determine if we're in all_sg or all_my mode
  const isAllSG = selectedPlatform === 'all_sg';
  const isAllMY = selectedPlatform === 'all_my';
  const allCurrency = isAllSG ? 'SGD' : isAllMY ? 'MYR' : undefined;

  type AllMetric = ShopeeMetric | LazadaMetric | ShopifyMetric | FoodpandaMetric | GrabMetric;

  // Filter metrics for all_sg/all_my
  let filteredAllMetrics = filteredMetrics;
  if (isAllSG || isAllMY) {
    filteredAllMetrics = filteredMetrics.filter((item: AllMetric) => {
      // Shopee, Lazada, Shopify all have currency field or can be inferred
      if ('currency' in item) return item.currency === allCurrency;
      // Fallback: Shopee/Lazada by shop/account id
      if ('shop_id' in item && 'ads_expense' in item) {
        if (allCurrency === 'SGD') return item.shop_id === 2421911;
        if (allCurrency === 'MYR') return item.shop_id === 976040827;
      }
      if ('account_id' in item) {
        if (allCurrency === 'SGD') return item.account_id === 'flo@thekettlegourmet.com';
        if (allCurrency === 'MYR') return item.account_id === 'leon@thekettlegourmet.com';
      }
      // Shopify: for all_sg, include all store_id; for all_my, exclude
      if ('store_id' in item) {
        return isAllSG;
      }
      // Foodpanda: for all_sg, include all foodpanda with SGD; for all_my, include all foodpanda with MYR
      if ('shop_id' in item && 'total_orders' in item && 'revenue' in item && !('ads_expense' in item)) {
        if (isAllSG) return true; // include all Foodpanda for SG
        if (isAllMY) return false; // adjust if you have MYR foodpanda
      }
      // Grab: include in all_sg, exclude from all_my (or adjust per your currency requirements)
      if ('store_name' in item && 'completed_order' in item && 'cancelled_order' in item) {
        if (isAllSG) return true; // include all Grab for SG
        if (isAllMY) return false; // adjust if you have MYR grab
      }
      return false;
    });
  }

  // For PlatformInfoHeader, collect included stores
  let includedStores: string[] = [];
  if (isAllSG || isAllMY) {
    const seen = new Set();
    includedStores = filteredAllMetrics.map((item: AllMetric) => {
      if ('shop_id' in item && 'total_orders' in item && 'revenue' in item && !('ads_expense' in item)) {
        // Foodpanda
        return `Foodpanda: ${FOODPANDA_SHOP_NAMES[item.shop_id] || item.shop_id}`;
      }
      if ('store_name' in item && 'completed_order' in item && 'cancelled_order' in item) {
        // Grab
        return `Grab: ${item.store_name}`;
      }
      if ('shop_id' in item) return `Shopee: ${SHOPEE_SHOP_NAMES[item.shop_id] || item.shop_id}`;
      if ('account_id' in item) return `Lazada: ${LAZADA_ACCOUNT_NAMES[item.account_id] || item.account_id}`;
      if ('store_id' in item) return `Shopify: ${item.store_id}`;
      return '';
    }).filter(store => {
      if (!store || seen.has(store)) return false;
      seen.add(store);
      return true;
    });
  }

  let shopName: string | undefined = undefined;
  if (selectedPlatform === 'shopee') {
    shopName = SHOPEE_SHOP_NAMES[selectedEntityId as string] || selectedEntityId as string;
  } else if (selectedPlatform === 'lazada') {
    shopName = LAZADA_ACCOUNT_NAMES[selectedEntityId as string] || selectedEntityId as string;
  } else if (selectedPlatform === 'redmart') {
    shopName = REDMART_SHOP_NAMES[selectedEntityId as string] || selectedEntityId as string;
  } else if (selectedPlatform === 'foodpanda') {
    shopName = FOODPANDA_SHOP_NAMES[selectedEntityId as string] || selectedEntityId as string;
  }

  return (
    <div className="flex flex-col w-full p-4">
      {/* Toast Notification */}
      <ToastNotification
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
      
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Online Sales Dashboard
      </h1>

      {/* Platform indicator */}
      <div className="mb-4 flex justify-between items-center">
        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
          selectedPlatform === "shopee" ? "bg-orange-100 text-orange-800" : 
          selectedPlatform === "lazada" ? "bg-blue-100 text-blue-800" : 
          selectedPlatform === "redmart" ? "bg-red-100 text-red-800" : 
          selectedPlatform === "foodpanda" ? "bg-purple-100 text-purple-800" :
          selectedPlatform === "shopify" ? "bg-green-100 text-green-800" :
          selectedPlatform === "all_sg" ? "bg-gray-800 text-white" :
          selectedPlatform === "all_my" ? "bg-yellow-800 text-white" :
          "bg-gray-100 text-gray-800"
        }`}>
          {isAllSG ? 'All (SG)' : isAllMY ? 'All (MY)' : selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Data
        </span>
        
        {/* Action Buttons */}
        <div className="flex gap-2 items-center">
          {/* Manual Entry Button */}
          {showManualEntry()}
          
          {/* Compile Sales Button */}
          <button 
            className="px-3 py-1 text-sm bg-indigo-500 text-white rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            onClick={handleCompileSales}
            disabled={isCompiling || isLoading}
            title="Consolidate and export data from all shops across multiple platforms"
          >
            {isCompiling ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-t border-white"></div>
                Consolidating...
              </>
            ) : (
              'Consolidate All Data'
            )}
          </button>
        </div>
      </div>

      {/* Controls section - reorganized into two main sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left section: Date Range Controls */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Date Range</h3>
          <div className="flex flex-col gap-4">
            {/* Date selector with YESTERDAY button beside tick */}
            <DateRangeSelector
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
              onSubmit={refreshData}
              isRefreshing={isRefreshing}
              extraButton={
                <button
                  onClick={handleYesterday}
                  className="py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-md transition shadow-sm border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  title="Set date range to yesterday"
                >
                  YESTERDAY
                </button>
              }
              hideLabel={true}
            />
            
            {/* Date range presets */}
            <div className="flex gap-3">
              <button
                onClick={handleMonthTillDate}
                className="flex-1 py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-md transition shadow-sm border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                MONTH TILL DATE
              </button>
              <button
                onClick={handleYearTillDate}
                className="flex-1 py-2 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium rounded-md transition shadow-sm border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                YEAR TILL DATE
              </button>
            </div>
          </div>
        </div>

        {/* Right section: Platform Controls */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Platform</h3>
          <div className="flex flex-col gap-4">
            {/* Platform selector */}
            <PlatformSelector
              selectedPlatform={selectedPlatform}
              onPlatformChange={handlePlatformChange}
              enabledPlatforms={enabledPlatforms}
              hideLabel={true}
            />

            {/* Entity selector (shop/account/store) */}
            <PlatformEntitySelector
              platform={selectedPlatform}
              entities={entities}
              selectedEntityId={selectedEntityId}
              onEntityChange={handleEntityChange}
            />
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && !isRefreshing && (
        <div className="flex justify-center items-center h-64">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
            selectedPlatform === "shopee" ? "border-orange-500" : 
            selectedPlatform === "lazada" ? "border-blue-500" : 
            selectedPlatform === "redmart" ? "border-red-500" :
            selectedPlatform === "foodpanda" ? "border-purple-500" :
            selectedPlatform === "shopify" ? "border-green-500" :
            selectedPlatform === "all_sg" ? "border-gray-800" :
            selectedPlatform === "all_my" ? "border-yellow-800" :
            "border-gray-500"
          }`}></div>
        </div>
      )}

      {/* Refreshing indicator */}
      {isRefreshing && (
        <div className="flex justify-center items-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          <span className="text-blue-500">Refreshing data...</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-md">
          <p>Error: {error instanceof Error ? error.message : "Failed to load metrics"}</p>
        </div>
      )}

      {/* Dashboard content */}
      {!isLoading && !error ? (
        filteredAllMetrics && filteredAllMetrics.length > 0 ? (
          <>
            {/* Platform info header */}
            <PlatformInfoHeader
              platform={selectedPlatform}
              companyId={companyInfo?.id}
              selectedEntityId={selectedEntityId}
              includedStores={includedStores}
            />
          
            {/* Summary cards */}
            <MetricsSummary
              totalRevenue={totalRevenue}
              totalOrders={totalOrders}
              totalAdsExpense={totalAdsExpense}
              currency={allCurrency || currency}
            />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Revenue Chart */}
              <RevenueChart 
                data={getEnhancedChartData()} 
                platform={selectedPlatform} 
                shopIdentifier={isAllSG || isAllMY ? includedStores.join(', ') : shopName}
              />

              {/* Orders Chart */}
              <OrdersChart 
                data={getEnhancedChartData()} 
                platform={selectedPlatform} 
                shopIdentifier={isAllSG || isAllMY ? includedStores.join(', ') : shopName}
              />
            </div>

            {/* Data table */}
            <MetricsDataTable data={filteredAllMetrics} platform={selectedPlatform} currency={allCurrency || currency} shopName={isAllSG || isAllMY ? includedStores.join(', ') : shopName} isFoodpanda={selectedPlatform === 'foodpanda' || isAllSG} />

            {/* Refresh button */}
            <button 
              onClick={refreshData} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>Refreshing...</span>
                </>
              ) : (
                "Refresh Data"
              )}
            </button>
          </>
        ) : (
          <EmptyStateMessage
            platform={selectedPlatform}
            companyId={companyInfo?.id}
            startDate={startDate}
            endDate={endDate}
            selectedEntityId={selectedEntityId}
            onRefresh={refreshData}
            isRefreshing={isRefreshing}
          />
        )
      ) : null}

      {/* Manual Entry Modals */}
      {companyInfo?.id && isLazadaManualEntryOpen && (
        <LazadaManualEntryModal
          isOpen={isLazadaManualEntryOpen}
          onClose={handleLazadaManualEntryClose}
          companyId={companyInfo.id}
        />
      )}

      {companyInfo?.id && isRedmartManualEntryOpen && (
        <RedmartManualEntryModal
          isOpen={isRedmartManualEntryOpen}
          onClose={handleRedmartManualEntryClose}
          companyId={companyInfo.id}
        />
      )}

      {companyInfo?.id && isFoodpandaManualEntryOpen && (
        <FoodpandaManualEntryModal
          isOpen={isFoodpandaManualEntryOpen}
          onClose={handleFoodpandaManualEntryClose}
          companyId={companyInfo.id}
        />
      )}

      {companyInfo?.id && isShopifyManualEntryOpen && (
        <ShopifyManualEntryModal
          isOpen={isShopifyManualEntryOpen}
          onClose={handleShopifyManualEntryClose}
          companyId={companyInfo.id}
        />
      )}

      {companyInfo?.id && isGrabManualEntryOpen && (
        <GrabManualEntryModal
          isOpen={isGrabManualEntryOpen}
          onClose={handleGrabManualEntryClose}
          companyId={companyInfo.id}
        />
      )}

      {companyInfo?.id && isShopeeManualEntryOpen && (
        <ShopeeManualEntryModal
          isOpen={isShopeeManualEntryOpen}
          onClose={handleShopeeManualEntryClose}
          companyId={companyInfo.id}
        />
      )}

      {/* Compile Sales Modal */}
      {companyInfo?.id && isCompileSalesModalOpen && (
        <CompileSalesModal
          isOpen={isCompileSalesModalOpen}
          onClose={handleCompileSalesModalClose}
          companyId={Number(companyInfo.id)}
          onCompile={handleDownloadPlatformData}
          isCompiling={isCompiling}
        />
      )}
    </div>
  );
};

export default OnlineSales;
