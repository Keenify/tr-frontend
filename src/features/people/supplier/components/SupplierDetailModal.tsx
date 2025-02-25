import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { SupplierData } from "../types/supplier";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSupplier: SupplierData | null;
  isCreateModalOpen: boolean;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  handleCreate: (e: React.FormEvent<HTMLFormElement>) => void;
  handleUpdate: (e: React.FormEvent<HTMLFormElement>) => void;
  handleDelete: () => void;
  handleDuplicate: () => void;
}

const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  isOpen,
  onClose,
  selectedSupplier,
  isCreateModalOpen,
  phoneNumber,
  setPhoneNumber,
  handleCreate,
  handleUpdate,
  handleDelete,
  handleDuplicate,
}) => {
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
                  {isCreateModalOpen ? 'Create New Supplier' : 'Supplier Details'}
                </Dialog.Title>
                
                <form 
                  id={isCreateModalOpen ? "createForm" : "updateForm"}
                  onSubmit={isCreateModalOpen ? handleCreate : handleUpdate} 
                  className="flex gap-8"
                >
                  {/* Left column - Contact Details */}
                  <div className="w-1/3 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700" htmlFor="supplier_company_name">Company Name</label>
                      <input
                        id="supplier_company_name"
                        type="text"
                        name="supplier_company_name"
                        title="Company Name"
                        placeholder="Enter company name"
                        defaultValue={selectedSupplier?.supplier_company_name || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700" htmlFor="contact_person_name">Contact Person</label>
                      <input
                        id="contact_person_name"
                        type="text"
                        name="contact_person_name"
                        title="Contact Person"
                        placeholder="Enter contact person name"
                        defaultValue={selectedSupplier?.contact_person_name}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700" htmlFor="contact_person_phone">Contact Phone</label>
                      <PhoneInput
                        country={'sg'}
                        value={phoneNumber}
                        onChange={setPhoneNumber}
                        inputProps={{
                          name: 'contact_person_phone',
                          required: false,
                          autoFocus: true
                        }}
                        containerClass="mt-1 block w-full"
                        inputClass="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        isValid={(value: string) => value === '' || value.length >= 8}
                        preferredCountries={['sg', 'my']}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700" htmlFor="contact_person_email">Contact Email</label>
                      <input
                        id="contact_person_email"
                        type="email"
                        name="contact_person_email"
                        title="Contact Email"
                        placeholder="Enter contact email"
                        defaultValue={selectedSupplier?.contact_person_email}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700" htmlFor="category">Category</label>
                      <input
                        id="category"
                        type="text"
                        name="category"
                        title="Category"
                        placeholder="Enter category"
                        defaultValue={selectedSupplier?.category || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700" htmlFor="purchased_items_services">Purchased Items/Services</label>
                      <input
                        id="purchased_items_services"
                        type="text"
                        name="purchased_items_services"
                        title="Purchased Items/Services"
                        placeholder="Enter purchased items/services"
                        defaultValue={selectedSupplier?.purchased_items_services}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Right column - Procurement Steps and Notes */}
                  <div className="w-2/3 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Procurement Steps</label>
                      <textarea
                        name="procurement_steps"
                        title="Procurement Steps"
                        placeholder="Enter detailed procurement steps..."
                        defaultValue={selectedSupplier?.procurement_steps}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[200px]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        name="notes"
                        title="Notes"
                        placeholder="Enter detailed notes about the supplier..."
                        defaultValue={selectedSupplier?.notes}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[200px]"
                      />
                    </div>
                  </div>
                </form>

                <div className="mt-6 flex justify-between">
                  {!isCreateModalOpen && (
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      onClick={handleDelete}
                    >
                      Delete
                    </button>
                  )}
                  <div className="space-x-2">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                      onClick={handleDuplicate}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form={isCreateModalOpen ? "createForm" : "updateForm"}
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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