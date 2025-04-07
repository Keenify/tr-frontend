/**
 * Interface for Business Quadrant data
 */
export interface BusinessQuadrant {
  create_value: string;
  deliver_value: string;
  capture_value: string;
  defend_value: string;
}

/**
 * Interface for Company data
 */
export interface Company {
  id: string;
  name: string;
  completed_sign_up_sequence: boolean;
  company_brand_color: string | null;
  business_quadrant: BusinessQuadrant;
  created_at: string;
  address: string | null;
  website_url: string | null;
  phone: string | null;
  logo_url: string | null;
} 