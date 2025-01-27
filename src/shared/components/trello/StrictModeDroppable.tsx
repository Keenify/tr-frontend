import { useEffect, useState } from 'react';
import { Droppable, DroppableProps } from 'react-beautiful-dnd';

/**
 * StrictModeDroppable Component
 * 
 * Responsibility:
 * - Wraps react-beautiful-dnd's Droppable component to work with React.StrictMode
 * - Handles the double-mounting behavior in development
 * 
 * Features:
 * - Fixes React 18 Strict Mode compatibility issues
 * - Manages component mounting timing
 * - Prevents drag and drop errors in development
 * 
 * Technical Details:
 * - Uses requestAnimationFrame to delay mounting
 * - Handles cleanup on unmount
 * - Preserves all Droppable props and functionality
 * 
 * Props:
 * @param {DroppableProps} props - All props from react-beautiful-dnd Droppable
 * @param {ReactNode} children - Render props pattern for Droppable content
 */
export const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));

    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return <Droppable {...props}>{children}</Droppable>;
}; 