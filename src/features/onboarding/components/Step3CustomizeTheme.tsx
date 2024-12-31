import React, { useState } from 'react';

interface Step3CustomizeThemeProps {
  onNext: () => void;
  onBack: () => void;
}

const Step3CustomizeTheme: React.FC<Step3CustomizeThemeProps> = ({ onNext, onBack }) => {
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [errors, setErrors] = useState({
    logo: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCompanyLogo(e.target.files[0]);
      setErrors({ logo: '' });
    }
  };

  const handleNextClick = () => {
    let valid = true;
    const newErrors = { logo: '' };

    if (!companyLogo) {
      newErrors.logo = 'Please upload a company logo.';
      valid = false;
    }

    setErrors(newErrors);

    if (valid) {
      onNext();
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 w-full justify-start">
      {/* Header */}
      <div className="text-left mb-4">
        <p className="text-gray-500">Step 3 of 3</p>
        <h1 className="text-2xl font-bold">🎨 Customize your theme</h1>
      </div>

      {/* Theme Customization Form */}
      <div className="flex-grow flex items-start justify-center mt-72">
        <div className="flex flex-col md:flex-row items-start justify-between w-full max-w-4xl mx-auto px-4">
          <div className="flex-1">
            <div className="mb-4">
              <label className="block mb-1 font-bold">Upload your company logo *</label>
              <input
                title="Upload your company logo"
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className={`w-full p-2 border rounded ${errors.logo ? 'border-red-500' : ''}`}
              />
              {errors.logo && <p className="text-red-500">{errors.logo}</p>}
            </div>

            <div className="mb-8 border rounded p-4">
              <h2 className="font-bold mb-4">Preview</h2>
              <div className="bg-gray-100 p-4 rounded">
                {companyLogo ? (
                  <img
                    src={URL.createObjectURL(companyLogo)}
                    alt="Company Logo Preview"
                    className="max-w-xs mx-auto"
                  />
                ) : (
                  <p className="text-gray-500 text-center">Logo preview will appear here</p>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <button onClick={onBack} className="p-2 bg-gray-500 text-white rounded">
                Back
              </button>
              <button onClick={handleNextClick} className="p-2 bg-purple-600 text-white rounded">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-left mt-2 mb-16">
        <p className="text-gray-400">Next Step</p>
        <h2 className="text-gray-400 text-2xl font-bold">🎯 Select your theme color</h2>
      </div>
    </div>
  );
};

export default Step3CustomizeTheme; 