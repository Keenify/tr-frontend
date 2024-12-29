import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";

// Extensions
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { Extension } from '@tiptap/core'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'

// Icons
import { 
  FaTextHeight, 
  FaListUl, 
  FaListOl, 
  FaCheckSquare 
} from "react-icons/fa";


// Services
import { upsertDocumentContent, getDocumentContent } from "../../../services/docService";

// Styles
import "./../styles/Editor.css";

// Toolbar
import { UndoRedoMenu, HeadingMenu, TextFormatMenu, ColorMenu, LinkMenu, TextAlignMenu, LineSpacingMenu } from "./EditorToolbar";

interface LineHeightAttributes {
  lineHeight?: string;
}

const CustomLineHeight = Extension.create({
  name: 'lineHeight',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          lineHeight: {
            default: '1',
            parseHTML: (element: HTMLElement) => element.style.lineHeight,
            renderHTML: (attributes: LineHeightAttributes) => {
              if (!attributes.lineHeight) return {}
              return {
                style: `--line-height: ${attributes.lineHeight};`
              }
            }
          }
        }
      }
    ]
  }
})

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
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);

  /**
   * Fetches the document content based on the tab ID from the location state.
   * If successful, sets the content state with the fetched data.
   * Logs an error if the fetch operation fails.
   */
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

  /**
   * Initializes the Tiptap editor with specified extensions and content.
   * The editor is re-initialized whenever the content changes.
   */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4]
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
      Underline,
      TextStyle.configure(),
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        HTMLAttributes: {
          class: 'cursor-pointer',
        },
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      CustomLineHeight,
    ],
    content: content,
  });

  /**
   * Updates the editor content if it differs from the current state content.
   * This ensures the editor reflects the latest content state.
   */
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  /**
   * Periodically syncs the editor content with the server every 3 seconds.
   * Attempts to upsert the document content and logs the result.
   * Cleans up the interval on component unmount.
   */
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

  /**
   * Validates a URL string.
   *
   * @param {string} str - The URL string to validate.
   * @returns {boolean} - True if the URL is valid, false otherwise.
   */
  const isValidURL = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="editor-container min-h-screen bg-gray-100 p-4">
      {/* Fixed header section */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-100 px-4 pt-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Title section */}
          <div className="bg-white shadow-lg rounded-lg p-6 relative">
            <h1 className="text-3xl font-bold text-center">{tabData?.title}</h1>
            <span className="absolute top-0 right-0 text-sm text-gray-500 p-2">
              Topic
            </span>
          </div>
          {/* Toolbar section */}
          <div className="bg-white shadow-lg rounded-lg p-2 flex justify-center space-x-2">
            {/* Undo button */}
            <UndoRedoMenu editor={editor} />
            {/* Heading menu toggle */}
            <HeadingMenu editor={editor} />
            {/* Vertical divider */}
            <div className="h-6 w-px bg-gray-300 mx-1 self-center"></div>
            {/* Text Format Menu */}
            <TextFormatMenu editor={editor} />
            {/* Vertical divider */}
            <div className="h-6 w-px bg-gray-300 mx-1 self-center"></div>
            {/* Text Color Menu */}
            <ColorMenu editor={editor} />
            {/* Vertical divider */}
            <div className="h-6 w-px bg-gray-300 mx-1 self-center"></div>
            {/* Link Menu */}
            <LinkMenu 
              editor={editor}
              showLinkMenu={showLinkMenu}
              setShowLinkMenu={setShowLinkMenu}
              linkText={linkText}
              setLinkText={setLinkText}
              linkUrl={linkUrl}
              setLinkUrl={setLinkUrl}
              isValidUrl={isValidUrl}
              setIsValidUrl={setIsValidUrl}
              isValidURL={isValidURL}
            />
            {/* Vertical divider */}
            <div className="h-6 w-px bg-gray-300 mx-1 self-center"></div>
            {/* Text Alignment Menu */}
            <TextAlignMenu editor={editor} />
            {/* Line Spacing Menu */}
            <LineSpacingMenu editor={editor} />
            {/* List Options */}
            <div className="relative">
              <label 
                className="inline-flex items-center justify-center w-10 h-8 rounded bg-gray-200 cursor-pointer"
                onClick={() => setShowListMenu(!showListMenu)}
              >
                <FaListUl />
              </label>
              
              {showListMenu && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white shadow-lg rounded-lg overflow-hidden z-10">
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                      editor.chain().focus().toggleBulletList().run();
                      setShowListMenu(false);
                    }}
                  >
                    <FaListUl /> Bulleted list
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                      editor.chain().focus().toggleOrderedList().run();
                      setShowListMenu(false);
                    }}
                  >
                    <FaListOl /> Numbered list
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                      editor.chain().focus().toggleTaskList().run();
                      setShowListMenu(false);
                    }}
                  >
                    <FaCheckSquare /> Check list
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content with padding to account for fixed header */}
      <div className="pt-48 mx-auto max-w-3xl"> {/* Adjust pt-48 value as needed */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <EditorContent
            editor={editor}
            className="tiptap-editor"
            placeholder="Add content here"
          />
        </div>
      </div>
    </div>
  );
};

export default Editor;
