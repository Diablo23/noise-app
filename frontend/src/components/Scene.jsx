import React, { forwardRef } from 'react';
import AudioItem from './AudioItem';
import TextItem from './TextItem';

const Scene = forwardRef(({ 
  items, 
  selectedId, 
  onSelectItem, 
  onUpdateItem, 
  onDeselect 
}, ref) => {
  const handleSceneClick = (e) => {
    if (e.target === e.currentTarget) {
      onDeselect();
    }
  };

  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden z-10"
      onClick={handleSceneClick}
    >
      {items.map((item) => {
        if (item.type === 'audio') {
          return (
            <AudioItem
              key={item.id}
              item={item}
              isSelected={selectedId === item.id}
              onSelect={onSelectItem}
              onUpdate={onUpdateItem}
              sceneRef={ref}
            />
          );
        }
        if (item.type === 'text') {
          return (
            <TextItem
              key={item.id}
              item={item}
              isSelected={selectedId === item.id}
              onSelect={onSelectItem}
              onUpdate={onUpdateItem}
              sceneRef={ref}
            />
          );
        }
        return null;
      })}
    </div>
  );
});

Scene.displayName = 'Scene';

export default Scene;
