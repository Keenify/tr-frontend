import React from 'react';
import '../styles/SelectionModeToggle.css';

interface SelectionModeToggleProps {
  mode: 'random' | 'manual';
  onChange: (mode: 'random' | 'manual') => void;
}

const SelectionModeToggle: React.FC<SelectionModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="selection-mode-wrapper">
      <div className="selection-mode-toggle">
        <button
          className={`toggle-option ${mode === 'random' ? 'active' : ''}`}
          onClick={() => onChange('random')}
          title="Random Selection - We'll pick for you"
        >
          Random Selection
        </button>
        <button
          className={`toggle-option ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => onChange('manual')}
          title="Manual Selection - You choose each item"
        >
          Manual Selection
        </button>
      </div>
      <p className="selection-mode-description">
        Let us pick for you, or choose your own items
      </p>
    </div>
  );
};

export default SelectionModeToggle;
