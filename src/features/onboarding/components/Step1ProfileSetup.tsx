import React, { useState } from 'react';

interface Step1ProfileSetupProps {
  onNext: () => void;
}

const Step1ProfileSetup: React.FC<Step1ProfileSetupProps> = ({ onNext }) => {
  const referralOptions = [
    "Amazon",
    "Conference/Event",
    "Facebook",
    "Friend/Referral",
    "LinkedIn",
    "Search (Google, Bing, etc)"
  ];

  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const [referralSource, setReferralSource] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [nameError, setNameError] = useState('');
  const [referralError, setReferralError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };

  const handleNextClick = () => {
    let valid = true;
    if (name.trim() === '') {
      setNameError('Please enter a valid name.');
      valid = false;
    } else {
      setNameError('');
    }

    if (referralSource === '') {
      setReferralError('Please select how you heard about us.');
      valid = false;
    } else {
      setReferralError('');
    }

    if (valid) {
      onNext();
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 w-full justify-start">
      {/* Header */}
      <div className="text-left mb-4">
        <p className="text-gray-500">Step 1 of 3</p>
        <h1 className="text-2xl font-bold">👋 Hi there! Let’s set up your profile</h1>
      </div>
      {/* Profile Setup */}
      <div className="flex-grow flex items-start justify-center mt-48">
        <div className="flex flex-col md:flex-row items-start justify-between w-full max-w-4xl mx-auto px-4">
          <div className="flex-1">
            <div className="mb-4">
              <label className="block mb-1 font-bold">What's your name? *</label>
              <input
                type="text"
                placeholder="First and last name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full p-2 border rounded ${nameError ? 'border-red-500' : ''}`}
              />
              {nameError && <p className="text-red-500">{nameError}</p>}
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-bold">What's your mobile number?</label>
              <input
                type="text"
                placeholder="##########"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={smsConsent}
                  onChange={() => setSmsConsent(!smsConsent)}
                  className="mr-2"
                />
                I agree to receive SMS messages from Trainual.
              </label>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-bold">How did you hear about us? *</label>
              <select
                title="How did you hear about us?"
                value={referralSource}
                onChange={(e) => setReferralSource(e.target.value)}
                className={`w-full p-2 border rounded ${referralError ? 'border-red-500' : ''}`}
              >
                <option value="">Select an option</option>
                {referralOptions.map((option) => (
                  <option key={option} value={option.toLowerCase().replace(/ /g, '_')}>
                    {option}
                  </option>
                ))}
              </select>
              {referralError && <p className="text-red-500">{referralError}</p>}
            </div>
            <button 
              onClick={handleNextClick} 
              className="p-2 rounded bg-purple-600 text-white"
            >
              Next
            </button>
          </div>
          {/* Profile Picture */}
          <div className="flex-1 mt-4 md:mt-0 md:ml-16">
            <h2 className="mb-2 font-bold">Upload a profile picture</h2>
            <div className="border-dashed border-2 border-gray-300 p-4 rounded-lg text-center w-64 h-64 flex flex-col items-center justify-center">
              <input type="file" onChange={handleFileChange} className="hidden" id="file-upload" />
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mb-2 overflow-hidden">
                  {profilePicture && (
                    <img
                      src={URL.createObjectURL(profilePicture)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <label htmlFor="file-upload" className="p-2 bg-purple-600 text-white rounded cursor-pointer">
                  Upload image
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">Files should be less than 2MB. Try to use horizontal versions of your logo, if available.</p>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <div className="text-left mt-2 mb-16">
        <p className="text-gray-400">Step 2 of 3</p>
        <h2 className="text-gray-400 text-2xl font-bold">🏢 Tell us about your company</h2>
      </div>
    </div>
  );
};

export default Step1ProfileSetup; 