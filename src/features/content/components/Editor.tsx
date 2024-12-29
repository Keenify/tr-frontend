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
  FaAlignCenter, 
  FaAlignJustify, 
  FaAlignLeft, 
  FaAlignRight, 
  FaBold, 
  FaFont, 
  FaHighlighter, 
  FaItalic, 
  FaLink, 
  FaRedo, 
  FaStrikethrough, 
  FaUnderline, 
  FaUndo, 
  FaTextHeight, 
  FaListUl, 
  FaListOl, 
  FaCheckSquare 
} from "react-icons/fa";
import { RiArrowDownSLine } from "react-icons/ri";

// Services
import { upsertDocumentContent, getDocumentContent } from "../../../services/docService";

// Styles
import "./../styles/Editor.css";

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
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [showLineSpacingMenu, setShowLineSpacingMenu] = useState(false);
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

  // Add new component for link menu
  const LinkMenu = ({ editor }: { editor: any }) => {
    if (!editor.isActive('link')) return null;

    // Get the current selection coordinates
    const { from } = editor.state.selection;
    const domRect = editor.view.coordsAtPos(from);
    const style = {
      position: 'fixed' as const,
      left: `${domRect.left}px`,
      top: `${domRect.bottom + 5}px`,
      zIndex: 100,
    };

    return (
      <div 
        className="bg-white shadow-lg rounded-lg p-2 flex gap-2" 
        style={style}
      >
        <a 
          href={editor.getAttributes('link').href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600"
        >
          {editor.getAttributes('link').href}
        </a>
        <button
          onClick={() => editor.chain().focus().unsetLink().run()}
          className="text-red-500 hover:text-red-600 px-2"
        >
          Remove
        </button>
        <button
          onClick={() => {
            const url = editor.getAttributes('link').href;
            setLinkUrl(url);
            const { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to, '');
            setLinkText(selectedText);
            setShowLinkMenu(true);
          }}
          className="text-gray-500 hover:text-gray-600 px-2"
        >
          Edit
        </button>
        {/* Vertical divider */}
        <div className="h-6 w-px bg-gray-300 mx-1 self-center"></div>
        
      </div>
    );
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
            <button
              onClick={() => editor.chain().focus().undo().run()}
              className="px-3 py-1 rounded bg-gray-200"
            >
              <FaUndo />
            </button>
            {/* Redo button */}
            <button
              onClick={() => editor.chain().focus().redo().run()}
              className="px-3 py-1 rounded bg-gray-200"
            >
              <FaRedo />
            </button>
            {/* Heading menu toggle */}
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
                  {/* Normal text button */}
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-base"
                    onClick={() => {
                      editor.chain().focus().setParagraph().run();
                      setShowHeadingMenu(false);
                    }}
                  >
                    Normal
                  </button>
                  {/* Heading level buttons */}
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
            {/* Vertical divider */}
            <div className="h-6 w-px bg-gray-300 mx-1 self-center"></div>
            {/* Bold button */}
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-3 py-1 rounded ${
                editor.isActive("bold") ? "bg-gray-300" : "bg-gray-200"
              }`}
            >
              <FaBold />
            </button>
            {/* Italic button */}
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-3 py-1 rounded ${
                editor.isActive("italic") ? "bg-gray-300" : "bg-gray-200"
              }`}
            >
              <FaItalic />
            </button>
            {/* Underline button */}
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`px-3 py-1 rounded ${
                editor.isActive("underline") ? "bg-gray-300" : "bg-gray-200"
              }`}
            >
              <FaUnderline />
            </button>
            {/* Strikethrough button */}
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`inline-flex items-center justify-center w-10 h-8 rounded ${
                editor.isActive("strike") ? "bg-gray-300" : "bg-gray-200"
              }`}
            >
              <FaStrikethrough className="text-lg" />
            </button>
            {/* Text Color */}
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
            {/* Highlight Color */}
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
            {/* Vertical divider */}
            <div className="h-6 w-px bg-gray-300 mx-1 self-center"></div>
            {/* Link button and popup */}
            <div className="relative">
              <button
                onClick={() => {
                  const selection = editor.state.selection;
                  const selectedText = selection.empty 
                    ? '' 
                    : editor.view.state.doc.textBetween(
                        selection.from,
                        selection.to,
                        ''
                      );
                  setLinkText(selectedText);
                  setShowLinkMenu(true);
                }}
                className={`inline-flex items-center justify-center w-10 h-8 rounded ${
                  editor.isActive('link') ? 'bg-gray-300' : 'bg-gray-200'
                }`}
              >
                <FaLink />
              </button>

              {showLinkMenu && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white shadow-lg rounded-lg p-4 z-10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-medium">Link</span>
                    <button 
                      onClick={() => setShowLinkMenu(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
                      <input
                        type="text"
                        value={linkText}
                        onChange={(e) => setLinkText(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                      <input
                        type="url"
                        value={linkUrl}
                        onChange={(e) => {
                          setLinkUrl(e.target.value);
                          setIsValidUrl(isValidURL(e.target.value));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setShowLinkMenu(false);
                          setLinkUrl('');
                          setLinkText('');
                        }}
                        className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (linkUrl) {
                            if (linkText && editor.state.selection.empty) {
                              editor.chain()
                                .focus()
                                .insertContent(linkText)
                                .setTextSelection(editor.state.selection.from - linkText.length)
                                .setLink({ href: linkUrl })
                                .run();
                            } else {
                              editor.chain().focus().setLink({ href: linkUrl }).run();
                            }
                          }
                          setShowLinkMenu(false);
                          setLinkUrl('');
                          setLinkText('');
                        }}
                        className={`px-4 py-2 rounded-md ${
                          isValidUrl 
                            ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer' 
                            : 'bg-gray-200 cursor-not-allowed'
                        }`}
                        disabled={!isValidUrl}
                      >
                        Save Link
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Vertical divider */}
            <div className="h-6 w-px bg-gray-300 mx-1 self-center"></div>
            {/* Text Alignment */}
            <div className="relative">
              <label className="inline-flex items-center justify-center w-10 h-8 rounded bg-gray-200 cursor-pointer"
                     onClick={() => setShowAlignMenu(!showAlignMenu)}>
                {editor.isActive({ textAlign: 'left' }) ? <FaAlignLeft /> :
                 editor.isActive({ textAlign: 'center' }) ? <FaAlignCenter /> :
                 editor.isActive({ textAlign: 'right' }) ? <FaAlignRight /> :
                 editor.isActive({ textAlign: 'justify' }) ? <FaAlignJustify /> :
                 <FaAlignLeft />}
              </label>
              
              {showAlignMenu && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white shadow-lg rounded-lg overflow-hidden z-10">
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                      editor.chain().focus().setTextAlign('left').run();
                      setShowAlignMenu(false);
                    }}
                  >
                    <FaAlignLeft /> Left
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                      editor.chain().focus().setTextAlign('center').run();
                      setShowAlignMenu(false);
                    }}
                  >
                    <FaAlignCenter /> Center
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                      editor.chain().focus().setTextAlign('right').run();
                      setShowAlignMenu(false);
                    }}
                  >
                    <FaAlignRight /> Right
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                      editor.chain().focus().setTextAlign('justify').run();
                      setShowAlignMenu(false);
                    }}
                  >
                    <FaAlignJustify /> Justify
                  </button>
                </div>
              )}
            </div>
            {/* Line Spacing */}
            <div className="relative">
              <label className="inline-flex items-center justify-center w-10 h-8 rounded bg-gray-200 cursor-pointer"
                     onClick={() => setShowLineSpacingMenu(!showLineSpacingMenu)}>
                <FaTextHeight />
              </label>
              
              {showLineSpacingMenu && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white shadow-lg rounded-lg overflow-hidden z-10">
                  {[
                    { label: 'Single', value: '1' },
                    { label: '1.15', value: '1.15' },
                    { label: '1.5', value: '1.5' },
                    { label: 'Double', value: '2' },
                    { label: '2.5', value: '2.5' },
                    { label: 'Triple', value: '3' },
                  ].map(({ label, value }) => (
                    <button
                      key={value}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                      onClick={() => {
                        editor.commands.updateAttributes('paragraph', { lineHeight: value });
                        setShowLineSpacingMenu(false);
                      }}
                    >
                      <FaTextHeight className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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

      {/* Move LinkMenu outside the editor container */}
      {editor && <LinkMenu editor={editor} />}
    </div>
  );
};

export default Editor;
