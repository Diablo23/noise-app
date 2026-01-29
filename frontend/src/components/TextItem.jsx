import React, { useState, useEffect, useRef } from 'react';
import { FONTS } from './FontDropdown';

const TextItem = ({ 
  item, 
  isSelected, 
  isOwner,
  onSelect, 
  onUpdate, 
  sceneRef 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const inputRef = useRef(null);
  const itemRef = useRef(null);

  const { id, text, x, y, font, scale, opacity } = item;

  const fontClass = FONTS.find(f => f.id === font)?.className || 'font-rubik-glitch';

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    // Only allow editing if user owns this item
    if (isOwner) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleTextChange = (e) => {
    if (isOwner) {
      onUpdate(id, { text: e.target.value });
    }
  };

  // Drag handlers - only allow dragging if owner
  const handleMouseDown = (e) => {
    if (isEditing) return;
    if (!isOwner) return;
    
    e.preventDefault();
    onSelect(id);
    setIsDragging(true);

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleTouchStart = (e) => {
    if (isEditing) return;
    if (!isOwner) return;
    
    onSelect(id);
    setIsDragging(true);

    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!sceneRef.current || !itemRef.current) return;

      const sceneRect = sceneRef.current.getBoundingClientRect();
      const itemRect = itemRef.current.getBoundingClientRect();

      let newX = e.clientX - sceneRect.left - dragOffset.x;
      let newY = e.clientY - sceneRect.top - dragOffset.y;

      // Constrain to scene bounds
      newX = Math.max(0, Math.min(newX, sceneRect.width - itemRect.width));
      newY = Math.max(0, Math.min(newY, sceneRect.height - itemRect.height));

      onUpdate(id, { x: newX, y: newY });
    };

    const handleTouchMove = (e) => {
      if (!sceneRef.current || !itemRef.current) return;

      const touch = e.touches[0];
      const sceneRect = sceneRef.current.getBoundingClientRect();
      const itemRect = itemRef.current.getBoundingClientRect();

      let newX = touch.clientX - sceneRect.left - dragOffset.x;
      let newY = touch.clientY - sceneRect.top - dragOffset.y;

      newX = Math.max(0, Math.min(newX, sceneRect.width - itemRect.width));
      newY = Math.max(0, Math.min(newY, sceneRect.height - itemRect.height));

      onUpdate(id, { x: newX, y: newY });
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleTouchEnd = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset, id, onUpdate, sceneRef]);

  const fontSize = 24 * (scale / 100);

  return (
    <div
      ref={itemRef}
      className={`absolute ${isOwner ? 'cursor-grab' : 'cursor-default'} no-select ${isDragging ? 'cursor-grabbing' : ''} ${isSelected ? 'selected-item' : ''}`}
      style={{
        left: x,
        top: y,
        zIndex: isSelected ? 20 : 10,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing && isOwner ? (
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`${fontClass} bg-transparent border-b-2 border-black text-black outline-none min-w-[100px] px-1`}
          style={{
            fontSize: `${fontSize}px`,
            opacity: opacity / 100,
          }}
        />
      ) : (
        <div
          className={`${fontClass} text-black px-2 py-1 whitespace-nowrap`}
          style={{
            fontSize: `${fontSize}px`,
            opacity: opacity / 100,
          }}
        >
          {text || 'Double-click to edit'}
        </div>
      )}
    </div>
  );
};

export default TextItem;
