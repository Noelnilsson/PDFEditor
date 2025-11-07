/**
 * TextBoxOverlay component
 *
 * Renders a single text box on a PDF page with:
 * - Visual representation with border when selected
 * - Inline editing capability
 * - Drag to move
 * - Resize handles
 * - Click to select
 *
 * Props:
 * - textBox: TextBox data
 * - isSelected: Whether this box is selected
 * - isEditing: Whether this box is in edit mode
 * - zoom: Current zoom level
 * - onSelect: Callback when box is selected
 * - onUpdate: Callback when box is updated
 * - onDelete: Callback when box is deleted
 */

import React, { useRef, useState, useEffect } from 'react';
import type { TextBox } from '../../types';

interface TextBoxOverlayProps {
  textBox: TextBox;
  isSelected: boolean;
  isEditing: boolean;
  zoom: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextBox>) => void;
  onDelete: () => void;
}

/**
 * TextBoxOverlay component for rendering and editing text boxes
 */
export const TextBoxOverlay: React.FC<TextBoxOverlayProps> = ({
  textBox,
  isSelected,
  isEditing,
  zoom,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.select();
    }
  }, [isEditing]);

  /**
   * Handle mouse down for dragging
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;

    e.stopPropagation();
    onSelect();

    setIsDragging(true);
    setDragStart({
      x: e.clientX - textBox.x * zoom,
      y: e.clientY - textBox.y * zoom,
    });
  };

  /**
   * Handle mouse down on resize handle
   */
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
  };

  /**
   * Handle mouse move for dragging and resizing
   */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = (e.clientX - dragStart.x) / zoom;
        const newY = (e.clientY - dragStart.y) / zoom;

        onUpdate({
          x: Math.max(0, newX),
          y: Math.max(0, newY),
        });
      } else if (isResizing) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        const newWidth = Math.max(50, textBox.width + deltaX / zoom);
        const newHeight = Math.max(20, textBox.height + deltaY / zoom);

        onUpdate({
          width: newWidth,
          height: newHeight,
        });

        setDragStart({
          x: e.clientX,
          y: e.clientY,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, zoom, textBox, onUpdate]);

  /**
   * Handle double click to enter edit mode
   */
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      onSelect();
    }
  };

  /**
   * Handle text change
   */
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ text: e.target.value });
  };

  /**
   * Handle key down in edit mode
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      textAreaRef.current?.blur();
    } else if (e.key === 'Delete' && !isEditing && isSelected) {
      e.preventDefault();
      onDelete();
    }
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${textBox.x * zoom}px`,
    top: `${textBox.y * zoom}px`,
    width: `${textBox.width * zoom}px`,
    height: `${textBox.height * zoom}px`,
    fontFamily: textBox.fontFamily,
    fontSize: `${textBox.fontSize * zoom}px`,
    color: textBox.color,
    fontWeight: textBox.fontWeight || 'normal',
    textAlign: textBox.textAlign || 'left',
    backgroundColor: textBox.mode === 'replace' ? textBox.backgroundColor : 'transparent',
    border: isSelected ? '2px solid #3b82f6' : '1px solid transparent',
    cursor: isDragging ? 'grabbing' : isEditing ? 'text' : 'grab',
    userSelect: isEditing ? 'text' : 'none',
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  return (
    <div
      ref={containerRef}
      style={style}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {isEditing ? (
        <textarea
          ref={textAreaRef}
          value={textBox.text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            resize: 'none',
            backgroundColor: 'transparent',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            color: 'inherit',
            fontWeight: 'inherit',
            textAlign: 'inherit',
            padding: '2px',
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div style={{ padding: '2px', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
          {textBox.text}
        </div>
      )}

      {isSelected && !isEditing && (
        <div
          onMouseDown={handleResizeMouseDown}
          style={{
            position: 'absolute',
            right: '-4px',
            bottom: '-4px',
            width: '8px',
            height: '8px',
            backgroundColor: '#3b82f6',
            cursor: 'se-resize',
            border: '1px solid white',
          }}
        />
      )}
    </div>
  );
};
