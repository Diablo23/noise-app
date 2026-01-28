/**
 * NOISE API Client
 * Handles all communication with the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ===========================================
// Session Management
// ===========================================

/**
 * Initialize or retrieve the user session
 */
export async function initSession() {
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
export function getToken() {
  return localStorage.getItem('noise_token');
}

/**
 * Get the current owner ID
 */
export function getOwnerId() {
  return localStorage.getItem('noise_ownerId');
}

/**
 * Check if current user owns an item
 */
export function isOwner(item) {
  return item.ownerId === getOwnerId();
}

// ===========================================
// Board Operations
// ===========================================

/**
 * Load all items on the board
 */
export async function loadBoard() {
  const response = await fetch(`${API_BASE_URL}/api/board`);
  
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
      audioUrl: `${API_BASE_URL}${item.audioUrl}`,
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
 */
export async function createAudioItem(audioBlob, { x, y, visualFormat = 'waveform', scale = 100 }) {
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
export async function updateAudioItem(id, updates) {
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
export async function rerecordAudioItem(id, audioBlob) {
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
export async function deleteAudioItem(id) {
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
export async function createTextItem({ text, x, y, font = 'rubik-glitch', opacity = 100, scale = 100 }) {
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
export async function updateTextItem(id, updates) {
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
export async function deleteTextItem(id) {
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

export const API_URL = API_BASE_URL;
