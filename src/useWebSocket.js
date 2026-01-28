import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API_URL, getOwnerId } from './api';

/**
 * Hook for WebSocket connection and real-time updates
 */
export function useWebSocket({ onItemCreated, onItemUpdated, onItemDeleted }) {
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket server
    socketRef.current = io(API_URL, {
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('WebSocket connection error:', error.message);
    });

    // Audio events
    socket.on('audioItemCreated', (event) => {
      const item = {
        id: event.data.id,
        type: 'audio',
        ownerId: event.data.ownerId,
        audioUrl: `${API_URL}${event.data.audioUrl}`,
        x: event.data.x,
        y: event.data.y,
        vizType: event.data.visualFormat,
        scale: event.data.scale,
      };
      // Don't add if we created it (already in state from optimistic update)
      if (item.ownerId !== getOwnerId()) {
        onItemCreated?.(item);
      }
    });

    socket.on('audioItemUpdated', (event) => {
      const item = {
        id: event.data.id,
        type: 'audio',
        ownerId: event.data.ownerId,
        audioUrl: `${API_URL}${event.data.audioUrl}`,
        x: event.data.x,
        y: event.data.y,
        vizType: event.data.visualFormat,
        scale: event.data.scale,
      };
      // Only update if not our own item (avoid double update)
      if (item.ownerId !== getOwnerId()) {
        onItemUpdated?.(item);
      }
    });

    socket.on('audioItemDeleted', (event) => {
      onItemDeleted?.(event.data.id);
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
      if (item.ownerId !== getOwnerId()) {
        onItemCreated?.(item);
      }
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
      if (item.ownerId !== getOwnerId()) {
        onItemUpdated?.(item);
      }
    });

    socket.on('textItemDeleted', (event) => {
      onItemDeleted?.(event.data.id);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [onItemCreated, onItemUpdated, onItemDeleted]);

  return socketRef;
}
