import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { FaBold, FaItalic, FaUnderline, FaStrikethrough } from "react-icons/fa";
import { upsertDocumentContent, getDocumentContent } from "../../../../../../services/docService";

import "./Editor.css";

/**
 * Props for the Editor component.
 *
 * @interface EditorProps
 * @property {string} initialContent - The initial content to be loaded into the editor.
 * @property {string} title - The title of the document being edited.
 */
interface EditorProps {
  initialContent: string;
  title: string;
}

/**
 * Editor component.
 *
 * This component provides a rich text editor interface using the Tiptap library.
 * It includes basic text formatting options such as bold, italic, underline, and strikethrough.
 *
 * @param {EditorProps} props - The component props.
 * @returns {JSX.Element | null} - The rendered component or null if the editor is not initialized.
 */
const Editor: React.FC<EditorProps> = ({ initialContent, title }) => {
  const location = useLocation();
  const { tabId } = location.state || {};
  const [content, setContent] = useState<string>(initialContent);

  useEffect(() => {
    const fetchContent = async () => {
      if (tabId && !initialContent) {
        try {
          const data = await getDocumentContent(tabId);
          setContent(data.content.key);
          console.log("✅ Document content fetched successfully");
        } catch (error) {
          console.error("❌ Failed to fetch document content:", error);
        }
      }
    };

    fetchContent();
  }, [tabId, initialContent]);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: content,
  });

  // Sync content every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (editor) {
        const updatedContent = editor.getHTML();
        try {
          await upsertDocumentContent(updatedContent, tabId);
          console.log("✅ Content synced successfully");
        } catch (error) {
          console.error("❌ Failed to sync content:", error);
        }
      }
    }, 3000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [editor, tabId]);

  // Re-initialize the editor when content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="editor-container flex flex-col items-center min-h-screen bg-gray-100 space-y-6 p-4">
      {/* Title section */}
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-3xl relative">
        <h1 className="text-3xl font-bold text-center">{title}</h1>
        <span className="absolute top-0 right-0 text-sm text-gray-500 p-2">Topic</span>
      </div>
      {/* Toolbar section */}
      <div className="bg-white shadow-lg rounded-lg p-2 w-full max-w-3xl flex justify-center space-x-2">
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
