import React, { useState, useEffect, useCallback } from 'react';
import { TheRockData } from '../types/theRocks';
import { getCompanyTheRocks, deleteTheRock } from '../services/useTheRocks';
import toast from 'react-hot-toast';
import { Edit2, Trash2 } from 'react-feather';
import '../styles/CompanyRocksTable.css';
import CompanyRocksModal from './CompanyRocksModal';

interface CompanyRocksTableProps {
  companyId: string;
}

const CompanyRocksTable: React.FC<CompanyRocksTableProps> = ({ companyId }) => {
  const [rocks, setRocks] = useState<TheRockData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRock, setEditingRock] = useState<TheRockData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleEdit = (rock: TheRockData, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingRock({ ...rock });
    setIsModalOpen(true);
  };

  const handleDelete = async (rockId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
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
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRock(null);
  }

  const getStatusColor = (status: 'red' | 'orange' | 'green' | null) => {
    if (status === 'green') return 'bg-green-500';
    if (status === 'orange') return 'bg-yellow-500';
    if (status === 'red') return 'bg-red-500';
    return 'bg-gray-300';
  };

  const renderTextWithNewlines = (text: string) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Company Rocks</h2>
        <button onClick={openModal} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
          Add Company Rock
        </button>
      </div>

      <CompanyRocksModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        companyId={companyId}
        editingRock={editingRock}
        onSaveSuccess={fetchRocks}
      />

      {isLoading && !isModalOpen && <p>Loading company rocks...</p>} 

      <div className="shadow overflow-x-auto border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[5%]">#</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[17%]">Title</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[30%]">Description</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[17%]">Link to Higher Priorities</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[26%]">Success Criteria</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[5%]">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rocks.map((rock, index) => (
              <tr key={rock.id} className="group hover:bg-gray-50 transition-colors duration-150 relative">
                <td className="px-6 py-4 text-sm font-medium text-gray-500 text-center">{index + 1}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 break-words">{renderTextWithNewlines(rock.title)}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-pre-wrap break-words">{renderTextWithNewlines(rock.rock_description)}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-pre-wrap break-words">{renderTextWithNewlines(rock.link_to_higher_level_priorities)}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-pre-wrap break-words">{renderTextWithNewlines(rock.success_criteria)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <div className="flex items-center justify-center">
                    <div 
                      className={`w-6 h-6 rounded-full ${getStatusColor(rock.success_status)}`}
                      title={rock.success_status ? rock.success_status.charAt(0).toUpperCase() + rock.success_status.slice(1) : 'Not Set'}
                    ></div>
                  </div>
                </td>
                <div className="company-rock-actions">
                  <button 
                    onClick={(e) => handleEdit(rock, e)} 
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Edit Rock"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(rock.id, e)} 
                    className="text-red-600 hover:text-red-900"
                    title="Delete Rock"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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