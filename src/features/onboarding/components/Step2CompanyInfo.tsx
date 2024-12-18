import React, { useState } from 'react';

interface Step2CompanyInfoProps {
  onNext: () => void;
  onBack: () => void;
}

const Step2CompanyInfo: React.FC<Step2CompanyInfoProps> = ({ onNext, onBack }) => {
  const industryOptions = [
    "Technology",
    "Finance",
    "Healthcare",
    "Education",
    "Retail",
    "Manufacturing",
    "Hospitality",
    "Transportation",
    "Construction",
    "Real Estate"
  ];

  const companySizeOptions = [
    "10 or fewer",
    "11-24",
    "25-50",
    "51-100",
    "101-500",
    "501-1000",
    "1001-5000",
    "5001+"
  ];

  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState("10 or fewer");
  const [errors, setErrors] = useState({
    companyName: '',
    role: '',
    industry: ''
  });

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyName(e.target.value);
    if (e.target.value.trim() !== '') {
      setErrors((prevErrors) => ({ ...prevErrors, companyName: '' }));
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRole(e.target.value);
    if (e.target.value.trim() !== '') {
      setErrors((prevErrors) => ({ ...prevErrors, role: '' }));
    }
  };

  const handleIndustryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIndustry(e.target.value);
    if (e.target.value !== '') {
      setErrors((prevErrors) => ({ ...prevErrors, industry: '' }));
    }
  };

  const handleNextClick = () => {
    let valid = true;
    const newErrors = { companyName: '', role: '', industry: '' };

    if (companyName.trim() === '') {
      newErrors.companyName = 'Please enter your company name.';
      valid = false;
    }

    if (role.trim() === '') {
      newErrors.role = 'Please enter your role.';
      valid = false;
    }

    if (industry === '') {
      newErrors.industry = 'Please select an industry.';
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
        <p className="text-gray-500">Step 2 of 3</p>
        <h1 className="text-2xl font-bold">🏢 Tell us about your company</h1>
      </div>
      {/* Company Info Form */}
      <div className="flex-grow flex items-start justify-center mt-72">
        <div className="flex flex-col md:flex-row items-start justify-between w-full max-w-4xl mx-auto px-4">
          <div className="flex-1">
            <div className="flex mb-4 space-x-4">
              <div className="flex-1">
                <label className="block mb-1 font-bold">What's your company name? *</label>
                <input
                  type="text"
                  placeholder="Your company name"
                  value={companyName}
                  onChange={handleCompanyNameChange}
                  className={`w-full p-2 border rounded ${errors.companyName ? 'border-red-500' : ''}`}
                />
                {errors.companyName && <p className="text-red-500">{errors.companyName}</p>}
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-bold">What do you do? *</label>
                <input
                  type="text"
                  placeholder="Your Job Title"
                  value={role}
                  onChange={handleRoleChange}
                  className={`w-full p-2 border rounded ${errors.role ? 'border-red-500' : ''}`}
                />
                {errors.role && <p className="text-red-500">{errors.role}</p>}
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-bold">What Industry are you in? *</label>
              <select
                value={industry}
                onChange={handleIndustryChange}
                className={`w-full p-2 border rounded ${errors.industry ? 'border-red-500' : ''}`}
              >
                <option value="">Select the industry your org operates in</option>
                {industryOptions.map((option) => (
                  <option key={option} value={option.toLowerCase().replace(/ /g, '_')}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.industry && <p className="text-red-500">{errors.industry}</p>}
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-bold">How many people are in your company?</label>
              <input
                type="range"
                min="0"
                max={companySizeOptions.length - 1}
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-gray-500 mt-2">
                {companySizeOptions.map((size, index) => (
                  <span key={size} className={index === parseInt(companySize, 10) ? 'font-bold' : ''}>
                    {size}
                  </span>
                ))}
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
        <p className="text-gray-400">Step 3 of 3</p>
        <h2 className="text-gray-400 text-2xl font-bold">🎨 Customize your theme</h2>
      </div>
    </div>
  );
};

export default Step2CompanyInfo; 