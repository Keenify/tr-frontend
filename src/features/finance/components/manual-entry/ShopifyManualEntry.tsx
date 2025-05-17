import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ShopifyMetricUpsertPayload, useShopifyMetricsUpsert } from '../../services/useShopifyMetrics';
import { useQueryClient } from '@tanstack/react-query';

interface ShopifyManualEntryProps {
  companyId: string;
  stores: string[];
  onSuccess?: () => void;
}

const ShopifyManualEntry: React.FC<ShopifyManualEntryProps> = ({ 
  companyId, 
  stores,
  onSuccess 
}) => {
  const [useCustomStore, setUseCustomStore] = useState<boolean>(stores.length === 0);
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ShopifyMetricUpsertPayload>({
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

  const onSubmit = (data: ShopifyMetricUpsertPayload) => {
    // Ensure numeric fields are properly converted
    const payload: ShopifyMetricUpsertPayload = {
      ...data,
      session: data.session ? Number(data.session) : undefined,
      bounce_rate: data.bounce_rate ? data.bounce_rate : undefined,
      add_to_cart_count: data.add_to_cart_count ? Number(data.add_to_cart_count) : undefined,
      session_completed_checkout_count: data.session_completed_checkout_count ? Number(data.session_completed_checkout_count) : undefined,
      new_customer_count: data.new_customer_count ? Number(data.new_customer_count) : undefined,
      existing_customer_count: data.existing_customer_count ? Number(data.existing_customer_count) : undefined,
      new_customer_sales: data.new_customer_sales ? data.new_customer_sales : undefined,
      existing_customer_sales: data.existing_customer_sales ? data.existing_customer_sales : undefined
    };
    
    mutate(payload);
  };

  const toggleStoreInput = () => {
    setUseCustomStore(!useCustomStore);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
      <div className="px-6 py-4">
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

            {/* Submit Button */}
            <div className="flex justify-end">
              <button 
                type="submit"
                className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isPending ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                disabled={isPending}
              >
                {isPending ? 'Saving...' : 'Save Metrics'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopifyManualEntry; 