import { FinancialInputs, PowerOfOneChanges, PowerOfOneData } from '../types/powerOfOne';
import { supabase } from '../../../lib/supabase';

class PowerOfOneService {
  // Get Power of One data for a user
  async getPowerOfOneData(userId: string, companyId?: string): Promise<PowerOfOneData | null> {
    try {
      const query = supabase
        .from('power_of_one')
        .select('*')
        .eq('user_id', userId);
      
      if (companyId) {
        query.eq('company_id', companyId);
      }

      const { data, error } = await query.single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (!data) return null;

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
      console.error('Error fetching Power of One data:', error);
      return null;
    }
  }

  // Create or update Power of One data
  async savePowerOfOneData(powerOfOneData: PowerOfOneData): Promise<PowerOfOneData | null> {
    try {
      const dbData = {
        user_id: powerOfOneData.userId,
        company_id: powerOfOneData.companyId,
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

      const { data, error } = await supabase
        .from('power_of_one')
        .upsert(dbData)
        .select()
        .single();

      if (error) throw error;

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
      console.error('Error saving Power of One data:', error);
      return null;
    }
  }

  // Update only financial inputs
  async updateFinancialInputs(
    userId: string, 
    financialInputs: FinancialInputs,
    companyId?: string
  ): Promise<boolean> {
    try {
      const query = supabase
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
        query.eq('company_id', companyId);
      }

      const { error } = await query;
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating financial inputs:', error);
      return false;
    }
  }

  // Update only changes (lever adjustments)
  async updateChanges(
    userId: string, 
    changes: PowerOfOneChanges,
    companyId?: string
  ): Promise<boolean> {
    try {
      const query = supabase
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
        query.eq('company_id', companyId);
      }

      const { error } = await query;
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating changes:', error);
      return false;
    }
  }
}

// Singleton instance
export const powerOfOneService = new PowerOfOneService();