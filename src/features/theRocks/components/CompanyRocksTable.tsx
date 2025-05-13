import React, { useState, useEffect, useCallback } from 'react';
import { TheRockData, CreateTheRockPayload, UpdateTheRockPayload } from '../types/theRocks';
import { createTheRock, getCompanyTheRocks, updateTheRock, deleteTheRock } from '../services/useTheRocks';
import toast from 'react-hot-toast';

interface CompanyRocksTableProps {
  companyId: string;
}

const CompanyRocksTable: React.FC<CompanyRocksTableProps> = ({ companyId }) => {
  const [rocks, setRocks] = useState<TheRockData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRock, setEditingRock] = useState<TheRockData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newRockData, setNewRockData] = useState<CreateTheRockPayload>({
    title: '',
    rock_description: '',
    link_to_higher_level_priorities: '',
    success_criteria: '',
    success_status: null,
  });

  const fetchRocks = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCompanyTheRocks(companyId);
      const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateA - dateB;
      });
      setRocks(sortedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch company rocks');
      toast.error(err instanceof Error ? err.message : 'Failed to fetch company rocks');
    }
    setIsLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchRocks();
  }, [fetchRocks]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'success_status' && value === '' ? null : value;
    if (editingRock) {
      setEditingRock(prev => prev ? { ...prev, [name]: finalValue } as TheRockData : null);
    } else {
      setNewRockData(prev => ({ ...prev, [name]: finalValue }));
    }
  };

  const resetNewRockData = () => {
    setNewRockData({
      title: '',
      rock_description: '',
      link_to_higher_level_priorities: '',
      success_criteria: '',
      success_status: null,
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingRock) {
        const payload: UpdateTheRockPayload = {
            title: editingRock.title,
            rock_description: editingRock.rock_description,
            link_to_higher_level_priorities: editingRock.link_to_higher_level_priorities,
            success_criteria: editingRock.success_criteria,
            success_status: editingRock.success_status,
        };
        await updateTheRock(editingRock.id, companyId, payload);
        toast.success('Company Rock updated successfully!');
      } else {
        await createTheRock(companyId, newRockData);
        toast.success('Company Rock created successfully!');
      }
      fetchRocks();
      closeModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save company rock');
    }
    setIsLoading(false);
  };

  const handleEdit = (rock: TheRockData) => {
    setEditingRock({ ...rock });
    setIsModalOpen(true);
  };

  const handleDelete = async (rockId: string) => {
    if (window.confirm('Are you sure you want to delete this rock?')) {
      setIsLoading(true);
      try {
        await deleteTheRock(rockId, companyId);
        toast.success('Company Rock deleted successfully!');
        fetchRocks();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete company rock');
      }
      setIsLoading(false);
    }
  };

  const openModal = () => {
    setEditingRock(null);
    resetNewRockData();
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRock(null);
    resetNewRockData();
  }

  const renderTextWithNewlines = (text: string) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
        <input type="text" name="title" id="title" required value={editingRock?.title ?? newRockData.title} onChange={handleInputChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
      </div>
      <div>
        <label htmlFor="rock_description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea name="rock_description" id="rock_description" rows={3} required value={editingRock?.rock_description ?? newRockData.rock_description} onChange={handleInputChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"></textarea>
      </div>
      <div>
        <label htmlFor="link_to_higher_level_priorities" className="block text-sm font-medium text-gray-700">Link to Higher Level Priorities</label>
        <input type="text" name="link_to_higher_level_priorities" id="link_to_higher_level_priorities" required value={editingRock?.link_to_higher_level_priorities ?? newRockData.link_to_higher_level_priorities} onChange={handleInputChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
      </div>
      <div>
        <label htmlFor="success_criteria" className="block text-sm font-medium text-gray-700">Success Criteria</label>
        <textarea name="success_criteria" id="success_criteria" rows={2} required value={editingRock?.success_criteria ?? newRockData.success_criteria} onChange={handleInputChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"></textarea>
      </div>
      <div>
        <label htmlFor="success_status" className="block text-sm font-medium text-gray-700">Success Status</label>
        <select name="success_status" id="success_status" value={editingRock?.success_status ?? newRockData.success_status ?? ''} onChange={handleInputChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">
          <option value="">Not Set</option>
          <option value="green">Green</option>
          <option value="orange">Orange</option>
          <option value="red">Red</option>
        </select>
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50">
          {isLoading ? (editingRock ? 'Updating...' : 'Creating...') : (editingRock ? 'Update Rock' : 'Create Rock')}
        </button>
      </div>
    </form>
  );

  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Company Rocks</h2>
        <button onClick={openModal} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
          Add Company Rock
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {editingRock ? 'Edit Company Rock' : 'Add New Company Rock'}
            </h3>
            {renderForm()}
          </div>
        </div>
      )}

      {isLoading && !isModalOpen && <p>Loading company rocks...</p>} 

      <div className="shadow overflow-x-auto border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[5%]">#</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Title</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[25%]">Description</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Link to Higher Priorities</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[25%]">Success Criteria</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[5%]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rocks.map((rock, index) => (
              <tr key={rock.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-500 text-center">{index + 1}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 break-words">{renderTextWithNewlines(rock.title)}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-pre-wrap break-words">{renderTextWithNewlines(rock.rock_description)}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-pre-wrap break-words">{renderTextWithNewlines(rock.link_to_higher_level_priorities)}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-pre-wrap break-words">{renderTextWithNewlines(rock.success_criteria)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span 
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${rock.success_status === 'green' ? 'bg-green-100 text-green-800' : 
                        rock.success_status === 'orange' ? 'bg-yellow-100 text-yellow-800' : 
                        rock.success_status === 'red' ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'}
                    `}
                  >
                    {rock.success_status ? rock.success_status.charAt(0).toUpperCase() + rock.success_status.slice(1) : 'Not Set'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => handleEdit(rock)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                  <button onClick={() => handleDelete(rock.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
            {rocks.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  No company rocks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyRocksTable; 