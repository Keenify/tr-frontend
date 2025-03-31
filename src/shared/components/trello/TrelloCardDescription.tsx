import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

// Toolbar icons
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaCheckSquare,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
} from "react-icons/fa";

interface TrelloCardDescriptionProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * TrelloCardDescription Component
 * 
 * A rich text editor for Trello card descriptions using Tiptap.
 * Supports markdown features like bold, italic, underline, bulletpoints, etc.
 * 
 * @param {string} value - Current description content
 * @param {function} onChange - Handler for content changes
 * @param {boolean} disabled - Whether the editor is read-only
 * @param {string} placeholder - Placeholder text when empty
 */
export const TrelloCardDescription: React.FC<TrelloCardDescriptionProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Add a detailed description...'
}) => {
  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        bulletList: {
          HTMLAttributes: {
            class: 'bullet-list',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'ordered-list',
          },
        },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  // Update content when value prop changes (e.g., when card changes)
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  // If editor isn't ready yet, show loading state
  if (!editor) {
    return <div className="p-4 text-gray-400">Loading editor...</div>;
  }

  // Helper to determine if a button should be active
  const isHeadingActive = (level: number) => editor.isActive('heading', { level });

  return (
    <div className={`trello-card-description ${disabled ? 'opacity-80' : ''}`}>
      {/* Editor toolbar - only show when not disabled */}
      {!disabled && (
        <div className="editor-toolbar flex flex-wrap gap-1 mb-2 p-1 bg-gray-100 rounded-md">
          {/* Headings */}
          <div className="flex items-center mr-1">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-1.5 rounded ${isHeadingActive(1) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
              title="Heading 1"
            >
              <span className="font-bold text-sm">H1</span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 rounded ${isHeadingActive(2) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
              title="Heading 2"
            >
              <span className="font-bold text-sm">H2</span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-1.5 rounded ${isHeadingActive(3) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
              title="Heading 3"
            >
              <span className="font-bold text-sm">H3</span>
            </button>
          </div>
          
          <div className="h-6 w-0.5 mx-1 bg-gray-300" /> {/* Divider */}
          
          {/* Text formatting */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            title="Bold"
          >
            <FaBold size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            title="Italic"
          >
            <FaItalic size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded ${editor.isActive('underline') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            title="Underline"
          >
            <FaUnderline size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded ${editor.isActive('strike') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            title="Strikethrough"
          >
            <FaStrikethrough size={14} />
          </button>

          <div className="h-6 w-0.5 mx-1 bg-gray-300" /> {/* Divider */}
          
          {/* Lists */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded ${editor.isActive('bulletList') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            title="Bullet List"
          >
            <FaListUl size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded ${editor.isActive('orderedList') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            title="Numbered List"
          >
            <FaListOl size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-1.5 rounded ${editor.isActive('taskList') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            title="Task List"
          >
            <FaCheckSquare size={14} />
          </button>

          <div className="h-6 w-0.5 mx-1 bg-gray-300" /> {/* Divider */}

          {/* Text alignment */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            title="Align Left"
          >
            <FaAlignLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            title="Align Center"
          >
            <FaAlignCenter size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1.5 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            title="Align Right"
          >
            <FaAlignRight size={14} />
          </button>
        </div>
      )}

      {/* Editor content */}
      <div className={`border rounded-md overflow-hidden relative ${disabled ? 'bg-gray-50' : 'focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-300'}`}>
        <EditorContent 
          editor={editor} 
          className="trello-card-description-editor min-h-[200px] p-3"
        />
        
        {/* Show placeholder when content is empty */}
        {editor.isEmpty && !editor.isFocused && (
          <div className="absolute top-3 left-3 text-gray-400 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}; 