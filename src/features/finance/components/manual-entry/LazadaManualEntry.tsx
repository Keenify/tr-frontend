import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { LazadaMetricUpsertPayload, useLazadaMetricsUpsert } from '../../services/useLazadaMetrics';
import { useQueryClient } from '@tanstack/react-query';

interface LazadaManualEntryProps {
  companyId: string;
  accounts: string[];
  onSuccess?: () => void;
}

const LazadaManualEntry: React.FC<LazadaManualEntryProps> = ({ 
  companyId, 
  accounts,
  onSuccess 
}) => {
  const [useCustomAccount, setUseCustomAccount] = useState<boolean>(accounts.length === 0);
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<LazadaMetricUpsertPayload>({
    defaultValues: {
      account_id: accounts.length > 0 ? accounts[0] : '',
      date: format(new Date(), 'yyyy-MM-dd'),
      revenue: '',
      ads_expense: '',
      total_orders: undefined,
      new_buyer_count: undefined,
      existing_buyer_count: undefined
    }
  });

  const { mutate, isPending } = useLazadaMetricsUpsert(companyId, {
    onSuccess: () => {
      toast.success('Lazada metrics updated successfully');
      queryClient.invalidateQueries({ queryKey: ['lazada-metrics', companyId] });
      reset();
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    }
  });

  const onSubmit = (data: LazadaMetricUpsertPayload) => {
    // Ensure numeric fields are properly converted
    const payload: LazadaMetricUpsertPayload = {
      ...data,
      revenue: data.revenue ? data.revenue : undefined,
      ads_expense: data.ads_expense ? data.ads_expense : undefined,
      total_orders: data.total_orders ? Number(data.total_orders) : undefined,
      new_buyer_count: data.new_buyer_count ? Number(data.new_buyer_count) : undefined,
      existing_buyer_count: data.existing_buyer_count ? Number(data.existing_buyer_count) : undefined
    };
    
    mutate(payload);
  };

  const toggleAccountInput = () => {
    setUseCustomAccount(!useCustomAccount);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
      <div className="px-6 py-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Account ID Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lazada Account <span className="text-red-500">*</span>
              </label>
              {accounts.length > 0 && !useCustomAccount ? (
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('account_id', { required: 'Account is required' })}
                >
                  {accounts.map((account) => (
                    <option key={account} value={account}>
                      {account}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter account email"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('account_id', { required: 'Account is required' })}
                />
              )}
              {errors.account_id && (
                <p className="mt-1 text-sm text-red-600">{errors.account_id.message}</p>
              )}
              
              {accounts.length > 0 && (
                <button 
                  type="button"
                  className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                  onClick={toggleAccountInput}
                >
                  {useCustomAccount ? "Use existing account" : "Enter custom account"}
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

            {/* Revenue Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Revenue
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

export default LazadaManualEntry; 