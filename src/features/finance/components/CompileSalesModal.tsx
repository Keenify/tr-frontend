import React, { useState } from "react";
import { subDays } from "date-fns";

// Import types
import { Platform } from "./platform/PlatformSelector";

interface CompileSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: number;
  onCompile: (params: CompileParams) => Promise<void>;
  isCompiling: boolean;
}

export interface CompileParams {
  platform: Platform;
  startDate: Date;
  endDate: Date;
  format: 'csv' | 'pdf';
}

const CompileSalesModal: React.FC<CompileSalesModalProps> = ({
  isOpen,
  onClose,
  companyId,
  onCompile,
  isCompiling
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("shopee");
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');

  const platforms: { value: Platform; label: string; color: string }[] = [
    { value: "shopee", label: "Shopee", color: "text-orange-600" },
    { value: "lazada", label: "Lazada", color: "text-blue-600" },
    { value: "redmart", label: "Redmart", color: "text-red-600" },
    { value: "foodpanda", label: "Foodpanda", color: "text-purple-600" },
    { value: "shopify", label: "Shopify", color: "text-green-600" },
    { value: "grab", label: "Grab", color: "text-green-700" },
    { value: "all_sg", label: "All (Singapore)", color: "text-gray-800" },
    { value: "all_my", label: "All (Malaysia)", color: "text-yellow-700" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlatform || !startDate || !endDate) {
      alert('Please fill in all required fields');
      return;
    }

    if (startDate > endDate) {
      alert('Start date cannot be after end date');
      return;
    }

    await onCompile({
      platform: selectedPlatform,
      startDate,
      endDate,
      format
    });
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Compile Sales Data</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              disabled={isCompiling}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform *
              </label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value as Platform)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
                disabled={isCompiling}
              >
                {platforms.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate.toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(new Date(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    disabled={isCompiling}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate.toISOString().split('T')[0]}
                    onChange={(e) => setEndDate(new Date(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    disabled={isCompiling}
                  />
                </div>
              </div>
            </div>

            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={(e) => setFormat(e.target.value as 'csv' | 'pdf')}
                    className="mr-2"
                    disabled={isCompiling}
                  />
                  <span className="text-sm text-gray-700">CSV</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={format === 'pdf'}
                    onChange={(e) => setFormat(e.target.value as 'csv' | 'pdf')}
                    className="mr-2"
                    disabled={isCompiling}
                  />
                  <span className="text-sm text-gray-700">PDF</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isCompiling}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isCompiling}
              >
                {isCompiling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t border-white"></div>
                    Compiling...
                  </>
                ) : (
                  'Compile & Export'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompileSalesModal;