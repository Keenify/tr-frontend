import React, { useState, useRef, useCallback, useEffect } from 'react';
import { JDPage as JDPageType } from '../types/jd.types';
import { jdService } from '../services/jdService';
import { useJDPages } from '../hooks/useJDPages';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { useUserAndCompanyData } from '../hooks/useUserAndCompanyData';
import { useSession } from '../hooks/useSession';
import toast from 'react-hot-toast';

interface JDPageProps {
  onClose?: () => void;
}

const JDPage: React.FC<JDPageProps> = ({ onClose }) => {
  const { pages, loading, error, updatePage, fetchPages } = useJDPages();
  const [isEditing, setIsEditing] = useState(false);
  const [editorState, setEditorState] = useState({ bold: false, italic: false, underline: false });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { session } = useSession();
  const { companyInfo } = useUserAndCompanyData(session?.user?.id || '');

  // TipTap Editor
  const editor: Editor | null = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      // Update editor state for button highlighting
      setEditorState({
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
      });
    },
    onSelectionUpdate: ({ editor }) => {
      // Also update when selection changes (cursor moves)
      setEditorState({
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
      });
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none',
        'data-placeholder': 'Start writing your job description here... Use the formatting tools above to style your text and upload images.',
      },
    },
  });

  // Load the single JD page
  useEffect(() => {
    if (editor) {
      if (pages.length > 0) {
        const page = pages[0]; // Always use the first/only page
        if (page.content) {
          // Convert markdown content to HTML for TipTap
          const htmlContent = convertMarkdownToHtml(page.content);
          editor.commands.setContent(htmlContent);
        } else {
          editor.commands.setContent('');
        }
      } else if (!loading && !error) {
        // Only set empty content if we're not loading and there's no error
        // This prevents clearing content during initial load
        editor.commands.setContent('');
      }
      
      // Initialize editor state
      setEditorState({
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
      });
    }
  }, [pages, editor, loading, error]);

  // Convert markdown to HTML for TipTap
  const convertMarkdownToHtml = (markdown: string): string => {
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^• (.*$)/gm, '<ul><li>$1</li></ul>')
      .replace(/\n/g, '<br>');
  };

  // Convert TipTap HTML back to markdown for storage
  const convertHtmlToMarkdown = (html: string): string => {
    // This is a simplified conversion - you might want to use a proper HTML-to-markdown library
    return html
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<u>(.*?)<\/u>/g, '__$1__')
      .replace(/<h1>(.*?)<\/h1>/g, '# $1')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1')
      .replace(/<ul><li>(.*?)<\/li><\/ul>/g, '• $1')
      .replace(/<br>/g, '\n');
  };

  const handleSave = useCallback(async () => {
    if (pages.length === 0 || !editor) return;
    
    try {
      const htmlContent = editor.getHTML();
      const markdownContent = convertHtmlToMarkdown(htmlContent);
      
      console.log('Saving JD page:', {
        id: pages[0].id,
        content: markdownContent,
        htmlContent: htmlContent
      });
      
      const result = await updatePage(pages[0].id, { content: markdownContent });
      
      console.log('Update result:', result);
      
      // Force refresh the cache to ensure public page gets updated content
      await jdService.forceRefresh();
      
      setIsEditing(false);
      toast.success('Job description saved and published successfully! The public page has been updated.');
    } catch (err) {
      console.error('Failed to save page:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      toast.error(`Failed to save job description: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [pages, editor, updatePage]);

  const handleImageUpload = useCallback(async (file: File) => {
    try {
      const imageUrl = await jdService.uploadImage(file);
      
      if (editor) {
        // Insert image at current cursor position
        editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
    }
  }, [editor]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleImageUpload]);

  const handleView = useCallback(() => {
    if (!companyInfo?.id) {
      toast.error('Company information not available');
      return;
    }

    const viewUrl = `${window.location.origin}/jd/${companyInfo.id}`;
    window.open(viewUrl, '_blank');
  }, [companyInfo?.id]);

  const handleCopyLink = useCallback(async () => {
    if (!companyInfo?.id) {
      toast.error('Company information not available');
      return;
    }

    try {
      const shareUrl = `${window.location.origin}/jd/${companyInfo.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast.error('Failed to copy link');
    }
  }, [companyInfo?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error: {error}
      </div>
    );
  }

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen relative">
      {/* Sticky Edit Button - Positioned to avoid header overlap */}
      <div className="fixed top-24 right-4 sm:right-6 z-40 hidden lg:block">
        <div className="flex flex-col gap-2">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center gap-2 transform hover:scale-105 backdrop-blur-sm bg-opacity-95"
              title="Save changes"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center gap-2 transform hover:scale-105 backdrop-blur-sm bg-opacity-95"
              title="Edit job description"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
          
          {/* Additional action buttons */}
          <button
            onClick={handleView}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center gap-2 text-sm backdrop-blur-sm bg-opacity-95"
            title="View public page"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">View</span>
          </button>
          
          <button
            onClick={handleCopyLink}
            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center gap-2 text-sm backdrop-blur-sm bg-opacity-95"
            title="Copy link to clipboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">Copy</span>
          </button>
        </div>
      </div>

      {/* Mobile Sticky Button - Shows on smaller screens */}
      <div className="fixed bottom-4 right-4 z-40 lg:hidden">
        {isEditing ? (
          <button
            onClick={handleSave}
            className="w-14 h-14 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center transform hover:scale-105 backdrop-blur-sm bg-opacity-95"
            title="Save changes"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-14 h-14 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center transform hover:scale-105 backdrop-blur-sm bg-opacity-95"
            title="Edit job description"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>

      {/* Page Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3 items-center">
            <h1 className="text-2xl font-bold text-gray-900">Job Description</h1>
          </div>
          <div className="flex gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md hover:shadow-lg font-medium"
              >
                Close
              </button>
              )}
          </div>
        </div>
        {/* Toolbar */}
        {isEditing && (
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-4 text-gray-800 text-lg">Formatting Tools</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if (editor) {
                    editor.chain().focus().toggleBold().run();
                    // Force a re-render to update button state
                    setRefreshTrigger(prev => prev + 1);
                  }
                }}
                className={`px-4 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 ${
                  editor?.isActive('bold')
                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300' 
                    : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg'
                }`}
                title="Bold (click to toggle)"
              >
                <strong>B</strong>
              </button>
              <button
                onClick={() => {
                  if (editor) {
                    editor.chain().focus().toggleItalic().run();
                    // Force a re-render to update button state
                    setRefreshTrigger(prev => prev + 1);
                  }
                }}
                className={`px-4 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 ${
                  editor?.isActive('italic')
                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300' 
                    : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg'
                }`}
                title="Italic (click to toggle)"
              >
                <em>I</em>
              </button>
              <button
                onClick={() => {
                  if (editor) {
                    editor.chain().focus().toggleUnderline().run();
                    // Force a re-render to update button state
                    setRefreshTrigger(prev => prev + 1);
                  }
                }}
                className={`px-4 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 ${
                  editor?.isActive('underline')
                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300' 
                    : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg'
                }`}
                title="Underline (click to toggle)"
              >
                <u>U</u>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`px-4 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2 ${
                  editor.isActive('bulletList') ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
                title="Bullet List"
              >
                •
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`px-4 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2 ${
                  editor.isActive('heading', { level: 1 }) ? 'bg-green-600 text-white' : 'bg-green-500 text-white hover:bg-green-600'
                }`}
                title="Heading 1"
              >
                H1
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`px-4 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2 ${
                  editor.isActive('heading', { level: 2 }) ? 'bg-green-600 text-white' : 'bg-green-500 text-white hover:bg-green-600'
                }`}
                title="Heading 2"
              >
                H2
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`px-4 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2 ${
                  editor.isActive({ textAlign: 'left' }) ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white hover:bg-indigo-600'
                }`}
                title="Align Left"
              >
                ⬅️
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`px-4 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2 ${
                  editor.isActive({ textAlign: 'center' }) ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white hover:bg-indigo-600'
                }`}
                title="Align Center"
              >
                ↔️
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`px-4 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2 ${
                  editor.isActive({ textAlign: 'right' }) ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white hover:bg-indigo-600'
                }`}
                title="Align Right"
              >
                ➡️
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                title="Upload Image"
              >
                🖼️
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Rich Text Editor:</strong> Use the formatting tools above to style your text. 
                Click <strong>B</strong> to make text bold, <em>I</em> for italic, and <u>U</u> for underline. 
                Click again to remove formatting. Images will be automatically inserted at your cursor position.
              </p>
            </div>
          </div>
        )}

        {/* Unified Content Editor/Viewer - Google Docs Style */}
        <div className="mb-6">
          <div className="w-full border-2 border-gray-200 rounded-lg min-h-[500px] bg-white">
            {isEditing ? (
              <div className="tiptap-editor p-6">
                <EditorContent editor={editor} className="min-h-[450px] prose max-w-none focus:outline-none" />
              </div>
            ) : (
              <div className="p-6 min-h-[450px]">
                {editor.getHTML() ? (
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: editor.getHTML()
                    }}
                  />
                ) : (
                  <div className="text-gray-500 text-center py-20">
                    <div className="text-6xl mb-4">📝</div>
                    <div className="text-xl font-medium text-gray-600 mb-2">No content yet</div>
                    <div className="text-gray-500">Click "Edit Page" to start writing your job description</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JDPage;
