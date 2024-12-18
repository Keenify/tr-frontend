import React, { useState } from 'react';

interface Step3CustomizeThemeProps {
  onNext: () => void;
  onBack: () => void;
}

const Step3CustomizeTheme: React.FC<Step3CustomizeThemeProps> = ({ onNext, onBack }) => {
  const [, setCompanyLogo] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCompanyLogo(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">🎨 Customize your theme</h1>
      <div className="flex">
        <div className="mr-4">
          <label>Company Logo:</label>
          <input type="file" onChange={handleFileChange} />
        </div>
        <div className="border p-4">
          <h2 className="font-bold">Sidebar Preview</h2>
          <p>Placeholder content</p>
        </div>
      </div>
      <div className="flex space-x-2 mt-4">
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

export default Step3CustomizeTheme; 