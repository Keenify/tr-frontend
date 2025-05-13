import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StaffRockData, CreateStaffRockPayload, UpdateStaffRockPayload } from '../types/staffRocks';
import { TheRockData } from '../types/theRocks';
import { createStaffRock, updateStaffRock } from '../services/useStaffRocks';
import { Info, XCircle } from 'react-feather';
import toast from 'react-hot-toast';
import '../styles/StaffRocksTable.css';
import { Employee } from '../../../shared/types/directory.types';

// Field hints for form fields
const fieldHints: Record<string, { title: string; description: string[] }> = {
  title: {
    title: "The Rock (Title)",
    description: [
      "Identify up to 5 key goals for building the business and/or the organization.",
      "Should be CLEAR: Challenging, Linked, Envisionable, Assessable, and Really Matters."
    ]
  },
  link_to_higher_level_priorities: {
    title: "Link to Higher-Level Priorities",
    description: ["Company, BU, OGSM/Action Plan or Work Team/Manager Priorities."]
  },
  success_criteria: {
    title: "Success Criteria",
    description: [
      "How will you know that you have achieved your Rock?",
      "Consider measures of quality, quantity, cost, and timing."
    ]
  },
  results_achieved: {
    title: "Results Achieved",
    description: [
      "Describe if the Rock was achieved or not as compared with the set success criteria.",
      "Do not describe the in-process activities."
    ]
  },
  manager_perspective: {
    title: "Manager Perspective",
    description: [
      "Comment on results achieved, work context, and/or relevant behaviors (i.e., Success Drivers)."
    ]
  }
};

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

interface StaffRocksModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  editingStaffRock: StaffRockData | null;
  parentCompanyRocks: TheRockData[];
  employedEmployees: Employee[];
  isLoadingEmployees: boolean;
  isLoadingParentRocks: boolean;
  defaultManagerId: string | null;
  currentUserId?: string;
  onSaveSuccess: () => void;
}

