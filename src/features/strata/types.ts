export interface SandboxBrandPromises {
  core_customers: string[];
  products_services: string[];
  brand_promises: string[];
  kpis: string[];
}

export interface ProfitBhag {
  profit_per_x: string[];
  bhag: string[];
}

export interface SevenStrata {
  id?: string;
  company_id: string;
  words_you_own: string[];
  sandbox_brand_promises: SandboxBrandPromises;
  brand_promise_guarantee: string;
  one_phrase_strategy: string;
  differentiating_activities: string[];
  x_factor: string;
  profit_bhag: ProfitBhag;
  last_edited_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Company {
  id: string;
  name: string;
}

export interface StrataProps {
  session: any;
}

export interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

export interface EditableListProps {
  items: string[];
  onSave: (items: string[]) => void;
  placeholder?: string;
  maxItems?: number;
}

export interface StrataSection {
  id: string;
  title: string;
  description: string;
  type: 'text' | 'list' | 'matrix' | 'dual';
  maxItems?: number;
}

export const STRATA_SECTIONS: StrataSection[] = [
  {
    id: 'words_you_own',
    title: 'Words You Own (Mindshare)',
    description: 'Define the unique phrase(s) your brand wants to "own" in the customer\'s mind',
    type: 'list',
    maxItems: 5
  },
  {
    id: 'sandbox_brand_promises',
    title: 'Sandbox & Brand Promises',
    description: '4-column matrix covering customers, products, promises, and KPIs',
    type: 'matrix'
  },
  {
    id: 'brand_promise_guarantee',
    title: 'Brand Promise Guarantee (Catalytic Mechanism)',
    description: 'What commitment or guarantee backs your brand promise',
    type: 'text'
  },
  {
    id: 'one_phrase_strategy',
    title: 'One-Phrase Strategy (Key to Making Money)',
    description: 'The one powerful phrase that captures your competitive strategy',
    type: 'text'
  },
  {
    id: 'differentiating_activities',
    title: 'Differentiating Activities (3–5 Hows)',
    description: 'Core activities or processes your business does differently from competitors',
    type: 'list',
    maxItems: 5
  },
  {
    id: 'x_factor',
    title: 'X-Factor (10x – 100x Underlying Advantage)',
    description: 'What gives you a significant (10x or more) advantage over others',
    type: 'text'
  },
  {
    id: 'profit_bhag',
    title: 'Profit per X & BHAG (Economic Engine & Long-Term Goal)',
    description: '2-column matrix: profit model and ambitious long-term goal',
    type: 'dual'
  }
];