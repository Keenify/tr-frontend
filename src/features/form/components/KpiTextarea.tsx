import React, { useState, useRef, useEffect } from 'react';

interface KpiTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

const KpiTextarea: React.FC<KpiTextareaProps> = ({
  value,
  onChange,
  placeholder = "• First KPI\n• Second KPI\n• Third KPI",
  className = "",
  rows = 3
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Format text to ensure each line has a bullet point with proper spacing
  const formatTextWithBullets = (text: string): string => {
    return text
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        // Ensure bullet point is followed by a space
        if (trimmed.startsWith('•')) {
          return trimmed.startsWith('• ') ? trimmed : `• ${trimmed.substring(1)}`;
        }
        return `• ${trimmed}`;
      })
      .join('\n');
  };

  const [displayValue, setDisplayValue] = useState(() => formatTextWithBullets(value));

  // Update display value when prop value changes
  useEffect(() => {
    // Format the value to ensure proper bullet point spacing
    const formattedValue = formatTextWithBullets(value);
    setDisplayValue(formattedValue);
  }, [value]);

  // Handle text changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    
    // Format the text and update the parent
    const formattedValue = formatTextWithBullets(newValue);
    onChange(formattedValue);
  };

  // Handle key events for better UX
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Enter key to add new bullet point
    if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = displayValue;
      
      // Insert new line with bullet point
      const newValue = 
        currentValue.substring(0, start) + 
        '\n• ' + 
        currentValue.substring(end);
      
      setDisplayValue(newValue);
      onChange(formatTextWithBullets(newValue));
      
      // Set cursor position after the bullet point
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = start + 3; // After "• "
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
    
    // Handle Backspace to remove bullet points properly
    if (e.key === 'Backspace') {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // If cursor is at the beginning of a line with bullet point, remove the bullet
      if (start === end && start > 0) {
        const lines = displayValue.split('\n');
        let currentPos = 0;
        let lineIndex = 0;
        
        for (let i = 0; i < lines.length; i++) {
          const lineLength = lines[i].length + 1; // +1 for newline
          if (currentPos + lineLength > start) {
            lineIndex = i;
            break;
          }
          currentPos += lineLength;
        }
        
        const lineStart = currentPos;
        const line = lines[lineIndex];
        
        // If cursor is right after bullet point, remove the bullet
        if (start === lineStart + 2 && line.startsWith('• ')) {
          e.preventDefault();
          const newValue = 
            displayValue.substring(0, lineStart) + 
            line.substring(2) + 
            displayValue.substring(start);
          
          setDisplayValue(newValue);
          onChange(formatTextWithBullets(newValue));
          
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(lineStart, lineStart);
            }
          }, 0);
        }
      }
    }
  };

  // Handle paste events to format pasted text
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Insert pasted text and format it
    const newValue = 
      displayValue.substring(0, start) + 
      pastedText + 
      displayValue.substring(end);
    
    setDisplayValue(newValue);
    onChange(formatTextWithBullets(newValue));
  };

  return (
    <textarea
      ref={textareaRef}
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder={placeholder}
      className={className}
      rows={rows}
      style={{ 
        fontFamily: 'monospace',
        lineHeight: '1.4',
        whiteSpace: 'pre-wrap'
      }}
    />
  );
};

export default KpiTextarea;
