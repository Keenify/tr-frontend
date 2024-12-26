import React, { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { updateDocument, createDocumentTab } from '../../../../../../services/docService'; // Adjust the import path as necessary

/**
 * Props for the SubjectDetail component.
 * @typedef {Object} SubjectDetailProps
 * @property {Object} subject - The subject details.
 * @property {string} subject.id - The unique identifier for the subject.
 * @property {string} subject.title - The title of the subject.
 * @property {string} subject.description - The description of the subject.
 * @property {'Company' | 'Policies' | 'Processes'} subject.type - The type of the subject.
 * @property {'published' | 'unpublished'} subject.status - The publication status of the subject.
 * @property {any} [subject.documentData] - Optional document data related to the subject.
 */

// Define the SubjectDetailProps interface
interface SubjectDetailProps {
  subject: {
    id: string;
    title: string;
    description: string;
    type: 'Company' | 'Policies' | 'Processes';
    documentData?: any; // Include document data if applicable
  };
  session: Session; // Add session prop
}

/**
 * A component to display and edit details of a subject.
 * @param {SubjectDetailProps} props - The props for the component.
 * @returns {JSX.Element} The rendered component.
 */

const SubjectDetail: React.FC<SubjectDetailProps> = ({ subject, session }) => {
  const [topicTitle, setTopicTitle] = useState<string>('');
  const [description, setDescription] = useState<string>(subject.description);
  const navigate = useNavigate();

  /**
   * Handles changes to the description textarea.
   * @param {React.ChangeEvent<HTMLTextAreaElement>} e - The change event.
   */
  const handleDescriptionChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= 500) {
      setDescription(text);
      try {
        await updateDocument(subject.documentData.id, { description: text });
        console.log('✅ Description updated successfully');
      } catch (error) {
        console.error('❌ Failed to update description:', error);
      }
    }
  };

  // Use useEffect to log document data only once or when it changes
  useEffect(() => {
    if (subject.documentData) {
      console.log('Document Data:', subject.documentData);
    }
  }, [subject.documentData]);

  // Display Document Data in the UI
  const documentData = subject.documentData;

  const handleCreateClick = async () => {
    if (!topicTitle) return;

    try {
      const tabData = await createDocumentTab(subject.documentData.id, topicTitle, 1); // Assuming position is 1 for simplicity
      console.log('✅ Tab created successfully:', tabData);

      navigate(`/${session.user.id}/dashboard/${subject.documentData.id}/editor`, {
        state: {
          title: topicTitle,
          description,
          topic: null,
          tabId: tabData.id, // Pass the tab ID
        },
      });
    } catch (error) {
      console.error('❌ Failed to create tab:', error);
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
              <h1 className="text-2xl font-semibold">{documentData.title}</h1>
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

        {/* Content Area */}
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
              onClick={handleCreateClick}
              className={`px-4 py-2 rounded-lg ${
                topicTitle
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              Create
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SubjectDetail;