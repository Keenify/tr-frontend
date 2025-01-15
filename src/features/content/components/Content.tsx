import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { Session } from '@supabase/supabase-js';
import { deleteDocument as deleteRegularDocument } from "../../../services/docService";
import { getDocumentsByType } from "../../../services/docService";
import { FaEllipsisV } from 'react-icons/fa';

// Modals
import CreateSubjectModal from '../modals/CreateSubjectModal';
import DeleteSubjectModal from '../modals/DeleteSubjectModal';
import UploadFileModal from '../modals/UploadFileModal';


// Define or update the Document type or interface
import { Document } from '../types/document';
import { useUserAndCompanyData } from '../../../hooks/useUserAndCompanyData';
import { uploadFile, fetchCompanyDocuments, getFileUrl, deleteDocument as deleteUploadedDocument } from '../services/uploadFileService';

interface ContentProps {
  session: Session;
}

// Add type for combined documents
type CombinedDocument = {
  id: string;
  title: string;
  type: 'Company' | 'Policies' | 'Processes';
  isUploadedFile: boolean;
  file_type?: string;
  file_path?: string;
  document_id?: string;
  position?: number;
  file_name?: string;
  file_size?: number;
  description?: string | null;
  status?: 'draft' | 'published';
  upload_date?: string;
};

type BaseDocument = {
  id: string;
  title: string;
  position?: number;
  type?: 'Company' | 'Policies' | 'Processes';
  document_id?: string;
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
  const [organizedDocs, setOrganizedDocs] = useState<{
    Company: CombinedDocument[];
    Policies: CombinedDocument[];
    Processes: CombinedDocument[];
  }>({
    Company: [],
    Policies: [],
    Processes: [],
  });
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  useEffect(() => {
    if (companyInfo?.id) {
      fetchDocuments(companyInfo.id);
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
  const fetchDocuments = async (companyId: string) => {
    setIsLoading(true);
    try {
      const [docs, uploadedDocs] = await Promise.all([
        getDocumentsByType('none', companyId),
        fetchCompanyDocuments(companyId)
      ]);

      // Combine and organize documents by type
      const combined: CombinedDocument[] = [
        ...docs.map((doc: BaseDocument) => ({ 
          ...doc, 
          isUploadedFile: false, 
          type: doc.type || 'Company',
          document_id: doc.document_id || undefined
        })),
        ...uploadedDocs.map(doc => ({
          ...doc,
          isUploadedFile: true,
          title: doc.file_name || doc.title || '',
          type: doc.type || 'Company',
          document_id: doc.document_id || undefined
        }))
      ];

      // Organize documents by type
      const organized = {
        Company: combined.filter(doc => doc.type === 'Company'),
        Policies: combined.filter(doc => doc.type === 'Policies'),
        Processes: combined.filter(doc => doc.type === 'Processes'),
      };

      setOrganizedDocs(organized);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
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
      if (selectedDoc.isUploadedFile) {
        // Use the document_id or id for uploaded files
        const docId = selectedDoc.document_id || selectedDoc.id;
        await deleteUploadedDocument(docId);
      } else {
        await deleteRegularDocument(selectedDoc.id);
      }

      // Refresh documents list
      if (companyInfo?.id) {
        fetchDocuments(companyInfo.id);
      } else {
        console.warn('Company ID is undefined');
      }
      setShowDeleteModal(false);
      setSelectedDoc(null);
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete document:', error);
      toast.error('Failed to delete document');
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
        await fetchDocuments(companyInfo.id);
      }
      
      // Clear form and close modal
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
    <div className="h-full">
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

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.entries(organizedDocs).map(([columnType, docs]) => (
            <div key={columnType} className="flex-1 min-w-[300px]">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">{columnType}</h2>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-sm">
                    {docs.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleDocumentClick(doc)}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{doc.title}</h3>
                        <div className="relative">
                          <button
                            title="More options"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMenu(showMenu === doc.id ? null : doc.id?.toString() || null);
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full"
                          >
                            <FaEllipsisV className="text-gray-500" />
                          </button>
                          
                          {showMenu === doc.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDoc(doc as Document);
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
                      {doc.isUploadedFile && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                          {doc.file_type?.split('/').pop()?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
