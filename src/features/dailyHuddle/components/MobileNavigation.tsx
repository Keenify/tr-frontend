import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Users, Target, BarChart2, Clipboard, Settings } from 'react-feather';

interface MobileNavigationProps {
  onItemClick?: () => void;
}

/**
 * Simplified mobile navigation for Daily Huddle page
 * Shows main navigation items in a mobile-friendly format
 */
export const MobileNavigation: React.FC<MobileNavigationProps> = ({ onItemClick }) => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();

  const handleNavigation = (path: string) => {
    navigate(`/${userId}/${path}`);
    if (onItemClick) {
      onItemClick();
    }
  };

  const navItems = [
    { icon: Calendar, label: 'Daily Huddle', path: 'dailyHuddle', color: '#10b981' },
    { icon: Calendar, label: 'Weekly Meeting', path: 'weeklyMeeting', color: '#3b82f6' },
    { icon: Users, label: 'People Directory', path: 'directory', color: '#8b5cf6' },
    { icon: Calendar, label: 'Calendar', path: 'calendar', color: '#f59e0b' },
    { icon: Clipboard, label: 'Todo', path: 'todo', color: '#6366f1' },
    { icon: Target, label: 'The Rocks', path: 'theRocks', color: '#ec4899' },
    { icon: BarChart2, label: 'Online Sales', path: 'onlineSales', color: '#14b8a6' },
    { icon: Settings, label: 'More...', path: '', color: '#6b7280' },
  ];

  return (
    <div className="mobile-nav-container">
      <div className="mobile-nav-header">
        <h2 className="mobile-nav-title">Navigation</h2>
        <p className="mobile-nav-subtitle">Quick Access</p>
      </div>

      <div className="mobile-nav-items">
        {navItems.map((item) => (
          <button
            key={item.path || item.label}
            onClick={() => item.path && handleNavigation(item.path)}
            className="mobile-nav-item"
            disabled={!item.path}
          >
            <div className="mobile-nav-icon" style={{ backgroundColor: item.color }}>
              <item.icon size={20} color="white" />
            </div>
            <span className="mobile-nav-label">{item.label}</span>
            <svg
              className="mobile-nav-arrow"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
      </div>

      <style>{`
        .mobile-nav-container {
          width: 100%;
        }

        .mobile-nav-header {
          padding: 0 0 20px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 20px;
        }

        .mobile-nav-title {
          font-size: 20px;
          font-weight: 700;
          color: white;
          margin: 0 0 4px 0;
        }

        .mobile-nav-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .mobile-nav-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          text-align: left;
        }

        .mobile-nav-item:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(4px);
        }

        .mobile-nav-item:active:not(:disabled) {
          transform: translateX(2px);
        }

        .mobile-nav-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mobile-nav-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .mobile-nav-label {
          flex: 1;
          color: white;
          font-size: 15px;
          font-weight: 500;
        }

        .mobile-nav-arrow {
          color: rgba(255, 255, 255, 0.4);
          flex-shrink: 0;
        }

        .mobile-nav-item:hover:not(:disabled) .mobile-nav-arrow {
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
};
