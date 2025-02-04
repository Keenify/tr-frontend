import React, { useEffect, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';

/**
 * SlideViewer Component
 * 
 * Modal component for viewing slide content.
 * Provides a read-only view of slides with options to:
 * - View slide content
 * - Open the full editor (SlideEditorPage) in a new window
 * - Close the viewer
 * 
 * Uses TinyMCE in readonly mode to maintain content formatting.
 */

interface SlideViewerProps {
  slide: {
    id: number;
    title: string;
    content: string;
  };
  onClose: () => void;
  onEdit: () => void;
}

const SlideViewer: React.FC<SlideViewerProps> = ({ slide: initialSlide, onClose, onEdit }) => {
  const [slide, setSlide] = useState(initialSlide);

  // Listen for changes to the slide content
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'slidesLastUpdated') {
        const slides = JSON.parse(localStorage.getItem('slides') || '[]');
        const updatedSlide = slides.find((s: typeof slide) => s.id === slide.id);
        if (updatedSlide) {
          setSlide(updatedSlide);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [slide.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{slide.title}</h2>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <Editor
            apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
            value={slide.content}
            init={{
              height: '100%',
              menubar: false,
              toolbar: false,
              plugins: [],
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }',
              inline: false,
              disabled: true,
            }}
            disabled={true}
          />
        </div>
      </div>
    </div>
  );
};

export default SlideViewer; 