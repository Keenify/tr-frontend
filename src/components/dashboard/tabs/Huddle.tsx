import { Plus, Search, MessageCircle, Clock } from 'lucide-react';

export function Huddle() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="divide-y divide-gray-200">
      {/* Actions Bar */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search meetings..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <p className="text-sm text-gray-500">{currentDate}</p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Plus className="h-5 w-5 mr-2" />
            New Meeting
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        <div className="space-y-4">
          {/* Today's Huddle */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-medium text-green-900">Today's Huddle</h3>
              </div>
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MessageCircle className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <p className="text-sm text-green-900">Team updates and priorities for the day</p>
                  <p className="text-xs text-green-600 mt-1">10:00 AM - 10:15 AM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Previous Huddles */}
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Daily Huddle - {new Date(Date.now() - item * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </h3>
                </div>
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  Completed
                </span>
              </div>
              <div className="ml-7 text-sm text-gray-500">
                <p>Duration: 15 minutes</p>
                <p>Participants: 8</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}