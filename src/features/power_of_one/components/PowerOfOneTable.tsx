import React from 'react';
import { PowerOfOneTableProps } from '../types/powerOfOne';
import { formatCurrency } from '../utils/calculations';

const PowerOfOneTable: React.FC<PowerOfOneTableProps> = ({
  rows,
  totals,
  onChangeUpdate,
  loading = false
}) => {
  const handleChangeInput = (rowId: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    onChangeUpdate(rowId, numericValue);
  };

  const formatChangeValue = (value: number): string => {
    return value === 0 ? '' : value.toString();
  };

  return (
    <div className="power-of-one-table-container">
      <div className="table-wrapper">
        <table className="power-of-one-table">
          <thead>
            <tr className="table-header-row">
              <th className="lever-column">Your Power of One</th>
              <th className="change-column">Change you would like to make</th>
              <th className="impact-column">Annual Impact on Cash Flow $</th>
              <th className="impact-column">Impact on EBIT $</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className={`table-row ${index % 2 === 0 ? 'even' : 'odd'}`}>
                <td className="lever-cell">
                  <span className="lever-label">{row.label}</span>
                </td>
                <td className="change-cell">
                  <div className="change-input-group">
                    <input
                      type="number"
                      className="change-input"
                      value={formatChangeValue(row.changeValue)}
                      onChange={(e) => handleChangeInput(row.id, e.target.value)}
                      placeholder="0"
                      min="0"
                      step={row.changeType === 'percentage' ? '0.1' : '1'}
                      disabled={loading}
                    />
                    <span className="change-unit">
                      {row.changeType === 'percentage' ? '%' : ' days'}
                    </span>
                  </div>
                </td>
                <td className="impact-cell cash-flow">
                  <span className="impact-value">
                    {formatCurrency(row.cashFlowImpact)}
                  </span>
                </td>
                <td className="impact-cell ebit">
                  <span className="impact-value">
                    {formatCurrency(row.ebitImpact)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td className="total-label-cell">
                <strong>TOTAL</strong>
              </td>
              <td className="total-spacer-cell"></td>
              <td className="total-impact-cell cash-flow">
                <strong>{formatCurrency(totals.totalCashFlowImpact)}</strong>
              </td>
              <td className="total-impact-cell ebit">
                <strong>{formatCurrency(totals.totalEbitImpact)}</strong>
              </td>
            </tr>
            <tr className="adjusted-totals-row">
              <td className="adjusted-label-cell" colSpan={2}>
                <strong>ADJUSTED TOTALS</strong>
              </td>
              <td className="adjusted-impact-cell cash-flow">
                <div className="adjusted-value">
                  <span className="adjusted-label">Adjusted Cash Flow:</span>
                  <strong>{formatCurrency(totals.adjustedCashFlow)}</strong>
                </div>
              </td>
              <td className="adjusted-impact-cell ebit">
                <div className="adjusted-value">
                  <span className="adjusted-label">Adjusted EBIT:</span>
                  <strong>{formatCurrency(totals.adjustedEbit)}</strong>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {loading && (
        <div className="table-loading-overlay">
          <div className="loading-spinner"></div>
          <span>Updating calculations...</span>
        </div>
      )}
    </div>
  );
};

export default PowerOfOneTable;