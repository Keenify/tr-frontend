interface Stage {
  unit: string;
  value: number;
}

interface Stages {
  A: Stage;
  B: Stage;
  C: Stage;
  D: Stage;
}

interface MetricSet {
  name: string;
  stages: Stages;
}

interface MetricSets {
  actual_ccc: MetricSet;
  desired_ccc: MetricSet;
  estimated_ccc: MetricSet;
}

export interface CashConversionMap {
  metric_sets: MetricSets;
}

export interface UpdateCashConversionMapPayload {
  cash_conversion_map: CashConversionMap;
}

export interface CompanyResponse {
  id: string;
  name: string;
  cash_conversion_map: CashConversionMap;
  // ... other company fields
} 