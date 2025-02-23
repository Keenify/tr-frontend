import React, { useState } from "react";
import { useUserAndCompanyData } from "../../../../shared/hooks/useUserAndCompanyData";
import { useQuery } from "@tanstack/react-query";
import { getCompanyB2BClients } from "../services/useB2BClients";
import { ClipLoader } from "react-spinners";
import { Session } from "@supabase/supabase-js";

interface ClientProps {
  session: Session;
}

const Client: React.FC<ClientProps> = ({ session }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { companyInfo, isLoading: isLoadingCompanyData } = useUserAndCompanyData(session.user.id);

  const {
    data: clients,
    isLoading: isLoadingClients,
    error,
  } = useQuery({
    queryKey: ['b2bClients', companyInfo?.id],
    queryFn: () => companyInfo?.id ? getCompanyB2BClients(companyInfo.id) : Promise.resolve([]),
    enabled: !!companyInfo?.id,
  });

  // Filter clients based on search term with null checks
  const filteredClients = clients?.filter((client) => {
    const searchString = searchTerm.toLowerCase();
    return (
      (client.client_company?.toLowerCase() || '').includes(searchString) ||
      (client.name?.toLowerCase() || '').includes(searchString) ||
      (client.email?.toLowerCase() || '').includes(searchString)
    );
  });

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
    <div className="min-h-screen p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">B2B Clients</h1>
        <p className="text-gray-600">Company: {companyInfo?.name}</p>
      </div>

      {/* Search Box */}
      <div className="mb-4">
        <div className="relative">
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
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Person
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClients?.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {client.client_company}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{client.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{client.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{client.contact_number}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredClients?.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            {clients?.length === 0 
              ? "No B2B clients found for this company."
              : "No clients match your search criteria."}
          </div>
        )}
      </div>
    </div>
  );
};

export default Client;
