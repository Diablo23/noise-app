import { AudioItem, TextItem } from '@prisma/client';

// JWT Payload
export interface JwtPayload {
  ownerId: string;
  iat?: number;
  exp?: number;
}

// API Responses
export interface SessionResponse {
  token: string;
  ownerId: string;
}

export interface BoardResponse {
  audioItems: AudioItemResponse[];
  textItems: TextItemResponse[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}

// Transform Prisma models to API responses (camelCase)
export interface AudioItemResponse {
  id: string;
  ownerId: string;
  audioUrl: string;
  durationMs: number | null;
  visualFormat: string;
  x: number;
  y: number;
  scale: number;
  createdAt: string;
  updatedAt: string;
}

export interface TextItemResponse {
  id: string;
  ownerId: string;
  text: string;
  font: string;
  opacity: number;
  x: number;
  y: number;
  scale: number;
  createdAt: string;
  updatedAt: string;
}

// Transform functions
export function transformAudioItem(item: AudioItem): AudioItemResponse {
  return {
    id: item.id,
    ownerId: item.ownerId,
    audioUrl: item.audioUrl,
    durationMs: item.durationMs,
    visualFormat: item.visualFormat,
    x: item.x,
    y: item.y,
    scale: item.scale,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function transformTextItem(item: TextItem): TextItemResponse {
  // Convert Prisma enum to frontend format
  const fontMap: Record<string, string> = {
    rubik_glitch: 'rubik-glitch',
    kapakana: 'kapakana',
    shadows: 'shadows',
  };

  return {
    id: item.id,
    ownerId: item.ownerId,
    text: item.text,
    font: fontMap[item.font] || item.font,
    opacity: item.opacity * 100, // Convert 0-1 to 0-100 for frontend
    x: item.x,
    y: item.y,
    scale: item.scale,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

// Error response
export interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

// WebSocket Events
export type WebSocketEventType =
  | 'audioItemCreated'
  | 'audioItemUpdated'
  | 'audioItemDeleted'
  | 'textItemCreated'
  | 'textItemUpdated'
  | 'textItemDeleted';

export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  data: T;
}
