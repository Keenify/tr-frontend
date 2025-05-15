import React from 'react';
import { Session } from '@supabase/supabase-js';
import ScoreboardManager from './ScoreboardManager';

interface ScoreboardManagerModalProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
}

const ScoreboardManagerModal: React.FC<ScoreboardManagerModalProps> = ({ session, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex">
      <div className="relative p-4 bg-white w-full max-w-6xl mx-auto my-8 rounded-lg shadow-xl overflow-hidden">
        <div className="flex justify-between items-center pb-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Manage Employee Pop Coins</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto py-4">
          <ScoreboardManager session={session} />
        </div>
      </div>
    </div>
  );
};

export default ScoreboardManagerModal; 