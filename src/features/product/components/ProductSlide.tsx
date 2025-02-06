import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Session } from '@supabase/supabase-js';

interface ProductSlideProps {
  session: Session;
}

interface GoogleSlide {
  id: string;
  name: string;
  thumbnailLink?: string;
}

// Constants
const FOLDER_ID = '1NkyydB8lFWWPMZZeKfvYU7_6JnVocoGm';

const ProductSlide: React.FC<ProductSlideProps> = ({ session }) => {
  const [slides, setSlides] = useState<GoogleSlide[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Session in ProductSlide:', session);

    const fetchSlides = async () => {
      try {
        const response = await axios.get(
          `https://www.googleapis.com/drive/v3/files`,
          {
            params: {
              q: `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.presentation'`,
              key: import.meta.env.VITE_GOOGLE_DRIVE_API_KEY,
              fields: 'files(id, name, thumbnailLink)',
              supportsAllDrives: true,
            },
          }
        );
        
        // Simply use the slides data without modifying thumbnailLinks
        setSlides(response.data.files);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching Google Slides:', error);
        setError('Failed to load slides. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchSlides();
  }, [session]);

  const handleCreateNewSlide = () => {
    window.open(`https://docs.google.com/presentation/create?usp=drive_web&folder=${FOLDER_ID}`, '_blank');
  };

  return (
    <div className="w-full py-4">
      {error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : isLoading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4"> 
          {slides.map((slide) => (
            <div 
              key={slide.id} 
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 aspect-[4/3] relative"
            >
              <a
                href={`https://docs.google.com/presentation/d/${slide.id}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 h-full"
              >
                <div className="h-3/4 mb-3 overflow-hidden rounded-md bg-gray-100">
                  {slide.thumbnailLink ? (
                    <img 
                      src={slide.thumbnailLink} 
                      alt={`Thumbnail of ${slide.name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error(`Error loading thumbnail for ${slide.name}:`, e);
                        // Fallback to placeholder on error
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://drive.google.com/thumbnail?id=${slide.id}&sz=w800`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center text-blue-600 hover:text-blue-800">
                  <span className="font-medium truncate text-lg px-1 text-center">{slide.name}</span>
                </div>
              </a>
            </div>
          ))}
          
          {/* Create New Slide Button */}
          <div 
            onClick={handleCreateNewSlide}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer aspect-[4/3]"
          >
            <div className="p-4 h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-lg">
              <svg 
                className="w-16 h-16 text-gray-400 mb-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 4v16m8-8H4" 
                />
              </svg>
              <span className="text-gray-600 font-medium">Create New Slide</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSlide;


