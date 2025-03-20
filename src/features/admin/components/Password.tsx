import { Session } from "@supabase/supabase-js";
import React, { useEffect, useState, useMemo } from "react";
import { useUserAndCompanyData } from "../../../shared/hooks/useUserAndCompanyData";
import { 
  getCompanyPasswords, 
  createPassword, 
  updatePassword, 
  deletePassword,
  getDecryptedPassword 
} from '../services/usePassword';
import { CreatePasswordPayload, PasswordData, UpdatePasswordPayload } from '../types/password';
import { EyeIcon, EyeSlashIcon, PencilIcon, TrashIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/solid';
import { Tab } from '@headlessui/react';
import EditPasswordModal from './EditPasswordModal';

interface PasswordProps {
  session: Session;
}

const Password: React.FC<PasswordProps> = ({ session }) => {
  const [passwords, setPasswords] = useState<PasswordData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { companyInfo, isLoading: isLoadingCompany, userInfo } = useUserAndCompanyData(session.user.id);
  const [decryptedPasswords, setDecryptedPasswords] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<Partial<PasswordData & { password?: string }>>({
    name: '',
    username: '',
    password: '',
    url: '',
    notes: '',
  });
  const [passwordToDelete, setPasswordToDelete] = useState<PasswordData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const isManager = userInfo?.role === 'manager';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const AVAILABLE_COUNTRIES = ['SG', 'MY'];
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch passwords
  useEffect(() => {
    const fetchPasswords = async () => {
      if (!companyInfo?.id) return;
      try {
        setIsLoading(true);
        const data = await getCompanyPasswords(companyInfo.id);
        setPasswords(data);
        
        // Extract unique countries from passwords
        const uniqueCountries = Array.from(new Set(data.map(p => p.country || 'Uncategorized')));
        setCountries(['All', ...uniqueCountries]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load passwords');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPasswords();
  }, [companyInfo?.id]);

  // Filter passwords based on selected country
  const filteredPasswords = useMemo(() => {
    let filtered = passwords;
    
    // Filter by country
    if (selectedCountry !== 'All') {
      filtered = filtered.filter(p => p.country === selectedCountry);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.username.toLowerCase().includes(query) ||
        p.url?.toLowerCase().includes(query) ||
        p.notes?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [passwords, selectedCountry, searchQuery]);

  const handleTogglePassword = async (passwordId: string) => {
    try {
      if (decryptedPasswords[passwordId]) {
        setDecryptedPasswords(prev => {
          const newState = { ...prev };
          delete newState[passwordId];
          return newState;
        });
      } else {
        const decryptedPassword = await getDecryptedPassword(passwordId);
        setDecryptedPasswords(prev => ({
          ...prev,
          [passwordId]: decryptedPassword
        }));
      }
    } catch (error) {
      console.error('Failed to decrypt password:', error);
      setError('Failed to decrypt password');
    }
  };

  const handleDelete = async (password: PasswordData) => {
    setPasswordToDelete(password);
  };

  const confirmDelete = async () => {
    if (!passwordToDelete) return;
    
    try {
      await deletePassword(passwordToDelete.id);
      setPasswords(prev => prev.filter(p => p.id !== passwordToDelete.id));
      setPasswordToDelete(null);
    } catch (error) {
      console.error('Failed to delete password:', error);
      setError('Failed to delete password');
    }
  };

  const handleEdit = async (password: PasswordData) => {
    setIsEditing(password.id);
    setNewPassword({
      name: password.name,
      username: password.username,
      url: password.url,
      notes: password.notes,
      country: password.country,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (isEditing) {
        const updateData: UpdatePasswordPayload = {
          name: newPassword.name || '',
          username: newPassword.username || '',
          url: newPassword.url ? (newPassword.url.match(/^https?:\/\//) ? newPassword.url : `https://${newPassword.url}`) : '',
          notes: newPassword.notes || '',
          country: newPassword.country || '',
        };
        
        if (newPassword.password && newPassword.password.trim() !== '') {
          updateData.password = newPassword.password;
        }

        console.log('Updating password with data:', updateData);
        const updated = await updatePassword(isEditing, updateData);
        console.log('Password update response:', updated);
        
        setPasswords(prev => prev.map(p => p.id === isEditing ? updated : p));
      } else {
        if (!companyInfo?.id || !newPassword.name || !newPassword.username || !newPassword.password) return;
        const created = await createPassword({
          ...newPassword,
          url: newPassword.url ? (newPassword.url.match(/^https?:\/\//) ? newPassword.url : `https://${newPassword.url}`) : '',
          company_id: companyInfo.id,
          country: newPassword.country || '',
        } as CreatePasswordPayload);
        setPasswords(prev => [...prev, created]);
      }
      setIsEditing(null);
      setNewPassword({
        name: '',
        username: '',
        password: '',
        url: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error in handleSave:', error);
      setError(error instanceof Error ? error.message : 'Failed to save password');
    }
  };

  const handleCancel = () => {
    setIsEditing(null);
    setNewPassword({
      name: '',
      username: '',
      password: '',
      url: '',
      notes: '',
    });
    setIsModalOpen(false);
  };

  const handleCopyPassword = async (passwordId: string, password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedId(passwordId);
      setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy password:', error);
      setError('Failed to copy password to clipboard');
    }
  };

  const handleNewPassword = () => {
    setNewPassword({
      name: '',
      username: '',
      password: '',
      url: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const getCountForCountry = (country: string) => {
    if (country === 'All') {
      return passwords.length;
    }
    return passwords.filter(p => p.country === country).length;
  };

  const renderTableBody = () => (
    <tbody className="divide-y divide-gray-200">
      {filteredPasswords.map((password) => (
        <tr key={password.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 break-words text-center">{password.name}</td>
          <td className="px-6 py-4 break-words text-center">{password.username}</td>
          <td className="px-6 py-4 break-words text-center">
            {password.url && (
              <a 
                href={password.url.startsWith('https://') ? password.url : `https://${password.url}`}
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-800"
              >
                {password.url}
              </a>
            )}
          </td>
          <td className="px-6 py-4 text-center">
            <div className="flex items-center justify-center">
              <div className="font-mono break-words">
                {decryptedPasswords[password.id] || '•••••••'}
              </div>
              <div className="flex items-center gap-2 ml-2">
                {decryptedPasswords[password.id] && (
                  <button
                    onClick={() => handleCopyPassword(password.id, decryptedPasswords[password.id])}
                    className="text-gray-600 hover:text-gray-900 flex-shrink-0"
                    title="Copy password"
                  >
                    {copiedId === password.id ? (
                      <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <ClipboardIcon className="h-5 w-5" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleTogglePassword(password.id)}
                  className="text-gray-600 hover:text-gray-900 flex-shrink-0"
                  title={decryptedPasswords[password.id] ? "Hide password" : "Show password"}
                >
                  {decryptedPasswords[password.id] ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 break-words text-center">{password.notes}</td>
          <td className="px-6 py-4 break-words text-center">{password.country}</td>
          <td className="px-6 py-4 text-center">
            {isManager && (
              <div className="flex space-x-2 justify-center">
                <button 
                  onClick={() => handleEdit(password)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit password"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => handleDelete(password)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete password"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  );

  if (isLoading || isLoadingCompany) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Password Management</h1>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all duration-200"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          {isManager && (
            <button
              onClick={handleNewPassword}
              className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>New Password</span>
            </button>
          )}
          {companyInfo?.name && (
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
              {companyInfo.name}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button 
            className="float-right font-bold"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

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
              <div className="overflow-y-auto overflow-x-hidden rounded-lg shadow-sm border border-gray-200 max-w-full">
                <table className="w-full bg-white table-fixed">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className="w-[15%] px-6 py-4 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Name</th>
                      <th className="w-[15%] px-6 py-4 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Username</th>
                      <th className="w-[20%] px-6 py-4 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">URL</th>
                      <th className="w-[20%] px-6 py-4 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Password</th>
                      <th className="w-[15%] px-6 py-4 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Notes</th>
                      <th className="w-[7%] px-6 py-4 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Country</th>
                      <th className="w-[8%] px-6 py-4 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Actions</th>
                    </tr>
                  </thead>
                  {renderTableBody()}
                </table>
              </div>
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>

      {passwordToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-6">
              Are you sure you want to delete the password for "{passwordToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setPasswordToDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <EditPasswordModal
        isOpen={isModalOpen}
        onClose={handleCancel}
        onSave={handleSave}
        password={newPassword}
        setPassword={setNewPassword}
        isNew={!isEditing}
        AVAILABLE_COUNTRIES={AVAILABLE_COUNTRIES}
      />
    </div>
  );
};

export default Password; 