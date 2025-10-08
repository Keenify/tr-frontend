import React, { useState } from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  pageTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLastPage: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  pageTitle,
  onClose,
  onConfirm,
  isLastPage
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (isLastPage) {
      setError('Cannot delete the last page. At least one page must exist.');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete page');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
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
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', color: '#d32f2f' }}>
          Delete Page?
        </h2>

        {isLastPage ? (
          <div style={{
            padding: '16px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            marginBottom: '20px',
            color: '#856404'
          }}>
            <strong>Cannot delete:</strong> At least one page must exist. This is your last page.
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
              Are you sure you want to delete the following page?
            </p>
            <div style={{
              padding: '12px',
              backgroundColor: '#f5f5f5',
              borderLeft: '4px solid #d32f2f',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              "{pageTitle}"
            </div>
            <p style={{ margin: '16px 0 0 0', fontSize: '14px', color: '#666' }}>
              This action cannot be undone. The page will be permanently deleted.
            </p>
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px',
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
            disabled={isDeleting}
          >
            Cancel
          </button>
          {!isLastPage && (
            <button
              type="button"
              onClick={handleConfirm}
              style={{
                padding: '10px 20px',
                backgroundColor: '#d32f2f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Page'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
