import React, { useState } from 'react';

interface AddPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
  existingTitles: string[];
  isAtLimit: boolean;
}


export const AddPageModal: React.FC<AddPageModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingTitles,
  isAtLimit
}) => {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validateTitle = (value: string): string | null => {
    // Check length
    if (value.length < 3) {
      return 'Title must be at least 3 characters long';
    }
    if (value.length > 100) {
      return 'Title must be less than 100 characters';
    }

    // Check uniqueness (case-insensitive)
    const lowerTitle = value.toLowerCase().trim();
    if (existingTitles.some(t => t.toLowerCase().trim() === lowerTitle)) {
      return 'A page with this title already exists';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAtLimit) {
      setError('Maximum 50 pages per company reached');
      return;
    }

    const validationError = validateTitle(title);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(title.trim());
      setTitle('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create page');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setError('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px' }}>Create New Page</h2>

        {isAtLimit && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            marginBottom: '20px',
            color: '#856404'
          }}>
            Maximum 50 pages per company reached
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Page Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
              placeholder="Enter page title (3-100 characters)"
              style={{
                width: '100%',
                padding: '10px',
                border: error ? '2px solid #f44336' : '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              disabled={isSubmitting || isAtLimit}
              autoFocus
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {title.length}/100 characters
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px',
              backgroundColor: '#ffebee',
              border: '1px solid #f44336',
              borderRadius: '4px',
              marginBottom: '20px',
              color: '#c62828',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: isAtLimit ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isAtLimit ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
              disabled={isSubmitting || isAtLimit}
            >
              {isSubmitting ? 'Creating...' : 'Create Page'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
