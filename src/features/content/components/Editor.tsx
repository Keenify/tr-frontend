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
import Image from "@tiptap/extension-image";
import ResizableImage from '../extensions/ResizableImage';

// Styles
import "./../styles/Editor.css";

// Toolbar
import { EditorToolbar } from "./EditorToolbar";
import { MediaToolbar } from "./MediaToolbar";

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
 * The editor content is periodically synced with the server.
 * Users can add, delete, and update steps within the document.
 *
 * @returns {JSX.Element | null} - The rendered component or null if the editor is not initialized.
 */
const Editor: React.FC = () => {
  const location = useLocation();
  const { tabData, subject } = location.state || {};
  const [content, ] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [pendingTitle, setPendingTitle] = useState(tabData?.title || '');
  const [steps, setSteps] = useState<Step[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

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
      Image,
      ResizableImage,
    ],
    content: content,
  });

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
          
          // If there are steps, set the content for the active step
          if (data.content.steps?.length > 0) {
            const activeStep = data.content.steps[activeStepIndex];
            if (activeStep?.content && editor) {
              const parsedContent = JSON.parse(activeStep.content);
              editor.commands.setContent(parsedContent);
            }
          }
          console.log("✅ Document content fetched successfully");
        } catch (error) {
          console.error("❌ Failed to fetch document content:", error);
        }
      } else {
        console.warn("⚠️ No tabId found in location.state");
      }
    };

    fetchContent();
  }, [tabData, activeStepIndex, editor]);

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
      if (editor && tabData?.id && steps.length > 0) {
        try {
          const content = editor.getJSON();
          const updatedContent: DocumentContent = {
            content: {
              steps: steps?.map((step, index) => ({
                ...step,
                content: index === activeStepIndex ? JSON.stringify(content) : step.content,
              })) || [],
            },
            tab_id: tabData.id,
          };
          
          await upsertDocumentContent(updatedContent);
          console.log("✅ Content synced successfully");
        } catch (error) {
          console.error("❌ Failed to sync content:", error);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [editor, tabData, steps, activeStepIndex]);

  /**
   * Updates the document tab title.
   */
  const handleTitleUpdate = async () => {
    if (!subject?.id || !tabData?.id) return;
    
    if (pendingTitle === tabData.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      await updateDocumentTab(subject.id, tabData.id, { title: pendingTitle });
      tabData.title = pendingTitle;
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

  /**
   * Handles the change of step title.
   *
   * @param {number} index - The index of the step.
   * @param {string} title - The new title of the step.
   */
  const handleStepTitleChange = (index: number, title: string) => {
    const updatedSteps = [...steps];
    updatedSteps[index].title = title;
    setSteps(updatedSteps);
  };

  /**
   * Handles the change of step content.
   *
   * @param {string} content - The new content of the step.
   */
  const handleStepContentChange = (content: string) => {
    const updatedSteps = [...steps];
    updatedSteps[activeStepIndex].content = content;
    setSteps(updatedSteps);
  };

  /**
   * Adds a new step to the document.
   */
  const handleAddStep = async () => {
    const newStep: Step = {
      title: `Step ${steps.length + 1}`,
      content: '',
      step_number: steps.length + 1,
    };
    const updatedSteps = [...steps, newStep];
    setSteps(updatedSteps);
    setActiveStepIndex(updatedSteps.length - 1);

    if (tabData?.id) {
      const updatedContent: DocumentContent = {
        content: {
          steps: updatedSteps,
        },
        tab_id: tabData?.id || '',
      };
      try {
        await upsertDocumentContent(updatedContent);
        console.log("✅ Step added successfully");
      } catch (error) {
        console.error("❌ Failed to add step:", error);
      }
    }
  };

  /**
   * Deletes a step from the document.
   *
   * @param {number} index - The index of the step to delete.
   */
  const handleDeleteStep = async (index: number) => {
    const updatedSteps = steps.filter((_, i) => i !== index);
    
    // Recalculate step numbers
    const recalculatedSteps = updatedSteps.map((step, i) => ({
      ...step,
      step_number: i + 1,
    }));

    // Update activeStepIndex before setting steps
    const newActiveStepIndex = Math.max(0, Math.min(activeStepIndex, recalculatedSteps.length - 1));
    setActiveStepIndex(newActiveStepIndex);
    setSteps(recalculatedSteps);

    if (tabData?.id) {
      const updatedContent: DocumentContent = {
        content: {
          steps: recalculatedSteps,
        },
        tab_id: tabData?.id || '',
      };
      try {
        await upsertDocumentContent(updatedContent);
        console.log("✅ Step deleted successfully");
      } catch (error) {
        console.error("❌ Failed to delete step:", error);
      }
    }

    // Clear editor content if no steps remain
    if (recalculatedSteps.length === 0 && editor) {
      editor.commands.clearContent();
    }
  };

  /**
   * Updates the editor content based on the active step index.
   */
  useEffect(() => {
    if (!editor) return;
    
    if (steps?.length > 0 && activeStepIndex >= 0 && activeStepIndex < steps.length) {
      try {
        const stepContent = steps[activeStepIndex].content;
        if (stepContent) {
          const parsedContent = typeof stepContent === 'string' ? 
            JSON.parse(stepContent) : stepContent;
          editor.commands.setContent(parsedContent);
        } else {
          editor.commands.clearContent();
        }
      } catch (error) {
        console.error('Error setting content:', error);
        editor.commands.clearContent();
      }
    } else {
      editor.commands.clearContent();
    }
  }, [editor, steps, activeStepIndex]);

  /**
   * Handles the click event on the title to enable editing.
   */
  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  return (
    <EditorLayout
      title={pendingTitle}
      isEditingTitle={isEditingTitle}
      pendingTitle={pendingTitle}
      onTitleChange={setPendingTitle}
      onTitleBlur={handleTitleUpdate}
      onTitleKeyPress={handleTitleKeyPress}
      onTitleClick={handleTitleClick}
      formatToolbarChildren={<EditorToolbar editor={editor} />}
      mediaToolbarChildren={<MediaToolbar editor={editor} />}
      steps={steps}
      activeStepIndex={activeStepIndex}
      setActiveStepIndex={setActiveStepIndex}
      onAddStep={handleAddStep}
      onDeleteStep={handleDeleteStep}
      onStepTitleChange={handleStepTitleChange}
    >
      <EditorContent
        editor={editor}
        className="tiptap-editor mt-4"
        placeholder="Add content here"
        onChange={() => {
          if (editor) {
            const content = editor.getJSON();
            handleStepContentChange(JSON.stringify(content));
          }
        }}
      />
    </EditorLayout>
  );
};

export default Editor;
