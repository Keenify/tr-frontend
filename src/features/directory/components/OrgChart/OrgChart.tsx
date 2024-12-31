import { useState } from 'react';
import noOrgChartImage from '../../assets/org_chart.svg';
import { OrgChartConfigPanel } from './OrgChartConfigPanel';

interface OrgChartProps {
  companyId: string;
}

export const OrgChart = ({ companyId }: OrgChartProps) => {
  const [activeTab, setActiveTab] = useState<'people' | 'roles'>('people');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  // TODO: Remove this after testing
  console.log("need to remove this", companyId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Org chart</h1>
        <p className="text-gray-600">
          A one-stop shop to see who reports to who. Accuracy depends on everyone having the "Reports to" field filled on their profile.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('people')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'people'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            People
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'roles'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Roles
          </button>
        </div>

        <div className="flex w-full sm:w-auto space-x-4">
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
          <button 
            onClick={() => setIsConfigPanelOpen(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors whitespace-nowrap"
          >
            Build people chart
          </button>
        </div>

      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-16">
        <img
          src={noOrgChartImage}
          alt="No org chart"
          className="w-96 h-96 mb-8"
        />
        <h2 className="text-xl font-semibold text-gray-900">
          An Org chart hasn't been created yet
        </h2>
      </div>

      {/* Add the config panel */}
      <OrgChartConfigPanel
        isOpen={isConfigPanelOpen}
        onClose={() => setIsConfigPanelOpen(false)}
        companyId={companyId}
      />
    </div>
  );
};
