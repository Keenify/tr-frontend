import { FinancialInputs, PowerOfOneChanges, PowerOfOneData } from '../types/powerOfOne';
import { supabase } from '../../../lib/supabase';

// Removed: Company membership validation error types (no longer needed)

// Default values for reset operations
const DEFAULT_FINANCIAL_INPUTS: FinancialInputs = {
  revenue: 0,
  cogs: 0,
  overheads: 0,
  debtorDays: 0,
  stockDays: 0,
  creditorDays: 0
};

const DEFAULT_CHANGES: PowerOfOneChanges = {
  priceIncreasePct: 0,
  volumeIncreasePct: 0,
  cogsReductionPct: 0,
  overheadsReductionPct: 0,
  debtorDaysReduction: 0,
  stockDaysReduction: 0,
  creditorDaysIncrease: 0
};

class PowerOfOneService {
  // REMOVED: Company membership validation methods
  // Power of One now uses component-level company access control via PowerOfOneWithCompany wrapper
  // This eliminates employees table dependency - same pattern as 7 Strata fix
  // Enhanced error handling for database operations
  private handleDatabaseError(error: any, operation: string): never {
    console.error(`Power of One ${operation} error:`, error);
    
    // Handle specific database constraint errors
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('A record already exists for this user and company combination.');
    }
    
    if (error.code === '23514') { // Check constraint violation
      throw new Error('Invalid financial data: values must be non-negative.');
    }
    
    if (error.code === 'PGRST116') { // No rows returned
      return null as never;
    }
    
