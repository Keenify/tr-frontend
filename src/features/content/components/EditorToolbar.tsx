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
  FaHighlighter, 
  FaLink, 
  FaAlignLeft, 
  FaAlignCenter, 
  FaAlignRight, 
  FaAlignJustify, 
  FaTextHeight, 
  FaListUl, 
  FaListOl, 
  FaCheckSquare 
} from "react-icons/fa";
import { RiArrowDownSLine } from "react-icons/ri";

/**
 * Component for undo and redo actions in the editor.
 * 
 * @param {Editor} editor - Instance of Tiptap editor.
 * @returns {JSX.Element} - Rendered component for undo and redo.
 */
export const UndoRedoMenu: React.FC<{ editor: Editor }> = ({ editor }) => (
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

/**
 * Component for selecting heading levels or normal text.
 * 
 * @param {Editor} editor - Instance of Tiptap editor.
 * @returns {JSX.Element} - Rendered component for heading selection.
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
 * Component for text formatting options like bold, italic, etc.
 * 
 * @param {Editor} editor - Instance of Tiptap editor.
 * @returns {JSX.Element} - Rendered component for text formatting.
 */
export const TextFormatMenu: React.FC<{ editor: Editor }> = ({ editor }) => (
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

/**
 * Component for changing text and highlight colors.
 * 
 * @param {Editor} editor - Instance of Tiptap editor.
 * @returns {JSX.Element} - Rendered component for color selection.
 */
export const ColorMenu: React.FC<{ editor: Editor }> = ({ editor }) => (
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

interface LinkMenuProps {
  editor: any;
  showLinkMenu: boolean;
  setShowLinkMenu: (show: boolean) => void;
  linkText: string;
  setLinkText: (text: string) => void;
  linkUrl: string;
  setLinkUrl: (url: string) => void;
  isValidUrl: boolean;
  setIsValidUrl: (valid: boolean) => void;
  isValidURL: (str: string) => boolean;
}

/**
 * Component for managing links in the editor.
 * 
 * @param {LinkMenuProps} props - Properties for link management.
 * @returns {JSX.Element} - Rendered component for link management.
 */
export const LinkMenu: React.FC<LinkMenuProps> = ({
  editor,
  showLinkMenu,
  setShowLinkMenu,
  linkText,
  setLinkText,
  linkUrl,
  setLinkUrl,
  isValidUrl,
  setIsValidUrl,
  isValidURL,
}) => {
  const [popupPosition, setPopupPosition] = useState<{ left: number; top: number } | null>(null);

  const FloatingLinkMenu = () => {
    if (!editor.isActive('link')) return null;

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
            setPopupPosition({
              left: domRect.left,
              top: domRect.bottom + 45
            });
            setShowLinkMenu(true);
          }}
          className="text-gray-500 hover:text-gray-600 px-2"
        >
          Edit
        </button>
        <div className="h-6 w-px bg-gray-300 mx-1 self-center"></div>
      </div>
    );
  };

  return (
    <>
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
            setPopupPosition(null);
            setShowLinkMenu(true);
          }}
          className={`inline-flex items-center justify-center w-10 h-8 rounded ${
            editor.isActive('link') ? 'bg-gray-300' : 'bg-gray-200'
          }`}
        >
          <FaLink />
        </button>

        {showLinkMenu && (
          <div 
            className="absolute w-72 bg-white shadow-lg rounded-lg p-4 z-10"
            style={popupPosition ? {
              position: 'fixed',
              left: `${popupPosition.left}px`,
              top: `${popupPosition.top}px`,
            } : {
              top: '100%',
              left: 0,
              marginTop: '0.25rem'
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-medium">Link</span>
              <button 
                onClick={() => {
                  setShowLinkMenu(false);
                  setPopupPosition(null);
                }}
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
                    setPopupPosition(null);
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
                    setPopupPosition(null);
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
      <FloatingLinkMenu />
    </>
  );
};

interface TextAlignMenuProps {
  editor: Editor;
}

/**
 * Component for text alignment options.
 * 
 * @param {Editor} editor - Instance of Tiptap editor.
 * @returns {JSX.Element} - Rendered component for text alignment.
 */
export const TextAlignMenu: React.FC<TextAlignMenuProps> = ({ editor }) => {
  const [showAlignMenu, setShowAlignMenu] = useState(false);

  return (
    <div className="relative">
      <label 
        className="inline-flex items-center justify-center w-10 h-8 rounded bg-gray-200 cursor-pointer"
        onClick={() => setShowAlignMenu(!showAlignMenu)}
      >
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
  );
};

interface LineSpacingMenuProps {
  editor: Editor;
}

/**
 * Component for line spacing options.
 * 
 * @param {Editor} editor - Instance of Tiptap editor.
 * @returns {JSX.Element} - Rendered component for line spacing.
 */
export const LineSpacingMenu: React.FC<LineSpacingMenuProps> = ({ editor }) => {
  const [showLineSpacingMenu, setShowLineSpacingMenu] = useState(false);

  return (
    <div className="relative">
      <label 
        className="inline-flex items-center justify-center w-10 h-8 rounded bg-gray-200 cursor-pointer"
        onClick={() => setShowLineSpacingMenu(!showLineSpacingMenu)}
      >
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
  );
};

interface ListMenuProps {
  editor: Editor;
}

/**
 * Component for list options like bullet, ordered, and task lists.
 * 
 * @param {Editor} editor - Instance of Tiptap editor.
 * @returns {JSX.Element} - Rendered component for list options.
 */
export const ListMenu: React.FC<ListMenuProps> = ({ editor }) => {
  const [showListMenu, setShowListMenu] = useState(false);

  return (
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
  );
};