import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { FoodpandaMetricUpsertPayload, useFoodpandaMetricsUpsert } from '../../services/useFoodpandaMetrics';
import { useQueryClient } from '@tanstack/react-query';

interface FoodpandaManualEntryProps {
  companyId: string;
  shops: string[];
  onSuccess?: () => void;
}

const FoodpandaManualEntry: React.FC<FoodpandaManualEntryProps> = ({ 
  companyId, 
  shops,
  onSuccess 
}) => {
  const [useCustomShop, setUseCustomShop] = useState<boolean>(shops.length === 0);
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FoodpandaMetricUpsertPayload>({
    defaultValues: {
      shop_id: shops.length > 0 ? shops[0] : '',
      date: format(new Date(), 'yyyy-MM-dd'),
      revenue: '',
      total_orders: undefined
    }
  });

  const { mutate, isPending } = useFoodpandaMetricsUpsert(companyId, {
    onSuccess: () => {
      toast.success('Foodpanda metrics updated successfully');
      queryClient.invalidateQueries({ queryKey: ['foodpanda-metrics', companyId] });
      reset();
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    }
  });

  const onSubmit = (data: FoodpandaMetricUpsertPayload) => {
    // Ensure fields are properly formatted for API
    const payload: FoodpandaMetricUpsertPayload = {
      shop_id: data.shop_id.trim(),
      date: data.date, // Ensure date is included in YYYY-MM-DD format
      revenue: data.revenue ? data.revenue : undefined,
      total_orders: data.total_orders ? Number(data.total_orders) : undefined
    };
    
    console.log('Submitting Foodpanda payload with date:', payload);
    
    mutate(payload);
  };

  const toggleShopInput = () => {
    setUseCustomShop(!useCustomShop);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
      <div className="px-6 py-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Shop ID Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Foodpanda Shop <span className="text-red-500">*</span>
              </label>
              {shops.length > 0 && !useCustomShop ? (
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  {...register('shop_id', { required: 'Shop is required' })}
                >
                  {shops.map((shop) => (
                    <option key={shop} value={shop}>
                      {shop}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter shop ID"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  {...register('shop_id', { required: 'Shop is required' })}
                />
              )}
              {errors.shop_id && (
                <p className="mt-1 text-sm text-red-600">{errors.shop_id.message}</p>
              )}
              
              {shops.length > 0 && (
                <button 
                  type="button"
                  className="mt-1 text-xs text-purple-600 hover:text-purple-800"
                  onClick={toggleShopInput}
                >
                  {useCustomShop ? "Use existing shop" : "Enter custom shop"}
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                {...register('revenue')}
              />
              {errors.revenue && (
                <p className="mt-1 text-sm text-red-600">{errors.revenue.message}</p>
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                {...register('total_orders', { 
                  valueAsNumber: true,
                  validate: (value: number | undefined) => !value || value >= 0 || 'Must be a positive number' 
                })}
              />
              {errors.total_orders && (
                <p className="mt-1 text-sm text-red-600">{errors.total_orders.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button 
                type="submit"
                className={`px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
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

export default FoodpandaManualEntry; 