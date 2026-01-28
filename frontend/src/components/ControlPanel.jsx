import React from 'react';
import FontDropdown from './FontDropdown';

const VIZ_TYPES = [
  { id: 'waveform', label: 'Waveform' },
  { id: 'bars', label: 'Bars' },
  { id: 'spectrum', label: 'Spectrum' },
];

const ControlPanel = ({ 
  selectedItem, 
  onUpdateItem, 
  onDeleteItem, 
  onReRecord,
  isRecording,
  canEdit = true // New prop to check ownership
}) => {
  if (!selectedItem) {
    return (
      <div className="fixed bottom-0 left-0 right-0 md:right-auto md:left-4 md:bottom-4 bg-black/80 backdrop-blur-sm border border-white/20 p-4 md:rounded-lg z-40">
        <p className="text-white text-sm text-center opacity-60">
          Select an element to edit its properties
        </p>
      </div>
    );
  }

  const isAudioItem = selectedItem.type === 'audio';
  const isTextItem = selectedItem.type === 'text';

  return (
    <div className="fixed bottom-0 left-0 right-0 md:right-auto md:left-4 md:bottom-4 md:w-72 bg-black/90 backdrop-blur-sm border border-white/30 z-40 md:rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">
            {isAudioItem ? 'Audio Properties' : 'Text Properties'}
          </span>
          {!canEdit && (
            <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded">
              View Only
            </span>
          )}
        </div>
        {canEdit && (
          <button
            onClick={() => onDeleteItem(selectedItem.id)}
            className="text-white/70 hover:text-red-400 transition-colors p-1"
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Not owner message */}
      {!canEdit && (
        <div className="px-4 py-3 bg-yellow-500/10 border-b border-yellow-500/20">
          <p className="text-yellow-200/80 text-xs">
            This item belongs to another user. You can view but not edit it.
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="p-4 space-y-4">
        {/* Audio Controls */}
        {isAudioItem && (
          <>
            {/* Visualization Type */}
            <div>
              <label className="text-white text-xs uppercase tracking-wide mb-2 block opacity-70">
                Visualization
              </label>
              <div className="flex gap-1">
                {VIZ_TYPES.map((viz) => (
                  <button
                    key={viz.id}
                    onClick={() => canEdit && onUpdateItem(selectedItem.id, { vizType: viz.id })}
                    disabled={!canEdit}
                    className={`flex-1 px-2 py-2 text-xs border transition-colors ${
                      selectedItem.vizType === viz.id
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent text-white border-white/50 hover:border-white'
                    } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {viz.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Slider */}
            <div>
              <label className="text-white text-xs uppercase tracking-wide mb-2 block opacity-70">
                Size: {selectedItem.scale}%
              </label>
              <input
                type="range"
                min="25"
                max="300"
                value={selectedItem.scale}
                onChange={(e) => canEdit && onUpdateItem(selectedItem.id, { scale: parseInt(e.target.value) })}
                disabled={!canEdit}
                className={`w-full accent-white ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            {/* Re-record Button */}
            {canEdit && (
              <button
                onClick={() => onReRecord(selectedItem.id)}
                disabled={isRecording}
                className="w-full px-4 py-2 bg-black border border-white text-white text-sm hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRecording ? 'Recording...' : 'Re-record'}
              </button>
            )}
          </>
        )}

        {/* Text Controls */}
        {isTextItem && (
          <>
            {/* Font Dropdown */}
            <div>
              <label className="text-white text-xs uppercase tracking-wide mb-2 block opacity-70">
                Font
              </label>
              <FontDropdown
                value={selectedItem.font}
                onChange={(font) => canEdit && onUpdateItem(selectedItem.id, { font })}
                disabled={!canEdit}
              />
            </div>

            {/* Size Slider */}
            <div>
              <label className="text-white text-xs uppercase tracking-wide mb-2 block opacity-70">
                Size: {selectedItem.scale}%
              </label>
              <input
                type="range"
                min="25"
                max="300"
                value={selectedItem.scale}
                onChange={(e) => canEdit && onUpdateItem(selectedItem.id, { scale: parseInt(e.target.value) })}
                disabled={!canEdit}
                className={`w-full accent-white ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            {/* Opacity Slider */}
            <div>
              <label className="text-white text-xs uppercase tracking-wide mb-2 block opacity-70">
                Opacity: {selectedItem.opacity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedItem.opacity}
                onChange={(e) => canEdit && onUpdateItem(selectedItem.id, { opacity: parseInt(e.target.value) })}
                disabled={!canEdit}
                className={`w-full accent-white ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
          </>
        )}

        {/* Delete Button - only for owners */}
        {canEdit && (
          <button
            onClick={() => onDeleteItem(selectedItem.id)}
            className="w-full px-4 py-2 bg-red-900/50 border border-red-500/50 text-red-300 text-sm hover:bg-red-800/50 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
