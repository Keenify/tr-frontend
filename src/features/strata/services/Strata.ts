import { supabase } from '../../../lib/supabase';
import { SevenStrata, Company } from '../types';

class StrataService {
  // Hybrid approach: Try seven_strata first (existing users), fallback to employees table (new users)
  async getCompaniesForUser(userId: string): Promise<Company[]> {
    try {
      console.log('🔍 Hybrid: Fetching companies for userId:', userId);
      
      // STEP 1: Try seven_strata table first (preserve existing behavior)
      const { data: strataData, error: strataError } = await supabase
        .from('seven_strata')
        .select('company_id, company_name')
        .eq('user_id', userId);

      console.log('🔍 Hybrid: Seven_strata query result:', { data: strataData, error: strataError });

      if (strataError) {
        console.error('🔍 Hybrid: Seven_strata query error:', strataError);
        throw strataError;
      }
      
      // If we found companies in seven_strata, use existing logic (no breaking changes)
      if (strataData && strataData.length > 0) {
        console.log('🔍 Hybrid: Found companies in seven_strata, using existing approach');
        
        const companies: Company[] = strataData
          .filter(record => record.company_name) // Only records with company_name
          .map(record => ({
            id: record.company_id,
            name: record.company_name
          }))
          .filter((company, index, self) => 
            index === self.findIndex(c => c.id === company.id)
          ); // Remove duplicates
        
        console.log('🔍 Hybrid: Final companies from seven_strata:', companies);
        return companies.sort((a, b) => a.name.localeCompare(b.name));
      }

      // STEP 2: Fallback to employees table (new users)
      console.log('🔍 Hybrid: No seven_strata data found, trying employees table');
      
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select(`
          company_id,
          companies(id, name)
        `)
        .eq('user_id', userId);

      console.log('🔍 Hybrid: Employees query result:', { data: employeeData, error: employeeError });

      if (employeeError) {
        console.error('🔍 Hybrid: Employees query error:', employeeError);
        throw employeeError;
      }

      if (!employeeData || employeeData.length === 0) {
        console.log('🔍 Hybrid: No companies found in employees table either');
        return [];
      }

      // Convert employees data to same format as seven_strata
      const companies: Company[] = employeeData
        .filter((record: any) => record.companies && record.companies.name) // Only records with company data
        .map((record: any) => ({
          id: record.companies.id,
          name: record.companies.name
        }))
        .filter((company, index, self) => 
          index === self.findIndex(c => c.id === company.id)
        ); // Remove duplicates

      console.log('🔍 Hybrid: Final companies from employees table:', companies);
      return companies.sort((a, b) => a.name.localeCompare(b.name));
      
    } catch (error) {
      console.error('🔍 Hybrid: Error in getCompaniesForUser:', error);
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

  async upsertStrata(strataData: Omit<SevenStrata, 'created_at' | 'updated_at'>): Promise<SevenStrata | null> {
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