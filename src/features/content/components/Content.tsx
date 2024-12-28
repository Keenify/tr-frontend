import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateSubjectModal from '../modals/CreateSubjectModal';
import SubjectDetail from './SubjectDetail';
import { Session } from '@supabase/supabase-js';
import { getDocumentsByType } from "../../../services/docService"

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
  type: SubjectType;
  /** Publishing status of the subject */
  status: 'published' | 'unpublished';
  documentData?: any;
}

interface ContentProps {
  session: Session;
}

// Define the types as a constant array
const SUBJECT_TYPES = ['Company', 'Policies', 'Processes'] as const;

// Use the constant in your code
type SubjectType = typeof SUBJECT_TYPES[number];

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
  const [activeContentType, setActiveContentType] = useState<string>('none');

  useEffect(() => {
    // Fetch all documents when the component mounts
    fetchDocuments('none');
  }, []);

  /**
   * Handles creation of a new subject
   * @param data Object containing name and type for new subject
   */
  const handleCreateSubject = (data: { name: string; types: string[]; documentData: any }) => {
    const newSubjects = data.types.map(type => ({
      id: Date.now().toString() + type, // Ensure unique ID for each type
      title: data.name,
      description: '',
      type: type as SubjectType, // Cast the string to SubjectType
      status: 'unpublished' as const,
      documentData: data.documentData,
    }));
    
    // Assuming you want to set the first subject as selected
    setSelectedSubject(newSubjects[0]);
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
