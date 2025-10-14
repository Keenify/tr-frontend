import React from 'react';
import '../styles/SelectionModeBox.css';

interface SelectionModeBoxProps {
  onSelectMode: (mode: 'random' | 'manual') => void;
}

const SelectionModeBox: React.FC<SelectionModeBoxProps> = ({ onSelectMode }) => {
  return (
    <div className="selection-mode-container">
      <div className="selection-mode-header">
        <h2>Choose Your Gift Box Selection Method</h2>
        <p className="selection-subtitle">How would you like to create your gift box?</p>
      </div>

      <div className="selection-boxes">
        {/* Random Selection Box */}
        <div
          className="selection-box random-box"
          onClick={() => onSelectMode('random')}
        >
          <div className="box-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="box-title">Random Selection</h3>
          <p className="box-description">
            Let us surprise you! We'll carefully select a variety of flavors to create the perfect gift box.
          </p>
          <ul className="box-features">
            <li>Quick and easy</li>
            <li>Balanced flavor variety</li>
            <li>Regenerate for different options</li>
          </ul>
          <button className="select-button">Select Random</button>
        </div>

        {/* Manual Selection Box */}
        <div
          className="selection-box manual-box"
          onClick={() => onSelectMode('manual')}
        >
          <div className="box-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="box-title">Manual Selection</h3>
          <p className="box-description">
            Take control! Choose exactly which flavors you want for each brand in your gift box.
          </p>
          <ul className="box-features">
            <li>Full customization</li>
            <li>Pick specific flavors</li>
            <li>Perfect for known preferences</li>
          </ul>
          <button className="select-button">Select Manual</button>
        </div>
      </div>
    </div>
  );
};

export default SelectionModeBox;
