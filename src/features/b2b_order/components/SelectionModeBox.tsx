import React from 'react';
import '../styles/SelectionModeBox.css';

interface SelectionModeBoxProps {
  onSelectMode: (mode: 'random' | 'manual') => void;
}

const SelectionModeBox: React.FC<SelectionModeBoxProps> = ({ onSelectMode }) => {
  return (
    <div className="selection-mode-container">
      <div className="selection-mode-header">
        <h2>Choose Your Christmas Gift Box Selection Method</h2>
        <p className="selection-subtitle">How would you like to create your Christmas gift box?</p>
      </div>

      <div className="selection-boxes">
        {/* Random Selection Box */}
        <div
          className="selection-box random-box"
          onClick={() => onSelectMode('random')}
        >
          <img
            src="/random-selection.png"
            alt="Random Selection"
            className="box-image"
            loading="eager"
            decoding="async"
          />
          <p className="box-caption">Let us surprise you with our selection</p>
        </div>

        {/* Manual Selection Box */}
        <div
          className="selection-box manual-box"
          onClick={() => onSelectMode('manual')}
        >
          <img
            src="/manual-selection.png"
            alt="Manual Selection"
            className="box-image"
            loading="eager"
            decoding="async"
          />
          <p className="box-caption">I want to pick my own products</p>
        </div>
      </div>
    </div>
  );
};

export default SelectionModeBox;
