import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { supabase } from '../../../lib/supabase';
import { useCompanies } from '../hooks/useCompanies';
import { useEmployees } from '../hooks/useEmployees';
import { FormValues, ProcessRow } from '../types/paceFormTypes';
import PaceFormRow from './PaceFormRow';

const MIN_ROWS = 4;
const MAX_ROWS = 9;

const PaceForm: React.FC = () => {
  // State for loading and submit status
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  // React Hook Form setup
  const { control, handleSubmit, watch, reset, setValue } = useForm<FormValues>({
    defaultValues: {
      company_id: '',
      processes: Array(MIN_ROWS).fill({
        employee_id: '',
        process_name: '',
        kpi_better: '',
        kpi_faster: '',
        kpi_cheaper: '',
      }),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'processes',
  });

  const selectedCompanyId = watch('company_id');
  const companies = useCompanies();
  const employees = useEmployees(selectedCompanyId);

  // Clear employee_id fields if company is unselected or changes
  React.useEffect(() => {
    if (!selectedCompanyId) {
      fields.forEach((_, idx) => setValue(`processes.${idx}.employee_id`, ''));
      return;
    }
    // Clear employee_id fields if company changes
    fields.forEach((_, idx) => setValue(`processes.${idx}.employee_id`, ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId]);

  // Add a new process row
  const handleAddRow = () => {
    if (fields.length < MAX_ROWS) {
      append({
        employee_id: '',
        process_name: '',
        kpi_better: '',
        kpi_faster: '',
        kpi_cheaper: '',
      });
    }
  };

  // Remove a process row
  const handleRemoveRow = (idx: number) => {
    if (fields.length > MIN_ROWS) {
      remove(idx);
    }
  };

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setSubmitStatus(null);
    try {
      // Prepare rows for insertion
      const rows = values.processes.map((row) => ({
        company_id: values.company_id,
        employee_id: row.employee_id,
        process_name: row.process_name,
        kpi_better: row.kpi_better,
        kpi_faster: row.kpi_faster,
        kpi_cheaper: row.kpi_cheaper,
      }));
      const { error } = await supabase.from('pace_form').insert(rows);
      if (error) throw error;
      setSubmitStatus('Form submitted successfully!');
      reset();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setSubmitStatus('Submission failed: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="bg-orange-400 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">People Process Accountability Chart (PACe)</h1>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">SCALING UP</div>
          <div className="text-sm">📈</div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 p-4 border-l border-r border-gray-300">
        <div className="flex items-start mb-2">
          <span className="text-purple-600 font-bold mr-2">●</span>
          <span className="text-sm">Identify 4 to 9 processes that drive your business</span>
        </div>
        <div className="flex items-start mb-2">
          <span className="text-purple-600 font-bold mr-2">●</span>
          <span className="text-sm">Assign someone specific accountability for each process</span>
        </div>
        <div className="flex items-start">
          <span className="text-purple-600 font-bold mr-2">●</span>
          <span className="text-sm">Set Key Performance Indicators (KPIs) for each process: Better, faster, cheaper</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Company Selector */}
        <div className="bg-gray-50 p-4 border-l border-r border-gray-300">
          <label htmlFor="company_id" className="block text-sm font-medium text-gray-700 mb-2">
            Company
          </label>
          <Controller
            name="company_id"
            control={control}
            rules={{ required: 'Please select a company' }}
            render={({ field, fieldState }) => (
              <div>
                <select
                  {...field}
                  id="company_id"
                  className="w-80 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">Select company...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {fieldState.error && (
                  <div className="text-red-500 text-sm mt-1">{fieldState.error.message}</div>
                )}
              </div>
            )}
          />
        </div>

        {/* Table */}
        <div className="border border-gray-300">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-300">
            <div className="col-span-1 p-3 text-center">
              <span className="text-purple-600 font-bold text-lg">●</span>
            </div>
            <div className="col-span-3 p-3 font-semibold text-sm border-l border-gray-300">
              Person Accountable
            </div>
            <div className="col-span-1 p-3 text-center border-l border-gray-300">
              <span className="text-purple-600 font-bold text-lg">●</span>
            </div>
            <div className="col-span-3 p-3 font-semibold text-sm border-l border-gray-300">
              Name of Process
            </div>
            <div className="col-span-1 p-3 text-center border-l border-gray-300">
              <span className="text-purple-600 font-bold text-lg">●</span>
            </div>
            <div className="col-span-3 p-3 font-semibold text-sm border-l border-gray-300">
              KPIs<br />
              <span className="text-xs text-gray-600">(Better, Faster, Cheaper)</span>
            </div>
          </div>

          {/* Dynamic Rows */}
          {fields.map((field, idx) => (
            <PaceFormRow
              key={field.id}
              idx={idx}
              field={field}
              control={control}
              employees={employees}
              selectedCompanyId={selectedCompanyId}
              fieldsLength={fields.length}
              minRows={MIN_ROWS}
              onRemove={handleRemoveRow}
            />
          ))}
        </div>

        {/* Add Row Button */}
        <div className="p-4 bg-gray-50 border-l border-r border-gray-300">
          {fields.length < MAX_ROWS && (
            <button
              type="button"
              onClick={handleAddRow}
              className="bg-orange-400 text-white px-4 py-2 rounded hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              + Add Process
            </button>
          )}
        </div>

        {/* Submit Button */}
        <div className="p-4 bg-gray-50 border-l border-r border-gray-300">
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-400 text-white px-6 py-2 rounded hover:bg-orange-500 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
          {submitStatus && (
            <div className={`mt-3 text-sm ${submitStatus.startsWith('Form') ? 'text-green-600' : 'text-red-600'}`}>
              {submitStatus}
            </div>
          )}
        </div>
      </form>

      {/* Footer */}
      <div className="bg-gray-50 p-4 border border-gray-300 rounded-b-lg text-xs text-gray-600">
        <div className="flex justify-between items-center">
          <span>Copyrighted resources used with permission from Scaling Up, a Gazelles company.</span>
          <span>v@2024 - Copyrighted TROS by Gazelles </span>
        </div>
      </div>
    </div>
  );
};

export default PaceForm;
