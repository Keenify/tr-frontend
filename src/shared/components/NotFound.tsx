import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * NotFound component renders a 404 error page with a message and a button
 * to navigate back to the previous page.
 * 
 * This component is used as a fallback for routes that do not match any
 * defined paths in the application.
 * 
 * @returns {JSX.Element} A React component that displays a 404 error message.
 */
const NotFound: React.FC = () => {
  const navigate = useNavigate();

  /**
   * Handles the "Go Back" button click event by navigating back to the previous page.
   */
  const handleGoBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

  return (
    <div className="text-center mt-12">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-xl">Normally we're good with instructions but this page needs some work!</p>
      <p className="mt-2 text-lg">We've been notified, just press the button below to go back to where you were.</p>
      <button 
        onClick={handleGoBack} 
        className="mt-8 px-6 py-3 bg-blue-500 text-white text-lg rounded hover:bg-blue-600 transition duration-300"
      >
        Go Back
      </button>
    </div>
  );
};

export default NotFound;
