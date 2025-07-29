import React, { useState, useRef, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Employee } from '../types/paceFormTypes';
import { ExtendedEmployee } from '../hooks/useEmployees';
import defaultAvatar from '../../../assets/images/sg-flag.png'; // Use a local default avatar or replace with a better default
import Select from 'react-select';

interface PaceFormRowProps {
  idx: number;
  field: any;
  control: any;
  employees: ExtendedEmployee[];
  selectedCompanyId: string;
  fieldsLength: number;
  minRows: number;
  onRemove: (idx: number) => void;
}

const EmployeeDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
  employees: Employee[];
  disabled: boolean;
}> = ({ value, onChange, employees, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedEmployee = employees.find(emp => emp.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-1 text-sm text-left focus:outline-none bg-transparent flex items-center min-h-[32px]"
      >
        {selectedEmployee ? (
          <div className="flex items-center space-x-2">
            <img
              src={selectedEmployee.profile_pic_url || '/default-avatar.png'}
              alt={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/default-avatar.png';
              }}
            />
            <span className="truncate">
              {selectedEmployee.first_name} {selectedEmployee.last_name}
            </span>
          </div>
        ) : (
          <span className="text-gray-500">Select employee...</span>
        )}
        <svg className="w-4 h-4 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
          <div 
            className="p-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-500"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
          >
            Select employee...
          </div>
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="p-2 hover:bg-gray-50 cursor-pointer flex items-center space-x-2"
              onClick={() => {
                onChange(employee.id);
                setIsOpen(false);
              }}
            >
              <img
                src={employee.profile_pic_url || '/default-avatar.png'}
                alt={`${employee.first_name} ${employee.last_name}`}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/default-avatar.png';
                }}
              />
              <span className="text-sm truncate">
                {employee.first_name} {employee.last_name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PaceFormRow: React.FC<PaceFormRowProps> = ({
  idx, field, control, employees, selectedCompanyId, fieldsLength, minRows, onRemove
}) => (
  <div className="grid grid-cols-3 border-b border-gray-300 hover:bg-gray-50">
    <div className="p-2 border-r border-gray-300">
      <Controller
        name={`processes.${idx}.employee_id`}
        control={control}
        rules={{ required: 'Required' }}
        render={({ field, fieldState }) => (
          <div>

            <Select
              value={employees.filter(e => e.is_employee).find(e => e.id === field.value) ? {
                value: field.value,
                label: `${employees.find(e => e.id === field.value)?.first_name} ${employees.find(e => e.id === field.value)?.last_name}`,
                employee: employees.find(e => e.id === field.value)
              } : null}
              onChange={(option) => field.onChange(option?.value || '')}
              options={employees.filter(e => e.is_employee).map(e => ({
                value: e.id,
                label: `${e.first_name} ${e.last_name}`,
                employee: e
              }))}
              placeholder="Select employee..."
              classNamePrefix="react-select"
              isClearable
              formatOptionLabel={(option) => (
                <div className="flex items-center gap-2">
                  <img 
                    src={option.employee?.profile_pic_url || defaultAvatar} 
                    alt="avatar" 
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0" 
                  />
                  <span className="text-sm">{option.label}</span>
                </div>
              )}
            />
            {fieldState.error && (
              <div className="text-red-500 text-xs mt-1">{fieldState.error.message}</div>
            )}
          </div>
        )}
      />
    </div>
    <div className="p-2 border-r border-gray-300">
      <Controller
        name={`processes.${idx}.process_name`}
        control={control}
        rules={{ required: 'Required' }}
        render={({ field, fieldState }) => (
          <div>
            <input
              {...field}
              type="text"
              className="w-full p-1 text-sm border-none focus:outline-none bg-transparent"
              placeholder="Process name"
            />
            {fieldState.error && (
              <div className="text-red-500 text-xs mt-1">{fieldState.error.message}</div>
            )}
          </div>
        )}
      />
    </div>
    <div className="p-2">
      <div className="space-y-1">
        <Controller
          name={`processes.${idx}.kpi_list`}
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              className="w-full p-2 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-400 resize-vertical min-h-[60px]"
              placeholder="• First KPI&#10;• Second KPI&#10;• Third KPI"
              rows={3}
            />
          )}
        />
        {fieldsLength > minRows && (
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="text-red-500 text-xs hover:text-red-700 mt-1"
          >
            ✕ Remove
          </button>
        )}
      </div>
    </div>
  </div>
);

export default PaceFormRow; 