import React, { useState } from 'react';
import Step1ProfileSetup from './Step1ProfileSetup';
import Step2CompanyInfo from './Step2CompanyInfo';
import Step3CustomizeTheme from './Step3CustomizeTheme';
import Step4SelectThemeColor from './Step4SelectThemeColor';
import Step5FinalConfirmation from './Step5FinalConfirmation';

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);
  const handleFinish = () => {
    console.log('Status: Onboarding completed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-5xl p-4 sm:p-6 rounded-lg shadow-md mx-auto mt-1">
        {step === 1 && <Step1ProfileSetup onNext={handleNext} />}
        {step === 2 && <Step2CompanyInfo onNext={handleNext} onBack={handleBack} />}
        {step === 3 && <Step3CustomizeTheme onNext={handleNext} onBack={handleBack} />}
        {step === 4 && <Step4SelectThemeColor onNext={handleNext} onBack={handleBack} />}
        {step === 5 && <Step5FinalConfirmation onFinish={handleFinish} onBack={handleBack} />}
      </div>
    </div>
  );
};

export default Onboarding; 