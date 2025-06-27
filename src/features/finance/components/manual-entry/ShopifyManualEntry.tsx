import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ShopifyMetricUpsertPayload, useShopifyMetricsUpsert, ShopifyMetric, useShopifyMetricDelete } from '../../services/useShopifyMetrics';
import { useQueryClient } from '@tanstack/react-query';

interface ShopifyManualEntryProps {
  companyId: string;
  stores: string[];
  existingData?: ShopifyMetric | null;
  isLoadingExistingData?: boolean;
  onDateStoreChange?: (date: string, storeId: string) => void;
  onSuccess?: () => void;
}

const ShopifyManualEntry: React.FC<ShopifyManualEntryProps> = ({ 
  companyId, 
  stores,
  existingData,
  isLoadingExistingData = false,
  onDateStoreChange,
  onSuccess 
}) => {
  const [useCustomStore, setUseCustomStore] = useState<boolean>(stores.length === 0);
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ShopifyMetricUpsertPayload>({
    defaultValues: {
      store_id: stores.length > 0 ? stores[0] : '',
      date: format(new Date(), 'yyyy-MM-dd'),
      session: undefined,
      bounce_rate: undefined,
      add_to_cart_count: undefined,
      session_completed_checkout_count: undefined,
      new_customer_count: undefined,
      existing_customer_count: undefined,
      new_customer_sales: undefined,
      existing_customer_sales: undefined
    }
  });

  // Watch for date and store changes
  const watchedDate = watch('date');
  const watchedStoreId = watch('store_id');

  // Update form values when existing data changes
  useEffect(() => {
    if (existingData) {
      setValue('session', existingData.session || undefined);
      setValue('bounce_rate', existingData.bounce_rate || undefined);
      setValue('add_to_cart_count', existingData.add_to_cart_count || undefined);
      setValue('session_completed_checkout_count', existingData.session_completed_checkout_count || undefined);
      setValue('new_customer_count', existingData.new_customer_count || undefined);
      setValue('existing_customer_count', existingData.existing_customer_count || undefined);
      setValue('new_customer_sales', existingData.new_customer_sales || undefined);
      setValue('existing_customer_sales', existingData.existing_customer_sales || undefined);
    } else {
      // Clear form when no existing data
      setValue('session', undefined);
      setValue('bounce_rate', undefined);
      setValue('add_to_cart_count', undefined);
      setValue('session_completed_checkout_count', undefined);
      setValue('new_customer_count', undefined);
      setValue('existing_customer_count', undefined);
      setValue('new_customer_sales', undefined);
      setValue('existing_customer_sales', undefined);
    }
  }, [existingData, setValue]);

  // Notify parent of date/store changes
  useEffect(() => {
    if (watchedDate && watchedStoreId && onDateStoreChange) {
      onDateStoreChange(watchedDate, watchedStoreId);
    }
  }, [watchedDate, watchedStoreId, onDateStoreChange]);

  const { mutate, isPending } = useShopifyMetricsUpsert(companyId, {
    onSuccess: () => {
      toast.success('Shopify metrics updated successfully');
      queryClient.invalidateQueries({ queryKey: ['shopify-metrics', companyId] });
      reset();
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    }
  });

  const { mutate: deleteMetric, isPending: isDeleting } = useShopifyMetricDelete(companyId, {
    onSuccess: () => {
      toast.success('Shopify metrics deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['shopify-metrics', companyId] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    }
  });

  const onSubmit = (data: ShopifyMetricUpsertPayload) => {
    // Log raw data before processing
    console.log('Raw form data before processing:', {
      ...data,
      dateValue: data.date,
      dateType: typeof data.date
    });
    
    // Ensure all fields are properly formatted for API
    const payload: ShopifyMetricUpsertPayload = {
      store_id: data.store_id.trim(),
      date: data.date, // Ensure date is included in YYYY-MM-DD format
      session: data.session != null ? Number(data.session) : undefined,
      bounce_rate: data.bounce_rate != null ? data.bounce_rate : undefined,
      add_to_cart_count: data.add_to_cart_count != null ? Number(data.add_to_cart_count) : undefined,
      session_completed_checkout_count: data.session_completed_checkout_count != null ? Number(data.session_completed_checkout_count) : undefined,
      new_customer_count: data.new_customer_count != null ? Number(data.new_customer_count) : undefined,
      existing_customer_count: data.existing_customer_count != null ? Number(data.existing_customer_count) : undefined,
      new_customer_sales: data.new_customer_sales != null ? data.new_customer_sales : undefined,
      existing_customer_sales: data.existing_customer_sales != null ? data.existing_customer_sales : undefined
    };
    
    console.log('Submitting Shopify payload with date:', {
      ...payload,
      dateValue: payload.date,
      dateType: typeof payload.date
    });
    
    mutate(payload);
  };

  const handleDelete = () => {
    if (!existingData?.id) {
      toast.error('No metric selected for deletion');
      return;
    }

    if (window.confirm('Are you sure you want to delete this metric? This action cannot be undone.')) {
      deleteMetric(existingData.id);
    }
  };

  const toggleStoreInput = () => {
    setUseCustomStore(!useCustomStore);
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
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
              <span className="text-sm text-gray-600">Loading existing data...</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Store ID Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shopify Store <span className="text-red-500">*</span>
              </label>
              {stores.length > 0 && !useCustomStore ? (
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('store_id', { required: 'Store is required' })}
                >
                  {stores.map((store) => (
                    <option key={store} value={store}>
                      {store}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter store ID"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('store_id', { required: 'Store is required' })}
                />
              )}
              {errors.store_id && (
                <p className="mt-1 text-sm text-red-600">{errors.store_id.message}</p>
              )}
              
              {stores.length > 0 && (
                <button 
                  type="button"
                  className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                  onClick={toggleStoreInput}
                >
                  {useCustomStore ? "Use existing store" : "Enter custom store"}
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('date', { required: 'Date is required' })}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Session Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sessions
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('session', {
                  valueAsNumber: true,
                  validate: (value: number | undefined) => !value || value >= 0 || 'Must be a positive number'
                })}
              />
              {errors.session && (
                <p className="mt-1 text-sm text-red-600">{errors.session.message}</p>
              )}
            </div>

            {/* Bounce Rate Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bounce Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('bounce_rate')}
              />
              {errors.bounce_rate && (
                <p className="mt-1 text-sm text-red-600">{errors.bounce_rate.message}</p>
              )}
            </div>

            {/* Add to Cart Count Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add to Cart Count
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('add_to_cart_count', {
                  valueAsNumber: true,
                  validate: (value: number | undefined) => !value || value >= 0 || 'Must be a positive number'
                })}
              />
              {errors.add_to_cart_count && (
                <p className="mt-1 text-sm text-red-600">{errors.add_to_cart_count.message}</p>
              )}
            </div>

            {/* Completed Checkout Count Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Completed Checkout Count
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('session_completed_checkout_count', {
                  valueAsNumber: true,
                  validate: (value: number | undefined) => !value || value >= 0 || 'Must be a positive number'
                })}
              />
              {errors.session_completed_checkout_count && (
                <p className="mt-1 text-sm text-red-600">{errors.session_completed_checkout_count.message}</p>
              )}
            </div>

            {/* New Customer Count Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Customer Count
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('new_customer_count', {
                  valueAsNumber: true,
                  validate: (value: number | undefined) => !value || value >= 0 || 'Must be a positive number'
                })}
              />
              {errors.new_customer_count && (
                <p className="mt-1 text-sm text-red-600">{errors.new_customer_count.message}</p>
              )}
            </div>

            {/* Existing Customer Count Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Existing Customer Count
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('existing_customer_count', {
                  valueAsNumber: true,
                  validate: (value: number | undefined) => !value || value >= 0 || 'Must be a positive number'
                })}
              />
              {errors.existing_customer_count && (
                <p className="mt-1 text-sm text-red-600">{errors.existing_customer_count.message}</p>
              )}
            </div>

            {/* New Customer Sales Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Customer Sales
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('new_customer_sales')}
              />
              {errors.new_customer_sales && (
                <p className="mt-1 text-sm text-red-600">{errors.new_customer_sales.message}</p>
              )}
            </div>

            {/* Existing Customer Sales Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Existing Customer Sales
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('existing_customer_sales')}
              />
              {errors.existing_customer_sales && (
                <p className="mt-1 text-sm text-red-600">{errors.existing_customer_sales.message}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              {/* Delete Button - Only show when editing existing data */}
              {existingData && (
                <button 
                  type="button"
                  className={`px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDeleting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
              
              {/* Submit Button */}
              <div className={existingData ? '' : 'ml-auto'}>
                <button 
                  type="submit"
                  className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isPending ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  disabled={isPending}
                >
                  {isPending ? 'Saving...' : existingData ? 'Update Metrics' : 'Save Metrics'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopifyManualEntry; 