const StaffRocksModal: React.FC<StaffRocksModalProps> = ({
  isOpen,
  onClose,
  companyId,
  editingStaffRock,
  parentCompanyRocks,
  employedEmployees,
  isLoadingEmployees,
  isLoadingParentRocks,
  defaultManagerId,
  currentUserId,
  onSaveSuccess
}) => {
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [hintPosition, setHintPosition] = useState({ top: 0, left: 0 });
  const hintContainerRef = useRef<HTMLDivElement>(null);

  // Initialize form data with useCallback
  const initialFormState = useCallback((): CreateStaffRockPayload => ({
    the_rock_id: '',
    title: '',
    rock_description: '',
    link_to_higher_level_priorities: '',
    success_criteria: '',
    employee_user_id: (currentUserId && employedEmployees.find((e: Employee) => e.id === currentUserId)) ? currentUserId : '', 
    manager_user_id: defaultManagerId,
    go_to_for: null,
    results_achieved: null,
    manager_perspective: null,
    success_status: null,
  }), [currentUserId, employedEmployees, defaultManagerId]);
  
  const [formData, setFormData] = useState<CreateStaffRockPayload | StaffRockData>(
    editingStaffRock || initialFormState()
  );

  // Update form data when editing rock changes or modal opens
  useEffect(() => {
    if (editingStaffRock) {
      setFormData(editingStaffRock);
    } else {
      setFormData(initialFormState());
    }
  }, [editingStaffRock, isOpen, initialFormState]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | {name: 'success_status'; value: 'red' | 'orange' | 'green' | null}) => {
    let fieldName: string;
    let fieldValue: string | null | boolean;

    if ('target' in e) { 
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      fieldName = target.name;
      fieldValue = target.value;
    } else { 
      fieldName = e.name;
      fieldValue = e.value;
    }
    
    // Handle empty select values
    let valueToSet: string | null;
    if (['employee_user_id', 'manager_user_id', 'the_rock_id'].includes(fieldName) && fieldValue === '') {
      valueToSet = null;
    } else if (fieldName === 'success_status') {
      valueToSet = fieldValue as ('red' | 'orange' | 'green' | null);
    } else {
      valueToSet = fieldValue as string;
    }

    setFormData(prevData => ({ ...prevData, [fieldName]: valueToSet }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.the_rock_id) {
        toast.error('Link to Company Rock is required.');
        return;
    }
    if (!formData.employee_user_id) { 
        toast.error('Employee selection is required.');
        return;
    }
    
    setIsFormLoading(true);
    try {
      if (editingStaffRock) {
        const payload: UpdateStaffRockPayload = {
            employee_user_id: formData.employee_user_id as string,
            manager_user_id: formData.manager_user_id as string | null,
            go_to_for: formData.go_to_for,
            title: formData.title,
            rock_description: formData.rock_description as string,
            link_to_higher_level_priorities: formData.link_to_higher_level_priorities,
            success_criteria: formData.success_criteria,
            results_achieved: formData.results_achieved,
            manager_perspective: formData.manager_perspective,
            success_status: formData.success_status as 'red' | 'orange' | 'green' | null, 
        };
        await updateStaffRock(editingStaffRock.id, companyId, payload);
        toast.success('Staff Rock updated successfully!');
      } else {
        await createStaffRock(companyId, formData as CreateStaffRockPayload & { employee_user_id: string });
        toast.success('Staff Rock created successfully!');
      }
      onSaveSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save staff rock');
    }
    setIsFormLoading(false);
  };

  const showHint = (fieldName: string, e: React.MouseEvent<SVGElement>) => {
    const iconElement = e.currentTarget;
    const modalContentScrollable = iconElement.closest('.modal-scrollable-content');
    const iconRect = iconElement.getBoundingClientRect();
    let top, left;
    
    if (modalContentScrollable) {
      const modalScrollableRect = modalContentScrollable.getBoundingClientRect();
      top = iconRect.top - modalScrollableRect.top + iconRect.height + 5 + modalContentScrollable.scrollTop; 
      left = iconRect.left - modalScrollableRect.left + modalContentScrollable.scrollLeft;
    } else {
      top = iconRect.bottom + window.scrollY + 5;
      left = iconRect.left + window.scrollX;
    }
    
    const hintWidth = 288; 
    if (left + hintWidth > window.innerWidth) {
        left = window.innerWidth - hintWidth - 20; 
    }
    if (left < 10) left = 10; 
    
    setHintPosition({ top, left });
    setActiveHint(fieldName);
  };

  const hideHint = () => {
    setActiveHint(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (hintContainerRef.current && !hintContainerRef.current.contains(event.target as Node)) {
        const targetIsInfoIcon = (event.target as HTMLElement).closest('.info-icon-class');
        if (!targetIsInfoIcon) { 
            hideHint();
        }
      }
    };
    
    if (activeHint) { 
        document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeHint]);

  const renderFieldWithHint = (
    fieldName: keyof CreateStaffRockPayload | keyof UpdateStaffRockPayload | 'parent_rock_title' | 'success_status_picker',
    label: string, 
    placeholder?: string, 
    type: 'input' | 'textarea' | 'select' | 'color_picker' = 'input', 
    options?: {value: string | null, label: string}[], 
    required = false, 
    rows = 2
  ) => {
    // Get current value from form data
    const currentValue = fieldName !== 'success_status_picker' 
      ? formData[fieldName as keyof typeof formData] 
      : formData.success_status;

    const hintData = fieldHints[fieldName as string];
    
    const commonProps = {
      name: fieldName === 'success_status_picker' ? 'success_status' : fieldName,
      id: fieldName === 'success_status_picker' ? 'success_status' : fieldName,
      value: currentValue ?? '',
      onChange: handleInputChange,
      className: "mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500",
      required: required,
    };

    let isLoadingSpecific = false;
    if (fieldName === 'employee_user_id' || fieldName === 'manager_user_id') isLoadingSpecific = isLoadingEmployees;
    if (fieldName === 'the_rock_id') isLoadingSpecific = isLoadingParentRocks;

    let defaultOptionLabel = `Select ${label.replace('*','').replace('Link to','').trim()}`;
    if (fieldName === 'employee_user_id' && required && !currentValue) defaultOptionLabel = "Select Employee*";
    else if (fieldName === 'employee_user_id' && required && currentValue) defaultOptionLabel = ""; 
    else if (fieldName === 'the_rock_id' && required && !currentValue) defaultOptionLabel = "Select Company Rock*";
    else if (fieldName === 'the_rock_id' && required && currentValue) defaultOptionLabel = "";
    else if (fieldName === 'manager_user_id' && !currentValue) defaultOptionLabel = "Not Set / No Manager";
    
    if (isLoadingSpecific) defaultOptionLabel = 'Loading...';
    
    return (
      <div className="relative">
        <label htmlFor={commonProps.id} className="flex items-center text-sm font-medium text-gray-700 mb-0.5">
          <span>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
          {hintData && 
            <Info 
              size={14} 
              tabIndex={0} 
              role="button"
              aria-label={`More information about ${label}`}
              className="info-icon-class inline ml-1.5 text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-full"
              onClick={(e) => activeHint === fieldName ? hideHint() : showHint(fieldName as string, e)}
            />}
        </label>
        {type === 'textarea' ? (
          <textarea {...commonProps} rows={rows} placeholder={placeholder}></textarea>
        ) : type === 'select' ? (
          <select {...commonProps} disabled={isLoadingSpecific}>
            {(defaultOptionLabel && !required || (required && !currentValue )) && <option value="">{defaultOptionLabel}</option>}
            {options?.map(opt => <option key={opt.value || fieldName + '-option-null'} value={opt.value || ''}>{opt.label}</option>)}
          </select>
        ) : type === 'color_picker' ? (
          <SuccessStatusPicker 
            value={currentValue as 'red' | 'orange' | 'green' | null ?? null}
            onChange={(newStatus) => handleInputChange({name: 'success_status', value: newStatus})}
          />
        ) : (
          <input type="text" {...commonProps} placeholder={placeholder} />
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40" aria-hidden="true" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
        {activeHint && fieldHints[activeHint] && (
          <div 
            ref={hintContainerRef} 
            className="hint-popup-tooltip"
            style={{
              '--hint-top': `${hintPosition.top}px`,
              '--hint-left': `${hintPosition.left}px`,
            } as React.CSSProperties}
          >
            <h4>{fieldHints[activeHint].title}</h4>
            {fieldHints[activeHint].description.map((line: string, i: number) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl transform transition-all sm:my-8" onClick={(e) => e.stopPropagation()}>
          <div className="absolute top-0 right-0 pt-4 pr-4 z-20">
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
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="w-full">
              <h3 className="text-xl leading-6 font-semibold text-gray-900 mb-6 border-b pb-3">
                {editingStaffRock ? 'Edit Staff Rock' : 'Add New Staff Rock'}
              </h3>
              <div className="mt-2 max-h-[calc(80vh-120px)] overflow-y-auto pr-2 custom-scrollbar modal-scrollable-content">
                <form onSubmit={handleSubmit} className="space-y-6 p-1">
                  <fieldset className="border p-4 rounded-md shadow-sm">
                    <legend className="text-md font-semibold px-2 text-gray-700">Assignment</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mt-2">
                      {renderFieldWithHint('employee_user_id', 'Employee', undefined, 'select', 
                        employedEmployees.map(emp => ({value: emp.id, label: `${emp.first_name} ${emp.last_name}`})), 
                        true 
                      )}
                      {renderFieldWithHint('manager_user_id', 'Manager', undefined, 'select', 
                        [{value: null, label: 'Not Set / No Manager'}, ...employedEmployees.map(emp => ({value: emp.id, label: `${emp.first_name} ${emp.last_name}`}))] 
                      )}
                      {renderFieldWithHint('go_to_for', 'Go To For', 'e.g., Guidance on Project X', 'input')}
                    </div>
                  </fieldset>

                  <fieldset className="border p-4 rounded-md shadow-sm">
                    <legend className="text-md font-semibold px-2 text-gray-700">The Rock - Planning (Start of FY)</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-2">
                      {renderFieldWithHint('the_rock_id', 'Link to Company Rock', undefined, 'select', 
                        parentCompanyRocks.map(pr => ({value: pr.id, label: pr.title})),
                        true
                      )}
                      {renderFieldWithHint('title', 'Rock Title', 'e.g., Improve Q3 Sales Process', 'input', undefined, true)}
                      <div className="md:col-span-2">
                        {renderFieldWithHint('rock_description', 'Rock Description', 'Detailed description of this staff rock', 'textarea', undefined, true, 3)}
                      </div>
                      {renderFieldWithHint('link_to_higher_level_priorities', 'Link to Higher-Level Priorities', 'e.g., Company Goal: Increase Revenue', 'input', undefined, true)}
                      <div className="md:col-span-2">
                        {renderFieldWithHint('success_criteria', 'Success Criteria', 'Specific, measurable outcomes for this rock', 'textarea', undefined, true, 3)}
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className="border p-4 rounded-md shadow-sm">
                    <legend className="text-md font-semibold px-2 text-gray-700">The Rock - Review (End of FY)</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-2">
                      <div className="md:col-span-2">
                        {renderFieldWithHint('results_achieved', 'Results Achieved', 'How did it go? What were the outcomes?', 'textarea', undefined, false, 3)}
                      </div>
                      <div className="md:col-span-2">
                        {renderFieldWithHint('manager_perspective', 'Manager Perspective', 'Manager\'s feedback on the results and process', 'textarea', undefined, false, 3)}
                      </div>
                      {renderFieldWithHint('success_status_picker', 'Success Status', undefined, 'color_picker')}
                    </div>
                  </fieldset>
                  
                  <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Cancel
                    </button>
                    <button type="submit" disabled={isFormLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                      {isFormLoading ? (editingStaffRock ? 'Updating...' : 'Creating...') : (editingStaffRock ? 'Update Staff Rock' : 'Create Staff Rock')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StaffRocksModal; 