import React, { useState, useRef, useCallback, useEffect } from 'react';
import { JDPage, JDContentBlock } from '../types/jd-page.types';
import { JDPageService } from '../services/jd-page.service';
import { v4 as uuidv4 } from 'uuid';

interface JDPageEditorProps {
  initialPage?: JDPage;
  onSave?: (page: JDPage) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

const JDPageEditor: React.FC<JDPageEditorProps> = ({
  initialPage,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const [title, setTitle] = useState(initialPage?.title || '');
  const [content, setContent] = useState<JDContentBlock[]>(
    initialPage?.content || [{ id: uuidv4(), type: 'text', content: '', order: 0 }]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save functionality
  useEffect(() => {
    if (isEditing && content.length > 0) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [content, title]);

  const handleAutoSave = async () => {
    if (!initialPage?.id || isSaving) return;
    
    try {
      setIsSaving(true);
      await JDPageService.updateJDPage(initialPage.id, { title, content });
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addContentBlock = (type: 'text' | 'image' | 'bullet', afterBlockId?: string) => {
    const newBlock: JDContentBlock = {
      id: uuidv4(),
      type,
      content: type === 'image' ? '' : 'Click to edit...',
      order: 0,
      style: {}
    };

    if (afterBlockId) {
      const afterIndex = content.findIndex(block => block.id === afterBlockId);
      const newContent = [...content];
      newContent.splice(afterIndex + 1, 0, newBlock);
      
      // Update order numbers
      newContent.forEach((block, index) => {
        block.order = index;
      });
      
      setContent(newContent);
    } else {
      const newContent = [...content, { ...newBlock, order: content.length }];
      setContent(newContent);
    }
    
    setSelectedBlockId(newBlock.id);
  };

  const updateBlockContent = (blockId: string, updates: Partial<JDContentBlock>) => {
    setContent(prev => prev.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (blockId: string) => {
    if (content.length === 1) return; // Don't delete the last block
    
    setContent(prev => {
      const newContent = prev.filter(block => block.id !== blockId);
      // Update order numbers
      newContent.forEach((block, index) => {
        block.order = index;
      });
      return newContent;
    });
  };

  const handleImageUpload = async (file: File, blockId: string) => {
    try {
      const imageUrl = await JDPageService.uploadImage(file);
      updateBlockContent(blockId, { 
        content: file.name,
        imageUrl,
        imageAlt: file.name
      });
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    try {
      setIsSaving(true);
      
      if (initialPage?.id) {
        const updatedPage = await JDPageService.updateJDPage(initialPage.id, { title, content });
        onSave?.(updatedPage);
      } else {
        const newPage = await JDPageService.createJDPage({ title, content });
        onSave?.(newPage);
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderContentBlock = (block: JDContentBlock) => {
    const isSelected = selectedBlockId === block.id;

    switch (block.type) {
      case 'text':
        return (
          <div className="relative group">
            <div
              contentEditable
              suppressContentEditableWarning
              className={`min-h-[24px] px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                block.style?.bold ? 'font-bold' : ''
              } ${block.style?.italic ? 'italic' : ''} ${
                block.style?.underline ? 'underline' : ''
              }`}
              onBlur={(e) => updateBlockContent(block.id, { content: e.currentTarget.textContent || '' })}
              onFocus={() => setSelectedBlockId(block.id)}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
            {isSelected && (
              <div className="absolute -top-8 left-0 bg-white border border-gray-300 rounded shadow-lg p-1 flex gap-1">
                <button
                  onClick={() => updateBlockContent(block.id, { 
                    style: { ...block.style, bold: !block.style?.bold }
                  })}
                  className={`px-2 py-1 rounded text-xs ${block.style?.bold ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  B
                </button>
                <button
                  onClick={() => updateBlockContent(block.id, { 
                    style: { ...block.style, italic: !block.style?.italic }
                  })}
                  className={`px-2 py-1 rounded text-xs ${block.style?.italic ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  I
                </button>
                <button
                  onClick={() => updateBlockContent(block.id, { 
                    style: { ...block.style, underline: !block.style?.underline }
                  })}
                  className={`px-2 py-1 rounded text-xs ${block.style?.underline ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  U
                </button>
                <button
                  onClick={() => updateBlockContent(block.id, { type: 'bullet' })}
                  className="px-2 py-1 rounded text-xs bg-gray-200"
                >
                  •
                </button>
                <button
                  onClick={() => deleteBlock(block.id)}
                  className="px-2 py-1 rounded text-xs bg-red-500 text-white"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        );

      case 'bullet':
        return (
          <div className="relative group flex items-start gap-2">
            <span className="text-xl mt-1">•</span>
            <div
              contentEditable
              suppressContentEditableWarning
              className={`flex-1 min-h-[24px] px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                block.style?.bold ? 'font-bold' : ''
              } ${block.style?.italic ? 'italic' : ''} ${
                block.style?.underline ? 'underline' : ''
              }`}
              onBlur={(e) => updateBlockContent(block.id, { content: e.currentTarget.textContent || '' })}
              onFocus={() => setSelectedBlockId(block.id)}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
            {isSelected && (
              <div className="absolute -top-8 left-6 bg-white border border-gray-300 rounded shadow-lg p-1 flex gap-1">
                <button
                  onClick={() => updateBlockContent(block.id, { 
                    style: { ...block.style, bold: !block.style?.bold }
                  })}
                  className={`px-2 py-1 rounded text-xs ${block.style?.bold ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  B
                </button>
                <button
                  onClick={() => updateBlockContent(block.id, { 
                    style: { ...block.style, italic: !block.style?.italic }
                  })}
                  className={`px-2 py-1 rounded text-xs ${block.style?.italic ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  I
                </button>
                <button
                  onClick={() => updateBlockContent(block.id, { 
                    style: { ...block.style, underline: !block.style?.underline }
                  })}
                  className={`px-2 py-1 rounded text-xs ${block.style?.underline ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  U
                </button>
                <button
                  onClick={() => updateBlockContent(block.id, { type: 'text' })}
                  className="px-2 py-1 rounded text-xs bg-gray-200"
                >
                  T
                </button>
                <button
                  onClick={() => deleteBlock(block.id)}
                  className="px-2 py-1 rounded text-xs bg-red-500 text-white"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="relative group">
            {block.imageUrl ? (
              <div className="relative inline-block">
                <img
                  src={block.imageUrl}
                  alt={block.imageAlt || 'Uploaded image'}
                  className="max-w-full h-auto rounded border"
                  style={{ maxHeight: '400px' }}
                />
                {isSelected && (
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                  >
                    ×
                  </button>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, block.id);
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-500 hover:text-blue-700"
                >
                  Click to upload image
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title..."
            className="text-2xl font-bold border-none outline-none flex-1 mr-4"
          />
          <div className="flex gap-2">
            {isSaving && (
              <span className="text-sm text-gray-500">Saving...</span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => addContentBlock('text')}
            className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Add Text
          </button>
          <button
            onClick={() => addContentBlock('bullet')}
            className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Add Bullet Point
          </button>
          <button
            onClick={() => addContentBlock('image')}
            className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Add Image
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 min-h-[500px]">
        {content.map((block, index) => (
          <div key={block.id} className="mb-4">
            {renderContentBlock(block)}
            {index < content.length - 1 && (
              <button
                onClick={() => addContentBlock('text', block.id)}
                className="w-full h-8 border-2 border-dashed border-gray-300 rounded hover:border-gray-400 hover:bg-gray-50 text-gray-500 text-sm"
              >
                + Add content here
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default JDPageEditor;
