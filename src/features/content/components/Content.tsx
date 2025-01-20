import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaEllipsisV } from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import { Session } from '@supabase/supabase-js';

// Services
import { deleteDocument as deleteRegularDocument } from "../services/docServices";
import { getDocumentsByType } from "../services/docServices";
import { uploadFile, fetchCompanyDocuments, getFileUrl, deleteDocument as deleteUploadedDocument } from '../services/uploadFileService';
import { documentTypeService } from '../services/docTypeServices';

// Modals
import CreateSubjectModal from '../modals/CreateSubjectModal';
import DeleteSubjectModal from '../modals/DeleteSubjectModal';
import UploadFileModal from '../modals/UploadFileModal';


// Define or update the Document type or interface
import { Document } from '../types/document';
import { useUserAndCompanyData } from '../../../hooks/useUserAndCompanyData';
import { DocumentType } from '../types/documentType';


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
  const [organizedDocs, setOrganizedDocs] = useState<Record<string, CombinedDocument[]>>({});
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Add new state for document types
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);

  const fetchDocuments = useCallback(async (companyId: string) => {
    setIsLoading(true);
    try {
      const [docs, uploadedDocs] = await Promise.all([
        getDocumentsByType('none', companyId),
        fetchCompanyDocuments(companyId)
      ]);

      // Combine documents
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

      // Organize documents by type dynamically
      const organized: Record<string, CombinedDocument[]> = {};
      documentTypes.forEach(type => {
        const typeName = type.type_name.charAt(0).toUpperCase() + type.type_name.slice(1);
        organized[typeName] = combined.filter(doc => 
          doc.type?.toLowerCase() === type.type_name.toLowerCase()
        );
      });

      setOrganizedDocs(organized);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [documentTypes]);

  useEffect(() => {
    if (companyInfo?.id) {
      fetchDocuments(companyInfo.id);
    }
  }, [companyInfo?.id, fetchDocuments]);

  // Add useEffect to fetch document types
  useEffect(() => {
    const fetchDocumentTypes = async () => {
      if (companyInfo?.id) {
        try {
          const types = await documentTypeService.getDocumentTypes(companyInfo.id);
          setDocumentTypes(types);
          
          // Initialize organizedDocs with fetched types
          const initialOrganizedDocs: Record<string, CombinedDocument[]> = {};
          types.forEach(type => {
            initialOrganizedDocs[type.type_name.charAt(0).toUpperCase() + type.type_name.slice(1)] = [];
          });
          setOrganizedDocs(initialOrganizedDocs);
        } catch (error) {
          console.error('Failed to fetch document types:', error);
          toast.error('Failed to load document types');
        }
      }
    };

    fetchDocumentTypes();
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

  const handleDragEnd = () => {
    // Implement drag and drop logic here
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
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="columns">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-full auto-rows-min"
              >
                {Object.entries(organizedDocs).map(([columnType, docs]) => (
                  <Draggable
                    key={columnType}
                    draggableId={columnType}
                    index={Object.keys(organizedDocs).indexOf(columnType)}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`w-full ${(docs.length === 0 ? 'col-span-1' : '')}`}
                      >
                        <div className="bg-gray-100 rounded-lg p-4 h-full">
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
                                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md hover:bg-yellow-200 transition-all cursor-pointer"
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
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                
                {/* Add new document type card */}
                <div className="col-span-1">
                  <button 
                    className="min-h-[88px] w-full bg-gray-100 rounded-lg p-4 hover:bg-gray-200 transition-all flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300"
                    onClick={() => {/* TODO: Implement add document type functionality */}}
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-gray-500 font-medium">Add another Document Type</span>
                  </button>
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
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