    // Generic error handling
    throw new Error(error.message || `Failed to ${operation} Power of One data`);
  }

  // Validate data before save operations
  private validatePowerOfOneData(data: PowerOfOneData): void {
    const { financialInputs, changes } = data;
    
    // Validate financial inputs are non-negative
    if (financialInputs.revenue < 0 || financialInputs.cogs < 0 || financialInputs.overheads < 0 ||
        financialInputs.debtorDays < 0 || financialInputs.stockDays < 0 || financialInputs.creditorDays < 0) {
      throw new Error('Financial inputs must be non-negative values.');
    }
    
    // Basic business logic validation
    if (financialInputs.cogs > financialInputs.revenue && financialInputs.revenue > 0) {
      throw new Error('Cost of Goods Sold cannot be greater than Revenue.');
    }
  }

  // Get Power of One data for a company (company-wide sharing, no employees table dependency)
  async getPowerOfOneData(userId: string, companyId: string): Promise<PowerOfOneData | null> {
    try {
      console.log('📊 Fetching company Power of One data:', { userId, companyId });
      
      // Query by company_id only (no employees table validation needed)
      const { data, error } = await supabase
        .from('power_of_one')
        .select('*')
        .eq('company_id', companyId)
        .single();
      
      if (error) {
        // If no record found, return null (company hasn't created Power of One data yet)
        if (error.code === 'PGRST116') {
          console.log('📊 No Power of One data found for company');
          return null;
        }
        console.error('📊 Error fetching company Power of One data:', error);
        this.handleDatabaseError(error, 'fetch');
      }
      
      if (!data) return null;

      return {
        id: data.id,
        companyId: data.company_id,
        lastEditedBy: data.last_edited_by,
        financialInputs: {
          revenue: data.revenue || 0,
          cogs: data.cogs || 0,
          overheads: data.overheads || 0,
          debtorDays: data.debtor_days || 0,
          stockDays: data.stock_days || 0,
          creditorDays: data.creditor_days || 0
        },
        changes: {
          priceIncreasePct: data.price_increase_pct || 0,
          volumeIncreasePct: data.volume_increase_pct || 0,
          cogsReductionPct: data.cogs_reduction_pct || 0,
          overheadsReductionPct: data.overheads_reduction_pct || 0,
          debtorDaysReduction: data.debtor_days_reduction || 0,
          stockDaysReduction: data.stock_days_reduction || 0,
          creditorDaysIncrease: data.creditor_days_increase || 0
        },
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      this.handleDatabaseError(error, 'fetch');
    }
  }

  // Create or update Power of One data (collaborative, no employees table dependency)
  async savePowerOfOneData(userId: string, powerOfOneData: PowerOfOneData): Promise<PowerOfOneData> {
    try {
      // Validate data before saving
      this.validatePowerOfOneData(powerOfOneData);
      
      const dbData = {
        company_id: powerOfOneData.companyId,
        last_edited_by: userId,
        revenue: powerOfOneData.financialInputs.revenue,
        cogs: powerOfOneData.financialInputs.cogs,
        overheads: powerOfOneData.financialInputs.overheads,
        debtor_days: powerOfOneData.financialInputs.debtorDays,
        stock_days: powerOfOneData.financialInputs.stockDays,
        creditor_days: powerOfOneData.financialInputs.creditorDays,
        price_increase_pct: powerOfOneData.changes.priceIncreasePct,
        volume_increase_pct: powerOfOneData.changes.volumeIncreasePct,
        cogs_reduction_pct: powerOfOneData.changes.cogsReductionPct,
        overheads_reduction_pct: powerOfOneData.changes.overheadsReductionPct,
        debtor_days_reduction: powerOfOneData.changes.debtorDaysReduction,
        stock_days_reduction: powerOfOneData.changes.stockDaysReduction,
        creditor_days_increase: powerOfOneData.changes.creditorDaysIncrease,
        updated_at: new Date().toISOString()
      };

      // Include ID if updating existing record
      if (powerOfOneData.id) {
        (dbData as any).id = powerOfOneData.id;
      }

      // NEW: Find existing record by company_id only
      let existingData = null;
      if (powerOfOneData.companyId) {
        const existingQuery = supabase
          .from('power_of_one')
          .select('id')
          .eq('company_id', powerOfOneData.companyId);
        
        const { data } = await existingQuery.single();
        existingData = data;
      }
      
      let result;
      
      if (existingData) {
        // Update existing company record
        const { data, error } = await supabase
          .from('power_of_one')
          .update(dbData)
          .eq('company_id', powerOfOneData.companyId) // NEW: Update by company_id
          .select()
          .single();
        result = { data, error };
      } else {
        // Insert new company record
        const { data, error } = await supabase
          .from('power_of_one')
          .insert(dbData)
          .select()
          .single();
        result = { data, error };
      }
      
      const { data, error } = result;

      if (error) {
        this.handleDatabaseError(error, 'save');
      }

      return {
        id: data.id,
        companyId: data.company_id,
        lastEditedBy: data.last_edited_by,
        financialInputs: {
          revenue: data.revenue,
          cogs: data.cogs,
          overheads: data.overheads,
          debtorDays: data.debtor_days,
          stockDays: data.stock_days,
          creditorDays: data.creditor_days
        },
        changes: {
          priceIncreasePct: data.price_increase_pct,
          volumeIncreasePct: data.volume_increase_pct,
          cogsReductionPct: data.cogs_reduction_pct,
          overheadsReductionPct: data.overheads_reduction_pct,
          debtorDaysReduction: data.debtor_days_reduction,
          stockDaysReduction: data.stock_days_reduction,
          creditorDaysIncrease: data.creditor_days_increase
        },
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      this.handleDatabaseError(error, 'save');
    }
  }

  // Restart functionality - clears all financial data while preserving system fields (collaborative)
  async restartPowerOfOneData(userId: string, companyId: string): Promise<PowerOfOneData> {
    try {
      // First, check if a record exists
      const existingData = await this.getPowerOfOneData(userId, companyId);
      
      const resetData: PowerOfOneData = {
        companyId,
        financialInputs: { ...DEFAULT_FINANCIAL_INPUTS },
        changes: { ...DEFAULT_CHANGES },
        lastEditedBy: userId
      };
      
      // If record exists, preserve the ID for update
      if (existingData) {
        resetData.id = existingData.id;
      }
      
      // Save the reset data with user context
      return await this.savePowerOfOneData(userId, resetData);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      this.handleDatabaseError(error, 'restart');
    }
  }

  // Update only financial inputs (deprecated - use savePowerOfOneData instead)
  async updateFinancialInputs(
    userId: string, 
    financialInputs: FinancialInputs,
    companyId?: string
  ): Promise<boolean> {
    try {
      // Validate financial inputs
      if (financialInputs.revenue < 0 || financialInputs.cogs < 0 || financialInputs.overheads < 0 ||
          financialInputs.debtorDays < 0 || financialInputs.stockDays < 0 || financialInputs.creditorDays < 0) {
        throw new Error('Financial inputs must be non-negative values.');
      }
      
      // NEW: Update by company_id only with last_edited_by tracking
      const updateData = {
        revenue: financialInputs.revenue,
        cogs: financialInputs.cogs,
        overheads: financialInputs.overheads,
        debtor_days: financialInputs.debtorDays,
        stock_days: financialInputs.stockDays,
        creditor_days: financialInputs.creditorDays,
        last_edited_by: userId,
        updated_at: new Date().toISOString()
      };

      let query = supabase
        .from('power_of_one')
        .update(updateData);

      if (companyId) {
        query = query.eq('company_id', companyId);
      } else {
        // For legacy compatibility, still handle null company_id case
        query = query.is('company_id', null);
      }

      const { error } = await query;
      
      if (error) {
        this.handleDatabaseError(error, 'update financial inputs');
      }
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      this.handleDatabaseError(error, 'update financial inputs');
    }
  }

  // Update only changes (deprecated - use savePowerOfOneData instead)
  async updateChanges(
    userId: string, 
    changes: PowerOfOneChanges,
    companyId?: string
  ): Promise<boolean> {
    try {
      // Update by company_id only with last_edited_by tracking
      const updateData = {
        price_increase_pct: changes.priceIncreasePct,
        volume_increase_pct: changes.volumeIncreasePct,
        cogs_reduction_pct: changes.cogsReductionPct,
        overheads_reduction_pct: changes.overheadsReductionPct,
        debtor_days_reduction: changes.debtorDaysReduction,
        stock_days_reduction: changes.stockDaysReduction,
        creditor_days_increase: changes.creditorDaysIncrease,
        last_edited_by: userId,
        updated_at: new Date().toISOString()
      };

      let query = supabase
        .from('power_of_one')
        .update(updateData);

      if (companyId) {
        query = query.eq('company_id', companyId);
      } else {
        // For legacy compatibility, still handle null company_id case
        query = query.is('company_id', null);
      }

      const { error } = await query;
      
      if (error) {
        this.handleDatabaseError(error, 'update changes');
      }
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      this.handleDatabaseError(error, 'update changes');
    }
  }
}

// Singleton instance
export const powerOfOneService = new PowerOfOneService();