import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';

interface Slide {
  id: number;
  title: string;
  content: string;
}

type TinyMCEEditorType = {
  setContent: (content: string) => void;
  getContent: () => string;
};

/**
 * SlideEditorPage Component
 * 
 * Full-page editor component opened in a new window.
 * This is the primary editor for creating and editing slides.
 * 
 * Features:
 * - Full-screen editing experience
 * - Loads/saves slides from localStorage
 * - Notifies main window of changes
 * 
 * Usage:
 * - Opened when creating new slides
 * - Opened when editing existing slides from SlideViewer
 */
const SlideEditorPage: React.FC = () => {
  const { slideId } = useParams<{ slideId: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<TinyMCEEditorType>(null) as React.MutableRefObject<TinyMCEEditorType>;

  useEffect(() => {
    const loadSlide = async () => {
      try {
        setIsLoading(true);
        const slides = JSON.parse(localStorage.getItem('slides') || '[]');
        const currentSlide = slides.find((s: Slide) => s.id === Number(slideId));
        
        if (currentSlide) {
          setTitle(currentSlide.title);
          setContent(currentSlide.content);
        } else {
          setError('Slide not found');
        }
      } catch (err) {
        setError('Error loading slide');
        console.error('Error loading slide:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSlide();
  }, [slideId]);

  const handleSave = () => {
    try {
      const slides = JSON.parse(localStorage.getItem('slides') || '[]');
      const updatedSlides = slides.map((s: Slide) =>
        s.id === Number(slideId) ? { ...s, title, content } : s
      );
      localStorage.setItem('slides', JSON.stringify(updatedSlides));
      localStorage.setItem('slidesLastUpdated', Date.now().toString());
      window.close();
    } catch (err) {
      console.error('Error saving slide:', err);
      alert('Error saving slide');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">{error}</h2>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl font-bold border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          placeholder="Slide Title"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Save & Close
          </button>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="flex-1" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {!isEditorReady && (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        <div className={!isEditorReady ? 'hidden' : 'h-full'}>
          <Editor
            onInit={(_, editor) => {
              editorRef.current = editor;
              editor.setContent(content || '<p><br></p>');
              setIsEditorReady(true);
            }}
            apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
            value={content}
            onEditorChange={(newContent) => setContent(newContent)}
            init={{
              height: 'calc(100vh - 250px)',
              min_height: 500,
              menubar: true,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 
                'charmap', 'preview', 'anchor', 'searchreplace', 
                'visualblocks', 'code', 'fullscreen', 'media', 
                'table', 'help', 'wordcount'
              ],
              toolbar: 'undo redo | blocks | ' +
                'bold italic forecolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | image media | help',
              content_style: `
                body { 
                  font-family: Helvetica,Arial,sans-serif; 
                  font-size: 14px;
                  padding: 1rem;
                  background: #ffffff;
                  min-height: 500px;
                }
              `,
              resize: false,
              statusbar: true,
              branding: false,
              promotion: false,
              setup: (editor) => {
                editor.on('init', () => {
                  editor.setContent(content || '<p><br></p>');
                });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SlideEditorPage; 