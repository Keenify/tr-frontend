import React from 'react';
import { JDPage } from '../types/jd.types';

interface JDPageSidebarProps {
  pages: JDPage[];
  currentPageId: string | null;
  onPageSelect: (pageId: string) => void;
  onAddPage: () => void;
  isLoading?: boolean;
}

export const JDPageSidebar: React.FC<JDPageSidebarProps> = ({
  pages,
  currentPageId,
  onPageSelect,
  onAddPage,
  isLoading = false
}) => {
  return (
    <div style={{
      width: '250px',
      borderRight: '1px solid #e0e0e0',
      padding: '20px',
      backgroundColor: '#f9f9f9',
      height: '100vh',
      overflowY: 'auto'
    }}>
      <button
        onClick={onAddPage}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#5b8def',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '20px',
          transition: 'all 0.2s',
          boxShadow: '0 1px 3px rgba(91,141,239,0.3)'
        }}
        disabled={isLoading}
        onMouseEnter={(e) => {
          if (!isLoading) e.currentTarget.style.backgroundColor = '#4a7dd9';
        }}
        onMouseLeave={(e) => {
          if (!isLoading) e.currentTarget.style.backgroundColor = '#5b8def';
        }}
      >
        + Add Page
      </button>

      <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>
        PAGES ({pages.length})
      </div>

      {isLoading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          Loading pages...
        </div>
      ) : pages.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          No pages yet. Click "+ Add Page" to create one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {pages.map(page => (
            <div
              key={page.id}
              onClick={() => onPageSelect(page.id)}
              style={{
                padding: '12px',
                backgroundColor: currentPageId === page.id ? '#e3f2fd' : 'white',
                border: currentPageId === page.id ? '2px solid #2196F3' : '1px solid #e0e0e0',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                wordBreak: 'break-word'
              }}
              onMouseEnter={(e) => {
                if (currentPageId !== page.id) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPageId !== page.id) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: currentPageId === page.id ? 'bold' : 'normal',
                color: currentPageId === page.id ? '#2196F3' : '#333',
                marginBottom: '4px'
              }}>
                {page.title}
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                Updated {new Date(page.updated_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
