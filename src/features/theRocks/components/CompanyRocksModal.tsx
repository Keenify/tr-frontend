import React, { useState } from 'react';
import { TheRockData, CreateTheRockPayload, UpdateTheRockPayload } from '../types/theRocks';
import { createTheRock, updateTheRock } from '../services/useTheRocks';
import toast from 'react-hot-toast';
import { XCircle } from 'react-feather';

// Helper component for Success Status Color Picker
interface SuccessStatusPickerProps {
  value: 'red' | 'orange' | 'green' | null;
  onChange: (value: 'red' | 'orange' | 'green' | null) => void;
}

const SuccessStatusPicker: React.FC<SuccessStatusPickerProps> = ({ value, onChange }) => {
  const statuses: ('green' | 'orange' | 'red')[] = ['green', 'orange', 'red'];
  const colorMap = {
    green: 'bg-green-500 hover:bg-green-600',
    orange: 'bg-yellow-500 hover:bg-yellow-600',
    red: 'bg-red-500 hover:bg-red-600',
  };

  return (
    <div className="flex items-center space-x-2 mt-1">
      {statuses.map(status => (
        <button
          key={status}
          type="button"
          onClick={() => onChange(status)}
          className={`w-8 h-8 rounded-full border-2 ${value === status ? 'border-blue-500 ring-2 ring-blue-300' : 'border-transparent'} ${colorMap[status]} transition-all`}
          title={status.charAt(0).toUpperCase() + status.slice(1)}
        />
      ))}
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${value === null ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'} bg-gray-100 hover:bg-gray-200 transition-all`}
        title="Not Set"
      >
        <XCircle size={18} className={`${value === null ? 'text-blue-500' : 'text-gray-500'}`} />
      </button>
    </div>
  );
};

interface CompanyRocksModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  editingRock: TheRockData | null;
  onSaveSuccess: () => void;
}

const CompanyRocksModal: React.FC<CompanyRocksModalProps> = ({
  isOpen,
  onClose,
  companyId,
  editingRock,
  onSaveSuccess
}) => {
  const [isFormLoading, setIsFormLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateTheRockPayload | TheRockData>(
    editingRock || {
      title: '',
      rock_description: '',
      link_to_higher_level_priorities: '',
      success_criteria: '',
      success_status: null,
    }
  );

  // Update form data when editing rock changes
  React.useEffect(() => {
    if (editingRock) {
      setFormData(editingRock);
    } else {
      setFormData({
        title: '',
        rock_description: '',
        link_to_higher_level_priorities: '',
        success_criteria: '',
        success_status: null,
      });
    }
  }, [editingRock, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | { name: string; value: 'red' | 'orange' | 'green' | null }) => {
    let fieldName: string;
    let fieldValue: string | null;

    if ('target' in e) {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      fieldName = target.name;
      fieldValue = target.value === '' ? null : target.value;
    } else {
      fieldName = e.name;
      fieldValue = e.value;
    }

    setFormData(prevData => ({ ...prevData, [fieldName]: fieldValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormLoading(true);
    
    try {
      if (editingRock) {
        const payload: UpdateTheRockPayload = {
          title: formData.title,
          rock_description: formData.rock_description,
          link_to_higher_level_priorities: formData.link_to_higher_level_priorities,
          success_criteria: formData.success_criteria,
          success_status: formData.success_status as 'red' | 'orange' | 'green' | null,
        };
        await updateTheRock(editingRock.id, companyId, payload);
        toast.success('Company Rock updated successfully!');
      } else {
        await createTheRock(companyId, formData as CreateTheRockPayload);
        toast.success('Company Rock created successfully!');
      }
      onSaveSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save company rock');
    }
    
    setIsFormLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6 overflow-hidden">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-6 pr-6">
            {editingRock ? 'Edit Company Rock' : 'Add New Company Rock'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <input 
                type="text" 
                name="title" 
                id="title" 
                required 
                value={formData.title} 
                onChange={handleInputChange} 
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
              />
            </div>
            
            <div>
              <label htmlFor="rock_description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea 
                name="rock_description" 
                id="rock_description" 
                rows={3} 
                required 
                value={formData.rock_description} 
                onChange={handleInputChange} 
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="link_to_higher_level_priorities" className="block text-sm font-medium text-gray-700">Link to Higher Level Priorities</label>
              <input 
                type="text" 
                name="link_to_higher_level_priorities" 
                id="link_to_higher_level_priorities" 
                required 
                value={formData.link_to_higher_level_priorities} 
                onChange={handleInputChange} 
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
              />
            </div>
            
            <div>
              <label htmlFor="success_criteria" className="block text-sm font-medium text-gray-700">Success Criteria</label>
              <textarea 
                name="success_criteria" 
                id="success_criteria" 
                rows={3} 
                required 
                value={formData.success_criteria} 
                onChange={handleInputChange} 
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="success_status" className="block text-sm font-medium text-gray-700">Success Status</label>
              <SuccessStatusPicker 
                value={formData.success_status as 'red' | 'orange' | 'green' | null} 
                onChange={(value) => handleInputChange({ name: 'success_status', value })} 
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isFormLoading} 
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isFormLoading ? (editingRock ? 'Updating...' : 'Creating...') : (editingRock ? 'Update Rock' : 'Create Rock')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanyRocksModal; 