import { FaUndo, FaRedo } from "react-icons/fa";
import { Editor } from '@tiptap/react';

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
