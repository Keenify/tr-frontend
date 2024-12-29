import { FaUndo, FaRedo } from "react-icons/fa";
import { Editor } from '@tiptap/react';
import { RiArrowDownSLine } from "react-icons/ri";
import React, { useState } from 'react';

// Undo/Redo Menu
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

// Heading Menu
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
