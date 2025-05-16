import React from 'react';
import { Menu, Item, useContextMenu } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import '../styles/contextMenu.css';

interface MenuOption {
  label: string;
  action: () => void;
  icon?: React.ReactNode;
}

interface ContextMenuProps {
  children: React.ReactNode;
  options: MenuOption[];
  id: string; // Unique ID for this context menu
  className?: string;
}

/**
 * A reusable context menu component using react-contexify
 */
const ContextMenu: React.FC<ContextMenuProps> = ({ 
  children, 
  options, 
  id,
  className = '' 
}) => {
  const { show } = useContextMenu({ id });

  // Handle the right-click event
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Show the context menu at the current mouse position
    show({ event: e });
  };

  return (
    <>
      {/* The element that triggers the context menu */}
      <div onContextMenu={handleContextMenu} className={`context-menu-container ${className}`}>
        {children}
      </div>

      {/* The actual context menu, positioned by react-contexify */}
      <Menu id={id} animation="fade">
        {options.map((option, index) => (
          <Item key={index} onClick={() => option.action()}>
            <div className="flex items-center">
              {option.icon && <span className="mr-2">{option.icon}</span>}
              <span>{option.label}</span>
            </div>
          </Item>
        ))}
      </Menu>
    </>
  );
};

export default ContextMenu; 