import { Session } from '@supabase/supabase-js';
import { useState } from 'react';

const Feedback = ({ session }: { session: Session }) => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you can send the feedback along with the session.user.email to your backend
    console.log('Feedback:', feedback, 'From:', session.user.email);
    
    // Reset form and show success message
    setFeedback('');
    setIsSubmitted(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">
          Anonymous Feedback Box
        </h1>
        <p className="text-gray-400 mb-6">
          Share your thoughts, concerns, or suggestions about the company or team members. 
          Your feedback will be submitted anonymously to help improve our workplace.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full h-40 px-4 py-3 bg-gray-700 text-gray-100 rounded-lg 
                     border border-gray-600 focus:outline-none focus:border-blue-500
                     placeholder-gray-500"
            placeholder="Enter your feedback here..."
            required
          />
          
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold 
                     py-3 px-6 rounded-lg transition duration-200"
          >
            Submit Anonymous Feedback
          </button>
        </form>

        {isSubmitted && (
          <div className="mt-4 p-4 bg-green-900 text-green-100 rounded-lg">
            Your feedback has been submitted anonymously. Thank you for your input!
          </div>
        )}
      </div>
    </div>
  );
};

export default Feedback;
