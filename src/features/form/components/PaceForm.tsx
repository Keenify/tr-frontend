import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { supabase } from '../../../lib/supabase';

// Types for fetched data
interface Company {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  company_id: string;
}

interface ProcessRow {
  employee_id: string;
  process_name: string;
  kpi_better: string;
  kpi_faster: string;
  kpi_cheaper: string;
}

interface FormValues {
  company_id: string;
  processes: ProcessRow[];
}

const MIN_ROWS = 4;
const MAX_ROWS = 9;

const PaceForm: React.FC = () => {
  // State for companies and employees
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
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

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');
      if (!error && data) setCompanies(data);
    };
    fetchCompanies();
  }, []);

  // Fetch employees when company changes
  useEffect(() => {
    if (!selectedCompanyId) {
      setEmployees([]);
      // Clear employee_id fields if company is unselected
      fields.forEach((_, idx) => setValue(`processes.${idx}.employee_id`, ''));
      return;
    }
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, company_id')
        .eq('company_id', selectedCompanyId)
        .order('first_name');
      if (!error && data) setEmployees(data);
    };
    fetchEmployees();
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
            <div key={field.id} className="grid grid-cols-12 border-b border-gray-300 hover:bg-gray-50">
              <div className="col-span-1 p-3 text-center border-r border-gray-300">
                {/* Empty cell for alignment */}
              </div>
              
              {/* Person Accountable */}
              <div className="col-span-3 p-2 border-r border-gray-300">
                <Controller
                  name={`processes.${idx}.employee_id` as const}
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
              
              <div className="col-span-1 p-3 text-center border-r border-gray-300">
                {/* Empty cell for alignment */}
              </div>
              
              {/* Name of Process */}
              <div className="col-span-3 p-2 border-r border-gray-300">
                <Controller
                  name={`processes.${idx}.process_name` as const}
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
              
              <div className="col-span-1 p-3 text-center border-r border-gray-300">
                {/* Empty cell for alignment */}
              </div>
              
              {/* KPIs Combined */}
              <div className="col-span-3 p-2">
                <div className="space-y-1">
                  <Controller
                    name={`processes.${idx}.kpi_better` as const}
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
                    name={`processes.${idx}.kpi_faster` as const}
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
                    name={`processes.${idx}.kpi_cheaper` as const}
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
                  {fields.length > MIN_ROWS && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveRow(idx)}
                      className="text-red-500 text-xs hover:text-red-700 mt-1"
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
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
