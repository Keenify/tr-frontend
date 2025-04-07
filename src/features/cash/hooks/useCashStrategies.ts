import { useState, useEffect, useCallback } from 'react';
import {
  getCompanyCashAccelerationStrategies,
  updateCompanyCashAccelerationStrategies,
} from '../services/useCashAccelerationStrategies';
import { CashAccelerationStrategies, UpdateCashAccelerationStrategiesPayload } from '../types/cashAcceleration';
import toast from 'react-hot-toast';

export interface UseCashStrategiesResult {
  strategies: CashAccelerationStrategies | null;
  setStrategies: React.Dispatch<React.SetStateAction<CashAccelerationStrategies | null>>; // Allow component to update local state
  loading: boolean;
  error: string | null;
  updateStrategies: (updatedStrategies: CashAccelerationStrategies) => Promise<{ success: boolean; error?: string }>;
  refetch: () => void;
}

// // Helper to create a default StrategyItem - REMOVED
// const createDefaultStrategyItem = (): StrategyItem => ({
//     strategy: '',
//     shorten_cycle_times: false,
//     eliminate_mistakes: false,
//     improve_business_model_pnl: false,
// });

// Helper to create default empty strategies structure
const createEmptyStrategies = (): CashAccelerationStrategies => ({
  sales_cycle_improvement: [],
  make_production_inventory_improvement: [],
  delivery_cycle_improvement: [],
  billing_payment_cycle_improvement: [],
});

// // Helper to ensure each category has exactly 5 items, padding if necessary - REMOVED
// const ensureFiveItems = (items: StrategyItem[] | undefined | null): StrategyItem[] => {
//     const validItems = items || [];
//     const defaultsNeeded = 5 - validItems.length;
//     const padding = defaultsNeeded > 0 ? Array(defaultsNeeded).fill(null).map(createDefaultStrategyItem) : [];
//     return [...validItems, ...padding].slice(0, 5);
// };


export function useCashStrategies(companyId: string | null | undefined): UseCashStrategiesResult {
  const [strategies, setStrategies] = useState<CashAccelerationStrategies | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStrategies = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      setStrategies(createEmptyStrategies()); // Provide empty structure if no companyId
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const companyData = await getCompanyCashAccelerationStrategies(companyId);
      // Use fetched strategies or default empty structure
      const fetchedStrategies = companyData.cash_acceleration_strategies;

      // Ensure structure exists, default to empty arrays if needed
       const validatedStrategies: CashAccelerationStrategies = {
         sales_cycle_improvement: fetchedStrategies?.sales_cycle_improvement || [],
         make_production_inventory_improvement: fetchedStrategies?.make_production_inventory_improvement || [],
         delivery_cycle_improvement: fetchedStrategies?.delivery_cycle_improvement || [],
         billing_payment_cycle_improvement: fetchedStrategies?.billing_payment_cycle_improvement || [],
       };
      setStrategies(validatedStrategies);
    } catch (err) {
      console.error('Error fetching cash strategies:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cash strategies';
      setError(errorMessage);
      setStrategies(createEmptyStrategies()); // Provide empty structure on error
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

    // Filter out empty strategies before sending?
    // Consider if backend handles empty strings or if they should be removed.
    // Example: Filter out items where strategy description is empty
    // const cleanedStrategies = { ... };

    const payload: UpdateCashAccelerationStrategiesPayload = {
      // Send the strategies as they are in the state
       cash_acceleration_strategies: updatedStrategiesData
    };

    try {
      // Assuming the API returns the updated company data which includes the strategies
      const updatedCompanyData = await updateCompanyCashAccelerationStrategies(companyId, payload);
      // Update local state with the confirmed data from the backend
      const confirmedStrategies = updatedCompanyData.cash_acceleration_strategies;
       // Ensure structure exists, default to empty arrays if needed
       const validatedStrategies: CashAccelerationStrategies = {
         sales_cycle_improvement: confirmedStrategies?.sales_cycle_improvement || [],
         make_production_inventory_improvement: confirmedStrategies?.make_production_inventory_improvement || [],
         delivery_cycle_improvement: confirmedStrategies?.delivery_cycle_improvement || [],
         billing_payment_cycle_improvement: confirmedStrategies?.billing_payment_cycle_improvement || [],
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
