import React, { useState, useRef, useCallback, useEffect } from 'react';
import { JDPage as JDPageType } from '../types/jd.types';
import { jdService } from '../services/jdService';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { useUserAndCompanyData } from '../hooks/useUserAndCompanyData';
import { useSession } from '../hooks/useSession';
import toast from 'react-hot-toast';
import { JDPageSidebar } from './JDPageSidebar';
import { AddPageModal } from './AddPageModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface JDPageProps {
  onClose?: () => void;
}

const JDPage: React.FC<JDPageProps> = ({ onClose }) => {
  const { session } = useSession();
  const { companyInfo, isLoading: companyLoading } = useUserAndCompanyData(session?.user?.id || '');

  const [pages, setPages] = useState<JDPageType[]>([]);
  const [currentPage, setCurrentPage] = useState<JDPageType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TipTap Editor
  const editor: Editor | null = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'my-paragraph',
          },
        },
        hardBreak: {
          keepMarks: true,
        },
      }),
      Underline,
      Image,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none',
      },
    },
    parseOptions: {
      preserveWhitespace: 'full',
    },
    editable: true,
  });

  // Load all pages for the company
  const loadPages = useCallback(async () => {
    if (!companyInfo?.id) return;

    try {
      setIsLoading(true);
      const fetchedPages = await jdService.fetchJDPages(companyInfo.id);

      if (fetchedPages.length === 0) {
        // Create default page if none exists
        const defaultPage = await jdService.ensureDefaultPage(companyInfo.id);
        setPages([defaultPage]);
        setCurrentPage(defaultPage);
      } else {
        setPages(fetchedPages);
        // Default to last edited page (first in array since ordered by updated_at DESC)
        setCurrentPage(fetchedPages[0]);
      }
    } catch (error) {
      console.error('Error loading pages:', error);
      toast.error('Failed to load pages');
    } finally {
      setIsLoading(false);
    }
  }, [companyInfo?.id]);

  // Load pages on mount
  useEffect(() => {
    if (companyInfo?.id) {
      loadPages();
    }
  }, [companyInfo?.id, loadPages]);

  // Update editor content when current page changes
  useEffect(() => {
    if (editor && currentPage) {
      let content = currentPage.content || '';

      // Convert old markdown syntax to HTML for backward compatibility
      content = content.replace(
        /\*\*\*__(.+?)__\*\*\*/g,
        '<strong><em><u>$1</u></em></strong>'
      );

      editor.commands.setContent(content);
    }
  }, [editor, currentPage]);

  // Auto-save before switching pages
  const autoSave = useCallback(async () => {
    if (!currentPage || !editor || !isEditing) return;

    try {
      const htmlContent = editor.getHTML();
      await jdService.updateJDPage(currentPage.id, { content: htmlContent });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [currentPage, editor, isEditing]);

  // Handle page selection
  const handlePageSelect = useCallback(async (pageId: string) => {
    // Auto-save current page before switching
    await autoSave();

    const page = pages.find(p => p.id === pageId);
    if (page) {
      setCurrentPage(page);
      setIsEditing(false);
    }
  }, [pages, autoSave]);

  // Handle add page
  const handleAddPage = useCallback(async (title: string) => {
    if (!companyInfo?.id) return;

    try {
      const newPage = await jdService.createJDPage({
        title,
        companyId: companyInfo.id
      });

      // Reload pages and switch to new page in edit mode
      await loadPages();
      setCurrentPage(newPage);
      setIsEditing(true);
      toast.success('Page created successfully!');
    } catch (error: any) {
      console.error('Error creating page:', error);
      throw error;
    }
  }, [companyInfo?.id, loadPages]);

  // Handle delete page
  const handleDeletePage = useCallback(async () => {
    if (!currentPage || !companyInfo?.id) return;

    try {
      const result = await jdService.deleteJDPage(currentPage.id, companyInfo.id);

      if (result.success) {
        toast.success('Page deleted successfully');
        setShowDeleteModal(false);

        // Remove the deleted page from state
        const updatedPages = pages.filter(p => p.id !== currentPage.id);
        setPages(updatedPages);

        // Switch to next page if available
        if (result.nextPageId) {
          const nextPage = updatedPages.find(p => p.id === result.nextPageId);
          if (nextPage) {
            setCurrentPage(nextPage);
          }
        } else if (updatedPages.length > 0) {
          setCurrentPage(updatedPages[0]);
        }
      }
    } catch (error: any) {
      console.error('Error deleting page:', error);
      toast.error(error.message || 'Failed to delete page');
      setShowDeleteModal(false);
    }
  }, [currentPage, companyInfo?.id, pages]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!currentPage || !editor) return;

    try {
      setIsSaving(true);
      let htmlContent = editor.getHTML();

      // Ensure empty paragraphs have <br> to prevent collapsing
      // Handle paragraphs with attributes like: <p class="..." style="..."></p>
      htmlContent = htmlContent.replace(/<p([^>]*)><\/p>/g, '<p$1><br></p>');
      htmlContent = htmlContent.replace(/<p([^>]*)>\s*<\/p>/g, '<p$1><br></p>');

      const updatedPage = await jdService.updateJDPage(currentPage.id, { content: htmlContent });

      // Update current page state without reloading (to preserve content exactly)
      setCurrentPage(updatedPage);

      // Update pages list
      setPages(prevPages =>
        prevPages.map(p => p.id === updatedPage.id ? updatedPage : p)
      );

      setIsEditing(false);
      toast.success('Page saved successfully!');
    } catch (error) {
      console.error('Failed to save page:', error);
      toast.error('Failed to save page');
    } finally {
      setIsSaving(false);
    }
  }, [currentPage, editor]);

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    try {
      const imageUrl = await jdService.uploadImage(file);

      if (editor) {
        editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image');
    }
  }, [editor]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleImageUpload]);

  // Handle view public page
  const handleView = useCallback(() => {
    if (!companyInfo?.id || !currentPage) {
      toast.error('Page information not available');
      return;
    }

    const viewUrl = `${window.location.origin}/jd/${companyInfo.id}/${currentPage.slug}`;
    window.open(viewUrl, '_blank');
  }, [companyInfo?.id, currentPage]);

  // Handle copy link
  const handleCopyLink = useCallback(async () => {
    if (!companyInfo?.id || !currentPage) {
      toast.error('Page information not available');
      return;
    }

    try {
      const shareUrl = `${window.location.origin}/jd/${companyInfo.id}/${currentPage.slug}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  }, [companyInfo?.id, currentPage]);

  // Handle title double-click
  const handleTitleDoubleClick = useCallback(() => {
    if (!currentPage || session?.user?.id !== currentPage.created_by) return;
    setIsEditingTitle(true);
    setEditedTitle(currentPage.title);
  }, [currentPage, session?.user?.id]);

  // Handle title save
  const handleTitleSave = useCallback(async () => {
    if (!currentPage || !editedTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }

    // Validate title length
    if (editedTitle.trim().length < 3 || editedTitle.trim().length > 100) {
      toast.error('Title must be between 3 and 100 characters');
      return;
    }

    // Check if title is unique
    const titleExists = pages.some(
      p => p.id !== currentPage.id && p.title.toLowerCase() === editedTitle.trim().toLowerCase()
    );

    if (titleExists) {
      toast.error('A page with this title already exists');
      return;
    }

    try {
      const updatedPage = await jdService.updateJDPage(currentPage.id, {
        title: editedTitle.trim()
      });

      setCurrentPage(updatedPage);
      setPages(prevPages =>
        prevPages.map(p => p.id === updatedPage.id ? updatedPage : p)
      );
      setIsEditingTitle(false);
      toast.success('Title updated successfully!');
    } catch (error) {
      console.error('Failed to update title:', error);
      toast.error('Failed to update title');
    }
  }, [currentPage, editedTitle, pages]);

  // Handle title cancel
  const handleTitleCancel = useCallback(() => {
    setIsEditingTitle(false);
    setEditedTitle('');
  }, []);

  // Auto-save on unmount
  useEffect(() => {
    return () => {
      if (isEditing && currentPage && editor) {
        autoSave();
      }
    };
  }, [isEditing, currentPage, editor, autoSave]);

  if (isLoading || companyLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ fontSize: '18px' }}>Loading...</div>
      </div>
    );
  }

  if (!editor) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ fontSize: '18px' }}>Loading editor...</div>
      </div>
    );
  }

  const canEdit = currentPage && session?.user?.id === currentPage.created_by;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <JDPageSidebar
        pages={pages}
        currentPageId={currentPage?.id || null}
        onPageSelect={handlePageSelect}
        onAddPage={() => setShowAddModal(true)}
        isLoading={isLoading}
      />

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Header with title */}
          <div style={{
            marginBottom: '20px',
            padding: '32px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e8e8e8'
          }}>
            <div style={{ marginBottom: '16px' }}>
              {isEditingTitle ? (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTitleSave();
                      } else if (e.key === 'Escape') {
                        handleTitleCancel();
                      }
                    }}
                    autoFocus
                    style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      padding: '8px 12px',
                      border: '2px solid #5b8def',
                      borderRadius: '6px',
                      maxWidth: '400px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      color: '#1a1a1a',
                      backgroundColor: '#f8f9fa'
                    }}
                    placeholder="Enter page title"
                  />
                  <button
                    onClick={handleTitleSave}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#5b8def',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a7dd9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5b8def'}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleTitleCancel}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'white',
                      color: '#495057',
                      border: '1.5px solid #dee2e6',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#adb5bd';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#dee2e6';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <h1
                  style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    margin: 0,
                    cursor: canEdit ? 'pointer' : 'default',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    transition: 'background-color 0.2s',
                    color: '#1a1a1a'
                  }}
                  onDoubleClick={handleTitleDoubleClick}
                  onMouseEnter={(e) => {
                    if (canEdit) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title={canEdit ? 'Double-click to edit title' : ''}
                >
                  {currentPage?.title || 'Job Description'}
                </h1>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {isEditing ? (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: isSaving ? '#94a3b8' : '#5b8def',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    boxShadow: isSaving ? 'none' : '0 1px 3px rgba(91,141,239,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving) e.currentTarget.style.backgroundColor = '#4a7dd9';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSaving) e.currentTarget.style.backgroundColor = '#5b8def';
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              ) : (
                canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#5b8def',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(91,141,239,0.3)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a7dd9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5b8def'}
                  >
                    Edit Page
                  </button>
                )
              )}

              <button
                onClick={handleView}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#495057',
                  border: '1.5px solid #dee2e6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.borderColor = '#adb5bd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#dee2e6';
                }}
              >
                View Page
              </button>

              <button
                onClick={handleCopyLink}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#495057',
                  border: '1.5px solid #dee2e6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.borderColor = '#adb5bd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#dee2e6';
                }}
              >
                Copy Link
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#dc3545',
                  border: '1.5px solid #f8d7da',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  marginLeft: 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff5f5';
                  e.currentTarget.style.borderColor = '#dc3545';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#f8d7da';
                }}
              >
                Delete Page
              </button>
            </div>
          </div>

          {/* Toolbar */}
          {isEditing && (
            <div style={{
              marginBottom: '20px',
              padding: '24px',
              backgroundColor: 'white',
              border: '1px solid #e8e8e8',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#495057', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Formatting Tools
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: editor.isActive('bold') ? '#5b8def' : 'white',
                    color: editor.isActive('bold') ? 'white' : '#495057',
                    border: `1.5px solid ${editor.isActive('bold') ? '#5b8def' : '#dee2e6'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!editor.isActive('bold')) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#adb5bd';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!editor.isActive('bold')) {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#dee2e6';
                    }
                  }}
                >
                  B
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: editor.isActive('italic') ? '#5b8def' : 'white',
                    color: editor.isActive('italic') ? 'white' : '#495057',
                    border: `1.5px solid ${editor.isActive('italic') ? '#5b8def' : '#dee2e6'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontStyle: 'italic',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!editor.isActive('italic')) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#adb5bd';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!editor.isActive('italic')) {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#dee2e6';
                    }
                  }}
                >
                  I
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: editor.isActive('underline') ? '#5b8def' : 'white',
                    color: editor.isActive('underline') ? 'white' : '#495057',
                    border: `1.5px solid ${editor.isActive('underline') ? '#5b8def' : '#dee2e6'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!editor.isActive('underline')) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#adb5bd';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!editor.isActive('underline')) {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#dee2e6';
                    }
                  }}
                >
                  U
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: editor.isActive('heading', { level: 1 }) ? '#5b8def' : 'white',
                    color: editor.isActive('heading', { level: 1 }) ? 'white' : '#495057',
                    border: `1.5px solid ${editor.isActive('heading', { level: 1 }) ? '#5b8def' : '#dee2e6'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!editor.isActive('heading', { level: 1 })) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#adb5bd';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!editor.isActive('heading', { level: 1 })) {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#dee2e6';
                    }
                  }}
                >
                  H1
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: editor.isActive('heading', { level: 2 }) ? '#5b8def' : 'white',
                    color: editor.isActive('heading', { level: 2 }) ? 'white' : '#495057',
                    border: `1.5px solid ${editor.isActive('heading', { level: 2 }) ? '#5b8def' : '#dee2e6'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!editor.isActive('heading', { level: 2 })) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#adb5bd';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!editor.isActive('heading', { level: 2 })) {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#dee2e6';
                    }
                  }}
                >
                  H2
                </button>
                <button
                  onClick={() => editor.chain().focus().setTextAlign('left').run()}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: editor.isActive({ textAlign: 'left' }) ? '#5b8def' : 'white',
                    color: editor.isActive({ textAlign: 'left' }) ? 'white' : '#495057',
                    border: `1.5px solid ${editor.isActive({ textAlign: 'left' }) ? '#5b8def' : '#dee2e6'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  title="Align Left"
                  onMouseEnter={(e) => {
                    if (!editor.isActive({ textAlign: 'left' })) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#adb5bd';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!editor.isActive({ textAlign: 'left' })) {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#dee2e6';
                    }
                  }}
                >
                  ⬅
                </button>
                <button
                  onClick={() => editor.chain().focus().setTextAlign('center').run()}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: editor.isActive({ textAlign: 'center' }) ? '#5b8def' : 'white',
                    color: editor.isActive({ textAlign: 'center' }) ? 'white' : '#495057',
                    border: `1.5px solid ${editor.isActive({ textAlign: 'center' }) ? '#5b8def' : '#dee2e6'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  title="Align Center"
                  onMouseEnter={(e) => {
                    if (!editor.isActive({ textAlign: 'center' })) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#adb5bd';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!editor.isActive({ textAlign: 'center' })) {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#dee2e6';
                    }
                  }}
                >
                  ↔
                </button>
                <button
                  onClick={() => editor.chain().focus().setTextAlign('right').run()}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: editor.isActive({ textAlign: 'right' }) ? '#5b8def' : 'white',
                    color: editor.isActive({ textAlign: 'right' }) ? 'white' : '#495057',
                    border: `1.5px solid ${editor.isActive({ textAlign: 'right' }) ? '#5b8def' : '#dee2e6'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  title="Align Right"
                  onMouseEnter={(e) => {
                    if (!editor.isActive({ textAlign: 'right' })) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#adb5bd';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!editor.isActive({ textAlign: 'right' })) {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#dee2e6';
                    }
                  }}
                >
                  ➡
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: 'white',
                    color: '#495057',
                    border: '1.5px solid #dee2e6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.borderColor = '#adb5bd';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#dee2e6';
                  }}
                >
                  🖼️ Image
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Editor / Viewer */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px',
            minHeight: '500px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e8e8e8'
          }}>
            <style>{`
              .ProseMirror p {
                margin: 0;
                margin-bottom: 1em;
                min-height: 1.5em;
              }
              .ProseMirror p br {
                display: block;
                content: "";
                margin-top: 0.5em;
              }
              .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
                margin-top: 1em;
                margin-bottom: 0.5em;
              }
              .ProseMirror {
                line-height: 1.6;
              }
              .ProseMirror > * + * {
                margin-top: 0.75em;
              }
            `}</style>
            {isEditing ? (
              <EditorContent editor={editor} style={{ minHeight: '450px' }} />
            ) : (
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6'
                }}
                dangerouslySetInnerHTML={{
                  __html: editor.getHTML() || '<p style="color: #999; text-align: center;">No content yet. Click Edit to start writing.</p>'
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddPageModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddPage}
        existingTitles={pages.map(p => p.title)}
        isAtLimit={pages.length >= 50}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        pageTitle={currentPage?.title || ''}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeletePage}
        isLastPage={pages.length <= 1}
      />
    </div>
  );
};

export default JDPage;
