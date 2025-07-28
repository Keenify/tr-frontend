import React from 'react';
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
    loading,
    saving,
    error,
    isInputsExpanded,
    baseMetrics,
    rows,
    totals,
    updateFinancialInput,
    saveFinancialInputs,
    updateChange,
    toggleInputsExpanded,
    hasCompleteFinancialInputs
  } = usePowerOfOne(userId, companyId);

  const handleSaveInputs = async () => {
    const success = await saveFinancialInputs();
    if (success && onUpdate) {
      onUpdate({
        userId,
        companyId,
        financialInputs,
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
        <h1 className="main-title">Power of One Analysis</h1>
        <p className="main-subtitle">
          Discover the impact of small improvements across key business levers
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <div className="error-content">
            <span className="error-icon">⚠</span>
            <span className="error-message">{error}</span>
          </div>
        </div>
      )}

      <div className="power-of-one-content">
        <FinancialInputsForm
          inputs={financialInputs}
          onInputChange={updateFinancialInput}
          onSave={handleSaveInputs}
          isExpanded={isInputsExpanded}
          onToggleExpanded={toggleInputsExpanded}
          loading={saving}
        />

        {hasCompleteFinancialInputs() ? (
          <div className="analysis-section">
            <div className="base-metrics-summary">
              <div className="metrics-grid">
                <div className="metric-card">
                  <span className="metric-label">Current EBIT</span>
                  <span className="metric-value">
                    ${baseMetrics.ebit.toLocaleString()}
                  </span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Current Net Cash Flow</span>
                  <span className="metric-value">
                    ${baseMetrics.netCashFlow.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <PowerOfOneTable
              rows={rows}
              totals={totals}
              onChangeUpdate={updateChange}
              loading={false}
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

export default PowerOfOne;