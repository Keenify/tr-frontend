import { useState } from 'react';
import { AddTeammateModal } from './modals/AddTeammateModal';

interface AddTeammateButtonProps {
  companyId: string;
  onTeammateAdded: () => void;
}

export const AddTeammateButton = ({ companyId, onTeammateAdded }: AddTeammateButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        onClick={() => setIsModalOpen(true)}
      >
        Add teammate
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="relative z-50">
            <AddTeammateModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSuccess={onTeammateAdded}
              companyId={companyId}
            />
          </div>
        </div>
      )}
    </>
  );
}; 