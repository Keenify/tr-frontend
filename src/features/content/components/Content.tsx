import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import { toast } from 'react-hot-toast';

import { Session } from '@supabase/supabase-js';
import { deleteDocument, getDocumentsByType } from "../../../services/docService";
import { FaEllipsisV } from 'react-icons/fa';

// Modals
import CreateSubjectModal from '../modals/CreateSubjectModal';
import DeleteSubjectModal from '../modals/DeleteSubjectModal';
import UploadFileModal from '../modals/UploadFileModal';


// Define or update the Document type or interface
import { Document } from '../types/document';
import { useUserAndCompanyData } from '../../../hooks/useUserAndCompanyData';
import { uploadFile, fetchCompanyDocuments, getFileUrl } from '../services/uploadFileService';

interface ContentProps {
  session: Session;
}

// Add type for combined documents
type CombinedDocument = Document & {
  isUploadedFile?: boolean;
  file_type?: string;
  file_path?: string;
};

/**
 * Content component that displays and manages document/subject content for a company
 * 
 * Features:
 * - Displays content categories (All, Company, Policies, Processes)
 * - Lists documents and uploaded files
 * - Allows creating new subjects
 * - Supports file uploads
 * - Enables document deletion
 * 
 * @param {ContentProps} props - Component props containing user session
 * @returns {JSX.Element} Content management interface
 */
