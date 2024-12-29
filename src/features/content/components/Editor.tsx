import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";

// Extensions
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";


// Icons
import { FaBold, FaItalic, FaUnderline, FaStrikethrough, FaUndo, FaRedo } from "react-icons/fa";

// Services
import { upsertDocumentContent, getDocumentContent } from "../../../services/docService";

// Styles
import "./../styles/Editor.css";

/**
 * Editor component.
 *
 * This component provides a rich text editor interface using the Tiptap library.
 * It includes basic text formatting options such as bold, italic, underline, and strikethrough.
 *
 * @returns {JSX.Element | null} - The rendered component or null if the editor is not initialized.
 */
const Editor: React.FC = () => {
  const location = useLocation();
  const { tabData } = location.state || {};
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    const fetchContent = async () => {
      if (tabData?.id) {

        try {
          const data = await getDocumentContent(tabData.id);
          setContent(data.content.key);
          console.log("✅ Document content fetched successfully");
        } catch (error) {
          console.error("❌ Failed to fetch document content:", error);
        }
      } else {
        console.warn("⚠️ No tabId found in location.state");
      }
    };

    fetchContent();
  }, [tabData]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline
    ],
    content: content,
  });

  // Re-initialize the editor when content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Sync content every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (editor) {
        const updatedContent = editor.getHTML();
        try {
          await upsertDocumentContent(updatedContent, tabData?.id);
          console.log("✅ Content synced successfully");
        } catch (error) {
          console.error("❌ Failed to sync content:", error);
        }
      }
    }, 3000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [editor, tabData]);

  if (!editor) {
    return null;
  }

  return (
    <div className="editor-container flex flex-col items-center min-h-screen bg-gray-100 space-y-6 p-4">
      {/* Title section */}
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-3xl relative">
        <h1 className="text-3xl font-bold text-center">{tabData?.title}</h1>
        <span className="absolute top-0 right-0 text-sm text-gray-500 p-2">Topic</span>
      </div>
      {/* Toolbar section */}
      <div className="bg-white shadow-lg rounded-lg p-2 w-full max-w-3xl flex justify-center space-x-2">
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
          className={`px-3 py-1 rounded ${
            editor.isActive("strike") ? "bg-gray-300" : "bg-gray-200"
          }`}
        >
          <FaStrikethrough />
        </button>
      </div>

      {/* Editor content section */}
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-3xl">
        <EditorContent
          editor={editor}
          className="tiptap-editor"
          placeholder="Add content here"
        />
      </div>
    </div>
  );
};

export default Editor;
