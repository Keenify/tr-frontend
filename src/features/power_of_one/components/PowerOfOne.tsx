import React, { useState } from 'react';
import { PowerOfOneProps } from '../types/powerOfOne';
import { usePowerOfOne } from '../hooks/usePowerOfOne';
import FinancialInputsForm from './FinancialInputsForm';
import PowerOfOneTable from './PowerOfOneTable';
import '../styles/powerOfOne.css';

const PowerOfOne: React.FC<PowerOfOneProps> = ({ 
  userId, 
  companyId, 
  onUpdate 
}) => {
  const {
    financialInputs,
    changes,
    loading,
    saving,
    restarting,
    error,
    isInputsExpanded,
    baseMetrics,
    rows,
    totals,
    updateFinancialInput,
    saveAllData,
    updateChange,
    toggleInputsExpanded,
    restartAnalysis,
    hasCompleteFinancialInputs
  } = usePowerOfOne(userId, companyId);

  // Handle save with user feedback
  const handleSaveInputs = async (): Promise<boolean> => {
    const success = await saveAllData();
    if (success && onUpdate) {
      onUpdate({
        userId,
        companyId,
        financialInputs, // Current values preserved
        changes // Current simulation values preserved
      });
    }
    return success;
  };

  // Handle restart with confirmation
  const handleRestart = async (): Promise<boolean> => {
    const confirmed = window.confirm(
      'Are you sure you want to restart? This will clear all your financial inputs and simulation values.'
    );
    
    if (confirmed) {
      const success = await restartAnalysis();
      if (success && onUpdate) {
        onUpdate({
          userId,
          companyId,
          financialInputs: {
            revenue: 0,
            cogs: 0,
            overheads: 0,
            debtorDays: 0,
            stockDays: 0,
            creditorDays: 0
          },
          changes: {
            priceIncreasePct: 0,
            volumeIncreasePct: 0,
            cogsReductionPct: 0,
            overheadsReductionPct: 0,
            debtorDaysReduction: 0,
            stockDaysReduction: 0,
            creditorDaysIncrease: 0
          }
        });
      }
      return success;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="power-of-one-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading Power of One Analysis...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="power-of-one-container">
      <div className="power-of-one-header">
        <h1 className="main-title">Cash: The Power of One</h1>
      </div>

      {error && (
        <div className="error-banner">
          <div className="error-content">
            <span className="error-icon">⚠</span>
            <span className="error-message">{error}</span>
            <button 
              className="error-dismiss"
              onClick={() => window.location.reload()}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="power-of-one-content">
        <FinancialInputsForm
          inputs={financialInputs}
          onInputChange={updateFinancialInput}
          isExpanded={isInputsExpanded}
          onToggleExpanded={toggleInputsExpanded}
        />

        {hasCompleteFinancialInputs() ? (
          <div className="analysis-section">
            <div className="base-metrics-summary">
              <div className="metrics-table">
                <div className="metrics-header">
                  <span className="metrics-label">Your Power of One</span>
                  <span className="metrics-spacer"></span>
                  <span className="metrics-value-header">Net Cash Flow</span>
                  <span className="metrics-value-header">EBIT $</span>
                </div>
                <div className="metrics-row">
                  <span className="metrics-label">Your Current Position</span>
                  <span className="metrics-spacer"></span>
                  <span className="metrics-value">${baseMetrics.netCashFlow.toLocaleString()}</span>
                  <span className="metrics-value">${baseMetrics.ebit.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <PowerOfOneTable
              rows={rows}
              totals={totals}
              onChangeUpdate={updateChange}
              loading={false}
            />
            
            <AnalysisActions
              onSave={handleSaveInputs}
              saving={saving}
            />
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-content">
              <div className="empty-state-icon">📊</div>
              <h3 className="empty-state-title">Set Your Financial Inputs</h3>
              <p className="empty-state-message">
                Click "Set Financial Inputs" above to enter your revenue, costs, and working capital days. 
                Once complete, you'll see your Power of One analysis with actionable insights.
              </p>
              <button 
                className="empty-state-button"
                onClick={toggleInputsExpanded}
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Analysis Actions Component
interface AnalysisActionsProps {
  onSave: () => Promise<boolean>;
  saving: boolean;
}

const AnalysisActions: React.FC<AnalysisActionsProps> = ({
  onSave,
  saving
}) => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const success = await onSave();
      setSaveStatus(success ? 'success' : 'error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const getSaveButtonText = () => {
    switch (saveStatus) {
      case 'saving': return 'Saving...';
      case 'success': return 'Saved!';
      case 'error': return 'Save Failed';
      default: return 'Save All Values';
    }
  };

  return (
    <div className="analysis-actions">
      <button
        type="button"
        className={`save-button ${saveStatus}`}
        onClick={handleSave}
        disabled={saving || saveStatus === 'saving'}
      >
        {getSaveButtonText()}
      </button>
    </div>
  );
};

export default PowerOfOne;