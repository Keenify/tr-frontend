import { useState, Fragment } from "react";
import { useUserAndCompanyData } from "../../../../shared/hooks/useUserAndCompanyData";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCompanySuppliers, updateSupplier, deleteSupplier, createSupplier } from "../services/useSupplier";
import { ClipLoader } from "react-spinners";
import { Session } from "@supabase/supabase-js";
import { Dialog, Transition } from "@headlessui/react";
import { SupplierData, CreateSupplierPayload, UpdateSupplierPayload } from "../types/supplier";
import toast from "react-hot-toast";

interface SupplierProps {
  session: Session;
}

const Supplier: React.FC<SupplierProps> = ({ session }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { companyInfo, isLoading: isLoadingCompanyData } = useUserAndCompanyData(session.user.id);
  const queryClient = useQueryClient();

  // Add sorting state
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ supplierId, payload }: { supplierId: string; payload: UpdateSupplierPayload }) =>
      updateSupplier(supplierId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier updated successfully');
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Error updating supplier: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (supplierId: string) => deleteSupplier(supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier deleted successfully');
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Error deleting supplier: ${error.message}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateSupplierPayload) => createSupplier(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier created successfully');
      setIsCreateModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Error creating supplier: ${error.message}`);
    },
  });

  const {
    data: suppliers,
    isLoading: isLoadingSuppliers,
    error,
  } = useQuery({
    queryKey: ['suppliers', companyInfo?.id],
    queryFn: () => companyInfo?.id ? getCompanySuppliers(companyInfo.id) : Promise.resolve([]),
    enabled: !!companyInfo?.id,
  });

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSupplier?.id) return;
    
    const formData = new FormData(e.currentTarget);
    const payload = {
      ...Object.fromEntries(formData.entries()),
      procurement_steps: formData.get('procurement_steps')?.toString() || '',
    } as unknown as UpdateSupplierPayload;
    
    updateMutation.mutate({
      supplierId: selectedSupplier.id,
      payload,
    });
  };

  const handleDelete = () => {
    if (!selectedSupplier?.id) return;
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      deleteMutation.mutate(selectedSupplier.id);
    }
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      ...Object.fromEntries(formData.entries()),
      company_id: companyInfo?.id,
    };
    createMutation.mutate(payload as CreateSupplierPayload);
  };

  // Add this function to clear selected supplier when opening create modal
  const handleOpenCreateModal = () => {
    setSelectedSupplier(null); // Clear any cached data
    setIsCreateModalOpen(true);
  };

  // Update the handleDuplicate function to ensure category is preserved
  const handleDuplicate = () => {
    if (!selectedSupplier) return;
    
    const supplierData = { ...selectedSupplier, supplier_company_name: '' } as Partial<SupplierData>;
    delete supplierData.id; // Remove the id property
    
    setSelectedSupplier(supplierData as SupplierData);
    setIsModalOpen(false);
    setIsCreateModalOpen(true);
  };

  // Filter and sort suppliers
  const filteredSuppliers = suppliers?.filter((supplier) => {
    const searchString = searchTerm.toLowerCase();
    return Object.values(supplier).some(value =>
      (value?.toString().toLowerCase() || '').includes(searchString)
    );
  }).sort((a, b) => {
    const nameA = (a.supplier_company_name || '').toLowerCase();
    const nameB = (b.supplier_company_name || '').toLowerCase();
    return sortOrder === 'asc' 
      ? nameA.localeCompare(nameB)
      : nameB.localeCompare(nameA);
  });

  if (isLoadingCompanyData || isLoadingSuppliers) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ClipLoader color="#36d7b7" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="text-red-500">Error loading suppliers: {(error as Error).message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <div className="flex justify-between items-center">
          <p className="text-gray-600">Company: {companyInfo?.name}</p>
          <p className="text-gray-600">Total Suppliers: {suppliers?.length || 0}</p>
        </div>
      </div>

      {/* Search and Create Button Row */}
      <div className="mb-4 flex justify-between items-center gap-4">
        <div className="flex-grow relative">
          <input
            type="text"
            placeholder="Search by anything..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
        >
          Create New Supplier
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-white shadow-md rounded-lg overflow-hidden table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th 
                className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                Company Name
                <span className="ml-1">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              </th>
              <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Person
              </th>
              <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Phone
              </th>
              <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Email
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSuppliers?.map((supplier) => (
              <tr 
                key={supplier.id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedSupplier(supplier);
                  setIsModalOpen(true);
                }}
              >
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 break-words">{supplier.category}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 break-words">
                    {supplier.supplier_company_name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 break-words">{supplier.contact_person_name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 break-words">{supplier.contact_person_phone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 break-words">{supplier.contact_person_email}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSuppliers?.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            {suppliers?.length === 0 
              ? "No suppliers found for this company."
              : "No suppliers match your search criteria."}
          </div>
        )}
      </div>

      {/* Supplier Details Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsModalOpen(false)}>
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
                        <input
                          id="contact_person_phone"
                          type="text"
                          name="contact_person_phone"
                          title="Contact Phone"
                          placeholder="Enter contact phone"
                          defaultValue={selectedSupplier?.contact_person_phone}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
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
                        onClick={() => isCreateModalOpen ? setIsCreateModalOpen(false) : setIsModalOpen(false)}
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

      {/* Create Supplier Modal */}
      <Transition appear show={isCreateModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsCreateModalOpen(false)}>
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
                    Create New Supplier
                  </Dialog.Title>
                  
                  <form id="createForm" onSubmit={handleCreate} className="flex gap-8">
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
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="contact_person_phone">Contact Phone</label>
                        <input
                          id="contact_person_phone"
                          type="text"
                          name="contact_person_phone"
                          title="Contact Phone"
                          placeholder="Enter contact phone"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
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
                          defaultValue={selectedSupplier?.procurement_steps || ''}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[200px]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <textarea
                          name="notes"
                          title="Notes"
                          placeholder="Enter detailed notes about the supplier..."
                          defaultValue={selectedSupplier?.notes || ''}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[200px]"
                        />
                      </div>
                    </div>
                  </form>

                  <div className="mt-6 flex justify-end space-x-2">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="createForm"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      Create
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Supplier;
