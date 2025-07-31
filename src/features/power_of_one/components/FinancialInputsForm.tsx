import React from 'react';
import { FinancialInputsFormProps, FinancialInputs } from '../types/powerOfOne';

const FinancialInputsForm: React.FC<FinancialInputsFormProps> = ({
  inputs,
  onInputChange,
  isExpanded,
  onToggleExpanded
}) => {
  const handleInputChange = (field: keyof FinancialInputs, value: string) => {
    const numericValue = Math.max(0, parseFloat(value) || 0); // Prevent negative values
    onInputChange(field, numericValue);
  };

  const formatNumber = (value: number): string => {
    return value === 0 ? '' : value.toString();
  };

  return (
    <div className="financial-inputs-section">
      <div className="financial-inputs-header" onClick={onToggleExpanded}>
        <button className="expand-button" type="button">
          <span className="expand-icon">{isExpanded ? '−' : '+'}</span>
          Set Financial Inputs
        </button>
        <div className="financial-inputs-summary">
          {!isExpanded && (
            <span className="inputs-preview">
              {inputs.revenue > 0 ? `Revenue: $${inputs.revenue.toLocaleString()}` : 'No inputs set'}
            </span>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="financial-inputs-form">
          <div className="inputs-grid">
            <div className="input-group">
              <label htmlFor="revenue" className="input-label">
                Revenue ($)
              </label>
              <input
                id="revenue"
                type="number"
                className="financial-input"
                value={formatNumber(inputs.revenue)}
                onChange={(e) => handleInputChange('revenue', e.target.value)}
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>

            <div className="input-group">
              <label htmlFor="cogs" className="input-label">
                COGS ($)
              </label>
              <input
                id="cogs"
                type="number"
                className="financial-input"
                value={formatNumber(inputs.cogs)}
                onChange={(e) => handleInputChange('cogs', e.target.value)}
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>

            <div className="input-group">
              <label htmlFor="overheads" className="input-label">
                Overheads ($)
              </label>
              <input
                id="overheads"
                type="number"
                className="financial-input"
                value={formatNumber(inputs.overheads)}
                onChange={(e) => handleInputChange('overheads', e.target.value)}
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>

            <div className="input-group">
              <label htmlFor="debtorDays" className="input-label">
                Debtor Days
              </label>
              <input
                id="debtorDays"
                type="number"
                className="financial-input"
                value={formatNumber(inputs.debtorDays)}
                onChange={(e) => handleInputChange('debtorDays', e.target.value)}
                placeholder="0"
                min="0"
                step="1"
              />
            </div>

            <div className="input-group">
              <label htmlFor="stockDays" className="input-label">
                Stock Days
              </label>
              <input
                id="stockDays"
                type="number"
                className="financial-input"
                value={formatNumber(inputs.stockDays)}
                onChange={(e) => handleInputChange('stockDays', e.target.value)}
                placeholder="0"
                min="0"
                step="1"
              />
            </div>

            <div className="input-group">
              <label htmlFor="creditorDays" className="input-label">
                Creditor Days
              </label>
              <input
                id="creditorDays"
                type="number"
                className="financial-input"
                value={formatNumber(inputs.creditorDays)}
                onChange={(e) => handleInputChange('creditorDays', e.target.value)}
                placeholder="0"
                min="0"
                step="1"
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default FinancialInputsForm;