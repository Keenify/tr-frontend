import React, { useState } from 'react';

interface SubjectDetailProps {
  subject: {
    id: string;
    title: string;
    description: string;
    type: 'Company' | 'Policies' | 'Processes';
    status: 'published' | 'unpublished';
  };
}

const SubjectDetail: React.FC<SubjectDetailProps> = ({ subject }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditModeOpen, setIsEditModeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'outline' | 'completions'>('outline');
  const [topicTitle, setTopicTitle] = useState('');
  const [description, setDescription] = useState(subject.description);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= 500) {
      setDescription(text);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <span className="text-gray-600">Content</span>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900">{subject.title}</span>
      </div>

      {/* Subject Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {subject.type === 'Company' ? '📄' : subject.type === 'Policies' ? '📝' : '📊'}
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{subject.title}</h1>
              <div className="text-sm text-gray-500">{subject.type}</div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="text-gray-600 mb-4">
          <textarea
            className="w-full p-2 border rounded-lg resize-none"
            placeholder="Enter Subject description"
            value={description}
            onChange={handleDescriptionChange}
            rows={3}
          />
          <div className="text-right text-sm text-gray-500">
            {description.length}/500
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          {/* Edit Mode Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsEditModeOpen(!isEditModeOpen)}
              className="inline-flex items-center px-3 py-2 border rounded-lg text-sm"
            >
              <span className="mr-2">✏️</span>
              {isEditMode ? 'Edit mode' : 'View mode'}
              <span className="ml-2">▼</span>
            </button>
            
            {isEditModeOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setIsEditMode(true);
                    setIsEditModeOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  <span>✏️</span>
                  <div>
                    <div className="font-medium">Edit mode</div>
                    <div className="text-sm text-gray-500">Update this content.</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    setIsEditModeOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  <span>👁️</span>
                  <div>
                    <div className="font-medium">View mode</div>
                    <div className="text-sm text-gray-500">Review or complete this content.</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button className="inline-flex items-center px-3 py-2 border rounded-lg text-sm bg-orange-50 text-orange-600">
            <span className="mr-2">⭕</span>
            Unpublished
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('outline')}
              className={`pb-2 px-1 ${
                activeTab === 'outline'
                  ? 'border-b-2 border-red-500 text-red-500'
                  : 'text-gray-500'
              }`}
            >
              Subject outline
            </button>
            <button
              onClick={() => setActiveTab('completions')}
              className={`pb-2 px-1 ${
                activeTab === 'completions'
                  ? 'border-b-2 border-red-500 text-red-500'
                  : 'text-gray-500'
              }`}
            >
              Completions
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'outline' && (
        <div>
          {/* Add Topic Form */}
          <div className="flex items-center gap-2 mb-4">
            <select className="border rounded-lg px-3 py-2">
              <option value="topic">Topic</option>
            </select>
            <input
              type="text"
              placeholder="Enter topic title"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2"
            />
            <button
              disabled={!topicTitle}
              className={`px-4 py-2 rounded-lg ${
                topicTitle
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              Create
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <button className="inline-flex items-center px-4 py-2 border rounded-lg text-sm text-red-500">
              <span className="mr-2">✨</span>
              Smart outline
            </button>
            <button className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg text-sm">
              Add content
              <span className="ml-2">▼</span>
            </button>
          </div>
        </div>
      )}
      {activeTab === 'completions' && (
        <div className="text-center py-8 text-gray-500">
          No completion data available
        </div>
      )}
    </div>
  );
};

export default SubjectDetail;