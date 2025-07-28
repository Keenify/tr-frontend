import { useState, useEffect, useCallback } from 'react';
import { 
  FinancialInputs, 
  PowerOfOneChanges, 
  PowerOfOneData,
  CalculatedMetrics,
  PowerOfOneRow,
  PowerOfOneTotals
} from '../types/powerOfOne';
import { powerOfOneService } from '../services/powerOfOneService';
import { 
  calculateBaseMetrics, 
  generatePowerOfOneRows, 
  calculateTotals 
} from '../utils/calculations';

// Default values
const DEFAULT_FINANCIAL_INPUTS: FinancialInputs = {
  revenue: 0,
  cogs: 0,
  overheads: 0,
  debtorDays: 0,
  stockDays: 0,
  creditorDays: 0
};

const DEFAULT_CHANGES: PowerOfOneChanges = {
  priceIncreasePct: 0,
  volumeIncreasePct: 0,
  cogsReductionPct: 0,
  overheadsReductionPct: 0,
  debtorDaysReduction: 0,
  stockDaysReduction: 0,
  creditorDaysIncrease: 0
};

export const usePowerOfOne = (userId: string, companyId?: string) => {
  const [financialInputs, setFinancialInputs] = useState<FinancialInputs>(DEFAULT_FINANCIAL_INPUTS);
  const [changes, setChanges] = useState<PowerOfOneChanges>(DEFAULT_CHANGES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInputsExpanded, setIsInputsExpanded] = useState(false);

  // Calculated values
  const baseMetrics: CalculatedMetrics = calculateBaseMetrics(financialInputs, changes);
  const rows: PowerOfOneRow[] = generatePowerOfOneRows(financialInputs, changes, baseMetrics);
  const totals: PowerOfOneTotals = calculateTotals(rows, baseMetrics);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await powerOfOneService.getPowerOfOneData(userId, companyId);
        
        if (data) {
          setFinancialInputs(data.financialInputs);
          setChanges(data.changes);
        }
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadData();
    }
  }, [userId, companyId]);

  // Save financial inputs
  const saveFinancialInputs = useCallback(async () => {
    try {
      setSaving(true);
      
      const powerOfOneData: PowerOfOneData = {
        userId,
        companyId,
        financialInputs,
        changes
      };
      
      const savedData = await powerOfOneService.savePowerOfOneData(powerOfOneData);
      
      if (!savedData) {
        throw new Error('Failed to save financial inputs');
      }
      
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save financial inputs');
      return false;
    } finally {
      setSaving(false);
    }
  }, [userId, companyId, financialInputs, changes]);

  // Update a single financial input
  const updateFinancialInput = useCallback((field: keyof FinancialInputs, value: number) => {
    setFinancialInputs(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Update a single change value
  const updateChange = useCallback(async (rowId: string, value: number) => {
    const newChanges = { ...changes };
    
    // Map rowId to the correct field
    const fieldMap: Record<string, keyof PowerOfOneChanges> = {
      priceIncrease: 'priceIncreasePct',
      volumeIncrease: 'volumeIncreasePct',
      cogsReduction: 'cogsReductionPct',
      overheadsReduction: 'overheadsReductionPct',
      debtorDaysReduction: 'debtorDaysReduction',
      stockDaysReduction: 'stockDaysReduction',
      creditorDaysIncrease: 'creditorDaysIncrease'
    };
    
    const field = fieldMap[rowId];
    if (field) {
      newChanges[field] = value;
      setChanges(newChanges);
      
      // Auto-save changes to database
      try {
        const success = await powerOfOneService.updateChanges(userId, newChanges, companyId);
        if (!success) {
          throw new Error('Failed to save changes');
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save changes');
      }
    }
  }, [userId, companyId, changes]);

  // Toggle inputs expansion
  const toggleInputsExpanded = useCallback(() => {
    setIsInputsExpanded(prev => !prev);
  }, []);

  // Reset all changes to zero
  const resetChanges = useCallback(async () => {
    try {
      const resetChanges = DEFAULT_CHANGES;
      setChanges(resetChanges);
      
      const success = await powerOfOneService.updateChanges(userId, resetChanges, companyId);
      if (!success) {
        throw new Error('Failed to reset changes');
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset changes');
    }
  }, [userId, companyId]);

  // Check if financial inputs are complete
  const hasCompleteFinancialInputs = useCallback(() => {
    return Object.values(financialInputs).every(value => value > 0);
  }, [financialInputs]);

  return {
    // State
    financialInputs,
    changes,
    loading,
    saving,
    error,
    isInputsExpanded,
    
    // Calculated values
    baseMetrics,
    rows,
    totals,
    
    // Actions
    updateFinancialInput,
    saveFinancialInputs,
    updateChange,
    toggleInputsExpanded,
    resetChanges,
    
    // Utilities
    hasCompleteFinancialInputs
  };
};