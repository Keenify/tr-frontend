import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Session } from '@supabase/supabase-js';
import { deleteDocument, getDocumentsByType } from "../../../services/docService";
import { FaEllipsisV } from 'react-icons/fa';

// Modals
import CreateSubjectModal from '../modals/CreateSubjectModal';
import DeleteSubjectModal from '../modals/DeleteSubjectModal';


interface ContentProps {
  session: Session;
}

/**
 * Content component that displays the main content section with subject management
 * 
 * Allows creating new subjects and viewing subject details. Shows a grid of
 * content category filters.
 */
const Content: React.FC<ContentProps> = ({ session }) => {
  
  // State for controlling create subject modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State to store fetched documents
  const [documents, setDocuments] = useState<any[]>([]);
  const navigate = useNavigate();
  const [activeContentType, setActiveContentType] = useState<string>('none');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    // Fetch all documents when the component mounts
    fetchDocuments('none');
  }, []);

  /**
   * Handles creation of a new subject
   * @param data Object containing name and type for new subject
   */
  const handleCreateSubject = (data: { name: string; types: string[]; documentData: any }) => {
    // Navigate to SubjectDetail with the response and session
    navigate(`/${session.user.id}/content/${data.documentData.id}`, {
      state: { subject: data.documentData, session }
    });
    setIsModalOpen(false);
  };

  // Function to fetch documents by type
  const fetchDocuments = async (type: string) => {
    try {
      setActiveContentType(type);
      const data = await getDocumentsByType(type);
      setDocuments(data);
      console.log(`✅ Documents fetched successfully for type: ${type}`);
    } catch (error) {
      console.error(`❌ Failed to fetch documents for type: ${type}`, error);
    }
  };

  // Add delete handler
  const handleDelete = async () => {
    if (!selectedDoc) return;
    
    try {
      await deleteDocument(selectedDoc.id);
      // Refresh documents list
      fetchDocuments(activeContentType);
      setShowDeleteModal(false);
      setSelectedDoc(null);
      console.log('✅ Document deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete document:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Content</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-500 text-white px-4 py-2 rounded-lg"
        >
          Create subject
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {['none', 'Company', 'Policies', 'Processes'].map((type) => (
          <div
            key={type}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              activeContentType === type
                ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => fetchDocuments(type)}
          >
            <div className="flex items-center gap-2">
              <span className={`text-${type === 'none' ? 'purple' : type === 'Company' ? 'yellow' : type === 'Policies' ? 'pink' : 'blue'}-500`}>
                {type === 'none' ? '🏠' : type === 'Company' ? '📄' : type === 'Policies' ? '📝' : '📊'}
              </span>
              <span>{type === 'none' ? 'All content' : type}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Document List */}
      <div className="mt-6">
        {documents.map((doc) => (
          <div key={doc.id} className="flex justify-between items-center p-4 border rounded-lg shadow-sm mb-4">
            <span
              className="text-lg font-medium cursor-pointer hover:underline"
              onClick={() => navigate(`/${session.user.id}/content/${doc.id}`, {
                state: { subject: doc, session }
              })}
            >
              {doc.title}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{doc.type}</span>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(showMenu === doc.id ? null : doc.id)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <FaEllipsisV className="text-gray-500" />
                </button>
                
                {showMenu === doc.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border">
                    <button
                      onClick={() => {
                        setSelectedDoc(doc);
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
          </div>
        ))}
      </div>

      {/* Delete Subject Modal */}
      <DeleteSubjectModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedDoc(null);
        }}
        onConfirm={handleDelete}
        documentTitle={selectedDoc?.title || ''}
      />

      {/* Create Subject Modal */}
      <CreateSubjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateSubject}
        session={session}
      />
    </div>
  );
};

export default Content;
