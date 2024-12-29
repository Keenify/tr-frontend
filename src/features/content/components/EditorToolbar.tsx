import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { 
  FaBold, 
  FaItalic, 
  FaRedo, 
  FaStrikethrough, 
  FaUnderline, 
  FaUndo, 
  FaFont, 
  FaHighlighter 
} from "react-icons/fa";
import { RiArrowDownSLine } from "react-icons/ri";

/**
 * UndoRedoMenu component.
 * Provides undo and redo functionality for the editor.
 *
 * @param {Editor} editor - The Tiptap editor instance.
 * @returns {JSX.Element} - The rendered UndoRedoMenu component.
 */
export const UndoRedoMenu: React.FC<{ editor: Editor }> = ({ editor }) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => editor.chain().focus().undo().run()}
        className="px-3 py-1 rounded bg-gray-200"
      >
        <FaUndo />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        className="px-3 py-1 rounded bg-gray-200"
      >
        <FaRedo />
      </button>
    </div>
  );
};

/**
 * HeadingMenu component.
 * Allows users to select heading levels or set text to normal.
 *
 * @param {Editor} editor - The Tiptap editor instance.
 * @returns {JSX.Element} - The rendered HeadingMenu component.
 */
export const HeadingMenu: React.FC<{ editor: Editor }> = ({ editor }) => {
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowHeadingMenu(!showHeadingMenu)}
        className="px-3 py-1 rounded bg-gray-200 flex items-center gap-1"
      >
        {editor.isActive("heading", { level: 1 })
          ? "H1"
          : editor.isActive("heading", { level: 2 })
          ? "H2"
          : editor.isActive("heading", { level: 3 })
          ? "H3"
          : editor.isActive("heading", { level: 4 })
          ? "H4"
          : "Normal"}
        <RiArrowDownSLine />
      </button>

      {showHeadingMenu && (
        <div className="absolute top-full left-0 mt-1 w-40 bg-white shadow-lg rounded-lg overflow-hidden z-10">
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-base"
            onClick={() => {
              editor.chain().focus().setParagraph().run();
              setShowHeadingMenu(false);
            }}
          >
            Normal
          </button>
          {[1, 2, 3, 4].map((level) => (
            <button
              key={level}
              className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                level === 1
                  ? "text-2xl"
                  : level === 2
                  ? "text-xl"
                  : level === 3
                  ? "text-lg"
                  : "text-base"
              }`}
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: level as 1 | 2 | 3 | 4 })
                  .run();
                setShowHeadingMenu(false);
              }}
            >
              Heading {level}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * TextFormatMenu component.
 * Provides text formatting options such as bold, italic, underline, and strikethrough.
 *
 * @param {Editor} editor - The Tiptap editor instance.
 * @returns {JSX.Element} - The rendered TextFormatMenu component.
 */
export const TextFormatMenu: React.FC<{ editor: Editor }> = ({ editor }) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-3 py-1 rounded ${
          editor.isActive("bold") ? "bg-gray-300" : "bg-gray-200"
        }`}
      >
        <FaBold />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-3 py-1 rounded ${
          editor.isActive("italic") ? "bg-gray-300" : "bg-gray-200"
        }`}
      >
        <FaItalic />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`px-3 py-1 rounded ${
          editor.isActive("underline") ? "bg-gray-300" : "bg-gray-200"
        }`}
      >
        <FaUnderline />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`inline-flex items-center justify-center w-10 h-8 rounded ${
          editor.isActive("strike") ? "bg-gray-300" : "bg-gray-200"
        }`}
      >
        <FaStrikethrough className="text-lg" />
      </button>
    </div>
  );
};

/**
 * ColorMenu component.
 * Allows users to change text color and highlight color.
 *
 * @param {Editor} editor - The Tiptap editor instance.
 * @returns {JSX.Element} - The rendered ColorMenu component.
 */
export const ColorMenu: React.FC<{ editor: Editor }> = ({ editor }) => {
  return (
    <div className="flex gap-2">
      <div className="relative">
        <label className="inline-flex items-center justify-center w-10 h-8 rounded bg-gray-200 cursor-pointer">
          <FaFont />
          <input
            type="color"
            className="absolute opacity-0 w-0 h-0"
            onInput={e => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
          />
        </label>
      </div>
      <div className="relative">
        <label className="inline-flex items-center justify-center w-10 h-8 rounded bg-gray-200 cursor-pointer">
          <FaHighlighter />
          <input
            type="color"
            className="absolute opacity-0 w-0 h-0"
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              editor.chain().focus().setHighlight({ color: target.value }).run();
            }}
          />
        </label>
      </div>
    </div>
  );
};
