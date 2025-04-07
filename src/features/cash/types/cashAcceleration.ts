// Define the type for a single strategy item
export interface StrategyItem {
  strategy: string;
  shorten_cycle_times: boolean;
  eliminate_mistakes: boolean;
  improve_business_model_pnl: boolean;
}

// Define the type for the cash acceleration strategies object
export interface CashAccelerationStrategies {
  sales_cycle_improvement: StrategyItem[];
  make_production_inventory_improvement: StrategyItem[];
  delivery_cycle_improvement: StrategyItem[];
  billing_payment_cycle_improvement: StrategyItem[];
}

// Define the payload type for the update operation
export interface UpdateCashAccelerationStrategiesPayload {
  cash_acceleration_strategies: CashAccelerationStrategies;
}

// Define the type for the company data returned by the API
export interface CompanyData {
  id: string;
  name: string;
  completed_sign_up_sequence: boolean;
  company_brand_color: string | null;
  business_quadrant: string | null;
  address: string;
  website_url: string;
  phone: string;
  logo_url: string | null;
  cash_acceleration_strategies: CashAccelerationStrategies;
  created_at: string;
} 