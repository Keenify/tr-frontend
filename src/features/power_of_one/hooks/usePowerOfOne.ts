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
  const [restarting, setRestarting] = useState(false);
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

  // Save both financial inputs and changes together
  const saveAllData = useCallback(async (): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);
      
      const powerOfOneData: PowerOfOneData = {
        userId,
        companyId,
        financialInputs, // 6 base values
        changes // 7 simulation values - ALL PRESERVED!
      };
      
      const savedData = await powerOfOneService.savePowerOfOneData(powerOfOneData);
      
      // Update local state with saved data to ensure consistency
      setFinancialInputs(savedData.financialInputs);
      setChanges(savedData.changes);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save Power of One data';
      setError(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [userId, companyId, financialInputs, changes]);

  // Legacy method for backward compatibility
  const saveFinancialInputs = useCallback(async () => {
    return await saveAllData();
  }, [saveAllData]);

  // Update a single financial input with validation
  const updateFinancialInput = useCallback((field: keyof FinancialInputs, value: number) => {
    // Prevent negative values
    const sanitizedValue = Math.max(0, value || 0);
    
    setFinancialInputs(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));
  }, []);

  // Update a single change value (removed auto-save to prevent conflicts)
  const updateChange = useCallback((rowId: string, value: number) => {
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
    }
  }, [changes]);

  // Toggle inputs expansion
  const toggleInputsExpanded = useCallback(() => {
    setIsInputsExpanded(prev => !prev);
  }, []);

  // Restart analysis - clear all data
  const restartAnalysis = useCallback(async (): Promise<boolean> => {
    try {
      setRestarting(true);
      setError(null);
      
      const resetData = await powerOfOneService.restartPowerOfOneData(userId, companyId);
      
      // Update local state with reset data
      setFinancialInputs(resetData.financialInputs);
      setChanges(resetData.changes);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restart analysis';
      setError(errorMessage);
      return false;
    } finally {
      setRestarting(false);
    }
  }, [userId, companyId]);

  // Reset all changes to zero (local state only)
  const resetChanges = useCallback(() => {
    setChanges(DEFAULT_CHANGES);
  }, []);

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
    restarting,
    error,
    isInputsExpanded,
    
    // Calculated values
    baseMetrics,
    rows,
    totals,
    
    // Actions
    updateFinancialInput,
    saveFinancialInputs, // Legacy method
    saveAllData, // New combined save method
    updateChange,
    toggleInputsExpanded,
    resetChanges, // Local state reset only
    restartAnalysis, // Full database restart
    
    // Utilities
    hasCompleteFinancialInputs
  };
};