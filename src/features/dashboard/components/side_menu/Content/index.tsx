import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateSubjectModal from './modals/CreateSubjectModal';
import SubjectDetail from './components/SubjectDetail';
import { Session } from '@supabase/supabase-js';
import { getDocumentsByType } from "../../../../../services/docService"

/**
 * Interface representing a subject in the content section
 */
interface Subject {
  /** Unique identifier for the subject */
  id: string;
  /** Title/name of the subject */
  title: string;
  /** Description text for the subject */
  description: string;
  /** Category type of the subject */
  type: 'Company' | 'Policies' | 'Processes';
  /** Publishing status of the subject */
  status: 'published' | 'unpublished';
  documentData?: any;
}

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
  // State for tracking currently selected subject
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  // State to store fetched documents
  const [documents, setDocuments] = useState<any[]>([]);
  const navigate = useNavigate();

  /**
   * Handles creation of a new subject
   * @param data Object containing name and type for new subject
   */
  const handleCreateSubject = (data: { name: string; type: 'Company' | 'Policies' | 'Processes'; documentData: any }) => {
    const newSubject = {
      id: Date.now().toString(),
      title: data.name,
      description: '',
      type: data.type,
      status: 'unpublished' as const,
      documentData: data.documentData,
    };
    setSelectedSubject(newSubject);
    setIsModalOpen(false);
  };

  // Function to fetch documents by type
  const fetchDocuments = async (type: string) => {
    try {
      const data = await getDocumentsByType(type);
      setDocuments(data);
      console.log(`✅ Documents fetched successfully for type: ${type}`);
    } catch (error) {
      console.error(`❌ Failed to fetch documents for type: ${type}`, error);
    }
  };

  // Show subject detail view if a subject is selected
  if (selectedSubject) {
    return <SubjectDetail subject={selectedSubject} session={session} />;
  }

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
        <div
          className="p-4 rounded-lg border hover:bg-gray-50 cursor-pointer"
          onClick={() => fetchDocuments('none')}
        >
          <div className="flex items-center gap-2">
            <span className="text-purple-500">🏠</span>
            <span>All content</span>
          </div>
        </div>

        <div
          className="p-4 rounded-lg border hover:bg-gray-50 cursor-pointer"
          onClick={() => fetchDocuments('Company')}
        >
          <div className="flex items-center gap-2">
            <span className="text-yellow-500">📄</span>
            <span>Company</span>
          </div>
        </div>

        <div
          className="p-4 rounded-lg border hover:bg-gray-50 cursor-pointer"
          onClick={() => fetchDocuments('Policies')}
        >
          <div className="flex items-center gap-2">
            <span className="text-pink-500">📝</span>
            <span>Policies</span>
          </div>
        </div>

        <div
          className="p-4 rounded-lg border hover:bg-gray-50 cursor-pointer"
          onClick={() => fetchDocuments('Processes')}
        >
          <div className="flex items-center gap-2">
            <span className="text-blue-500">📊</span>
            <span>Processes</span>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="mt-6">
        {documents.map((doc) => (
          <div key={doc.id} className="flex justify-between items-center p-4 border rounded-lg shadow-sm mb-4">
            <span
              className="text-lg font-medium cursor-pointer hover:underline"
              onClick={() => navigate(`/${session.user.id}/dashboard/${doc.id}/editor`, {
                state: { title: doc.title, topic: doc.content }
              })}
            >
              {doc.title}
            </span>
            <span className="text-sm text-gray-500">{doc.type}</span>
          </div>
        ))}
      </div>

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
