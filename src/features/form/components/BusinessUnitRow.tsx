import React from 'react';
import { Controller } from 'react-hook-form';
import { ExtendedEmployee } from '../hooks/useEmployees';
import defaultAvatar from '../../../assets/images/sg-flag.png';
import Select from 'react-select';

interface BusinessUnitRowProps {
  idx: number;
  field: any;
  control: any;
  employees: ExtendedEmployee[];
  selectedCompanyId: string;
  fieldsLength: number;
  minRows: number;
  onRemove: (idx: number) => void;
}

const BusinessUnitRow: React.FC<BusinessUnitRowProps> = ({
  idx, field, control, employees, selectedCompanyId, fieldsLength, minRows, onRemove
}) => (
  <div className="grid grid-cols-4 border-b border-gray-300 hover:bg-gray-50">
    {/* Business Unit Name Column */}
    <div className="p-2 border-r border-gray-300">
      <Controller
        name={`business_units.${idx}.business_unit_name`}
        control={control}
        render={({ field, fieldState }) => (
          <div>
            <input
              {...field}
              type="text"
              className="w-full p-1 text-sm border-none focus:outline-none bg-transparent"
              placeholder="Business unit name"
            />
            {fieldState.error && (
              <div className="text-red-500 text-xs mt-1">{fieldState.error.message}</div>
            )}
          </div>
        )}
      />
    </div>

    {/* Head Employee Column */}
    <div className="p-2 border-r border-gray-300">
      <Controller
        name={`business_units.${idx}.head_employee_id`}
        control={control}
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

    {/* Leading Indicators (KPIs) Column */}
    <div className="p-2 border-r border-gray-300">
      <Controller
        name={`business_units.${idx}.kpi_list`}
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
          name={`business_units.${idx}.outcome_list`}
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
        <button
          type="button"
          onClick={() => onRemove(idx)}
          className="text-red-500 text-xs hover:text-red-700 mt-1"
        >
          ✕ Remove
        </button>
      </div>
    </div>
  </div>
);

export default BusinessUnitRow;