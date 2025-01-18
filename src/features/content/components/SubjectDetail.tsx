import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { updateDocument } from '../services/docServices';
import { createDocumentTab, getDocumentTabs, deleteDocumentTab } from '../../../services/docService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEllipsisV } from 'react-icons/fa';
import DeleteTopicModal from '../modals/DeleteTopicModal';

/**
 * SubjectDetail component displays detailed information about a subject
 * and allows users to update the description and create new document tabs.
 */
const SubjectDetail: React.FC = () => {
  const location = useLocation();
  const { subject, session } = location.state || {};

  const [topicTitle, setTopicTitle] = useState<string>('');
  const [description, setDescription] = useState<string>(subject?.description || '');
  const [pendingDescription, setPendingDescription] = useState<string>(description);
  const [documentTabs, setDocumentTabs] = useState<DocumentTab[]>([]);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<DocumentTab | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [pendingTitle, setPendingTitle] = useState(subject?.title || '');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  interface DocumentTab {
    id: string;
    title: string;
    // Add other properties as needed
  }

  useEffect(() => {
    if (!subject) return;

    const fetchTabs = async () => {
      setIsLoading(true);
      try {
        const tabs = await getDocumentTabs(subject.id);
        setDocumentTabs(tabs);
      } catch (error) {
        console.error('❌ Failed to fetch document tabs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTabs();
  }, [subject]);

  useEffect(() => {
    if (!subject) return;

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
  }, [pendingDescription, description, subject]);

  if (!subject || !session) {
    return <div>Error: Subject or session data is missing. Please try again.</div>;
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= 500) {
      setPendingDescription(text);
    }
  };

  const handleCreateClick = async () => {
    if (!topicTitle) return;

    try {
      const tabData = await createDocumentTab(subject.id, topicTitle, documentTabs.length + 1);
      setDocumentTabs([...documentTabs, tabData]);
      setTopicTitle('');
      console.log('✅ Tab created successfully:', tabData);

      navigate(`/${session.user.id}/steps/${tabData.id}/editor`, {
        state: {
          subject,
          tabData,
          session,
        },
      });
    } catch (error) {
      console.error('❌ Failed to create tab:', error);
    }
  };

  const handleDeleteTab = async () => {
    if (!selectedTab || !subject) return;
    
    try {
      await deleteDocumentTab(subject.id, selectedTab.id);
      const updatedTabs = documentTabs.filter(tab => tab.id !== selectedTab.id);
      setDocumentTabs(updatedTabs);
      setShowDeleteModal(false);
      setSelectedTab(null);
      console.log('✅ Topic deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete topic:', error);
    }
  };

  const handleTitleUpdate = async () => {
    if (pendingTitle === subject.title || !pendingTitle.trim()) {
      setPendingTitle(subject.title);
      setIsEditingTitle(false);
      return;
    }

    try {
      await updateDocument(subject.id, { title: pendingTitle });
      setIsEditingTitle(false);
      toast.success('Title updated successfully', {
        position: 'top-right',
      });
    } catch (error) {
      console.error('❌ Failed to update title:', error);
      setPendingTitle(subject.title);
      toast.error('Failed to update title', {
        position: 'top-right',
      });
    }
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleUpdate();
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
              {isEditingTitle ? (
                <div className="relative">
                  <input
                    type="text"
                    title="Topic Title"
                    placeholder="Topic Title"
                    value={pendingTitle}
                    onChange={(e) => {
                      if (e.target.value.length <= 100) {
                        setPendingTitle(e.target.value);
                      }
                    }}
                    onBlur={handleTitleUpdate}
                    onKeyPress={handleTitleKeyPress}
                    autoFocus
                    className="text-2xl font-semibold w-full p-1 border rounded"
                  />
                  <div className="absolute right-2 bottom-1 text-xs text-gray-500">
                    {pendingTitle.length}/100
                  </div>
                </div>
              ) : (
                <h1 
                  className="text-2xl font-semibold cursor-pointer group relative"
                  onClick={() => setIsEditingTitle(true)}
                >
                  <span className="group-hover:bg-gray-100 px-1 py-0.5 rounded">
                    {pendingTitle}
                  </span>
                </h1>
              )}
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

        {/* Loading Animation */}
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        ) : (
          /* Content Area */
          <div>
            {/* Existing Topics */}
            <div className="mb-4">
              {documentTabs.map((tab) => (
                <div key={tab.id} className="flex items-center gap-2 mb-2">
                  <select className="border rounded-lg px-3 py-2" disabled title="Topic">
                    <option value="topic">Topic</option>
                  </select>
                  <input
                    title="Topic Title"
                    placeholder="Topic Title"
                    type="text"
                    value={tab.title}
                    readOnly
                    onClick={() => navigate(`/${session.user.id}/steps/${tab.id}/editor`, { state: { subject, tabData: tab, session } })}
                    className="flex-1 border rounded-lg px-3 py-2 bg-gray-100 cursor-pointer hover:underline"
                  />
                  <div className="relative">
                    <button
                      title="Delete Topic"
                      onClick={() => setShowMenu(showMenu === tab.id ? null : tab.id)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <FaEllipsisV className="text-gray-500" />
                    </button>
                    
                    {showMenu === tab.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border">
                        <button
                          onClick={() => {
                            setSelectedTab(tab);
                            setShowDeleteModal(true);
                            setShowMenu(null);
                          }}
                          className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 rounded-lg"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Topic Form */}
            <div className="flex items-center gap-2 mb-4">
              <select className="border rounded-lg px-3 py-2" title="Topic">
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
        )}
      </div>

      {/* Add DeleteTopicModal */}
      <DeleteTopicModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTab(null);
        }}
        onConfirm={handleDeleteTab}
        topicTitle={selectedTab?.title || ''}
      />
    </div>
  );
};

export default SubjectDetail;