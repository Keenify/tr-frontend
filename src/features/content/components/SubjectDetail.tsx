import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { updateDocument, createDocumentTab } from '../../../services/docService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * SubjectDetail component displays detailed information about a subject
 * and allows users to update the description and create new document tabs.
 */
const SubjectDetail: React.FC = () => {
  const location = useLocation();
  const { subject, session } = location.state || {};

  if (!subject || !session) {
    return <div>Error: Subject or session data is missing. Please try again.</div>;
  }

  const [topicTitle, setTopicTitle] = useState<string>('');
  const [description, setDescription] = useState<string>(subject.description || '');
  const [pendingDescription, setPendingDescription] = useState<string>(description);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const [isFocused, setIsFocused] = useState<boolean>(false);

  /**
   * Updates the description state and attempts to update the document's description.
   * @param {React.ChangeEvent<HTMLTextAreaElement>} e - The change event from the textarea.
   */
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= 500) {
      setPendingDescription(text);
    }
  };

  useEffect(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      if (pendingDescription !== description) {
        try {
          await updateDocument(subject.id, { description: pendingDescription });
          setDescription(pendingDescription);
          toast.success('Description updated successfully', {
            position: 'top-right',
          });
        } catch (error) {
          console.error('❌ Failed to update description:', error);
        }
      }
    }, 2000);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [pendingDescription, description, subject.id]);

  useEffect(() => {
    if (subject.documentData) {
      console.log('Document Data:', subject.documentData);
    }
  }, [subject.documentData]);

  /**
   * Handles the creation of a new document tab.
   */
  const handleCreateClick = async () => {
    if (!topicTitle) return;

    try {
      const tabData = await createDocumentTab(subject.documentData.id, topicTitle, 1);
      console.log('✅ Tab created successfully:', tabData);

      navigate(`/${session.user.id}/content/${subject.documentData.id}/editor`, {
        state: {
          title: topicTitle,
          description,
          topic: null,
          tabId: tabData.id,
        },
      });
    } catch (error) {
      console.error('❌ Failed to create tab:', error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <ToastContainer />
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
            className={`w-full p-2 border rounded-lg resize-none ${isFocused ? 'text-black' : 'text-gray-500'}`}
            placeholder="Enter Subject description"
            value={pendingDescription}
            onChange={handleDescriptionChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={3}
          />
          {isFocused && (
            <div className="text-right text-sm text-gray-500">
              {pendingDescription.length}/500
            </div>
          )}
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