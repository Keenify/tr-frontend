import React, { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { B2BOrderRow, DietaryRestriction } from '../types/B2BOrderTypes';
import '../styles/B2BOrder.css';

interface B2BOrderProps {
  session: Session;
}

const B2BOrderSimple: React.FC<B2BOrderProps> = ({ session }) => {
  const initialRow: B2BOrderRow = {
    id: Date.now().toString(),
    pax: 1,
    amountPerPerson: 0,
    dietaryRestriction: 'halal',
    customDietary: ''
  };

  const [rows, setRows] = useState<B2BOrderRow[]>([initialRow]);

  const handleReset = () => {
    setRows([{ ...initialRow, id: Date.now().toString() }]);
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
    }
  };

  return (
    <div className="b2b-order-page">
      <div className="b2b-order-container">
        <div className="b2b-order-header">
          <h2>B2B Order</h2>
          <div className="header-actions">
            <button onClick={handleReset}>Reset</button>
            <button>Export PDF</button>
          </div>
        </div>

        <div className="table-container">
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
                  <td>{row.pax}</td>
                  <td>{row.amountPerPerson}</td>
                  <td>{row.dietaryRestriction}</td>
                  <td>
                    <button onClick={() => handleRemoveRow(row.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleAddRow}>Add Row</button>
        </div>
      </div>
    </div>
  );
};

export default B2BOrderSimple;