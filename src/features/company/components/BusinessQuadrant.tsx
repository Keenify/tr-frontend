import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { useBusinessQuadrant } from '../hooks/useBusinessQuadrant';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import toast, { Toaster } from 'react-hot-toast';

interface BusinessQuadrantProps {
  session: Session;
}

const BusinessQuadrant: React.FC<BusinessQuadrantProps> = ({ session }) => {
  // Get company ID from useUserAndCompanyData hook
  const { companyInfo, isLoading: isLoadingCompany } = useUserAndCompanyData(session.user.id);
  const companyId = companyInfo?.id || '';
  
  // Use the hook to fetch and update data
  const { quadrantData, loading, error, updateQuadrantData } = useBusinessQuadrant(companyId);
  
  // Local state for form values
  const [formValues, setFormValues] = useState({
    create_value: '',
    deliver_value: '',
    capture_value: '',
    defend_value: '',
    notes: ''
  });
  
  // Local state for saving status and loading timeout
  const [isSaving, setIsSaving] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Set a timeout for loading to handle cases where the API might not respond
  useEffect(() => {
    let timer: number | undefined;
    
    if (loading) {
      // If still loading after 5 seconds, assume there's an issue
      timer = window.setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000);
    }
    
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [loading]);
  
  // Update local form values when quadrantData is loaded
  useEffect(() => {
    if (quadrantData) {
      setFormValues({
        create_value: quadrantData.create_value || '',
        deliver_value: quadrantData.deliver_value || '',
        capture_value: quadrantData.capture_value || '',
        defend_value: quadrantData.defend_value || '',
        notes: quadrantData.notes || ''
      });
    }
  }, [quadrantData]);
  
  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle save
  const handleSave = async () => {
    if (!companyId) {
      toast.error('Error: Company information not available');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const result = await updateQuadrantData(formValues);
      
      if (result.success) {
        toast.success('Changes saved successfully!');
      } else {
        toast.error(`Error: ${result.error || 'Failed to save changes'}`);
      }
    } catch (err) {
      console.error('Error saving changes:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Show loading while company info is being fetched
  if (isLoadingCompany) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-gray-600">Loading company information...</div>
      </div>
    );
  }
  
  // Show a timeout message if loading takes too long
  if (loading && loadingTimeout) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>Loading is taking longer than expected. You can continue with an empty quadrant.</p>
          <button 
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Loading state - only show for a reasonable time
  if (loading && !loadingTimeout) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-gray-600">Loading business quadrant data...</div>
      </div>
    );
  }
  
  // Error state
  if (error && !quadrantData) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error loading data: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Business Model Quadrant</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Info box - spanning 2 columns on large screens */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">What is the Business Model Quadrant?</h2>
          <p className="text-gray-600">
            The Business Model Quadrant is a strategic framework to help visualize and analyze 
            your business model across four key dimensions: how you create, deliver, capture, and 
            defend value. Use this tool to identify strengths, weaknesses, and opportunities in your 
            business model.
          </p>
        </div>
        
        {/* Actions - single column */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col justify-center">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Actions</h2>
          <div className="mt-auto">
            <button 
              className={`w-full px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Quadrant */}
      <div className="relative bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg shadow-xl overflow-hidden border border-gray-600">
        {/* Center Business Model */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-white text-center py-4 px-6 rounded-full shadow-2xl border-4 border-indigo-500">
          <h3 className="text-lg font-bold text-gray-800">Business<br />Model</h3>
        </div>
        
        {/* Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[60vh] md:min-h-[500px]">
          {/* Top Left - Create Value */}
          <div className="border-r border-b border-white/20 p-4 md:p-6 flex flex-col items-center justify-center">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">Create Value</h3>
            <textarea 
              className="w-full h-32 md:h-40 bg-white/10 text-white placeholder-gray-400 p-4 rounded border border-white/30 focus:border-indigo-400 focus:ring-indigo-400 focus:outline-none resize-none text-center flex items-center justify-center"
              placeholder="How does your business create value for customers? What problems do you solve?"
              value={formValues.create_value}
              onChange={(e) => handleInputChange('create_value', e.target.value)}
            ></textarea>
          </div>
          
          {/* Top Right - Deliver Value */}
          <div className="border-b border-white/20 p-4 md:p-6 flex flex-col items-center justify-center">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">Deliver Value</h3>
            <textarea 
              className="w-full h-32 md:h-40 bg-white/10 text-white placeholder-gray-400 p-4 rounded border border-white/30 focus:border-indigo-400 focus:ring-indigo-400 focus:outline-none resize-none text-center flex items-center justify-center"
              placeholder="How do you deliver your product/service to customers? What channels do you use?"
              value={formValues.deliver_value}
              onChange={(e) => handleInputChange('deliver_value', e.target.value)}
            ></textarea>
          </div>
          
          {/* Bottom Left - Capture Value */}
          <div className="border-r border-white/20 p-4 md:p-6 flex flex-col items-center justify-center">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">Capture Value</h3>
            <textarea 
              className="w-full h-32 md:h-40 bg-white/10 text-white placeholder-gray-400 p-4 rounded border border-white/30 focus:border-indigo-400 focus:ring-indigo-400 focus:outline-none resize-none text-center flex items-center justify-center"
              placeholder="How does your business monetize? What's your revenue model and pricing strategy?"
              value={formValues.capture_value}
              onChange={(e) => handleInputChange('capture_value', e.target.value)}
            ></textarea>
          </div>
          
          {/* Bottom Right - Defend Value */}
          <div className="p-4 md:p-6 flex flex-col items-center justify-center">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">Defend Value</h3>
            <textarea 
              className="w-full h-32 md:h-40 bg-white/10 text-white placeholder-gray-400 p-4 rounded border border-white/30 focus:border-indigo-400 focus:ring-indigo-400 focus:outline-none resize-none text-center flex items-center justify-center"
              placeholder="How do you protect your business from competition? What are your competitive advantages?"
              value={formValues.defend_value}
              onChange={(e) => handleInputChange('defend_value', e.target.value)}
            ></textarea>
          </div>
        </div>
      </div>
      
      {/* Notes Section */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-xl font-semibold mb-3 text-gray-700">Notes & Insights</h3>
        <textarea 
          className="w-full p-4 border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none resize-vertical min-h-[100px]"
          rows={4}
          placeholder="Add your notes and insights about your business model..."
          value={formValues.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
        ></textarea>
      </div>
    </div>
  );
};

export default BusinessQuadrant; 