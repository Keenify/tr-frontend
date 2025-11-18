import React, { useEffect } from 'react';

interface MobileSidebarOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

/**
 * Mobile-only sidebar overlay for Daily Huddle navigation
 * Shows the dashboard sidebar in a slide-in overlay on mobile
 * Only visible on mobile/tablet (max-width: 1024px)
 */
export const MobileSidebarOverlay: React.FC<MobileSidebarOverlayProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop - click to close */}
      <div
        className={`mobile-sidebar-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Sidebar container */}
      <div
        className={`mobile-sidebar-container ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Close button - positioned where hamburger was */}
        <button
          onClick={onClose}
          className="mobile-sidebar-close-x"
          aria-label="Close navigation"
        >
          <div className="x-icon">
            <span className="x-line" />
            <span className="x-line" />
          </div>
        </button>

        {/* Sidebar content */}
        <div className="mobile-sidebar-content">
          <div className="mobile-sidebar-nav">
            {children || (
              <p style={{ color: 'white', padding: '20px', textAlign: 'center' }}>
                Navigation loading...
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        /* Hidden on desktop - only shows on mobile/tablet */
        .mobile-sidebar-backdrop,
        .mobile-sidebar-container {
          display: none;
        }

        @media (max-width: 1024px) {
          /* Backdrop */
          .mobile-sidebar-backdrop {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
            z-index: 999;
          }

          .mobile-sidebar-backdrop.open {
            opacity: 1;
            visibility: visible;
          }

          /* Sidebar container */
          .mobile-sidebar-container {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 280px;
            max-width: 85vw;
            background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
            box-shadow: 2px 0 16px rgba(0, 0, 0, 0.3);
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1000;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          .mobile-sidebar-container.open {
            transform: translateX(0);
          }

          /* Close X button - positioned where hamburger was */
          .mobile-sidebar-close-x {
            position: fixed;
            top: 16px;
            left: 16px;
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            z-index: 1001;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          }

          .mobile-sidebar-close-x:hover {
            background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          }

          .mobile-sidebar-close-x:active {
            transform: scale(0.95);
          }

          /* X icon styling */
          .x-icon {
            position: relative;
            width: 20px;
            height: 20px;
          }

          .x-line {
            position: absolute;
            width: 100%;
            height: 2.5px;
            background-color: white;
            border-radius: 2px;
            top: 50%;
            left: 0;
          }

          .x-line:first-child {
            transform: translateY(-50%) rotate(45deg);
          }

          .x-line:last-child {
            transform: translateY(-50%) rotate(-45deg);
          }

          /* Sidebar content */
          .mobile-sidebar-content {
            padding: 70px 20px 20px 20px; /* Top padding for X button */
            height: 100%;
            overflow-y: auto;
          }

          .mobile-sidebar-nav {
            /* Navigation items container */
            width: 100%;
          }
        }
      `}</style>
    </>
  );
};
