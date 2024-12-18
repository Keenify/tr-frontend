import React from 'react';

interface Step5FinalConfirmationProps {
  onFinish: () => void;
  onBack: () => void;
}

const Step5FinalConfirmation: React.FC<Step5FinalConfirmationProps> = ({ onFinish, onBack }) => {
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">🥳 Let’s go!</h1>
      <div className="flex space-x-4 mb-4">
        <button className="p-2 bg-blue-500 text-white rounded" onClick={onFinish}>
          I want to create training
        </button>
        <button className="p-2 bg-green-500 text-white rounded" onClick={onFinish}>
          I want to organize my business
        </button>
      </div>
      <button onClick={onBack} className="p-2 bg-gray-500 text-white rounded">
        Back
      </button>
    </div>
  );
};

export default Step5FinalConfirmation; 