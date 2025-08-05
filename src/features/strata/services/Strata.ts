import { supabase } from '../../../lib/supabase';
import { SevenStrata, Company } from '../types';

class StrataService {
  // Get companies using user's actual company access (simplified - no employees table)
  async getCompaniesForUser(userId: string): Promise<Company[]> {
    try {
      console.log('🔍 Getting companies for 7 Strata for userId:', userId);
      
      // IMPORTANT: This method now returns empty array since company filtering 
      // should be handled by the component using user's actual company data
      // The component will use userInfo.company_id to determine which companies the user has access to
      
      // For now, we return companies with existing strata data only
      // This prevents users from seeing all companies in the system
      const { data: strataCompanies, error: strataError } = await supabase
        .from('seven_strata')
        .select('company_id, company_name')
        .not('company_name', 'is', null);

      if (!strataError && strataCompanies && strataCompanies.length > 0) {
        const existingCompanies = strataCompanies
          .filter((record, index, self) => 
            index === self.findIndex(r => r.company_id === record.company_id)
          )
          .map(record => ({
            id: record.company_id,
            name: record.company_name
          }));
        
        console.log('🔍 Found companies with existing strata data:', existingCompanies);
        return existingCompanies;
      }

      console.log('🔍 No existing strata data found - returning empty array');
      return [];
      
    } catch (error) {
      console.error('🔍 Error in getCompaniesForUser:', error);
      return [];
    }
  }

  // Get strata data for a specific company (Simplified - no employees table validation)
  async getStrataByCompany(userId: string, companyId: string): Promise<SevenStrata | null> {
    try {
      console.log('🔍 Fetching company strata for userId:', userId, 'companyId:', companyId);
      
      // Query by company_id only (no user validation - simplified approach)
      const { data, error } = await supabase
        .from('seven_strata')
        .select('*')
        .eq('company_id', companyId)
        .single();

      console.log('🔍 Company strata query result:', { data, error });

      if (error) {
        // If no record found, return null (company hasn't created strata yet)
        if (error.code === 'PGRST116') {
          console.log('🔍 No strata data found for company');
          return null;
        }
        console.error('🔍 Error fetching company strata:', error);
        return null;
      }

      // Handle backward compatibility for profit_bhag format change
      if (data && data.profit_bhag) {
        if (typeof data.profit_bhag.profit_per_x === 'string') {
          data.profit_bhag.profit_per_x = data.profit_bhag.profit_per_x ? [data.profit_bhag.profit_per_x] : [];
        }
        if (typeof data.profit_bhag.bhag === 'string') {
          data.profit_bhag.bhag = data.profit_bhag.bhag ? [data.profit_bhag.bhag] : [];
        }
      }

      return data;
    } catch (error) {
      console.error('Error fetching strata data:', error);
      return null;
    }
  }

  async createStrata(
    userId: string,
    strataData: Omit<SevenStrata, 'id' | 'created_at' | 'updated_at' | 'last_edited_by'>
  ): Promise<SevenStrata | null> {
    try {
      // Add last_edited_by to track who created the record
      const dataWithEditor = {
        ...strataData,
        last_edited_by: userId
      };
      
      const { data, error } = await supabase
        .from('seven_strata')
        .insert(dataWithEditor)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating strata:', error);
      return null;
    }
  }

  async updateStrata(
    userId: string,
    companyId: string,
    updates: Partial<SevenStrata>
  ): Promise<SevenStrata | null> {
    try {
      // Add last_edited_by and updated_at to track changes
      const updatesWithEditor = {
        ...updates,
        last_edited_by: userId,
        updated_at: new Date().toISOString()
      };
      
      // Update by company_id only
      const { data, error } = await supabase
        .from('seven_strata')
        .update(updatesWithEditor)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating strata:', error);
      return null;
    }
  }

  async upsertStrata(
    userId: string,
    strataData: Omit<SevenStrata, 'created_at' | 'updated_at' | 'last_edited_by'>
  ): Promise<SevenStrata | null> {
    try {
      // Check if company already has strata data
      const existingData = await this.getStrataByCompany(userId, strataData.company_id);
      
      // Add last_edited_by to track who made changes
      const dataWithEditor = {
        ...strataData,
        last_edited_by: userId,
        updated_at: new Date().toISOString()
      };
      
      if (existingData) {
        // Update existing company record
        const { data, error } = await supabase
          .from('seven_strata')
          .update(dataWithEditor)
          .eq('company_id', strataData.company_id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new company record
        const { data, error } = await supabase
          .from('seven_strata')
          .insert(dataWithEditor)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error upserting strata:', error);
      return null;
    }
  }

  async deleteStrata(userId: string, companyId: string): Promise<boolean> {
    try {
      // Clear form data but keep company_id, id, and created_at
      // Track who cleared the data
      const { error } = await supabase
        .from('seven_strata')
        .update({
          words_you_own: [],  // Empty array
          sandbox_brand_promises: {
            core_customers: [],
            products_services: [],
            brand_promises: [],
            kpis: []
          },
          brand_promise_guarantee: '',
          one_phrase_strategy: '',
          differentiating_activities: [],  // Empty array
          x_factor: '',
          profit_bhag: {
            profit_per_x: [],
            bhag: []
          },
          last_edited_by: userId,  // Track who cleared the data
          updated_at: new Date().toISOString()
        })
        .eq('company_id', companyId);  // Filter by company_id only

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error clearing strata form data:', error);
      return false;
    }
  }

  getDefaultStrataData(companyId: string): Omit<SevenStrata, 'id' | 'created_at' | 'updated_at' | 'last_edited_by'> {
    return {
      // NOTE: user_id removed - data is now company-wide
      company_id: companyId,
      words_you_own: [],
      sandbox_brand_promises: {
        core_customers: [],
        products_services: [],
        brand_promises: [],
        kpis: []
      },
      brand_promise_guarantee: '',
      one_phrase_strategy: '',
      differentiating_activities: [],
      x_factor: '',
      profit_bhag: {
        profit_per_x: [],
        bhag: []
      }
    };
  }
}

export const strataService = new StrataService();