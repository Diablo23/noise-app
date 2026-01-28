/**
 * NOISE API Client
 * 
 * This file demonstrates how to integrate the NOISE backend API
 * with the React frontend. Copy and adapt this code to your frontend.
 */

// Configuration
const API_BASE_URL = 'http://localhost:3001';
const WS_URL = 'http://localhost:3001';

// ===========================================
// Session Management
// ===========================================

/**
 * Initialize or retrieve the user session
 * Call this on app startup
 */
async function initSession() {
  let token = localStorage.getItem('noise_token');
  let ownerId = localStorage.getItem('noise_ownerId');
  
  if (!token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/session`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const data = await response.json();
      token = data.token;
      ownerId = data.ownerId;
      
      localStorage.setItem('noise_token', token);
      localStorage.setItem('noise_ownerId', ownerId);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      throw error;
    }
  }
  
  return { token, ownerId };
}

/**
 * Get the current auth token
 */
function getToken() {
  return localStorage.getItem('noise_token');
}

/**
 * Get the current owner ID
 */
function getOwnerId() {
  return localStorage.getItem('noise_ownerId');
}

/**
 * Check if current user owns an item
 */
function isOwner(item) {
  return item.ownerId === getOwnerId();
}

// ===========================================
// Board Operations
// ===========================================

/**
 * Load all items on the board
 */
async function loadBoard(limit = 100, offset = 0) {
  const response = await fetch(
    `${API_BASE_URL}/api/board?limit=${limit}&offset=${offset}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to load board');
  }
  
  const data = await response.json();
  
  // Transform items to match frontend format
  const items = [
    ...data.audioItems.map(item => ({
      id: item.id,
      type: 'audio',
      ownerId: item.ownerId,
      audioUrl: `${API_BASE_URL}${item.audioUrl}`, // Full URL for audio
      x: item.x,
      y: item.y,
      vizType: item.visualFormat,
      scale: item.scale,
    })),
    ...data.textItems.map(item => ({
      id: item.id,
      type: 'text',
      ownerId: item.ownerId,
      text: item.text,
      x: item.x,
      y: item.y,
      font: item.font,
      scale: item.scale,
      opacity: item.opacity,
    })),
  ];
  
  return items;
}

// ===========================================
// Audio Item Operations
// ===========================================

/**
 * Create a new audio item
 * @param {Blob} audioBlob - The recorded audio blob
 * @param {object} options - Position and settings
 */
async function createAudioItem(audioBlob, { x, y, visualFormat = 'waveform', scale = 100 }) {
  const token = getToken();
  if (!token) throw new Error('No auth token');
  
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('x', x.toString());
  formData.append('y', y.toString());
  formData.append('visualFormat', visualFormat);
  formData.append('scale', scale.toString());
  
  const response = await fetch(`${API_BASE_URL}/api/audio-items`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create audio item');
  }
  
  const item = await response.json();
  
  // Transform to frontend format
  return {
    id: item.id,
    type: 'audio',
    ownerId: item.ownerId,
    audioUrl: `${API_BASE_URL}${item.audioUrl}`,
    x: item.x,
    y: item.y,
    vizType: item.visualFormat,
    scale: item.scale,
  };
}

/**
 * Update an audio item
 */
async function updateAudioItem(id, updates) {
  const token = getToken();
  if (!token) throw new Error('No auth token');
  
  // Map frontend field names to API field names
  const apiUpdates = {};
  if (updates.x !== undefined) apiUpdates.x = updates.x;
  if (updates.y !== undefined) apiUpdates.y = updates.y;
  if (updates.scale !== undefined) apiUpdates.scale = updates.scale;
  if (updates.vizType !== undefined) apiUpdates.visualFormat = updates.vizType;
  
  const response = await fetch(`${API_BASE_URL}/api/audio-items/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apiUpdates),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update audio item');
  }
  
  return response.json();
}

/**
 * Re-record an audio item with new audio
 */
async function rerecordAudioItem(id, audioBlob) {
  const token = getToken();
  if (!token) throw new Error('No auth token');
  
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  
  const response = await fetch(`${API_BASE_URL}/api/audio-items/${id}/rerecord`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to re-record audio');
  }
  
  const item = await response.json();
  return {
    ...item,
    audioUrl: `${API_BASE_URL}${item.audioUrl}`,
  };
}

/**
 * Delete an audio item
 */
async function deleteAudioItem(id) {
  const token = getToken();
  if (!token) throw new Error('No auth token');
  
  const response = await fetch(`${API_BASE_URL}/api/audio-items/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok && response.status !== 204) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete audio item');
  }
}

// ===========================================
// Text Item Operations
// ===========================================

/**
 * Create a new text item
 */
async function createTextItem({ text, x, y, font = 'rubik-glitch', opacity = 100, scale = 100 }) {
  const token = getToken();
  if (!token) throw new Error('No auth token');
  
  const response = await fetch(`${API_BASE_URL}/api/text-items`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, x, y, font, opacity, scale }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create text item');
  }
  
  const item = await response.json();
  
  return {
    id: item.id,
    type: 'text',
    ownerId: item.ownerId,
    text: item.text,
    x: item.x,
    y: item.y,
    font: item.font,
    scale: item.scale,
    opacity: item.opacity,
  };
}

/**
 * Update a text item
 */