const Content: React.FC<ContentProps> = ({ session }) => {
  
  // Load user and company data
  const { userInfo, companyInfo } = useUserAndCompanyData(session.user.id);

  // State for controlling create subject modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State to store fetched documents
  const [documents, setDocuments] = useState<CombinedDocument[]>([]);
  const navigate = useNavigate();
  const [activeContentType, setActiveContentType] = useState<string>('none');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  useEffect(() => {
    if (companyInfo?.id) {
      // Fetch all documents when the component mounts
      fetchDocuments('none', companyInfo.id);
    } else {
      console.warn('Company ID is undefined');
    }
  }, [companyInfo?.id]);

  /**
   * Handles the creation of a new subject and navigates to its detail view
   * 
   * @param {Object} data - Subject creation data
   * @param {string} data.name - Name of the subject
   * @param {string[]} data.types - Content types associated with the subject
   * @param {Document} data.documentData - Complete document data
   */
  const handleCreateSubject = (data: { name: string; types: string[]; documentData: Document }) => {
    // Navigate to SubjectDetail with the response and session
    navigate(`/${session.user.id}/content/${data.documentData.id}`, {
      state: { subject: data.documentData, session }
    });
    setIsModalOpen(false);
  };

  /**
   * Fetches both regular documents and uploaded files based on content type
   * 
   * @param {string} type - Content type filter ('none', 'Company', 'Policies', 'Processes')
   * @param {string} companyId - ID of the current company
   * @returns {Promise<void>}
   */
  const fetchDocuments = async (type: string, companyId: string) => {
    setIsLoading(true);
    try {
      setActiveContentType(type);
      
      // Fetch both regular documents and uploaded files
      const [docs, uploadedDocs] = await Promise.all([
        getDocumentsByType(type, companyId),
        fetchCompanyDocuments(companyId)
      ]);

      // Filter uploaded docs by type if needed
      const filteredUploadedDocs = type === 'none' 
        ? uploadedDocs 
        : uploadedDocs.filter(doc => doc.type === type);

      // Combine and format documents
      const combinedDocs = [
        ...docs.map(doc => ({ ...doc, isUploadedFile: false })),
        ...filteredUploadedDocs.map((doc, index) => ({ 
          ...doc, 
          isUploadedFile: true,
          id: doc.document_id || doc.id,
          position: docs.length + index
        }))
      ];

      setDocuments(combinedDocs);
    } catch (error: unknown) {
      console.error(`❌ Failed to fetch documents for type: ${type}`, error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles document deletion and updates the document list
   * 
   * @returns {Promise<void>}
   * @throws {Error} When deletion fails
   */
  const handleDelete = async () => {
    if (!selectedDoc) return;
    
    try {
      await deleteDocument(selectedDoc.id);
      // Refresh documents list
      if (companyInfo?.id) {
        fetchDocuments(activeContentType, companyInfo.id);
      } else {
        console.warn('Company ID is undefined');
      }
      setShowDeleteModal(false);
      setSelectedDoc(null);
      console.log('✅ Document deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete document:', error);
    }
  };

  /**
   * Handles file upload process with progress tracking
   * 
   * @param {Object} data - Upload data
   * @param {File} data.file - File to upload
   * @param {string} data.type - Content type
   * @param {string} data.title - Document title
   * @returns {Promise<void>}
   * @throws {Error} When upload fails or user/company info is missing
   */
  const handleFileUpload = async (data: { file: File; type: string; title: string }) => {
    try {
      if (!userInfo?.id || !companyInfo?.id) {
        throw new Error('User or company info not found');
      }

      await uploadFile({
        file: data.file,
        title: data.title,
        documentType: data.type,
        employeeId: userInfo.id,
        companyId: companyInfo.id,
        onProgress: (progress: number) => {
          setUploadProgress(progress);
        }
      });

      // Reset progress and show success toast
      setUploadProgress(0);
      toast.success('File uploaded successfully!');

      // Refresh documents list
      if (companyInfo?.id) {
        await fetchDocuments(activeContentType, companyInfo.id);
      }
      
      handleCloseUploadModal();
    } catch (error) {
      setUploadProgress(0);
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  /**
   * Closes upload modal and resets upload progress
   */
  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadProgress(0); // Reset progress when modal closes
  };

  /**
   * Handles document click navigation
   * If it's an uploaded file, opens the signed file URL
   * Otherwise navigates to the document detail page
   * 
   * @param {CombinedDocument} doc - The document to handle
   */
  const handleDocumentClick = async (doc: CombinedDocument) => {
    if (doc.isUploadedFile && doc.file_path) {
      try {
        const fileUrl = await getFileUrl(doc.file_path);
        window.open(fileUrl, '_blank');
      } catch (error) {
        console.error('Error accessing file:', error);
        toast.error('Unable to access file');
      }
    } else {
      navigate(`/${session.user.id}/content/${doc.id}`, {
        state: { subject: doc, session }
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Content</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Create subject
          </button>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Upload
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {['none', 'Company', 'Policies', 'Processes'].map((type) => (
          <div
            key={type}
            data-tooltip-id={`tooltip-${type}`}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              activeContentType === type
                ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => {
              if (companyInfo?.id) {
                fetchDocuments(type, companyInfo.id);
              } else {
                console.warn('Company ID is undefined');
              }
            }}
          >
            <div className="flex items-center gap-2">
              <span className={`text-${type === 'none' ? 'purple' : type === 'Company' ? 'yellow' : type === 'Policies' ? 'pink' : 'blue'}-500`}>
                {type === 'none' ? '🏠' : type === 'Company' ? '📄' : type === 'Policies' ? '📝' : '📊'}
              </span>
              <span>{type === 'none' ? 'All content' : type}</span>
            </div>
            <Tooltip id={`tooltip-${type}`}>
              {type === 'none' && "View all your content in one place"}
              {type === 'Company' && "Create content that outlines your story, values, mission, and vision in a way that gets everyone on the same page"}
              {type === 'Policies' && "Document the operating rules and standards of your business into a guided, organised, digital employee handbook."}
              {type === 'Processes' && "Create step-by-step training manuals that outline your company's standard operating procedures (SOPs)."}
            </Tooltip>
          </div>
        ))}
      </div>

      {/* Document List */}
      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        ) : documents && documents.length > 0 ? (
          documents.map((doc) => (
            <div key={doc.id} className="flex justify-between items-center p-4 border rounded-lg shadow-sm mb-4">
              <span
                className="text-lg font-medium cursor-pointer hover:underline"
                onClick={() => handleDocumentClick(doc)}
              >
                {doc.title}
              </span>
              <div className="flex items-center gap-4">
                {doc.isUploadedFile && (
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {doc.file_type?.split('/').pop()?.toUpperCase()}
                  </span>
                )}
                <span className="text-sm text-gray-500">{doc.type}</span>
                {!doc.isUploadedFile && ( // Only show menu for regular documents
                  <div className="relative">
                    <button
                      title="Edit"
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
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <h3 className="text-xl font-medium text-gray-900 mb-2">No documents yet</h3>
          </div>
        )}
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
      {/* Upload File Modal */}
      <UploadFileModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        onSubmit={handleFileUpload}
        uploadProgress={uploadProgress}
      />
    </div>
  );
};

export default Content;
