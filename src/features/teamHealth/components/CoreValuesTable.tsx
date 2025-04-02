import React, { useEffect, useState } from 'react';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { 
  createCoreValue, 
  getCompanyCoreValues, 
  updateCoreValue, 
  deleteCoreValue 
} from '../services/useCoreValues';
import { CoreValueData, CreateCoreValuePayload, UpdateCoreValuePayload } from '../types/coreValue';
import { FiPlus, FiTrash2, FiEdit3, FiCheck, FiX, FiAlertCircle, FiAlertTriangle, FiLock } from 'react-icons/fi';
import { Session } from '@supabase/supabase-js';

interface CoreValuesTableProps {
  session: Session;
}

const CoreValuesTable: React.FC<CoreValuesTableProps> = ({ session }) => {
  const [coreValues, setCoreValues] = useState<CoreValueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newCoreValue, setNewCoreValue] = useState<Partial<CreateCoreValuePayload>>({
    name: '',
    description: ''
  });
  const [editFormData, setEditFormData] = useState<UpdateCoreValuePayload>({});
  const [addingNew, setAddingNew] = useState(false);
  const [isManager, setIsManager] = useState(false);

  const { companyInfo, userInfo, isLoading: userDataLoading } = useUserAndCompanyData(session.user.id);

  // Check if user is a manager
  useEffect(() => {
    if (userInfo) {
      // Check if user role contains 'manager'
      const hasManagerRole = userInfo.role ? 
        userInfo.role.toLowerCase().includes('manager') : false;
      
      console.log('User role check:', {
        role: userInfo.role,
        isManager: hasManagerRole
      });
      
      setIsManager(hasManagerRole);
    }
  }, [userInfo]);

  // Fetch core values when component mounts or company info changes
  useEffect(() => {
    const fetchCoreValues = async () => {
      if (!companyInfo?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await getCompanyCoreValues(companyInfo.id);
        setCoreValues(data);
      } catch (err) {
        console.error('Error fetching core values:', err);
        setError('Failed to load company core values');
      } finally {
        setLoading(false);
      }
    };

    if (!userDataLoading && companyInfo?.id) {
      fetchCoreValues();
    }
  }, [companyInfo?.id, userDataLoading]);

  // Handle creating a new core value
  const handleAddCoreValue = async () => {
    if (!isManager) {
      setError('Only managers can add core values');
      return;
    }

    if (!companyInfo?.id) {
      setError('Company ID is required');
      return;
    }

    if (!newCoreValue.name || !newCoreValue.description) {
      setError('Name and Cultural Definition are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const payload: CreateCoreValuePayload = {
        name: newCoreValue.name,
        description: newCoreValue.description,
        company_id: companyInfo.id
      };
      
      const createdCoreValue = await createCoreValue(payload);
      setCoreValues([...coreValues, createdCoreValue]);
      
      // Reset form
      setNewCoreValue({ name: '', description: '' });
      setAddingNew(false);
    } catch (err) {
      console.error('Error creating core value:', err);
      setError('Failed to create core value');
    } finally {
      setLoading(false);
    }
  };

  // Handle updating a core value
  const handleUpdateCoreValue = async (id: string) => {
    if (!isManager) {
      setError('Only managers can update core values');
      return;
    }

    if (!editFormData.name && !editFormData.description) {
      setEditingId(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const updatedCoreValue = await updateCoreValue(id, editFormData);
      
      setCoreValues(
        coreValues.map(value => 
          value.id === id ? updatedCoreValue : value
        )
      );
      
      setEditingId(null);
      setEditFormData({});
    } catch (err) {
      console.error('Error updating core value:', err);
      setError('Failed to update core value');
    } finally {
      setLoading(false);
    }
  };

  // Initiate delete confirmation for a core value
  const initiateDelete = (id: string) => {
    if (!isManager) {
      setError('Only managers can delete core values');
      return;
    }
    setDeletingId(id);
  };

  // Cancel delete operation
  const cancelDelete = () => {
    setDeletingId(null);
  };

  // Confirm and handle deleting a core value
  const confirmDeleteCoreValue = async (id: string) => {
    if (!isManager) {
      setError('Only managers can delete core values');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await deleteCoreValue(id);
      setCoreValues(coreValues.filter(value => value.id !== id));
      setDeletingId(null);
    } catch (err) {
      console.error('Error deleting core value:', err);
      setError('Failed to delete core value');
    } finally {
      setLoading(false);
    }
  };

  // Start editing a core value
  const handleStartEdit = (coreValue: CoreValueData) => {
    if (!isManager) {
      setError('Only managers can edit core values');
      return;
    }
    setEditingId(coreValue.id);
    setEditFormData({
      name: coreValue.name,
      description: coreValue.description
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  // Handle changes to the edit form
  const handleEditChange = (field: keyof UpdateCoreValuePayload, value: string) => {
    setEditFormData({
      ...editFormData,
      [field]: value
    });
  };

  // Handle changes to the new core value form
  const handleNewValueChange = (field: keyof CreateCoreValuePayload, value: string) => {
    setNewCoreValue({
      ...newCoreValue,
      [field]: value
    });
  };

  // Get the core value name by ID
  const getCoreValueNameById = (id: string): string => {
    const coreValue = coreValues.find(value => value.id === id);
    return coreValue ? coreValue.name : '';
  };

  if (userDataLoading || (loading && coreValues.length === 0)) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-indigo-600 font-medium">Loading core values...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            Core Values
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Define and manage the core values that represent your company culture
          </p>
        </div>
        <div>
          {!isManager && (
            <div className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500">
              <FiLock className="mr-2 h-4 w-4" />
              View-only mode
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 px-6 py-4 my-4 mx-6 rounded-lg border-l-4 border-red-400">
          <div className="flex items-center">
            <FiAlertCircle className="h-5 w-5 text-red-500" />
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="bg-amber-50 px-6 py-4 my-4 mx-6 rounded-lg border-l-4 border-amber-500">
          <div className="flex items-start">
            <FiAlertTriangle className="h-6 w-6 text-amber-500 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm font-medium text-amber-800">
                Are you sure you want to delete the core value "{getCoreValueNameById(deletingId)}"?
              </p>
              <p className="text-sm text-amber-700 mt-1">
                This action cannot be undone. All data associated with this core value will be permanently removed.
              </p>
              <div className="mt-3 flex space-x-3">
                <button
                  onClick={() => confirmDeleteCoreValue(deletingId)}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={cancelDelete}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cultural Definition
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coreValues.map(coreValue => (
              <tr key={coreValue.id} className={`transition-colors ${deletingId === coreValue.id ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                <td className="px-6 py-4 text-center">
                  {editingId === coreValue.id ? (
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-center"
                      value={editFormData.name}
                      onChange={(e) => handleEditChange('name', e.target.value)}
                      placeholder="Core value name"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{coreValue.name}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {editingId === coreValue.id ? (
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-center"
                      value={editFormData.description}
                      onChange={(e) => handleEditChange('description', e.target.value)}
                      placeholder="Define what this value means for your culture"
                    />
                  ) : (
                    <div className="text-sm text-gray-700">{coreValue.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {editingId === coreValue.id ? (
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={() => handleUpdateCoreValue(coreValue.id)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Save"
                      >
                        <FiCheck className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        title="Cancel"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center space-x-3">
                      {isManager ? (
                        <>
                          <button
                            onClick={() => handleStartEdit(coreValue)}
                            disabled={deletingId !== null}
                            className={`text-indigo-600 hover:text-indigo-800 transition-colors ${deletingId !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Edit"
                          >
                            <FiEdit3 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => initiateDelete(coreValue.id)}
                            disabled={deletingId !== null}
                            className={`text-red-500 hover:text-red-700 transition-colors ${deletingId !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Delete"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400 text-sm italic">No actions available</span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {/* Add new core value row */}
            {addingNew && (
              <tr className="bg-gray-50 border-t border-gray-100">
                <td className="px-6 py-4 text-center">
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-center"
                    value={newCoreValue.name || ''}
                    onChange={(e) => handleNewValueChange('name', e.target.value)}
                    placeholder="Core value name"
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-center"
                    value={newCoreValue.description || ''}
                    onChange={(e) => handleNewValueChange('description', e.target.value)}
                    placeholder="Define what this value means for your culture"
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={handleAddCoreValue}
                      className="text-green-600 hover:text-green-800 transition-colors"
                      title="Save"
                      disabled={deletingId !== null}
                    >
                      <FiCheck className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setAddingNew(false);
                        setNewCoreValue({ name: '', description: '' });
                      }}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                      title="Cancel"
                      disabled={deletingId !== null}
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add button */}
      {!addingNew && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          {isManager ? (
            <button
              type="button"
              onClick={() => setAddingNew(true)}
              disabled={deletingId !== null}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ${deletingId !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FiPlus className="-ml-1 mr-2 h-4 w-4" />
              Add Core Value
            </button>
          ) : (
            <p className="text-sm text-gray-500 italic">Only managers can add or modify core values</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CoreValuesTable;
