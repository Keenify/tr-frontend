export interface FinancialInputs {
  revenue: number;
  cogs: number;
  overheads: number;
  debtorDays: number;
  stockDays: number;
  creditorDays: number;
}

export interface PowerOfOneChanges {
  priceIncreasePct: number;
  volumeIncreasePct: number;
  cogsReductionPct: number;
  overheadsReductionPct: number;
  debtorDaysReduction: number;
  stockDaysReduction: number;
  creditorDaysIncrease: number;
}

export interface CalculatedMetrics {
  ebit: number;
  dailyRevenue: number;
  dailyCogs: number;
  grossMargin: number;
  netCashFlow: number;
}

export interface LeverImpact {
  cashFlowImpact: number;
  ebitImpact: number;
}

export interface PowerOfOneData {
  id?: string;
  userId: string;
  companyId?: string;
  financialInputs: FinancialInputs;
  changes: PowerOfOneChanges;
  createdAt?: string;
  updatedAt?: string;
}

export interface PowerOfOneRow {
  id: string;
  label: string;
  changeLabel: string;
  changeValue: number;
  changeType: 'percentage' | 'days';
  cashFlowImpact: number;
  ebitImpact: number;
}

export interface PowerOfOneTotals {
  totalCashFlowImpact: number;
  totalEbitImpact: number;
  adjustedEbit: number;
  adjustedCashFlow: number;
}

export interface PowerOfOneProps {
  userId: string;
  companyId?: string;
  onUpdate?: (data: PowerOfOneData) => void;
}

export interface FinancialInputsFormProps {
  inputs: FinancialInputs;
  onInputChange: (field: keyof FinancialInputs, value: number) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export interface PowerOfOneTableProps {
  rows: PowerOfOneRow[];
  totals: PowerOfOneTotals;
  onChangeUpdate: (rowId: string, value: number) => void;
  loading?: boolean;
}