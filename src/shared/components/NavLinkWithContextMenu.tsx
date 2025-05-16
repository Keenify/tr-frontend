import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ContextMenu from './ContextMenu';
import { ExternalLink } from 'react-feather'; // External link icon

interface NavLinkWithContextMenuProps {
  to: string;        // Route path to navigate to
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
}

/**
 * Navigation link component with right-click context menu that offers
 * "Open in New Tab" functionality
 */
const NavLinkWithContextMenu: React.FC<NavLinkWithContextMenuProps> = ({ 
  to, 
  children, 
  className = '',
  onClick,
  isActive = false
}) => {
  const navigate = useNavigate();
  
  // Generate a unique ID for this menu instance
  // Using useMemo to ensure the ID stays consistent across renders
  const menuId = useMemo(() => `nav-link-menu-${to.replace(/\//g, '-')}`, [to]);
  
  // Handle normal click (navigate within the app)
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
    if (onClick) onClick();
  };
  
  // Context menu option to open in a new tab
  const menuOptions = [
    {
      label: 'Open in New Tab',
      action: () => {
        const url = `${window.location.origin}${to}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      },
      icon: <ExternalLink size={16} />
    }
  ];

  return (
    <ContextMenu 
      options={menuOptions} 
      id={menuId}
    >
      <a
        href={to}
        onClick={handleClick}
        className={`${className} ${isActive ? 'context-menu-active' : ''}`}
      >
        {children}
      </a>
    </ContextMenu>
  );
};

export default NavLinkWithContextMenu; 