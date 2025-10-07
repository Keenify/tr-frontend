export type DietaryRestriction = 'halal' | 'non-halal' | 'vegan';

export interface B2BOrderRow {
  id: string;
  pax: number;
  amountPerPerson: number;
  dietaryRestriction: DietaryRestriction;
}

export interface ValidationError {
  field: string;
  message: string;
}