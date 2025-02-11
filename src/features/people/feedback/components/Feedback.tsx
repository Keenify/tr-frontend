import { Session } from '@supabase/supabase-js';
import Modal from 'react-modal';
import { useState } from 'react';
import { useSession } from '../../../../shared/hooks/useSession';
import { useNavigate } from 'react-router-dom';
import { useUserAndCompanyData } from '../../../../shared/hooks/useUserAndCompanyData';

const Feedback = ({ session }: { session: Session }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { signOut } = useSession();
  const navigate = useNavigate();
  const { companyInfo } = useUserAndCompanyData(session.user.id);

  const handleFeedbackClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    localStorage.setItem('feedback_user_id', session.user.id);
    if (companyInfo?.id) {
      localStorage.setItem('feedback_company_id', companyInfo.id);
    }
    await signOut();
    window.open('/anonymous_feedback', '_blank');
    navigate('/login');
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      <div className="max-w-md w-full p-8 bg-gray-900/80 backdrop-blur-sm rounded-xl 
                    border border-green-500/20 shadow-2xl shadow-green-500/10">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-green-400 tracking-wider">Anonymous Feedback</h2>
          <p className="text-gray-400 mb-6">
            Share your thoughts and suggestions anonymously to help improve our workplace.
          </p>
          <button
            title="Open Anonymous Feedback Form"
            onClick={handleFeedbackClick}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold 
                     py-3 px-6 rounded-lg transition duration-200 border border-green-500
                     shadow-lg shadow-green-500/20 w-full"
          >
            Open Anonymous Feedback Form
          </button>
        </div>

        <Modal
          isOpen={isModalOpen}
          onRequestClose={handleCancel}
          className="fixed inset-0 flex items-center justify-center"
          overlayClassName="fixed inset-0 bg-black/90 backdrop-blur-sm"
          style={{
            content: {
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#0a0a0a',
              borderRadius: '0.75rem',
              padding: '1rem',
              width: '90%',
              maxWidth: '400px',
              border: '1px solid #2f2f2f',
              boxShadow: '0 0 20px rgba(34, 197, 94, 0.1)',
              overflow: 'hidden',
              height: 'auto',
              maxHeight: 'fit-content'
            }
          }}
        >
          <div className="bg-gray-900/80 rounded-lg p-3 border border-green-500/20">
            <h3 className="text-lg font-semibold mb-2 text-green-400 text-center">Confirm Submission</h3>
            <p className="text-gray-400 mb-3 text-center text-sm">
              Once you click "Yes, Logout", you'll be logged out and a new tab will open for your anonymous feedback. 
              Please proceed with your feedback in the new tab.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-1.5 text-gray-400 hover:text-gray-200 border border-gray-700 
                         rounded-lg transition duration-200 hover:border-gray-600 min-w-[100px]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold 
                         rounded-lg transition duration-200 border border-green-500 min-w-[100px]"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Feedback;
