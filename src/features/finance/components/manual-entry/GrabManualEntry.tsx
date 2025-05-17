import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { GrabMetricUpsertPayload, useGrabMetricsUpsert } from '../../services/useGrabMetrics';
import { useQueryClient } from '@tanstack/react-query';

interface GrabManualEntryProps {
  companyId: string;
  stores: string[];
  onSuccess?: () => void;
}

// Custom error type to handle backend errors
interface ApiError {
  message?: string;
  [key: string]: unknown;
}

const GrabManualEntry: React.FC<GrabManualEntryProps> = ({ 
  companyId, 
  stores,
  onSuccess 
}) => {
  const [useCustomStore, setUseCustomStore] = useState<boolean>(stores.length === 0);
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<GrabMetricUpsertPayload>({
    defaultValues: {
      store_name: stores.length > 0 ? stores[0] : '',
      date: format(new Date(), 'yyyy-MM-dd'),
      completed_order: undefined,
      cancelled_order: undefined,
      revenue: '',
    }
  });

  const selectedStore = watch('store_name');

  const { mutate, isPending } = useGrabMetricsUpsert(
    companyId,
    selectedStore,
    {
      onSuccess: () => {
        toast.success('Grab metrics updated successfully');
        queryClient.invalidateQueries({ queryKey: ['grab-metrics', companyId] });
        reset();
        if (onSuccess) onSuccess();
      },
      onError: (error: ApiError) => {
        console.error('Detailed error:', error);
        // Extract more meaningful error message if available
        const errorMessage = error.message || 'Unknown error occurred';
        toast.error(`Failed to update: ${errorMessage}`);
      }
    }
  );

  const onSubmit = (data: GrabMetricUpsertPayload) => {
    // Format the fields correctly and include the date as a string
    const formattedPayload = {
      store_name: data.store_name.trim(),
      date: data.date, // Keep the date in the payload; the service will handle it
      completed_order: data.completed_order !== undefined ? Number(data.completed_order) : undefined,
      cancelled_order: data.cancelled_order !== undefined ? Number(data.cancelled_order) : undefined,
      revenue: data.revenue ? String(data.revenue) : undefined
    };
    
    // Debug log to help troubleshoot
    console.log('Submitting payload with date:', formattedPayload);
    
    mutate(formattedPayload);
  };

  const toggleStoreInput = () => {
    setUseCustomStore(!useCustomStore);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
      <div className="px-6 py-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Store Name Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grab Store <span className="text-red-500">*</span>
              </label>
              {stores.length > 0 && !useCustomStore ? (
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  {...register('store_name', { required: 'Store name is required' })}
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
                  placeholder="Enter store name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  {...register('store_name', { required: 'Store name is required' })}
                />
              )}
              {errors.store_name && (
                <p className="mt-1 text-sm text-red-600">{errors.store_name.message}</p>
              )}
              
              {stores.length > 0 && (
                <button 
                  type="button"
                  className="mt-1 text-xs text-green-600 hover:text-green-800"
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                {...register('date', { required: 'Date is required' })}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Completed Orders Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Completed Orders
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                {...register('completed_order', { 
                  validate: (value: number | string | undefined | null) => 
                    !value || Number(value) >= 0 || 'Must be a positive number' 
                })}
              />
              {errors.completed_order && (
                <p className="mt-1 text-sm text-red-600">{errors.completed_order.message}</p>
              )}
            </div>

            {/* Cancelled Orders Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cancelled Orders
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                {...register('cancelled_order', { 
                  validate: (value: number | string | undefined | null) => 
                    !value || Number(value) >= 0 || 'Must be a positive number' 
                })}
              />
              {errors.cancelled_order && (
                <p className="mt-1 text-sm text-red-600">{errors.cancelled_order.message}</p>
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                {...register('revenue')}
              />
              {errors.revenue && (
                <p className="mt-1 text-sm text-red-600">{errors.revenue.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button 
                type="submit"
                className={`px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 ${
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

export default GrabManualEntry; 