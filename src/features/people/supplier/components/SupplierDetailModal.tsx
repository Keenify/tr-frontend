import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { SupplierData } from "../types/supplier";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useDropzone } from 'react-dropzone';
import { uploadAttachment, deleteAttachment, getAttachmentSignedUrl } from '../services/useAttachments';
import { updateSupplierAttachment, deleteSupplierAttachment } from '../services/useSupplier';
import Select from 'react-select';
import countryList from 'react-select-country-list';

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSupplier: SupplierData | null;
  setSelectedSupplier: React.Dispatch<React.SetStateAction<SupplierData | null>>;
  isCreateModalOpen: boolean;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  handleCreate: (e: React.FormEvent<HTMLFormElement>) => void;
  handleUpdate: (e: React.FormEvent<HTMLFormElement>) => void;
  handleDelete: () => void;
  handleDuplicate: () => void;
  refreshSupplier?: (supplierId: string) => Promise<void>;
}

const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  isOpen,
  onClose,
  selectedSupplier,
  setSelectedSupplier,
  isCreateModalOpen,
  phoneNumber,
  setPhoneNumber,
  handleCreate,
  handleUpdate,
  handleDelete,
  handleDuplicate,
  refreshSupplier,
}) => {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'attachments'>('details');
  const [isProcurementExpanded, setIsProcurementExpanded] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setAttachments((prev) => [...prev, ...acceptedFiles]);
    },
  });

  const handleUpload = async () => {
    if (!selectedSupplier?.id) return;

    setUploading(true);
    try {
      for (const file of attachments) {
        const filePath = await uploadAttachment(file);
        console.log('Uploaded file path:', filePath);

        // Update the supplier with the attachment information
        const attachmentResponse = await updateSupplierAttachment(filePath, 'Attachment description', selectedSupplier.id);
        console.log('Attachment response:', attachmentResponse);
        
        // Add the new attachment to the UI immediately
        if (selectedSupplier && attachmentResponse) {
          const newAttachment = {
            id: attachmentResponse.id,
            file_url: filePath,
            uploaded_at: new Date().toISOString()
          };
          setSelectedSupplier(prevSupplier => {
            if (!prevSupplier) return null;
            return {
              ...prevSupplier,
              attachments: [...prevSupplier.attachments, newAttachment]
            };
          });
        }
      }
      
      setAttachments([]);

      if (refreshSupplier && selectedSupplier.id) {
        await refreshSupplier(selectedSupplier.id);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = async () => {
    await handleUpload();
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleUpload();
    if (isCreateModalOpen) {
      handleCreate(e);
    } else {
      handleUpdate(e);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!selectedSupplier?.id) return;
    
    if (!window.confirm('Are you sure you want to delete this attachment?')) {
      return;
    }
    
    try {
      const attachment = selectedSupplier.attachments.find(a => a.id === attachmentId);
      if (!attachment) {
        console.error('Attachment not found');
        return;
      }

      // Delete database record
      await deleteSupplierAttachment(attachment.id);
      console.log('Successfully deleted database record with ID:', attachment.id);

      // Delete from storage
      await deleteAttachment(attachment.file_url);
      console.log('Successfully deleted file from storage');

      // Update UI
      setSelectedSupplier(prevSupplier => {
        if (!prevSupplier) return null;
        return {
          ...prevSupplier,
          attachments: prevSupplier.attachments.filter(a => a.id !== attachment.id)
        };
      });

      // Refresh in background
      if (refreshSupplier && selectedSupplier.id) {
        refreshSupplier(selectedSupplier.id).catch(console.error);
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Failed to delete attachment. Please try again.');
    }
  };

  const handleAttachmentClick = async (fileUrl: string) => {
    try {
      const signedUrl = await getAttachmentSignedUrl(fileUrl);
      window.open(signedUrl, '_blank');
    } catch (error) {
      console.error('Error opening attachment:', error);
      alert('Failed to open attachment. Please try again.');
    }
  };

  const getSortedCountries = () => {
    const countries = countryList().getData();
    const priorityCountries = ['SG', 'MY'];
    
    const prioritized = countries.filter(country => 
      priorityCountries.includes(country.value)
    );
    const others = countries.filter(country => 
      !priorityCountries.includes(country.value)
    );
    
    return [...prioritized, ...others];
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
              <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  {isCreateModalOpen ? 'Create New Supplier' : 'Edit Supplier'}
                </Dialog.Title>
                
                <form
                  id={isCreateModalOpen ? "createForm" : "updateForm"}
                  onSubmit={handleFormSubmit}
                  className="flex gap-6"
                >
                  {/* Left column */}
                  <div className="w-1/3 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company Name</label>
                      <input
                        title="Supplier Company Name"
                        placeholder="Enter Supplier Company Name"
                        type="text"
                        name="supplier_company_name"
                        defaultValue={selectedSupplier?.supplier_company_name}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                      <input
                        title="Contact Person Name"
                        placeholder="Enter Contact Person Name"
                        type="text"
                        name="contact_person_name"
                        defaultValue={selectedSupplier?.contact_person_name}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                      <PhoneInput
                        country={'sg'}
                        value={phoneNumber}
                        onChange={setPhoneNumber}
                        inputProps={{
                          title: 'Contact Person Phone Number',
                          placeholder: 'Enter Contact Person Phone Number',
                          name: 'contact_person_phone',
                          required: false
                        }}
                        containerClass="mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                      <input
                        title="Contact Person Email"
                        placeholder="Enter Contact Person Email"
                        type="email"
                        name="contact_person_email"
                        defaultValue={selectedSupplier?.contact_person_email}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <input
                        title="Purchased Items/Services"
                        placeholder="Enter Purchased Items/Services"
                        type="text"
                        name="purchased_items_services"
                        defaultValue={selectedSupplier?.purchased_items_services}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Purchased Items/Services</label>
                      <input
                        title="Purchased Items/Services"
                        placeholder="Enter Purchased Items/Services"
                        type="text"
                        name="purchased_items_services"
                        defaultValue={selectedSupplier?.purchased_items_services}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Supplier Country</label>
                      <Select
                        name="client_country"
                        options={getSortedCountries()}
                        className="mt-1"
                        defaultValue={getSortedCountries().find(
                          country => country.value === selectedSupplier?.client_country
                        )}
                        placeholder="Select Supplier Country"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Origin Country</label>
                      <Select
                        name="origin_country"
                        options={getSortedCountries()}
                        className="mt-1"
                        defaultValue={getSortedCountries().find(
                          country => country.value === selectedSupplier?.origin_country
                        )}
                        placeholder="Select Origin Country"
                        required
                      />
                    </div>
                  </div>

                  {/* Right column - Details/Attachments Tabs */}
                  <div className="w-2/3">
                    {/* Tab Navigation */}
                    <div className="flex mb-4 border-b">
                      <button
                        type="button"
                        className={`px-4 py-2 ${activeTab === 'details' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('details')}
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 ${activeTab === 'attachments' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('attachments')}
                      >
                        Attachments
                        <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                          {selectedSupplier?.attachments.length || 0}
                        </span>
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-gray-50 rounded-lg p-4 h-[500px] overflow-y-auto">
                      {activeTab === 'details' && (
                        <div className="space-y-4">
                          <div>
                            <div 
                              className="flex items-center justify-between cursor-pointer mb-2"
                              onClick={() => setIsProcurementExpanded(!isProcurementExpanded)}
                            >
                              <h4 className="text-md font-medium text-gray-900">Procurement Steps</h4>
                              <svg 
                                className={`w-5 h-5 transform transition-transform ${isProcurementExpanded ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                            <textarea
                              name="procurement_steps"
                              defaultValue={selectedSupplier?.procurement_steps}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[200px] bg-white"
                              placeholder="Enter procurement steps..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                            <textarea
                              name="notes"
                              defaultValue={selectedSupplier?.notes}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[100px] bg-white"
                              placeholder="Enter notes..."
                            />
                          </div>
                        </div>
                      )}

                      {activeTab === 'attachments' && !isCreateModalOpen && (
                        <div className="space-y-4">
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
                                  {selectedSupplier?.attachments.map((attachment, index) => (
                                    <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100">
                                      <div 
                                        className="flex-1 min-w-0 mr-2 cursor-pointer"
                                        onClick={() => handleAttachmentClick(attachment.file_url)}
                                        title="Click to open attachment"
                                      >
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
                                          onClick={() => handleDeleteAttachment(attachment.id)}
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
                                  {(!selectedSupplier?.attachments || selectedSupplier.attachments.length === 0) && (
                                    <li className="text-sm text-gray-500 italic">No attachments</li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </form>

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
                      className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      onClick={handleDuplicate}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form={isCreateModalOpen ? "createForm" : "updateForm"}
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      {isCreateModalOpen ? 'Create' : 'Update'}
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

export default SupplierDetailModal; 