import { 
  FinancialInputs, 
  PowerOfOneChanges, 
  CalculatedMetrics, 
  LeverImpact, 
  PowerOfOneRow,
  PowerOfOneTotals 
} from '../types/powerOfOne';

// Calculate base financial metrics
export const calculateBaseMetrics = (
  inputs: FinancialInputs, 
  changes?: PowerOfOneChanges
): CalculatedMetrics => {
  const { revenue, cogs, overheads } = inputs;
  
  const ebit = revenue - cogs - overheads;
  const dailyRevenue = revenue / 365;
  const dailyCogs = cogs / 365;
  const grossMargin = revenue > 0 ? (revenue - cogs) / revenue : 0;
  
  // Calculate Net Cash Flow with working capital changes
  let netCashFlow = ebit;
  
  if (changes) {
    // ΔDebtors Cash = debtor_days_reduction × (Revenue / 365)
    const deltaDebtorsCash = changes.debtorDaysReduction * dailyRevenue;
    
    // ΔStock Cash = stock_days_reduction × (COGS / 365)
    const deltaStockCash = changes.stockDaysReduction * dailyCogs;
    
    // ΔCreditors Cash = creditor_days_increase × (COGS / 365)
    const deltaCreditorsHash = changes.creditorDaysIncrease * dailyCogs;
    
    // Net Cash Flow = EBIT + ΔDebtors Cash + ΔStock Cash + ΔCreditors Cash
    netCashFlow = ebit + deltaDebtorsCash + deltaStockCash + deltaCreditorsHash;
  }
  
  return {
    ebit,
    dailyRevenue,
    dailyCogs,
    grossMargin,
    netCashFlow
  };
};

// Calculate individual lever impacts
export const calculateLeverImpacts = (
  inputs: FinancialInputs,
  changes: PowerOfOneChanges,
  baseMetrics: CalculatedMetrics
): Record<string, LeverImpact> => {
  const impacts: Record<string, LeverImpact> = {};
  
  // 1. Price Increase
  const priceIncreaseCashFlow = inputs.revenue * changes.priceIncreasePct / 100;
  impacts.priceIncrease = {
    cashFlowImpact: priceIncreaseCashFlow,
    ebitImpact: priceIncreaseCashFlow
  };
  
  // 2. Volume Increase
  const volumeIncreaseCashFlow = inputs.revenue * changes.volumeIncreasePct / 100 * baseMetrics.grossMargin;
  impacts.volumeIncrease = {
    cashFlowImpact: volumeIncreaseCashFlow,
    ebitImpact: volumeIncreaseCashFlow
  };
  
  // 3. COGS Reduction
  const cogsReductionCashFlow = inputs.cogs * changes.cogsReductionPct / 100;
  impacts.cogsReduction = {
    cashFlowImpact: cogsReductionCashFlow,
    ebitImpact: cogsReductionCashFlow
  };
  
  // 4. Overheads Reduction
  const overheadsReductionCashFlow = inputs.overheads * changes.overheadsReductionPct / 100;
  impacts.overheadsReduction = {
    cashFlowImpact: overheadsReductionCashFlow,
    ebitImpact: overheadsReductionCashFlow
  };
  
  // 5. Debtors Days Reduction (affects cash flow only, not EBIT)
  const debtorDaysReductionCashFlow = changes.debtorDaysReduction * baseMetrics.dailyRevenue;
  impacts.debtorDaysReduction = {
    cashFlowImpact: debtorDaysReductionCashFlow,
    ebitImpact: 0
  };
  
  // 6. Stock Days Reduction (affects cash flow only, not EBIT)
  const stockDaysReductionCashFlow = changes.stockDaysReduction * baseMetrics.dailyCogs;
  impacts.stockDaysReduction = {
    cashFlowImpact: stockDaysReductionCashFlow,
    ebitImpact: 0
  };
  
  // 7. Creditors Days Increase (affects cash flow only, not EBIT)
  const creditorDaysIncreaseCashFlow = changes.creditorDaysIncrease * baseMetrics.dailyCogs;
  impacts.creditorDaysIncrease = {
    cashFlowImpact: creditorDaysIncreaseCashFlow,
    ebitImpact: 0
  };
  
  return impacts;
};

