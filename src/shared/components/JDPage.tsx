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

interface JDPageProps {
  onClose?: () => void;
}

const JDPage: React.FC<JDPageProps> = ({ onClose }) => {
  const { pages, loading, error, updatePage } = useJDPages();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('Job Description');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Content is automatically managed by TipTap
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
    if (pages.length > 0 && editor) {
      const page = pages[0]; // Always use the first/only page
      setTitle(page.title);
      if (page.content) {
        // Convert markdown content to HTML for TipTap
        const htmlContent = convertMarkdownToHtml(page.content);
        editor.commands.setContent(htmlContent);
      } else {
        editor.commands.setContent('');
      }
    } else if (editor) {
      // Initialize with default content if no page exists
      setTitle('Job Description');
      editor.commands.setContent('');
    }
  }, [pages, editor]);

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
      await updatePage(pages[0].id, { title, content: markdownContent });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save page:', err);
    }
  }, [pages, title, editor, updatePage]);

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
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800">Job Description Page</h1>
        <div className="flex gap-3">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md hover:shadow-lg font-medium"
            >
              Save Changes
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg font-medium"
            >
              Edit Page
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md hover:shadow-lg font-medium"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Title */}
        <div className="mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!isEditing}
            className="text-2xl font-bold w-full p-4 border-2 border-gray-200 rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500"
            placeholder="Enter page title..."
          />
        </div>

        {/* Toolbar */}
        {isEditing && (
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-4 text-gray-800 text-lg">Formatting Tools</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`px-4 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2 ${
                  editor.isActive('bold') ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`px-4 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2 ${
                  editor.isActive('italic') ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                title="Italic"
              >
                <em>I</em>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`px-4 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2 ${
                  editor.isActive('underline') ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                title="Underline"
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
                Images will be automatically inserted at your cursor position and displayed in real-time.
              </p>
            </div>
          </div>
        )}

        {/* Content Editor */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Description Content
          </label>
          {isEditing ? (
            <div className="space-y-4">
              <div className="tiptap-editor">
                <EditorContent editor={editor} className="min-h-[280px] prose max-w-none" />
              </div>
              {/* Live Preview while editing */}
              <div className="live-preview">
                <h4>Live Preview:</h4>
                <div className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: editor.getHTML()
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full p-4 border-2 border-gray-200 rounded-lg min-h-[300px] bg-gray-50">
              {editor.getHTML() ? (
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: editor.getHTML()
                  }}
                />
              ) : (
                <div className="text-gray-800 font-mono text-sm">
                  No content yet. Click Edit to start writing.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Final Preview */}
        {editor.getHTML() && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Final Preview</h3>
            <div className="p-6 border-2 border-gray-200 rounded-lg bg-white shadow-sm">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html: editor.getHTML()
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JDPage;
