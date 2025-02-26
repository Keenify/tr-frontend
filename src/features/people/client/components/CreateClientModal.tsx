import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useDropzone } from 'react-dropzone';
import { CreateB2BClientPayload, B2BClientData } from '../types/b2bClient';
import { uploadAttachment } from '../services/useAttachments';
import { updateB2BAttachment } from '../services/useB2BClients';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import countryList from 'react-select-country-list';
import { toast } from 'react-hot-toast';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleCreate: (payload: CreateB2BClientPayload) => Promise<B2BClientData>;
  companyId: string;
  uniqueNatureValues: string[];
  uniqueCreditTermsValues: string[];
}

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

const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  onClose,
  handleCreate,
  companyId,
  uniqueNatureValues,
  uniqueCreditTermsValues,
}) => {
  const [clientCountry, setClientCountry] = useState<string | null>(null);
  const [originCountry, setOriginCountry] = useState<string | null>(null);
  const [nature, setNature] = useState<string | null>(null);
  const [creditTerms, setCreditTerms] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setAttachments((prev) => [...prev, ...acceptedFiles]);
    },
  });

  // Convert arrays to react-select options format
  const natureOptions = uniqueNatureValues.map(value => ({ label: value, value }));
  const creditTermsOptions = uniqueCreditTermsValues.map(value => ({ label: value, value }));

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Create a properly typed payload
    const payload: CreateB2BClientPayload = {
      client_company: formData.get('client_company') as string,
      business_unit: formData.get('business_unit') as string || '',
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      contact_number: formData.get('contact_number') as string,
      nature: nature || '',
      credit_terms: creditTerms || '',
      last_price: formData.get('last_price') as string || '',
      remarks: formData.get('remarks') as string || '',
      client_country: clientCountry || '',
      origin_country: originCountry || '',
      company_id: companyId,
      designation: '',
      attachments: []
    };
    
    try {
      // Create the client and get the response
      const createdClient = await handleCreate(payload);
      setCreatedClientId(createdClient.id || null);
      setIsCreating(false);
      
      // Don't close the modal - allow attachments to be uploaded
    } catch (error) {
      console.error('Error creating client:', error);
      setIsCreating(false);
    }
  };

  const handleUpload = async () => {
    if (!createdClientId || attachments.length === 0) return;

    setUploading(true);
    try {
      for (const file of attachments) {
        const filePath = await uploadAttachment(file);
        console.log('Uploaded file path:', filePath);

        // Update the client with the attachment information
        await updateB2BAttachment(filePath, 'Attachment description', createdClientId);
      }
      
      setAttachments([]);
      toast.success('Attachments uploaded successfully');
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload attachments');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Reset all state
    setClientCountry(null);
    setOriginCountry(null);
    setNature(null);
    setCreditTerms(null);
    setAttachments([]);
    setCreatedClientId(null);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
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
                  {createdClientId ? 'Client Created - Add Attachments' : 'Create New Client'}
                </Dialog.Title>
                
                <div className="flex gap-6">
                  {/* Client Information Section */}
                  <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Company Information</h4>
                    {!createdClientId ? (
                      <form id="createClientForm" onSubmit={handleFormSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Company Name</label>
                          <input
                            title="Company Name"
                            placeholder="Enter Company Name"
                            type="text"
                            name="client_company"
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Nature</label>
                          <CreatableSelect
                            isClearable
                            placeholder="Select or enter nature of business"
                            options={natureOptions}
                            className="mt-1"
                            onChange={(option) => setNature(option?.value || null)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Credit Terms</label>
                          <CreatableSelect
                            isClearable
                            placeholder="Select or enter credit terms"
                            options={creditTermsOptions}
                            className="mt-1"
                            onChange={(option) => setCreditTerms(option?.value || null)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Last Price</label>
                          <input
                            title="Last Price"
                            placeholder="Enter Last Price"
                            type="text"
                            name="last_price"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Remarks</label>
                          <textarea
                            title="Remarks"
                            placeholder="Enter Remarks"
                            name="remarks"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Client Country</label>
                          <Select
                            name="client_country"
                            options={getSortedCountries()}
                            className="mt-1"
                            placeholder="Select Client Country"
                            required
                            value={clientCountry ? { label: clientCountry, value: clientCountry } : null}
                            onChange={(option) => setClientCountry(option?.value || null)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Origin Country</label>
                          <Select
                            name="origin_country"
                            options={getSortedCountries()}
                            className="mt-1"
                            placeholder="Select Origin Country"
                            required
                            value={originCountry ? { label: originCountry, value: originCountry } : null}
                            onChange={(option) => setOriginCountry(option?.value || null)}
                          />
                        </div>
                      </form>
                    ) : (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-green-700 font-medium">Client created successfully!</p>
                        <p className="text-sm text-green-600 mt-2">
                          You can now upload attachments for this client using the panel on the right.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Attachments Section */}
                  <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Attachments</h4>
                    
                    {!createdClientId ? (
                      <p className="text-sm text-gray-600 mb-4">
                        You can upload attachments after creating the client.
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 mb-4">
                        Upload attachments for the newly created client.
                      </p>
                    )}
                    
                    {/* Upload Area */}
                    {!createdClientId ? (
                      <div className="border-2 border-dashed rounded-lg p-4 transition-colors duration-300 border-gray-300 bg-gray-100">
                        <p className="text-gray-500 text-center">
                          Attachments can be added after client creation
                        </p>
                      </div>
                    ) : (
                      <>
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
                              onClick={handleUpload}
                              disabled={uploading}
                            >
                              {uploading ? 'Uploading...' : 'Upload Files'}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={handleClose}
                  >
                    {createdClientId ? 'Close' : 'Cancel'}
                  </button>
                  
                  {!createdClientId && (
                    <button
                      type="submit"
                      form="createClientForm"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      disabled={isCreating}
                    >
                      {isCreating ? 'Creating...' : 'Create'}
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreateClientModal; 