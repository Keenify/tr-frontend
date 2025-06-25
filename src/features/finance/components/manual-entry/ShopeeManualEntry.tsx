import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ShopeeMetricUpsertPayload, useShopeeMetricsUpsert, ShopeeMetric } from '../../services/useShopeeMetrics';
import { useQueryClient } from '@tanstack/react-query';
import { SHOPEE_SHOP_NAMES } from '../../constant/Shopname';

interface ShopeeManualEntryProps {
  companyId: string;
  shops: number[];
  existingData?: ShopeeMetric | null;
  isLoadingExistingData?: boolean;
  onDateShopChange?: (date: string, shopId: number) => void;
  onSuccess?: () => void;
}

const ShopeeManualEntry: React.FC<ShopeeManualEntryProps> = ({ 
  companyId, 
  shops,
  existingData,
  isLoadingExistingData = false,
  onDateShopChange,
  onSuccess 
}) => {
  const [useCustomShop, setUseCustomShop] = useState<boolean>(shops.length === 0);
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ShopeeMetricUpsertPayload>({
    defaultValues: {
      shop_id: shops.length > 0 ? shops[0] : undefined,
      date: format(new Date(), 'yyyy-MM-dd'),
      revenue: '',
      ads_expense: '',
      total_orders: undefined,
      new_buyer_count: undefined,
      existing_buyer_count: undefined
    }
  });

  // Watch for date and shop changes
  const watchedDate = watch('date');
  const watchedShopId = watch('shop_id');

  // Update form values when existing data changes
  useEffect(() => {
    if (existingData) {
      setValue('revenue', existingData.revenue?.toString() || '');
      setValue('ads_expense', existingData.ads_expense?.toString() || '');
      setValue('total_orders', existingData.total_orders || undefined);
      setValue('new_buyer_count', existingData.new_buyer_count || undefined);
      setValue('existing_buyer_count', existingData.existing_buyer_count || undefined);
    } else {
      // Clear form when no existing data
      setValue('revenue', '');
      setValue('ads_expense', '');
      setValue('total_orders', undefined);
      setValue('new_buyer_count', undefined);
      setValue('existing_buyer_count', undefined);
    }
  }, [existingData, setValue]);

  // Notify parent of date/shop changes
  useEffect(() => {
    if (watchedDate && watchedShopId && onDateShopChange) {
      onDateShopChange(watchedDate, Number(watchedShopId));
    }
  }, [watchedDate, watchedShopId, onDateShopChange]);

  const { mutate, isPending } = useShopeeMetricsUpsert(companyId, {
    onSuccess: () => {
      toast.success('Shopee metrics updated successfully');
      queryClient.invalidateQueries({ queryKey: ['shopee-metrics', companyId] });
      reset();
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    }
  });

  const onSubmit = (data: ShopeeMetricUpsertPayload) => {
    console.log('🔍 Raw form data:', data);
    
    // Ensure fields are properly formatted for API
    const payload: ShopeeMetricUpsertPayload = {
      shop_id: Number(data.shop_id),
      date: data.date, // Ensure date is included in YYYY-MM-DD format
      revenue: data.revenue ? data.revenue : undefined,
      ads_expense: data.ads_expense ? data.ads_expense : undefined,
      total_orders: data.total_orders != null ? Number(data.total_orders) : undefined,
      new_buyer_count: data.new_buyer_count != null ? Number(data.new_buyer_count) : undefined,
      existing_buyer_count: data.existing_buyer_count != null ? Number(data.existing_buyer_count) : undefined
    };
    
    console.log('🚀 Submitting Shopee payload:', {
      payload,
      companyId,
      endpoint: `${import.meta.env.VITE_BACKEND_API_DOMAIN}/shopee-metrics/company/${encodeURIComponent(companyId)}/manual-upsert`
    });
    
    mutate(payload);
  };

  const toggleShopInput = () => {
    setUseCustomShop(!useCustomShop);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
      <div className="px-6 py-4">
        {/* Show existing data indicator */}
        {existingData && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-blue-800">
                Editing existing data for {format(new Date(existingData.date), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoadingExistingData && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-orange-500 mr-2"></div>
              <span className="text-sm text-gray-600">Loading existing data...</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Shop ID Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shopee Shop <span className="text-red-500">*</span>
              </label>
              {shops.length > 0 && !useCustomShop ? (
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  {...register('shop_id', { required: 'Shop is required', valueAsNumber: true })}
                >
                  {shops.map((shop) => (
                    <option key={shop} value={shop}>
                      {SHOPEE_SHOP_NAMES[shop] || shop}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  placeholder="Enter shop ID"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  {...register('shop_id', { required: 'Shop ID is required', valueAsNumber: true })}
                />
              )}
              {errors.shop_id && (
                <p className="mt-1 text-sm text-red-600">{errors.shop_id.message}</p>
              )}
              
              {shops.length > 0 && (
                <button 
                  type="button"
                  className="mt-1 text-xs text-orange-600 hover:text-orange-800"
                  onClick={toggleShopInput}
                >
                  {useCustomShop ? "Use existing shop" : "Enter custom shop ID"}
                </button>
              )}
            </div>

            {/* Date Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                {...register('date', { required: 'Date is required' })}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Revenue Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Revenue
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                {...register('revenue')}
              />
              {errors.revenue && (
                <p className="mt-1 text-sm text-red-600">{errors.revenue.message}</p>
              )}
            </div>

            {/* Ads Expense Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ads Expense
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                {...register('ads_expense')}
              />
              {errors.ads_expense && (
                <p className="mt-1 text-sm text-red-600">{errors.ads_expense.message}</p>
              )}
            </div>

            {/* Total Orders Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Orders
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                {...register('total_orders', { 
                  valueAsNumber: true,
                  validate: (value: number | undefined) => !value || value >= 0 || 'Must be a positive number' 
                })}
              />
              {errors.total_orders && (
                <p className="mt-1 text-sm text-red-600">{errors.total_orders.message}</p>
              )}
            </div>

            {/* New Buyers Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Buyers
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                {...register('new_buyer_count', { 
                  valueAsNumber: true,
                  validate: (value: number | undefined) => !value || value >= 0 || 'Must be a positive number' 
                })}
              />
              {errors.new_buyer_count && (
                <p className="mt-1 text-sm text-red-600">{errors.new_buyer_count.message}</p>
              )}
            </div>

            {/* Existing Buyers Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Existing Buyers
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                {...register('existing_buyer_count', { 
                  valueAsNumber: true,
                  validate: (value: number | undefined) => !value || value >= 0 || 'Must be a positive number' 
                })}
              />
              {errors.existing_buyer_count && (
                <p className="mt-1 text-sm text-red-600">{errors.existing_buyer_count.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button 
                type="submit"
                className={`px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  isPending ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                disabled={isPending}
              >
                {isPending ? 'Saving...' : existingData ? 'Update Metrics' : 'Save Metrics'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopeeManualEntry; 