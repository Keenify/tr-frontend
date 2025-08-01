import { FinancialInputs, PowerOfOneChanges, PowerOfOneData } from '../types/powerOfOne';
import { supabase } from '../../../lib/supabase';

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

  // Get Power of One data for a user
  async getPowerOfOneData(userId: string, companyId?: string): Promise<PowerOfOneData | null> {
    try {
      let query = supabase
        .from('power_of_one')
        .select('*')
        .eq('user_id', userId);
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      } else {
        query = query.is('company_id', null);
      }

      const { data, error } = await query.single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No data found
        }
        this.handleDatabaseError(error, 'fetch');
      }
      
      if (!data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        companyId: data.company_id,
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

  // Create or update Power of One data with enhanced error handling
  async savePowerOfOneData(powerOfOneData: PowerOfOneData): Promise<PowerOfOneData> {
    try {
      // Validate data before saving
      this.validatePowerOfOneData(powerOfOneData);
      
      const dbData = {
        user_id: powerOfOneData.userId,
        company_id: powerOfOneData.companyId || null,
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

      // First, try to find existing record
      const existingQuery = supabase
        .from('power_of_one')
        .select('id')
        .eq('user_id', powerOfOneData.userId);
      
      if (powerOfOneData.companyId) {
        existingQuery.eq('company_id', powerOfOneData.companyId);
      } else {
        existingQuery.is('company_id', null);
      }
      
      const { data: existingData } = await existingQuery.single();
      
      let result;
      
      if (existingData) {
        // Update existing record
        const { data, error } = await supabase
          .from('power_of_one')
          .update(dbData)
          .eq('id', existingData.id)
          .select()
          .single();
        result = { data, error };
      } else {
        // Insert new record
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
        userId: data.user_id,
        companyId: data.company_id,
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

  // Restart functionality - clears all financial data while preserving system fields
  async restartPowerOfOneData(userId: string, companyId?: string): Promise<PowerOfOneData> {
    try {
      // First, check if a record exists
      const existingData = await this.getPowerOfOneData(userId, companyId);
      
      const resetData: PowerOfOneData = {
        userId,
        companyId,
        financialInputs: { ...DEFAULT_FINANCIAL_INPUTS },
        changes: { ...DEFAULT_CHANGES }
      };
      
      // If record exists, preserve the ID for update
      if (existingData) {
        resetData.id = existingData.id;
      }
      
      // Save the reset data
      return await this.savePowerOfOneData(resetData);
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
      
      let query = supabase
        .from('power_of_one')
        .update({
          revenue: financialInputs.revenue,
          cogs: financialInputs.cogs,
          overheads: financialInputs.overheads,
          debtor_days: financialInputs.debtorDays,
          stock_days: financialInputs.stockDays,
          creditor_days: financialInputs.creditorDays,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (companyId) {
        query = query.eq('company_id', companyId);
      } else {
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
      let query = supabase
        .from('power_of_one')
        .update({
          price_increase_pct: changes.priceIncreasePct,
          volume_increase_pct: changes.volumeIncreasePct,
          cogs_reduction_pct: changes.cogsReductionPct,
          overheads_reduction_pct: changes.overheadsReductionPct,
          debtor_days_reduction: changes.debtorDaysReduction,
          stock_days_reduction: changes.stockDaysReduction,
          creditor_days_increase: changes.creditorDaysIncrease,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (companyId) {
        query = query.eq('company_id', companyId);
      } else {
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