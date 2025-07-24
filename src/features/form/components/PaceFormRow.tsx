import React from 'react';
import { Controller } from 'react-hook-form';
import { Employee } from '../types/paceFormTypes';

interface PaceFormRowProps {
  idx: number;
  field: any;
  control: any;
  employees: Employee[];
  selectedCompanyId: string;
  fieldsLength: number;
  minRows: number;
  onRemove: (idx: number) => void;
}

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
            <select
              {...field}
              disabled={!selectedCompanyId}
              className="w-full p-1 text-sm border-none focus:outline-none bg-transparent"
            >
              <option value="">Select employee...</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name}
                </option>
              ))}
            </select>
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
          name={`processes.${idx}.kpi_better`}
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              className="w-full p-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-400"
              placeholder="Better"
            />
          )}
        />
        <Controller
          name={`processes.${idx}.kpi_faster`}
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              className="w-full p-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-400"
              placeholder="Faster"
            />
          )}
        />
        <Controller
          name={`processes.${idx}.kpi_cheaper`}
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              className="w-full p-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-400"
              placeholder="Cheaper"
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