async function updateTextItem(id, updates) {
  const token = getToken();
  if (!token) throw new Error('No auth token');
  
  const response = await fetch(`${API_BASE_URL}/api/text-items/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update text item');
  }
  
  return response.json();
}

/**
 * Delete a text item
 */
async function deleteTextItem(id) {
  const token = getToken();
  if (!token) throw new Error('No auth token');
  
  const response = await fetch(`${API_BASE_URL}/api/text-items/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok && response.status !== 204) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete text item');
  }
}

// ===========================================
// WebSocket for Real-time Updates
// ===========================================

/**
 * Connect to WebSocket for real-time updates
 * @param {function} onItemCreated - Callback for new items
 * @param {function} onItemUpdated - Callback for updated items
 * @param {function} onItemDeleted - Callback for deleted items
 */
function connectWebSocket({ onItemCreated, onItemUpdated, onItemDeleted }) {
  // Import socket.io-client: import { io } from 'socket.io-client';
  const io = require('socket.io-client').io;
  
  const socket = io(WS_URL);
  
  socket.on('connect', () => {
    console.log('WebSocket connected');
  });
  
  socket.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason);
  });
  
  // Audio events
  socket.on('audioItemCreated', (event) => {
    const item = {
      id: event.data.id,
      type: 'audio',
      ownerId: event.data.ownerId,
      audioUrl: `${API_BASE_URL}${event.data.audioUrl}`,
      x: event.data.x,
      y: event.data.y,
      vizType: event.data.visualFormat,
      scale: event.data.scale,
    };
    onItemCreated?.(item);
  });
  
  socket.on('audioItemUpdated', (event) => {
    const item = {
      id: event.data.id,
      type: 'audio',
      ownerId: event.data.ownerId,
      audioUrl: `${API_BASE_URL}${event.data.audioUrl}`,
      x: event.data.x,
      y: event.data.y,
      vizType: event.data.visualFormat,
      scale: event.data.scale,
    };
    onItemUpdated?.(item);
  });
  
  socket.on('audioItemDeleted', (event) => {
    onItemDeleted?.(event.data.id, 'audio');
  });
  
  // Text events
  socket.on('textItemCreated', (event) => {
    const item = {
      id: event.data.id,
      type: 'text',
      ownerId: event.data.ownerId,
      text: event.data.text,
      x: event.data.x,
      y: event.data.y,
      font: event.data.font,
      scale: event.data.scale,
      opacity: event.data.opacity,
    };
    onItemCreated?.(item);
  });
  
  socket.on('textItemUpdated', (event) => {
    const item = {
      id: event.data.id,
      type: 'text',
      ownerId: event.data.ownerId,
      text: event.data.text,
      x: event.data.x,
      y: event.data.y,
      font: event.data.font,
      scale: event.data.scale,
      opacity: event.data.opacity,
    };
    onItemUpdated?.(item);
  });
  
  socket.on('textItemDeleted', (event) => {
    onItemDeleted?.(event.data.id, 'text');
  });
  
  return {
    disconnect: () => socket.disconnect(),
    socket,
  };
}

// ===========================================
// React Hook Example
// ===========================================

/**
 * Example React hook for using the NOISE API
 * 
 * Usage in your component:
 * 
 * const { items, isLoading, createAudio, createText, updateItem, deleteItem } = useNoiseBoard();
 */
/*
import { useState, useEffect, useCallback } from 'react';

function useNoiseBoard() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerId, setOwnerId] = useState(null);
  
  // Initialize session and load board
  useEffect(() => {
    async function init() {
      try {
        const session = await initSession();
        setOwnerId(session.ownerId);
        
        const boardItems = await loadBoard();
        setItems(boardItems);
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    init();
  }, []);
  
  // Connect WebSocket
  useEffect(() => {
    const ws = connectWebSocket({
      onItemCreated: (item) => {
        // Don't add if we created it (already in state)
        if (item.ownerId === ownerId) return;
        setItems(prev => [...prev, item]);
      },
      onItemUpdated: (item) => {
        setItems(prev => prev.map(i => i.id === item.id ? item : i));
      },
      onItemDeleted: (id) => {
        setItems(prev => prev.filter(i => i.id !== id));
      },
    });
    
    return () => ws.disconnect();
  }, [ownerId]);
  
  const createAudio = useCallback(async (audioBlob, options) => {
    const item = await createAudioItem(audioBlob, options);
    setItems(prev => [...prev, item]);
    return item;
  }, []);
  
  const createText = useCallback(async (options) => {
    const item = await createTextItem(options);
    setItems(prev => [...prev, item]);
    return item;
  }, []);
  
  const updateItem = useCallback(async (id, updates) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    if (item.type === 'audio') {
      await updateAudioItem(id, updates);
    } else {
      await updateTextItem(id, updates);
    }
    
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, [items]);
  
  const deleteItem = useCallback(async (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    if (item.type === 'audio') {
      await deleteAudioItem(id);
    } else {
      await deleteTextItem(id);
    }
    
    setItems(prev => prev.filter(i => i.id !== id));
  }, [items]);
  
  return {
    items,
    isLoading,
    ownerId,
    isOwner,
    createAudio,
    createText,
    updateItem,
    deleteItem,
  };
}
*/

// Export all functions
module.exports = {
  initSession,
  getToken,
  getOwnerId,
  isOwner,
  loadBoard,
  createAudioItem,
  updateAudioItem,
  rerecordAudioItem,
  deleteAudioItem,
  createTextItem,
  updateTextItem,
  deleteTextItem,
  connectWebSocket,
};
