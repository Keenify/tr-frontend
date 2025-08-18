import React, { useState } from 'react';
import { X, Download, Calendar, CheckSquare, Square } from 'lucide-react';
import { Platform } from '../platform/PlatformSelector';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  availablePlatforms: Platform[];
  onExport: (config: ExportConfig) => void;
}

export interface ExportConfig {
  platforms: Platform[];
  startDate: Date;
  endDate: Date;
  format: 'pdf' | 'csv';
  includeGraphs: boolean;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  availablePlatforms,
  onExport
}) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
  const [includeGraphs, setIncludeGraphs] = useState(true);

  if (!isOpen) return null;

  const platformLabels: Record<Platform, string> = {
    'shopee': 'Shopee',
    'lazada': 'Lazada', 
    'redmart': 'Redmart',
    'shopify': 'Shopify',
    'foodpanda': 'Foodpanda',
    'grab': 'Grab',
    'all_sg': 'All (Singapore)',
    'all_my': 'All (Malaysia)'
  };

  const platformColors: Record<Platform, string> = {
    'shopee': 'bg-orange-100 text-orange-800 border-orange-300',
    'lazada': 'bg-blue-100 text-blue-800 border-blue-300',
    'redmart': 'bg-red-100 text-red-800 border-red-300',
    'shopify': 'bg-green-100 text-green-800 border-green-300',
    'foodpanda': 'bg-purple-100 text-purple-800 border-purple-300',
    'grab': 'bg-green-100 text-green-800 border-green-300',
    'all_sg': 'bg-gray-100 text-gray-800 border-gray-300',
    'all_my': 'bg-yellow-100 text-yellow-800 border-yellow-300'
  };

  const handlePlatformToggle = (platform: Platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSelectAll = () => {
    setSelectedPlatforms(availablePlatforms);
  };

  const handleSelectNone = () => {
    setSelectedPlatforms([]);
  };

  const handleExport = () => {
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    const config: ExportConfig = {
      platforms: selectedPlatforms,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      format,
      includeGraphs
    };

    onExport(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Export Sales Data</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Platform Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Platforms
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleSelectNone}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {availablePlatforms.map(platform => (
                <div
                  key={platform}
                  className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedPlatforms.includes(platform)
                      ? platformColors[platform] + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => handlePlatformToggle(platform)}
                >
                  <div className="flex items-center">
                    {selectedPlatforms.includes(platform) ? (
                      <CheckSquare className="h-5 w-5 mr-3" />
                    ) : (
                      <Square className="h-5 w-5 mr-3" />
                    )}
                    <span className="font-medium">{platformLabels[platform]}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedPlatforms.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={() => setFormat('pdf')}
                  className="mr-3"
                />
                <span className="text-sm">PDF with charts and graphs</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                  className="mr-3"
                />
                <span className="text-sm">CSV data file</span>
              </label>
            </div>
          </div>

          {/* Include Graphs Option (for PDF only) */}
          {format === 'pdf' && (
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeGraphs}
                  onChange={(e) => setIncludeGraphs(e.target.checked)}
                  className="mr-3"
                />
                <span className="text-sm font-medium text-gray-700">
                  Include revenue and order charts
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                Charts will show daily trends for the selected date range
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={selectedPlatforms.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;