// Generate Power of One table rows
export const generatePowerOfOneRows = (
  inputs: FinancialInputs,
  changes: PowerOfOneChanges,
  baseMetrics: CalculatedMetrics
): PowerOfOneRow[] => {
  const impacts = calculateLeverImpacts(inputs, changes, baseMetrics);
  
  return [
    {
      id: 'priceIncrease',
      label: 'Price Increase %',
      changeLabel: 'Price Increase %',
      changeValue: changes.priceIncreasePct,
      changeType: 'percentage',
      cashFlowImpact: impacts.priceIncrease.cashFlowImpact,
      ebitImpact: impacts.priceIncrease.ebitImpact
    },
    {
      id: 'volumeIncrease',
      label: 'Volume Increase %',
      changeLabel: 'Volume Increase %',
      changeValue: changes.volumeIncreasePct,
      changeType: 'percentage',
      cashFlowImpact: impacts.volumeIncrease.cashFlowImpact,
      ebitImpact: impacts.volumeIncrease.ebitImpact
    },
    {
      id: 'cogsReduction',
      label: 'COGS Reduction %',
      changeLabel: 'COGS Reduction %',
      changeValue: changes.cogsReductionPct,
      changeType: 'percentage',
      cashFlowImpact: impacts.cogsReduction.cashFlowImpact,
      ebitImpact: impacts.cogsReduction.ebitImpact
    },
    {
      id: 'overheadsReduction',
      label: 'Overheads Reduction %',
      changeLabel: 'Overheads Reduction %',
      changeValue: changes.overheadsReductionPct,
      changeType: 'percentage',
      cashFlowImpact: impacts.overheadsReduction.cashFlowImpact,
      ebitImpact: impacts.overheadsReduction.ebitImpact
    },
    {
      id: 'debtorDaysReduction',
      label: 'Reduction in Debtors Days',
      changeLabel: 'Days Reduction',
      changeValue: changes.debtorDaysReduction,
      changeType: 'days',
      cashFlowImpact: impacts.debtorDaysReduction.cashFlowImpact,
      ebitImpact: impacts.debtorDaysReduction.ebitImpact
    },
    {
      id: 'stockDaysReduction',
      label: 'Reduction in Stock Days',
      changeLabel: 'Days Reduction',
      changeValue: changes.stockDaysReduction,
      changeType: 'days',
      cashFlowImpact: impacts.stockDaysReduction.cashFlowImpact,
      ebitImpact: impacts.stockDaysReduction.ebitImpact
    },
    {
      id: 'creditorDaysIncrease',
      label: 'Increase in Creditors Days',
      changeLabel: 'Days Increase',
      changeValue: changes.creditorDaysIncrease,
      changeType: 'days',
      cashFlowImpact: impacts.creditorDaysIncrease.cashFlowImpact,
      ebitImpact: impacts.creditorDaysIncrease.ebitImpact
    }
  ];
};

// Calculate totals
export const calculateTotals = (
  rows: PowerOfOneRow[],
  baseMetrics: CalculatedMetrics
): PowerOfOneTotals => {
  const totalCashFlowImpact = rows.reduce((sum, row) => sum + row.cashFlowImpact, 0);
  const totalEbitImpact = rows.reduce((sum, row) => sum + row.ebitImpact, 0);
  
  // Calculate working capital impacts only (last 3 levers)
  const workingCapitalImpact = rows
    .filter(row => ['debtorDaysReduction', 'stockDaysReduction', 'creditorDaysIncrease'].includes(row.id))
    .reduce((sum, row) => sum + row.cashFlowImpact, 0);
  
  return {
    totalCashFlowImpact,
    totalEbitImpact,
    adjustedEbit: baseMetrics.ebit + totalEbitImpact,
    adjustedCashFlow: baseMetrics.ebit + workingCapitalImpact // Base EBIT + Working Capital Impacts
  };
};

// Format currency values for display
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Format percentage values for display
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};