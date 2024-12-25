/**
 * CreateSubjectModal component allows users to create new training subjects.
 * 
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls visibility of the modal
 * @param {Function} props.onClose - Callback function to close the modal
 * @param {Function} props.onSubmit - Callback function called with subject data on form submission
 * @param {Session} props.session - Session object
 * @returns {React.ReactElement | null} Returns the modal UI when open, null when closed
 * 
 * @example
 * ```tsx
 * <CreateSubjectModal 
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSubmit={(data) => handleCreateSubject(data)}
 *   session={session}
 * />
 * ```
 */

import React, { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { getUserData } from '../../../../../../services/userService';
import { createDocument } from '../../../../../../services/docService';

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; type: 'Company' | 'Policies' | 'Processes' }) => void;
  session: Session;
}

const CreateSubjectModal: React.FC<CreateSubjectModalProps> = ({ isOpen, onClose, onSubmit, session }) => {
  const [subjectName, setSubjectName] = useState('');
  const [selectedType, setSelectedType] = useState<'Company' | 'Policies' | 'Processes' | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (subjectName && selectedType) {
      try {
        const userData = await getUserData(session.user.id);
        const documentData = await createDocument(subjectName, 'draft', userData.id);

        console.log('Success:', documentData);

        onSubmit({ name: subjectName, type: selectedType });
        setSubjectName('');
        setSelectedType(null);
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create subject</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <p className="text-gray-600 mb-4">
          Create a new subject for your Content section. Once published, you'll
          be able to add individuals or groups to complete your training and
          track their completions!
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="Enter subject name"
            className="w-full p-2 border rounded-lg"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What kind of training is this? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-4">
            {['Company', 'Policies', 'Processes'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type as typeof selectedType)}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${
                  selectedType === type ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                }`}
              >
                <span>{type === 'Company' ? '📄' : type === 'Policies' ? '📝' : '📊'}</span>
                <span>{type}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!subjectName || !selectedType}
            className={`px-4 py-2 rounded-lg text-white ${
              !subjectName || !selectedType
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            Create subject
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateSubjectModal;
