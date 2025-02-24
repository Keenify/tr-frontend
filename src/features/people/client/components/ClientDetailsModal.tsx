import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useDropzone } from 'react-dropzone';
import { B2BClientData } from '../types/b2bClient';
import { uploadAttachment, deleteAttachment } from '../services/useAttachments';
import { updateB2BAttachment, deleteB2BAttachment } from '../services/useB2BClients';

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClient: B2BClientData | null;
  handleUpdate: (e: React.FormEvent) => void;
  handleDelete: () => void;
  attachments: File[];
  setAttachments: React.Dispatch<React.SetStateAction<File[]>>;
  refreshClient?: (clientId: string) => Promise<void>;
}

const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  isOpen,
  onClose,
  selectedClient,
  handleUpdate,
  handleDelete,
  attachments,
  setAttachments,
  refreshClient,
}) => {
  const [uploading, setUploading] = useState(false);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setAttachments((prev) => [...prev, ...acceptedFiles]);
    },
  });

  const handleUpload = async () => {
    if (!selectedClient?.id) return;

    setUploading(true);
    try {
      for (const file of attachments) {
        const filePath = await uploadAttachment(file);
        console.log('Uploaded file path:', filePath);

        // Update the client with the attachment information
        const attachmentResponse = await updateB2BAttachment(filePath, 'Attachment description', selectedClient.id);
        console.log('Attachment response:', attachmentResponse);
        
        // Add the new attachment to the UI immediately using the response data
        if (selectedClient && attachmentResponse) {
          const newAttachment = {
            id: attachmentResponse.id,  // This should be a UUID from the server
            file_url: filePath,
            uploaded_at: new Date().toISOString(),
            description: 'Attachment description'
          };
          selectedClient.attachments = [...selectedClient.attachments, newAttachment];
        }
      }
      
      setAttachments([]);

      if (refreshClient) {
        await refreshClient(selectedClient.id);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  // Make the upload button submit the form
  const handleUploadClick = async () => {
    await handleUpload();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleUpload(); // Upload files first
    handleUpdate(e); // Then update other client details
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!selectedClient?.id) return;
    
    if (!window.confirm('Are you sure you want to delete this attachment?')) {
      return;
    }
    
    try {
      const attachment = selectedClient.attachments.find(a => a.id === attachmentId);
      if (!attachment) {
        console.error('Attachment not found');
        return;
      }

      // Debug log to check attachment data
      console.log('Found attachment to delete:', {
        attachmentId,
        fullAttachment: attachment,
        allAttachments: selectedClient.attachments
      });

      // First delete the database record using the correct UUID
      try {
        await deleteB2BAttachment(attachment.id);
        console.log('Successfully deleted database record with ID:', attachment.id);

        // Then delete from storage
        const filePath = attachment.file_url;
        console.log('Deleting file from Supabase storage:', filePath);
        await deleteAttachment(filePath);
        console.log('Successfully deleted file from storage');

        // Update the UI immediately
        if (selectedClient) {
          selectedClient.attachments = selectedClient.attachments.filter(a => a.id !== attachment.id);
        }

        // Optional: Refresh in background
        if (refreshClient) {
          refreshClient(selectedClient.id).catch(console.error);
        }
      } catch (dbError) {
        console.error('Error deleting from database:', dbError);
        throw dbError;
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Failed to delete attachment. Please try again.');
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Client Details
                </Dialog.Title>
                
                <div className="flex gap-6">
                  {/* Client Information Section */}
                  <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Company Information</h4>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Company Name</label>
                        <input
                          title="Company Name"
                          placeholder="Enter Company Name"
                          type="text"
                          name="client_company"
                          defaultValue={selectedClient?.client_company}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Business Unit</label>
                        <input
                          title="Business Unit"
                          placeholder="Enter Business Unit"
                          type="text"
                          name="business_unit"
                          defaultValue={selectedClient?.business_unit || ''}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                        <input
                          title="Contact Person"
                          placeholder="Enter Contact Person"
                          type="text"
                          name="name"
                          defaultValue={selectedClient?.name}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          title="Email"
                          placeholder="Enter Email"
                          type="email"
                          name="email"
                          defaultValue={selectedClient?.email}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                        <input
                          title="Contact Number"
                          placeholder="Enter Contact Number"
                          type="text"
                          name="contact_number"
                          defaultValue={selectedClient?.contact_number}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nature</label>
                        <input
                          title="Nature"
                          placeholder="Enter Nature"
                          type="text"
                          name="nature"
                          defaultValue={selectedClient?.nature}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Credit Terms</label>
                        <input
                          title="Credit Terms"
                          placeholder="Enter Credit Terms"
                          type="text"
                          name="credit_terms"
                          defaultValue={selectedClient?.credit_terms}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Last Price</label>
                        <input
                          title="Last Price"
                          placeholder="Enter Last Price"
                          type="text"
                          name="last_price"
                          defaultValue={selectedClient?.last_price || ''}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Remarks</label>
                        <textarea
                          title="Remarks"
                          placeholder="Enter Remarks"
                          name="remarks"
                          defaultValue={selectedClient?.remarks}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          rows={3}
                        />
                      </div>
                    </form>
                  </div>

                  {/* Attachments Section */}
                  <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Attachments</h4>
                    
                    {/* Upload Area */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 transition-colors duration-300 ${
                        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
                      }`}
                      {...getRootProps()}
                    >
                      <input {...getInputProps()} />
                      <p className="text-gray-500 text-center">
                        {isDragActive ? "Drop the files here ..." : "Drag & drop files here, or click to select files"}
                      </p>
                    </div>

                    {/* Selected Files */}
                    {attachments.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Selected Files</h5>
                        <ul className="space-y-2 bg-white rounded-lg p-3">
                          {attachments.map((file, index) => (
                            <li key={index} className="text-sm text-gray-700">
                              {file.name}
                            </li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          className="mt-2 w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                          onClick={handleUploadClick}
                          disabled={uploading}
                        >
                          {uploading ? 'Uploading...' : 'Upload Files'}
                        </button>
                      </div>
                    )}

                    {/* Existing Attachments */}
                    <div className="mt-6">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Existing Attachments</h5>
                      <div className="bg-white rounded-lg p-3">
                        <div className="max-h-[400px] overflow-y-auto">
                          <ul className="space-y-2">
                            {selectedClient?.attachments.map((attachment, index) => (
                              <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <div className="flex-1 min-w-0 mr-2">
                                  <p className="text-sm text-gray-700 truncate break-all">
                                    {attachment.file_url.split('/').pop()?.split('_').slice(1).join('_') || 'Unnamed file'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {new Date(attachment.uploaded_at).toLocaleDateString()}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDeleteAttachment(attachment.id);
                                      console.log('Attachment object:', attachment);
                                    }}
                                    className="text-red-600 hover:text-red-800 p-1"
                                    title="Delete attachment"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </li>
                            ))}
                            {(!selectedClient?.attachments || selectedClient.attachments.length === 0) && (
                              <li className="text-sm text-gray-500 italic">No attachments</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                  <div className="space-x-2">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="clientForm"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      onClick={handleFormSubmit}
                    >
                      Update
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ClientDetailsModal; 