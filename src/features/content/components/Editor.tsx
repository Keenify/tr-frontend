import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import { updateDocumentTab } from "../../../services/docService";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { EditorLayout } from './EditorLayout';
import { DocumentContent, Step, upsertDocumentContent, getDocumentContent } from '../../../services/docService';

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

// Styles
import "./../styles/Editor.css";

// Toolbar
import { 
  UndoRedoMenu, 
  HeadingMenu, 
  TextFormatMenu, 
  ColorMenu, 
  LinkMenu,
  TextAlignMenu,
  LineSpacingMenu,
  ListMenu 
} from "./EditorToolbar";

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
  const { tabData, subject } = location.state || {};
  const [content, ] = useState<string>('');
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [pendingTitle, setPendingTitle] = useState(tabData?.title || '');
  const [steps, setSteps] = useState<Step[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [contentId, setContentId] = useState<string | null>(null);

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
          setSteps(data.content.steps);
          setContentId(data.id);
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
      if (editor && contentId) {
        const updatedContent: DocumentContent = {
          content: {
            steps: steps?.map((step, index) => ({
              ...step,
              content: index === activeStepIndex ? editor.getHTML() : step.content,
            })) || [],
          },
          id: contentId,
          tab_id: tabData?.id || '',
        };
        try {
          await upsertDocumentContent(updatedContent, contentId);
          console.log("✅ Content synced successfully");
        } catch (error) {
          console.error("❌ Failed to sync content:", error);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [editor, contentId, steps, activeStepIndex, tabData]);

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

  /**
   * Updates the document tab title.
   */
  const handleTitleUpdate = async () => {
    if (!subject?.id || !tabData?.id) return;
    if (pendingTitle === tabData.title || !pendingTitle.trim()) {
      setPendingTitle(tabData.title);
      setIsEditingTitle(false);
      return;
    }

    try {
      await updateDocumentTab(subject.id, tabData.id, { title: pendingTitle });
      setIsEditingTitle(false);
      toast.success('Topic title updated successfully', {
        position: 'top-right',
      });
    } catch (error) {
      console.error('❌ Failed to update topic title:', error);
      setPendingTitle(tabData.title);
      toast.error('Failed to update topic title', {
        position: 'top-right',
      });
    }
  };

  /**
   * Handles key press events for title input.
   *
   * @param {React.KeyboardEvent<HTMLInputElement>} e - The key press event.
   */
  const handleTitleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleUpdate();
    }
  };

  const handleStepTitleChange = (index: number, title: string) => {
    const updatedSteps = [...steps];
    updatedSteps[index].title = title;
    setSteps(updatedSteps);
  };

  const handleStepContentChange = (content: string) => {
    const updatedSteps = [...steps];
    updatedSteps[activeStepIndex].content = content;
    setSteps(updatedSteps);
  };

  const handleAddStep = () => {
    const newStep: Step = {
      title: `Step ${steps.length + 1}`,
      content: '',
      step_number: steps.length + 1,
    };
    setSteps([...steps, newStep]);
    setActiveStepIndex(steps.length);
  };

  const handleDeleteStep = (index: number) => {
    const updatedSteps = steps.filter((_, i) => i !== index);
    setSteps(updatedSteps);
    setActiveStepIndex(Math.min(activeStepIndex, updatedSteps.length - 1));
  };

  useEffect(() => {
    if (editor && steps?.length > 0) {
      editor.commands.setContent(steps[activeStepIndex].content);
    }
  }, [editor, steps, activeStepIndex]);

  return (
    <EditorLayout
      title={pendingTitle}
      isEditingTitle={isEditingTitle}
      pendingTitle={pendingTitle}
      onTitleChange={setPendingTitle}
      onTitleBlur={handleTitleUpdate}
      onTitleKeyPress={handleTitleKeyPress}
      toolbarChildren={
        <>
          {editor && (
            <>
              <UndoRedoMenu editor={editor} />
              <HeadingMenu editor={editor} />
              <div className="h-6 w-px bg-gray-300 mx-1 self-center"></div>
              <TextFormatMenu editor={editor} />
              <div className="h-6 w-px bg-gray-300 mx-1 self-center"></div>
              <ColorMenu editor={editor} />
              <div className="h-6 w-px bg-gray-300 mx-1 self-center"></div>
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
              <div className="h-6 w-px bg-gray-300 mx-1 self-center"></div>
              <TextAlignMenu editor={editor} />
              <LineSpacingMenu editor={editor} />
              <ListMenu editor={editor} />
            </>
          )}
        </>
      }
      steps={steps}
      activeStepIndex={activeStepIndex}
      setActiveStepIndex={setActiveStepIndex}
      onAddStep={handleAddStep}
      onDeleteStep={handleDeleteStep}
      onStepTitleChange={handleStepTitleChange}
    >
      <EditorContent
        editor={editor}
        className="tiptap-editor mt-4" // Add margin-top class
        placeholder="Add content here"
        onChange={() => handleStepContentChange(editor?.getHTML() || '')}
      />
    </EditorLayout>
  );
};

export default Editor;
