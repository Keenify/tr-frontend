import { supabase } from '../../../lib/supabase';
import { SevenStrata, Company } from '../types';

class StrataService {
  // Get companies for a specific user using company_name column (much simpler!)
  async getCompaniesForUser(userId: string): Promise<Company[]> {
    try {
      console.log('🔍 Testing: Fetching companies for userId using company_name:', userId);
      
      const { data, error } = await supabase
        .from('seven_strata')
        .select('company_id, company_name')
        .eq('user_id', userId);

      console.log('🔍 Testing: Raw query result:', { data, error });

      if (error) {
        console.error('🔍 Testing: Query error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('🔍 Testing: No records found for user');
        return [];
      }

      // Convert to Company format and remove duplicates
      const companies: Company[] = data
        .filter(record => record.company_name) // Only records with company_name
        .map(record => ({
          id: record.company_id,
          name: record.company_name
        }))
        .filter((company, index, self) => 
          index === self.findIndex(c => c.id === company.id)
        ); // Remove duplicates
      
      console.log('🔍 Testing: Final companies array:', companies);
      
      return companies.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('🔍 Testing: Error fetching companies:', error);
      return [];
    }
  }

  // Get strata data for a specific user/company (following Rockefeller pattern)
  async getStrataByCompany(userId: string, companyId: string): Promise<SevenStrata | null> {
    try {
      console.log('🔍 Testing: Fetching strata for userId:', userId, 'companyId:', companyId);
      
      const { data, error } = await supabase
        .from('seven_strata')
        .select('*')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .single();

      console.log('🔍 Testing: Strata query result:', { data, error });

      if (error) {
        console.error('🔍 Testing: Error fetching strata:', error);
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

  async createStrata(strataData: Omit<SevenStrata, 'id' | 'created_at' | 'updated_at'>): Promise<SevenStrata | null> {
    try {
      const { data, error } = await supabase
        .from('seven_strata')
        .insert(strataData)
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
      const { data, error } = await supabase
        .from('seven_strata')
        .update(updates)
        .eq('user_id', userId)
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

  async upsertStrata(strataData: Omit<SevenStrata, 'id' | 'created_at' | 'updated_at'>): Promise<SevenStrata | null> {
    try {
      // Check if this is an update (has id) or insert (no id)
      if (strataData.id) {
        // Update existing record
        const { data, error } = await supabase
          .from('seven_strata')
          .update(strataData)
          .eq('id', strataData.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('seven_strata')
          .insert(strataData)
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
      // Clear form data but keep user_id, company_id, company_name, id, and created_at
      const { error } = await supabase
        .from('seven_strata')
        .update({
          words_you_own: '{}',  // Empty text array
          sandbox_brand_promises: {
            core_customers: [],
            products_services: [],
            brand_promises: [],
            kpis: []
          },
          brand_promise_guarantee: '',
          one_phrase_strategy: '',
          differentiating_activities: '{}',  // Empty text array
          x_factor: '',
          profit_bhag: {
            profit_per_x: [],
            bhag: []
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error clearing strata form data:', error);
      return false;
    }
  }

  getDefaultStrataData(userId: string, companyId: string): Omit<SevenStrata, 'id' | 'created_at' | 'updated_at'> {
    return {
      user_id: userId,
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