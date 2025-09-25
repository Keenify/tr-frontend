import React, { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { FiRefreshCw, FiPlus, FiTrash2, FiDownload } from 'react-icons/fi';
import { B2BOrderRow, DietaryRestriction } from '../types/B2BOrderTypes';
import '../styles/B2BOrder.css';
import { generateB2BOrderPDF } from '../utils/pdfGenerator';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';

interface B2BOrderProps {
  session: Session;
}

const B2BOrder: React.FC<B2BOrderProps> = ({ session }) => {
  const { companyInfo } = useUserAndCompanyData(session.user.id);

  const initialRow: B2BOrderRow = {
    id: Date.now().toString(),
    pax: 1,
    amountPerPerson: 0,
    dietaryRestriction: 'halal',
    customDietary: ''
  };

  const [rows, setRows] = useState<B2BOrderRow[]>([initialRow]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleReset = () => {
    setRows([{ ...initialRow, id: Date.now().toString() }]);
    setValidationErrors({});
  };

  const handleAddRow = () => {
    const newRow: B2BOrderRow = {
      ...initialRow,
      id: Date.now().toString()
    };
    setRows([...rows, newRow]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
      const newErrors = { ...validationErrors };
      delete newErrors[`pax-${id}`];
      delete newErrors[`amount-${id}`];
      setValidationErrors(newErrors);
    }
  };

  const handlePaxChange = (id: string, value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) && value !== '') {
      setValidationErrors({
        ...validationErrors,
        [`pax-${id}`]: 'Must be a number'
      });
      return;
    }

    const newErrors = { ...validationErrors };
    delete newErrors[`pax-${id}`];
    setValidationErrors(newErrors);

    setRows(rows.map(row =>
      row.id === id ? { ...row, pax: numValue || 0 } : row
    ));
  };

  const handleAmountChange = (id: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) && value !== '') {
      setValidationErrors({
        ...validationErrors,
        [`amount-${id}`]: 'Must be a number'
      });
      return;
    }

    const newErrors = { ...validationErrors };
    delete newErrors[`amount-${id}`];
    setValidationErrors(newErrors);

    setRows(rows.map(row =>
      row.id === id ? { ...row, amountPerPerson: numValue || 0 } : row
    ));
  };

  const handleDietaryChange = (id: string, value: DietaryRestriction) => {
    setRows(rows.map(row =>
      row.id === id ? { ...row, dietaryRestriction: value } : row
    ));
  };

  const handleCustomDietaryChange = (id: string, value: string) => {
    setRows(rows.map(row =>
      row.id === id ? { ...row, customDietary: value } : row
    ));
  };

  const incrementValue = (id: string, field: 'pax' | 'amountPerPerson', delta: number) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        const currentValue = row[field];
        const newValue = Math.max(0, currentValue + delta);
        return { ...row, [field]: newValue };
      }
      return row;
    }));
  };

  const handleExportPDF = () => {
    if (companyInfo) {
      generateB2BOrderPDF(rows, companyInfo);
    }
  };

  const getTotalAmount = () => {
    return rows.reduce((sum, row) => sum + (row.pax * row.amountPerPerson), 0);
  };

  const getTotalPax = () => {
    return rows.reduce((sum, row) => sum + row.pax, 0);
  };

  return (
    <div className="b2b-order-page">
      <div className="b2b-order-container">
        <div className="b2b-order-header">
          <h2>B2B Order</h2>
          <div className="header-actions">
            <button
              className="reset-btn"
              onClick={handleReset}
              title="Reset table"
            >
              <FiRefreshCw size={18} />
            </button>
            <button
              className="export-btn"
              onClick={handleExportPDF}
              title="Export as PDF"
            >
              <FiDownload size={18} />
              Export PDF
            </button>
          </div>
        </div>

        <div className="table-container" id="b2b-order-table">
          <table className="b2b-order-table">
            <thead>
              <tr>
                <th>Pax</th>
                <th>Amount per Person ($)</th>
                <th>Dietary Restriction</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="pax-cell">
                    <div className="number-input-wrapper">
                      <button
                        className="decrement-btn"
                        onClick={() => incrementValue(row.id, 'pax', -1)}
                      >
                        -
                      </button>
                      <input
                        type="text"
                        className="number-input"
                        value={row.pax}
                        onChange={(e) => handlePaxChange(row.id, e.target.value)}
                      />
                      <button
                        className="increment-btn"
                        onClick={() => incrementValue(row.id, 'pax', 1)}
                      >
                        +
                      </button>
                    </div>
                    {validationErrors[`pax-${row.id}`] && (
                      <span className="error-message">{validationErrors[`pax-${row.id}`]}</span>
                    )}
                  </td>
                  <td className="amount-cell">
                    <div className="number-input-wrapper">
                      <button
                        className="decrement-btn"
                        onClick={() => incrementValue(row.id, 'amountPerPerson', -0.5)}
                      >
                        -
                      </button>
                      <input
                        type="text"
                        className="number-input"
                        value={row.amountPerPerson}
                        onChange={(e) => handleAmountChange(row.id, e.target.value)}
                      />
                      <button
                        className="increment-btn"
                        onClick={() => incrementValue(row.id, 'amountPerPerson', 0.5)}
                      >
                        +
                      </button>
                    </div>
                    {validationErrors[`amount-${row.id}`] && (
                      <span className="error-message">{validationErrors[`amount-${row.id}`]}</span>
                    )}
                  </td>
                  <td className="dietary-cell">
                    {row.dietaryRestriction !== 'custom' ? (
                      <select
                        className="dietary-select"
                        value={row.dietaryRestriction}
                        onChange={(e) => handleDietaryChange(row.id, e.target.value as DietaryRestriction)}
                      >
                        <option value="halal">Halal</option>
                        <option value="non-halal">Non-Halal</option>
                        <option value="vegan">Vegan</option>
                        <option value="custom">Custom</option>
                      </select>
                    ) : (
                      <div className="custom-dietary-wrapper">
                        <input
                          type="text"
                          className="custom-dietary-input"
                          placeholder="Enter custom dietary restriction"
                          value={row.customDietary}
                          onChange={(e) => handleCustomDietaryChange(row.id, e.target.value)}
                        />
                        <button
                          className="back-to-select-btn"
                          onClick={() => handleDietaryChange(row.id, 'halal')}
                          title="Back to options"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="remove-row-btn"
                      onClick={() => handleRemoveRow(row.id)}
                      disabled={rows.length === 1}
                      title="Remove row"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="summary-row">
                <td>
                  <strong>Total Pax: {getTotalPax()}</strong>
                </td>
                <td colSpan={2}>
                  <strong>Total Amount: ${getTotalAmount().toFixed(2)}</strong>
                </td>
                <td>
                  <button
                    className="add-row-btn"
                    onClick={handleAddRow}
                    title="Add row"
                  >
                    <FiPlus size={16} /> Add Row
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default B2BOrder;