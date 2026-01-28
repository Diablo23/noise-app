import React, { useState, useRef, useCallback, useEffect } from 'react';
import NoiseOverlay from './components/NoiseOverlay';
import Scene from './components/Scene';
import ControlPanel from './components/ControlPanel';
import {
  initSession,
  loadBoard,
  createAudioItem,
  updateAudioItem,
  rerecordAudioItem,
  deleteAudioItem,
  createTextItem,
  updateTextItem,
  deleteTextItem,
  isOwner,
  getOwnerId,
} from './api';
import { useWebSocket } from './useWebSocket';

function App() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingState, setRecordingState] = useState('idle'); // idle, requesting, ready, recording
  const [reRecordingId, setReRecordingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ownerId, setOwnerId] = useState(null);
  
  const sceneRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const selectedItem = items.find(item => item.id === selectedId);

  // WebSocket callbacks for real-time updates
  const handleItemCreated = useCallback((item) => {
    setItems(prev => {
      // Check if item already exists
      if (prev.find(i => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const handleItemUpdated = useCallback((item) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...item } : i));
  }, []);

  const handleItemDeleted = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
    setSelectedId(prevId => prevId === id ? null : prevId);
  }, []);

  // Connect WebSocket for real-time updates
  useWebSocket({
    onItemCreated: handleItemCreated,
    onItemUpdated: handleItemUpdated,
    onItemDeleted: handleItemDeleted,
  });

  // Initialize session and load board on mount
  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Initialize session (get or create token)
        const session = await initSession();
        setOwnerId(session.ownerId);
        
        // Load existing items from the board
        const boardItems = await loadBoard();
        setItems(boardItems);
      } catch (err) {
        console.error('Failed to initialize:', err);
        setError('Failed to connect to server. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    }
    
    init();
  }, []);

  // Get random position within scene bounds
  const getRandomPosition = useCallback(() => {
    if (!sceneRef.current) return { x: 100, y: 100 };
    
    const rect = sceneRef.current.getBoundingClientRect();
    const padding = 220;
    
    return {
      x: Math.random() * (rect.width - padding) + 10,
      y: Math.random() * (rect.height - padding) + 10,
    };
  }, []);

  // Start recording process
  const startRecordingProcess = async () => {
    setRecordingState('requesting');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
          if (reRecordingId) {
            // Re-record existing audio item
            const updatedItem = await rerecordAudioItem(reRecordingId, audioBlob);
            setItems(prev => prev.map(item => 
              item.id === reRecordingId 
                ? { ...item, audioUrl: updatedItem.audioUrl }
                : item
            ));
            setReRecordingId(null);
          } else {
            // Create new audio item
            const position = getRandomPosition();
            const newItem = await createAudioItem(audioBlob, {
              x: position.x,
              y: position.y,
              visualFormat: 'waveform',
              scale: 100,
            });
            setItems(prev => [...prev, newItem]);
            setSelectedId(newItem.id);
          }
        } catch (err) {
          console.error('Failed to save audio:', err);
          alert('Failed to save audio. Please try again.');
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setRecordingState('idle');
      };

      setRecordingState('ready');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setRecordingState('idle');
      alert('Could not access microphone. Please grant permission and try again.');
    }
  };

  // Start actual recording
  const startRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'ready') {
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingState('recording');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      if (recordingState === 'recording') {
        mediaRecorderRef.current.stop();
      }
      audioChunksRef.current = [];
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setRecordingState('idle');
    setIsRecording(false);
    setReRecordingId(null);
  };

  // Add text caption
  const addTextCaption = async () => {
    const position = getRandomPosition();
    
    try {
      const newItem = await createTextItem({
        text: 'Your caption',
        x: position.x,
        y: position.y,
        font: 'rubik-glitch',
        scale: 100,
        opacity: 100,
      });
      setItems(prev => [...prev, newItem]);
      setSelectedId(newItem.id);
    } catch (err) {
      console.error('Failed to create text item:', err);
      alert('Failed to create caption. Please try again.');
    }
  };

  // Update item (with debounced API call for position changes)
  const updateItem = useCallback(async (id, updates) => {
    // Optimistic update for smooth UI
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
    
    // Find the item to determine type
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    // Check ownership before API call
    if (!isOwner(item)) {
      console.warn('Cannot update item: not owner');
      return;
    }
    
    try {
      if (item.type === 'audio') {
        await updateAudioItem(id, updates);
      } else {
        await updateTextItem(id, updates);
      }
    } catch (err) {
      console.error('Failed to update item:', err);
      // Could revert optimistic update here if needed
    }
  }, [items]);

  // Delete item
  const deleteItem = useCallback(async (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    // Check ownership
    if (!isOwner(item)) {
      alert('You can only delete your own items.');
      return;
    }
    
    // Optimistic delete
    setItems(prev => prev.filter(item => item.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
    
    try {
      if (item.type === 'audio') {
        await deleteAudioItem(id);
      } else {
        await deleteTextItem(id);
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
      // Revert optimistic delete
      setItems(prev => [...prev, item]);
      alert('Failed to delete item. Please try again.');
    }
  }, [items, selectedId]);

  // Re-record handler
  const handleReRecord = (id) => {
    const item = items.find(i => i.id === id);
    if (!item || !isOwner(item)) {
      alert('You can only re-record your own items.');
      return;
    }
    setReRecordingId(id);
    startRecordingProcess();
  };

  // Select item
  const selectItem = useCallback((id) => {
    setSelectedId(id);
  }, []);

  // Deselect
  const deselect = useCallback(() => {
    setSelectedId(null);
  }, []);

  // Check if selected item is owned by current user
  const canEditSelectedItem = selectedItem ? isOwner(selectedItem) : false;

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-screen bg-noise-orange grain-texture flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-2xl font-bold text-black mb-2">NOISE</div>
          <p className="text-black/60">Loading board...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-screen bg-noise-orange grain-texture flex items-center justify-center">
        <div className="text-center p-8 bg-black/80 border border-white max-w-md">
          <div className="text-2xl font-bold text-white mb-4">NOISE</div>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white text-black font-medium hover:bg-gray-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-noise-orange grain-texture relative overflow-hidden">
      {/* Scene with items - behind overlay */}
      <Scene
        ref={sceneRef}
        items={items}
        selectedId={selectedId}
        onSelectItem={selectItem}
        onUpdateItem={updateItem}
        onDeselect={deselect}
        currentOwnerId={ownerId}
      />

      {/* NOISE Overlay - always on top */}
      <NoiseOverlay />

      {/* Action Buttons - Top Left */}
      <div className="fixed top-6 left-6 md:top-8 md:left-8 z-40 flex flex-col gap-3">
        {recordingState === 'idle' ? (
          <>
            <button
              onClick={startRecordingProcess}
              className="noise-button px-4 py-2 bg-black border border-white text-white text-sm font-medium"
            >
              Record noise
            </button>
            <button
              onClick={addTextCaption}
              className="noise-button px-4 py-2 bg-black border border-white text-white text-sm font-medium"
            >
              Add caption
            </button>
          </>
        ) : (
          <div className="bg-black/90 border border-white p-4 space-y-3 min-w-[200px]">
            <div className="flex items-center gap-2">
              {recordingState === 'recording' && (
                <div className="w-3 h-3 bg-red-500 rounded-full recording-indicator" />
              )}
              <span className="text-white text-sm">
                {recordingState === 'requesting' && 'Requesting permission...'}
                {recordingState === 'ready' && 'Ready to record'}
                {recordingState === 'recording' && 'Recording...'}
              </span>
            </div>
            
            <div className="flex gap-2">
              {recordingState === 'ready' && (
                <button
                  onClick={startRecording}
                  className="noise-button flex-1 px-3 py-2 bg-red-600 border border-red-400 text-white text-sm"
                >
                  Start
                </button>
              )}
              {recordingState === 'recording' && (
                <button
                  onClick={stopRecording}
                  className="noise-button flex-1 px-3 py-2 bg-black border border-white text-white text-sm"
                >
                  Stop
                </button>
              )}
              <button
                onClick={cancelRecording}
                className="noise-button px-3 py-2 bg-black border border-white/50 text-white/70 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Panel - shows when item is selected */}
      {selectedItem && (
        <ControlPanel
          selectedItem={selectedItem}
          onUpdateItem={updateItem}
          onDeleteItem={deleteItem}
          onReRecord={handleReRecord}
          isRecording={recordingState !== 'idle'}
          canEdit={canEditSelectedItem}
        />
      )}

      {/* Instructions hint - bottom center (hidden when panel shows) */}
      {!selectedItem && items.length === 0 && recordingState === 'idle' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 text-center">
          <p className="text-black/60 text-sm">
            Record audio or add captions to leave your noise
          </p>
        </div>
      )}

      {/* Connection indicator */}
      <div className="fixed bottom-4 right-4 z-30">
        <div className="flex items-center gap-2 text-xs text-black/40">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Connected</span>
        </div>
      </div>
    </div>
  );
}

export default App;
