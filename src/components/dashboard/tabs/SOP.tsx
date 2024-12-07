import { Plus, Search } from 'lucide-react';

export function SOP() {
  return (
    <div className="divide-y divide-gray-200 h-full">
      {/* Actions Bar */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search SOPs..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <button className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Plus className="h-5 w-5 mr-2" />
            New SOP
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 flex-grow">
        <div className="w-full max-w-full mx-auto space-y-4">
          {/* Sample SOP Items */}
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    SOP-{item.toString().padStart(3, '0')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Last updated 2 days ago
                  </p>
                </div>
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}