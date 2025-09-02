import React, { useState, useRef, useCallback } from 'react';
import { JDPage as JDPageType, JDContentBlock } from '../types/jd.types';
import { jdService } from '../services/jdService';
import { useJDPages } from '../hooks/useJDPages';
import { useManagerAccess } from '../hooks/useManagerAccess';

interface JDPageProps {
  pageId?: string;
  onClose?: () => void;
}

const JDPage: React.FC<JDPageProps> = ({ pageId, onClose }) => {
  const { pages, loading, error, createPage, updatePage, deletePage } = useJDPages();
  const { isManager, loading: managerLoading, error: managerError } = useManagerAccess();
  const [currentPage, setCurrentPage] = useState<JDPageType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<JDContentBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing page if pageId is provided
  React.useEffect(() => {
    if (pageId) {
      const page = pages.find(p => p.id === pageId);
      if (page) {
        setCurrentPage(page);
        setTitle(page.title);
        setContent(page.content);
      }
    }
  }, [pageId, pages]);

  const handleCreateNew = useCallback(async () => {
    try {
      const newPage = await createPage({
        title: 'Untitled JD Page',
        content: []
      });
      setCurrentPage(newPage);
      setTitle(newPage.title);
      setContent(newPage.content);
      setIsEditing(true);
    } catch (err) {
      console.error('Failed to create new page:', err);
    }
  }, [createPage]);

  const handleSave = useCallback(async () => {
    if (!currentPage) return;
    
    try {
      await updatePage(currentPage.id, { title, content });
      setIsEditing(false);
      // Refresh the current page data
      const updatedPage = pages.find(p => p.id === currentPage.id);
      if (updatedPage) {
        setCurrentPage(updatedPage);
      }
    } catch (err) {
      console.error('Failed to save page:', err);
    }
  }, [currentPage, title, content, updatePage, pages]);

  const handleDelete = useCallback(async () => {
    if (!currentPage || !window.confirm('Are you sure you want to delete this page?')) return;
    
    try {
      await deletePage(currentPage.id);
      setCurrentPage(null);
      setTitle('');
      setContent([]);
      onClose?.();
    } catch (err) {
      console.error('Failed to delete page:', err);
    }
  }, [currentPage, deletePage, onClose]);

  const addTextBlock = useCallback(() => {
    const newBlock: JDContentBlock = {
      id: Date.now().toString(),
      type: 'text',
      content: '',
      style: {},
      order: content.length
    };
    setContent(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  }, [content.length]);

  const addImageBlock = useCallback(async (file: File) => {
    try {
      const imageUrl = await jdService.uploadImage(file);
      const newBlock: JDContentBlock = {
        id: Date.now().toString(),
        type: 'image',
        content: file.name,
        imageUrl,
        imageAlt: file.name,
        order: content.length
      };
      setContent(prev => [...prev, newBlock]);
      setSelectedBlockId(newBlock.id);
    } catch (err) {
      console.error('Failed to upload image:', err);
    }
  }, [content.length]);

  const addBulletBlock = useCallback(() => {
    const newBlock: JDContentBlock = {
      id: Date.now().toString(),
      type: 'bullet',
      content: '',
      style: {},
      order: content.length
    };
    setContent(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  }, [content.length]);

  const updateBlock = useCallback((blockId: string, updates: Partial<JDContentBlock>) => {
    setContent(prev => prev.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setContent(prev => prev.filter(block => block.id !== blockId));
  }, []);

  const toggleStyle = useCallback((blockId: string, style: 'bold' | 'italic' | 'underline') => {
    setContent(prev => prev.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          style: {
            ...block.style,
            [style]: !block.style?.[style]
          }
        };
      }
      return block;
    }));
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      addImageBlock(file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addImageBlock]);

  const renderBlock = useCallback((block: JDContentBlock) => {
    const isSelected = selectedBlockId === block.id;
    
    switch (block.type) {
      case 'text':
        return (
          <div key={block.id} className={`mb-4 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => toggleStyle(block.id, 'bold')}
                className={`px-2 py-1 text-sm ${block.style?.bold ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                B
              </button>
              <button
                onClick={() => toggleStyle(block.id, 'italic')}
                className={`px-2 py-1 text-sm ${block.style?.italic ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                I
              </button>
              <button
                onClick={() => toggleStyle(block.id, 'underline')}
                className={`px-2 py-1 text-sm ${block.style?.underline ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                U
              </button>
              <button
                onClick={() => deleteBlock(block.id)}
                className="px-2 py-1 text-sm bg-red-500 text-white"
              >
                Delete
              </button>
            </div>
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              onFocus={() => setSelectedBlockId(block.id)}
              className={`w-full p-2 border rounded min-h-[100px] ${
                block.style?.bold ? 'font-bold' : ''
              } ${block.style?.italic ? 'italic' : ''} ${
                block.style?.underline ? 'underline' : ''
              }`}
              placeholder="Enter text here..."
            />
          </div>
        );

      case 'image':
        return (
          <div key={block.id} className={`mb-4 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => deleteBlock(block.id)}
                className="px-2 py-1 text-sm bg-red-500 text-white"
              >
                Delete
              </button>
            </div>
            <img
              src={block.imageUrl}
              alt={block.imageAlt || 'Uploaded image'}
              className="max-w-full h-auto rounded border"
              onFocus={() => setSelectedBlockId(block.id)}
            />
          </div>
        );

      case 'bullet':
        return (
          <div key={block.id} className={`mb-4 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => toggleStyle(block.id, 'bold')}
                className={`px-2 py-1 text-sm ${block.style?.bold ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                B
              </button>
              <button
                onClick={() => toggleStyle(block.id, 'italic')}
                className={`px-2 py-1 text-sm ${block.style?.italic ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                I
              </button>
              <button
                onClick={() => toggleStyle(block.id, 'underline')}
                className={`px-2 py-1 text-sm ${block.style?.underline ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                U
              </button>
              <button
                onClick={() => deleteBlock(block.id)}
                className="px-2 py-1 text-sm bg-red-500 text-white"
              >
                Delete
              </button>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-2xl mt-2">•</span>
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                onFocus={() => setSelectedBlockId(block.id)}
                className={`flex-1 p-2 border rounded min-h-[100px] ${
                  block.style?.bold ? 'font-bold' : ''
                } ${block.style?.italic ? 'italic' : ''} ${
                  block.style?.underline ? 'underline' : ''
                }`}
                placeholder="Enter bullet point text..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  }, [selectedBlockId, toggleStyle, deleteBlock, updateBlock]);

  // Check manager access
  if (managerLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Checking access...</div>
      </div>
    );
  }

  if (managerError) {
    return (
      <div className="text-red-500 p-4">
        Error checking access: {managerError}
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-xl font-semibold text-red-600 mb-2">Access Denied</div>
          <div className="text-gray-600">Only managers can access the JD Page.</div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">JD Page Editor</h1>
        <div className="flex gap-2">
          {!currentPage && (
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create New
            </button>
          )}
          {currentPage && (
            <>
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Edit
                </button>
              )}
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Page List */}
      {!currentPage && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Existing Pages</h2>
          {pages.length === 0 ? (
            <p className="text-gray-500">No JD pages found. Create your first one!</p>
          ) : (
            <div className="grid gap-4">
              {pages.map(page => (
                <div
                  key={page.id}
                  className="p-4 border rounded hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setCurrentPage(page);
                    setTitle(page.title);
                    setContent(page.content);
                    setIsEditing(false);
                  }}
                >
                  <h3 className="font-semibold">{page.title}</h3>
                  <p className="text-sm text-gray-500">
                    Last updated: {new Date(page.updated_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor */}
      {currentPage && (
        <div>
          {/* Title */}
          <div className="mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!isEditing}
              className="text-2xl font-bold w-full p-2 border rounded disabled:bg-gray-100"
              placeholder="Enter page title..."
            />
          </div>

          {/* Toolbar */}
          {isEditing && (
            <div className="mb-6 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold mb-2">Add Content</h3>
              <div className="flex gap-2">
                <button
                  onClick={addTextBlock}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Text
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Add Image
                </button>
                <button
                  onClick={addBulletBlock}
                  className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  Add Bullet Point
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Content */}
          <div className="space-y-4">
            {content.map(renderBlock)}
          </div>

          {content.length === 0 && isEditing && (
            <div className="text-center py-12 text-gray-500">
              <p>No content yet. Use the toolbar above to add text, images, or bullet points.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JDPage;
