import React from 'react';
import { Controller } from 'react-hook-form';
import { Employee } from '../types/faceFormTypes';
import { ExtendedEmployee } from '../hooks/useEmployees';
import defaultAvatar from '../../../assets/images/sg-flag.png';
import Select from 'react-select';

interface FaceFormRowProps {
  idx: number;
  field: any;
  control: any;
  employees: ExtendedEmployee[];
  selectedCompanyId: string;
  fieldsLength: number;
  minRows: number;
  onRemove: (idx: number) => void;
  isPredefinedFunction?: boolean;
}

const FaceFormRow: React.FC<FaceFormRowProps> = ({
  idx, field, control, employees, selectedCompanyId, fieldsLength, minRows, onRemove, isPredefinedFunction = false
}) => (
  <div className="grid grid-cols-4 border-b border-gray-300 hover:bg-gray-50">
    {/* Functions Column */}
    <div className="p-2 border-r border-gray-300">
      <Controller
        name={`functions.${idx}.function_name`}
        control={control}
        rules={{ required: 'Required' }}
        render={({ field, fieldState }) => (
          <div>
            <input
              {...field}
              type="text"
              className="w-full p-1 text-sm border-none focus:outline-none bg-transparent"
              placeholder="Function name"
            />
            {fieldState.error && (
              <div className="text-red-500 text-xs mt-1">{fieldState.error.message}</div>
            )}
          </div>
        )}
      />
    </div>

    {/* Person Accountable Column */}
    <div className="p-2 border-r border-gray-300">
      <Controller
        name={`functions.${idx}.accountable_employee_id`}
        control={control}
        render={({ field, fieldState }) => (
          <div>
            <Select
              value={employees.filter(e => e.is_employee).find(e => e.id === field.value) ? {
                value: field.value,
                label: `${employees.find(e => e.id === field.value)?.first_name} ${employees.find(e => e.id === field.value)?.last_name}`,
                employee: employees.find(e => e.id === field.value)
              } : null}
              onChange={(option) => field.onChange(option?.value || null)}
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

    {/* Leading Indicators (KPIs) Column */}
    <div className="p-2 border-r border-gray-300">
      <Controller
        name={`functions.${idx}.kpi_list`}
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
    </div>

    {/* Results/Outcomes Column */}
    <div className="p-2">
      <div className="space-y-1">
        <Controller
          name={`functions.${idx}.outcome_list`}
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              className="w-full p-2 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-400 resize-vertical min-h-[60px]"
              placeholder="• First Outcome&#10;• Second Outcome&#10;• Third Outcome"
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

export default FaceFormRow;