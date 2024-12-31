import React, { useState } from 'react';

interface Step4SelectThemeColorProps {
  onNext: () => void;
  onBack: () => void;
}

const Step4SelectThemeColor: React.FC<Step4SelectThemeColorProps> = ({ onNext, onBack }) => {
  const [selectedColor, setSelectedColor] = useState('#6366F1');

  const predefinedColors = ['#6366F1', '#10B981', '#EF4444', '#14B8A6', '#F97316'];

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Select a color theme</h1>
      <div className="flex space-x-2 mb-4">
        {predefinedColors.map((color) => (
          <button
            title="Select a color theme"
            key={color}
            style={{ backgroundColor: color }}
            className={`w-8 h-8 rounded-full ${selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>
      <input
        title="Select a color theme"
        type="color"
        value={selectedColor}
        onChange={(e) => setSelectedColor(e.target.value)}
        className="mb-4"
      />
      <div className="flex space-x-2">
        <button onClick={onBack} className="p-2 bg-gray-500 text-white rounded">
          Back
        </button>
        <button onClick={onNext} className="p-2 bg-blue-500 text-white rounded">
          Next
        </button>
      </div>
    </div>
  );
};

export default Step4SelectThemeColor; 