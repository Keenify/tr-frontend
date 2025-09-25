export type DietaryRestriction = 'halal' | 'non-halal' | 'vegan' | 'custom';

export interface B2BOrderRow {
  id: string;
  pax: number;
  amountPerPerson: number;
  dietaryRestriction: DietaryRestriction;
  customDietary?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}