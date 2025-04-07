import { useState, useEffect, useCallback } from 'react';
import {
  getCompanyCashAccelerationStrategies,
  updateCompanyCashAccelerationStrategies,
} from '../services/useCashAccelerationStrategies';
import { CashAccelerationStrategies, UpdateCashAccelerationStrategiesPayload, StrategyItem } from '../types/cashAcceleration';
import toast from 'react-hot-toast';

export interface UseCashStrategiesResult {
  strategies: CashAccelerationStrategies | null;
  setStrategies: React.Dispatch<React.SetStateAction<CashAccelerationStrategies | null>>; // Allow component to update local state
  loading: boolean;
  error: string | null;
  updateStrategies: (updatedStrategies: CashAccelerationStrategies) => Promise<{ success: boolean; error?: string }>;
  refetch: () => void;
}

// Helper to create a default StrategyItem
const createDefaultStrategyItem = (): StrategyItem => ({
    strategy: '',
    shorten_cycle_times: false,
    eliminate_mistakes: false,
    improve_business_model_pnl: false,
});

// Helper to create default strategies structure ensuring 5 items per category
const createDefaultStrategies = (): CashAccelerationStrategies => ({
  sales_cycle_improvement: Array(5).fill(null).map(createDefaultStrategyItem),
  make_production_inventory_improvement: Array(5).fill(null).map(createDefaultStrategyItem),
  delivery_cycle_improvement: Array(5).fill(null).map(createDefaultStrategyItem),
  billing_payment_cycle_improvement: Array(5).fill(null).map(createDefaultStrategyItem),
});

// Helper to ensure each category has exactly 5 items, padding if necessary
const ensureFiveItems = (items: StrategyItem[] | undefined | null): StrategyItem[] => {
    const validItems = items || [];
    const defaultsNeeded = 5 - validItems.length;
    const padding = defaultsNeeded > 0 ? Array(defaultsNeeded).fill(null).map(createDefaultStrategyItem) : [];
    return [...validItems, ...padding].slice(0, 5);
};


export function useCashStrategies(companyId: string | null | undefined): UseCashStrategiesResult {
  const [strategies, setStrategies] = useState<CashAccelerationStrategies | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStrategies = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      setStrategies(createDefaultStrategies()); // Provide default structure if no companyId
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const companyData = await getCompanyCashAccelerationStrategies(companyId);
      // Ensure strategies structure exists, providing defaults if null/undefined
      const fetchedStrategies = companyData.cash_acceleration_strategies;

      // Validate and ensure each category has exactly 5 items
       const validatedStrategies: CashAccelerationStrategies = {
         sales_cycle_improvement: ensureFiveItems(fetchedStrategies?.sales_cycle_improvement),
         make_production_inventory_improvement: ensureFiveItems(fetchedStrategies?.make_production_inventory_improvement),
         delivery_cycle_improvement: ensureFiveItems(fetchedStrategies?.delivery_cycle_improvement),
         billing_payment_cycle_improvement: ensureFiveItems(fetchedStrategies?.billing_payment_cycle_improvement),
       };
      setStrategies(validatedStrategies);
    } catch (err) {
      console.error('Error fetching cash strategies:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cash strategies';
      setError(errorMessage);
      setStrategies(createDefaultStrategies()); // Provide default structure on error
      toast.error(`Could not load cash strategies: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  const updateStrategies = useCallback(async (updatedStrategiesData: CashAccelerationStrategies): Promise<{ success: boolean; error?: string }> => {
    if (!companyId) {
      return { success: false, error: 'Company ID is missing' };
    }
    if (!updatedStrategiesData) {
        return { success: false, error: 'No strategies data provided for update.' };
    }

    const payload: UpdateCashAccelerationStrategiesPayload = {
      // Ensure we are sending the correct structure, even if the input was potentially null
       cash_acceleration_strategies: {
         sales_cycle_improvement: ensureFiveItems(updatedStrategiesData.sales_cycle_improvement),
         make_production_inventory_improvement: ensureFiveItems(updatedStrategiesData.make_production_inventory_improvement),
         delivery_cycle_improvement: ensureFiveItems(updatedStrategiesData.delivery_cycle_improvement),
         billing_payment_cycle_improvement: ensureFiveItems(updatedStrategiesData.billing_payment_cycle_improvement),
       }
    };

    try {
      // Assuming the API returns the updated company data which includes the strategies
      const updatedCompanyData = await updateCompanyCashAccelerationStrategies(companyId, payload);
      // Update local state with the confirmed data from the backend
      const confirmedStrategies = updatedCompanyData.cash_acceleration_strategies;
       const validatedStrategies: CashAccelerationStrategies = {
         sales_cycle_improvement: ensureFiveItems(confirmedStrategies?.sales_cycle_improvement),
         make_production_inventory_improvement: ensureFiveItems(confirmedStrategies?.make_production_inventory_improvement),
         delivery_cycle_improvement: ensureFiveItems(confirmedStrategies?.delivery_cycle_improvement),
         billing_payment_cycle_improvement: ensureFiveItems(confirmedStrategies?.billing_payment_cycle_improvement),
       };
      setStrategies(validatedStrategies);
      return { success: true };
    } catch (err) {
      console.error('Error updating cash strategies:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update strategies';
      toast.error(`Failed to save strategies: ${errorMessage}`)
      return { success: false, error: errorMessage };
    }
  }, [companyId]);


  return { strategies, setStrategies, loading, error, updateStrategies, refetch: fetchStrategies };
}
