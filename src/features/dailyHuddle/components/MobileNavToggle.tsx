import React from 'react';

interface MobileNavToggleProps {
  isOpen: boolean;
  onClick: () => void;
}

/**
 * Mobile-only hamburger menu toggle for Daily Huddle page
 * Only visible on mobile/tablet viewports (max-width: 1024px)
 * Desktop users won't see this at all
 */
export const MobileNavToggle: React.FC<MobileNavToggleProps> = ({
  isOpen,
  onClick,
}) => {
  return (
    <>
      <button
        onClick={onClick}
        className={`mobile-nav-toggle ${isOpen ? 'open' : ''}`}
        aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={isOpen}
        type="button"
      >
        <div className="hamburger-icon">
          <span className={`line ${isOpen ? 'open' : ''}`} />
          <span className={`line ${isOpen ? 'open' : ''}`} />
          <span className={`line ${isOpen ? 'open' : ''}`} />
        </div>
      </button>

      <style>{`
        /* Mobile-only hamburger button - hidden on desktop */
        .mobile-nav-toggle {
          display: none; /* Hidden by default (desktop) */
          position: fixed;
          top: 16px;
          left: 16px;
          width: 44px;
          height: 44px;
          padding: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          z-index: 999; /* Below sidebar overlay (1000) */
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        /* Show ONLY on mobile/tablet (max-width: 1024px) */
        @media (max-width: 1024px) {
          .mobile-nav-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        /* Hide hamburger when sidebar is open */
        .mobile-nav-toggle.open {
          opacity: 0;
          pointer-events: none;
        }

        .mobile-nav-toggle:hover {
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .mobile-nav-toggle:active {
          transform: scale(0.95);
        }

        .hamburger-icon {
          position: relative;
          width: 20px;
          height: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .hamburger-icon .line {
          display: block;
          width: 100%;
          height: 2.5px;
          background-color: white;
          border-radius: 2px;
          transition: all 0.3s ease;
          transform-origin: center;
        }

        /* Animate to X when menu is open */
        .hamburger-icon .line:nth-child(1).open {
          transform: translateY(6.75px) rotate(45deg);
        }

        .hamburger-icon .line:nth-child(2).open {
          opacity: 0;
          transform: translateX(-10px);
        }

        .hamburger-icon .line:nth-child(3).open {
          transform: translateY(-6.75px) rotate(-45deg);
        }
      `}</style>
    </>
  );
};
