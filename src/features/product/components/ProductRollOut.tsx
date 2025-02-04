import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import SlideViewer from './SlideViewer';

interface ProductRollOutProps {
  session: Session;
}

interface Slide {
  id: number;
  title: string;
  content: string;
}

/**
 * ProductRollOut Component
 * 
 * Main container component for the product slides feature.
 * Handles:
 * - Displaying grid of all slides
 * - Creating new slides
 * - Managing slide state in localStorage
 * - Opening slides in viewer mode
 * 
 * Flow:
 * 1. Click "+" button -> Opens new slide in SlideEditorPage (new window)
 * 2. Click existing slide -> Opens SlideViewer (modal)
 * 3. Click edit in viewer -> Opens SlideEditorPage (new window)
 */
const ProductRollOut: React.FC<ProductRollOutProps> = ({ session }) => {
  const [slides, setSlides] = useState<Slide[]>(() => {
    const savedSlides = localStorage.getItem('slides');
    return savedSlides ? JSON.parse(savedSlides) : [];
  });
  const [viewingSlide, setViewingSlide] = useState<Slide | null>(null);

  // Add storage event listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'slidesLastUpdated') {
        const savedSlides = localStorage.getItem('slides');
        if (savedSlides) {
          setSlides(JSON.parse(savedSlides));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  console.log(session);

  // Update localStorage whenever slides change
  useEffect(() => {
    localStorage.setItem('slides', JSON.stringify(slides));
  }, [slides]);

  const handleCreateSlide = () => {
    const newSlide = {
      id: Date.now(),
      title: `Slide ${slides.length + 1}`,
      content: '',
    };
    const updatedSlides = [...slides, newSlide];
    setSlides(updatedSlides);
    localStorage.setItem('slides', JSON.stringify(updatedSlides));
    window.open(`/slides/edit/${newSlide.id}`, '_blank');
  };

  const handleSlideClick = (slide: Slide) => {
    setViewingSlide(slide);
  };

  return (
    <div className="flex flex-col gap-6 p-6 relative min-h-screen">
      {viewingSlide && (
        <SlideViewer
          slide={viewingSlide}
          onClose={() => setViewingSlide(null)}
          onEdit={() => {
            window.open(`/slides/edit/${viewingSlide.id}`, '_blank');
          }}
        />
      )}

      {slides.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">No slides yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slides.map((slide) => (
            <div 
              key={slide.id}
              className="border rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleSlideClick(slide)}
            >
              <h2 className="font-medium">{slide.title}</h2>
            </div>
          ))}
        </div>
      )}

      <motion.button
        onClick={handleCreateSlide}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed right-8 bottom-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow duration-300"
        aria-label="Create new slide"
      >
        <Plus className="text-white" size={32} />
      </motion.button>
    </div>
  );
};

export default ProductRollOut; 