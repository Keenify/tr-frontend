import { Session } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
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

interface PasswordProps {
  session: Session;
}

const Password: React.FC<PasswordProps> = ({ session }) => {
  const [passwords, setPasswords] = useState<PasswordData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { companyInfo, isLoading: isLoadingCompany } = useUserAndCompanyData(session.user.id);
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

  // Fetch passwords
  useEffect(() => {
    const fetchPasswords = async () => {
      if (!companyInfo?.id) return;
      try {
        setIsLoading(true);
        const data = await getCompanyPasswords(companyInfo.id);
        setPasswords(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load passwords');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPasswords();
  }, [companyInfo?.id]);

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
    });
  };

  const handleSave = async () => {
    try {
      if (isEditing) {
        const updateData: UpdatePasswordPayload = {
          name: newPassword.name || '',
          username: newPassword.username || '',
          url: newPassword.url ? (newPassword.url.match(/^https?:\/\//) ? newPassword.url : `https://${newPassword.url}`) : '',
          notes: newPassword.notes || '',
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

  const renderEditableRow = (password: Partial<PasswordData & { password?: string }>) => (
    <tr className="bg-white hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <input
          type="text"
          value={password.name || ''}
          onChange={e => setNewPassword(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500 rounded-lg transition-all duration-200 focus:bg-white focus:outline-none"
          placeholder="Name"
        />
      </td>
      <td className="px-6 py-4">
        <input
          type="text"
          value={password.username || ''}
          onChange={e => setNewPassword(prev => ({ ...prev, username: e.target.value }))}
          className="w-full px-3 py-2 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500 rounded-lg transition-all duration-200 focus:bg-white focus:outline-none"
          placeholder="Username"
        />
      </td>
      <td className="px-6 py-4">
        <input
          type="password"
          value={password.password || ''}
          onChange={e => setNewPassword(prev => ({ ...prev, password: e.target.value }))}
          className="w-full px-3 py-2 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500 rounded-lg transition-all duration-200 focus:bg-white focus:outline-none"
          placeholder={isEditing ? "Leave empty to keep existing password" : "Password"}
        />
      </td>
      <td className="px-6 py-4">
        <input
          type="text"
          value={password.url || ''}
          onChange={e => setNewPassword(prev => ({ ...prev, url: e.target.value }))}
          className="w-full px-3 py-2 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500 rounded-lg transition-all duration-200 focus:bg-white focus:outline-none"
          placeholder="URL"
        />
      </td>
      <td className="px-6 py-4">
        <input
          type="text"
          value={password.notes || ''}
          onChange={e => setNewPassword(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full px-3 py-2 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500 rounded-lg transition-all duration-200 focus:bg-white focus:outline-none"
          placeholder="Notes"
        />
      </td>
      <td className="px-6 py-4">
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            className="text-green-600 hover:text-green-800 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );

  const renderTableBody = () => (
    <tbody className="divide-y divide-gray-200">
      {!isEditing && renderEditableRow(newPassword)}
      {passwords.map((password) => (
        <tr key={password.id}>
          {isEditing === password.id ? (
            <>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={newPassword.name || ''}
                  onChange={e => setNewPassword(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500 rounded-lg transition-all duration-200 focus:bg-white focus:outline-none"
                  placeholder="Name"
                />
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={newPassword.username || ''}
                  onChange={e => setNewPassword(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500 rounded-lg transition-all duration-200 focus:bg-white focus:outline-none"
                  placeholder="Username"
                />
              </td>
              <td className="px-6 py-4">
                <input
                  type="password"
                  value={newPassword.password || ''}
                  onChange={e => setNewPassword(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500 rounded-lg transition-all duration-200 focus:bg-white focus:outline-none"
                  placeholder="Leave empty to keep existing password"
                />
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={newPassword.url || ''}
                  onChange={e => setNewPassword(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500 rounded-lg transition-all duration-200 focus:bg-white focus:outline-none"
                  placeholder="URL"
                />
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={newPassword.notes || ''}
                  onChange={e => setNewPassword(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500 rounded-lg transition-all duration-200 focus:bg-white focus:outline-none"
                  placeholder="Notes"
                />
              </td>
              <td className="px-6 py-4">
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="text-green-600 hover:text-green-800 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </td>
            </>
          ) : (
            <>
              <td className="px-6 py-4 whitespace-nowrap">{password.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{password.username}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center justify-between">
                  <div className="font-mono min-w-[120px]">
                    {decryptedPasswords[password.id] || '•••••••'}
                  </div>
                  <div className="flex items-center gap-2">
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
              <td className="px-6 py-4">
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
              <td className="px-6 py-4">{password.notes}</td>
              <td className="px-6 py-4">
                <div className="flex space-x-2">
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
              </td>
            </>
          )}
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
        {companyInfo?.name && (
          <span className="text-lg text-gray-600">{companyInfo.name}</span>
        )}
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

      <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-6 py-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-[15%]">Name</th>
              <th className="px-6 py-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-[15%]">Username</th>
              <th className="px-6 py-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-[25%]">Password</th>
              <th className="px-6 py-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-[20%]">URL</th>
              <th className="px-6 py-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-[15%]">Notes</th>
              <th className="px-6 py-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-[10%]">Actions</th>
            </tr>
          </thead>
          {renderTableBody()}
        </table>
      </div>

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
    </div>
  );
};

export default Password; 