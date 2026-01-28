import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from '../config';
import { WebSocketEvent, WebSocketEventType, AudioItemResponse, TextItemResponse } from '../types';

let io: SocketIOServer | null = null;

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.cors.origins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join the shared board room
    socket.join('board');

    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id} (${reason})`);
    });

    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  console.log('WebSocket server initialized');
  return io;
}

/**
 * Get the WebSocket server instance
 */
export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Broadcast an event to all connected clients
 */
export function broadcast<T>(eventType: WebSocketEventType, data: T): void {
  if (!io) {
    console.warn('WebSocket server not initialized');
    return;
  }

  const event: WebSocketEvent<T> = {
    type: eventType,
    data,
  };

  io.to('board').emit(eventType, event);
}

// Convenience methods for specific events
export const wsEvents = {
  audioItemCreated: (item: AudioItemResponse) => broadcast('audioItemCreated', item),
  audioItemUpdated: (item: AudioItemResponse) => broadcast('audioItemUpdated', item),
  audioItemDeleted: (id: string) => broadcast('audioItemDeleted', { id }),

  textItemCreated: (item: TextItemResponse) => broadcast('textItemCreated', item),
  textItemUpdated: (item: TextItemResponse) => broadcast('textItemUpdated', item),
  textItemDeleted: (id: string) => broadcast('textItemDeleted', { id }),
};
