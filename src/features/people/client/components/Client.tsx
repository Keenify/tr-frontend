import React, { useState, Fragment, useEffect, useMemo } from "react";
import { useUserAndCompanyData } from "../../../../shared/hooks/useUserAndCompanyData";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCompanyB2BClients, updateB2BClient, deleteB2BClient, createB2BClient } from "../services/useB2BClients";
import { ClipLoader } from "react-spinners";
import { Session } from "@supabase/supabase-js";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { B2BClientData, CreateB2BClientPayload, UpdateB2BClientPayload } from "../types/b2bClient";
import toast from "react-hot-toast";
import ClientDetailsModal from './ClientDetailsModal';
import Select from 'react-select';
import countryList from 'react-select-country-list';

interface ClientProps {
  session: Session;
}

// Add type for react-select ref
type SelectRef = { getValue: () => Array<{ label: string; value: string }> };

const Client: React.FC<ClientProps> = ({ session }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<B2BClientData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { companyInfo, isLoading: isLoadingCompanyData } = useUserAndCompanyData(session.user.id);
  const queryClient = useQueryClient();

  // Add sorting state
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // State to hold attachments
  const [attachments, setAttachments] = useState<File[]>([]);

  // New state for country filtering
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [countries, setCountries] = useState<string[]>(['All']);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ clientId, payload }: { clientId: string; payload: UpdateB2BClientPayload }) =>
      updateB2BClient(clientId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2bClients'] });
      toast.success('Client updated successfully');
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast.error(`Error updating client: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (clientId: string) => deleteB2BClient(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2bClients'] });
      toast.success('Client deleted successfully');
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast.error(`Error deleting client: ${error.message}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateB2BClientPayload) => createB2BClient(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2bClients'] });
      toast.success('Client created successfully');
      setIsCreateModalOpen(false);
    },
    onError: (error) => {
      toast.error(`Error creating client: ${error.message}`);
    },
  });

  const {
    data: clients,
    isLoading: isLoadingClients,
    error,
  } = useQuery({
    queryKey: ['b2bClients', companyInfo?.id],
    queryFn: () => companyInfo?.id ? getCompanyB2BClients(companyInfo.id) : Promise.resolve([]),
    enabled: !!companyInfo?.id,
  });

  const uniqueNatures = Array.from(new Set(clients?.map(client => client.nature).filter(Boolean) || []));
  const uniqueCreditTerms = Array.from(new Set(clients?.map(client => client.credit_terms).filter(Boolean) || []));

  // Update useEffect to extract unique countries
  useEffect(() => {
    if (clients) {
      const uniqueCountries = Array.from(new Set(clients.map(client => client.origin_country || 'Uncategorized')));
      setCountries(['All', ...uniqueCountries.sort()]);
    }
  }, [clients]);

  // Update filtered clients logic
  const filteredClients = useMemo(() => {
    let filtered = clients || [];
    
    // Filter by country
    if (selectedCountry !== 'All') {
      filtered = filtered.filter(client => client.origin_country === selectedCountry);
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(client => 
        client.client_company.toLowerCase().includes(search) ||
        client.name.toLowerCase().includes(search) ||
        client.email.toLowerCase().includes(search)
      );
    }

    // Sort if needed
    if (sortOrder === 'asc') {
      filtered.sort((a, b) => a.client_company.localeCompare(b.client_company));
    } else {
      filtered.sort((a, b) => b.client_company.localeCompare(a.client_company));
    }

    return filtered;
  }, [clients, selectedCountry, searchTerm, sortOrder]);

  const getCountForCountry = (country: string) => {
    if (country === 'All') {
      return clients?.length || 0;
    }
    return clients?.filter(c => c.origin_country === country).length || 0;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient?.id) return;
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    
    updateMutation.mutate({
      clientId: selectedClient.id,
      payload: payload as UpdateB2BClientPayload,
    });
  };

  const handleDelete = () => {
    if (!selectedClient?.id) return;
    if (window.confirm('Are you sure you want to delete this client?')) {
      deleteMutation.mutate(selectedClient.id);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Get selected values from react-select
    const clientCountry = ((form.querySelector('[name="client_country"]') as unknown) as SelectRef)?.getValue()?.[0]?.label;
    const originCountry = ((form.querySelector('[name="origin_country"]') as unknown) as SelectRef)?.getValue()?.[0]?.label;
    
    const payload = {
      ...Object.fromEntries(formData.entries()),
      company_id: companyInfo?.id,
      client_country: clientCountry,
      origin_country: originCountry,
    };
    
    createMutation.mutate(payload as CreateB2BClientPayload);
  };

  // Add this function to refresh a specific client
  const refreshClient = async (clientId: string) => {
    await queryClient.invalidateQueries({ 
      queryKey: ['b2bClients', companyInfo?.id, clientId]
    });
  };

  const getSortedCountries = () => {
    const countries = countryList().getData();
    const priorityCountries = ['SG', 'MY']; // Singapore and Malaysia country codes
    
    const prioritized = countries.filter(country => 
      priorityCountries.includes(country.value)
    );
    const others = countries.filter(country => 
      !priorityCountries.includes(country.value)
    );
    
    return [...prioritized, ...others];
  };

  if (isLoadingCompanyData || isLoadingClients) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ClipLoader color="#36d7b7" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="text-red-500">Error loading clients: {(error as Error).message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">B2B Clients</h1>
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Company: {companyInfo?.name}</p>
            <p className="text-gray-600">Total Clients: {clients?.length || 0}</p>
          </div>
        </div>

        {/* Search and Create Button Row */}
        <div className="mb-4 flex justify-between items-center gap-4">
          <div className="flex-grow relative">
            <input
              type="text"
              placeholder="Search by company, contact person, or email..."
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
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
          >
            Create New Client
          </button>
        </div>

        <Tab.Group onChange={(index) => setSelectedCountry(countries[index])}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6 overflow-x-auto">
            {countries.map((country) => (
              <Tab
                key={country}
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 min-w-[100px] flex items-center justify-center gap-2
                  ${selected 
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
                  }`
                }
              >
                {({ selected }) => (
                  <>
                    {country}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      selected ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {getCountForCountry(country)}
                    </span>
                  </>
                )}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels>
            {countries.map((country) => (
              <Tab.Panel key={country}>
                <div className="overflow-x-auto">
                  <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          className="w-1/3 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                        <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact Number
                        </th>
                        <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredClients.map((client) => (
                        <tr 
                          key={client.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setSelectedClient(client);
                            setIsModalOpen(true);
                          }}
                        >
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 break-words">
                              {client.client_company}
                              {client.business_unit && ` - ${client.business_unit}`}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 break-words">{client.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 break-words">{client.contact_number}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 break-words">{client.email}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredClients.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      {clients?.length === 0 
                        ? "No B2B clients found for this company."
                        : "No clients match your search criteria."}
                    </div>
                  )}
                </div>
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>

        <ClientDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
          handleUpdate={handleUpdate}
          handleDelete={handleDelete}
          attachments={attachments}
          setAttachments={setAttachments}
          refreshClient={refreshClient}
        />

        {/* Create Modal */}
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
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900"
                    >
                      Create New Client
                    </Dialog.Title>
                    
                    <form onSubmit={handleCreate} className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Company Name</label>
                        <input
                          title="Company Name"
                          placeholder="Enter Company Name"
                          type="text"
                          name="client_company"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          title="Email"
                          placeholder="Enter Email"
                          type="email"
                          name="email"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                        <input
                          title="Contact Number"
                          placeholder="Enter Contact Number"
                          type="text"
                          name="contact_number"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nature</label>
                        <input
                          title="Nature"
                          placeholder="Enter or select Nature"
                          type="text"
                          name="nature"
                          list="natures"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <datalist id="natures">
                          {uniqueNatures.map((nature) => (
                            <option key={nature} value={nature} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Credit Terms</label>
                        <input
                          title="Credit Terms"
                          placeholder="Enter or select Credit Terms"
                          type="text"
                          name="credit_terms"
                          list="creditTerms"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <datalist id="creditTerms">
                          {uniqueCreditTerms.map((term) => (
                            <option key={term} value={term} />
                          ))}
                        </datalist>
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
                        />
                      </div>

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
                          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        >
                          Create
                        </button>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
};

export default Client;
