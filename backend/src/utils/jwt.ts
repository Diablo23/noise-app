import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  ownerId: string;
}

export function generateToken(ownerId: string): string {
  return jwt.sign(
    { ownerId } as TokenPayload,
    config.jwtSecret,
    { expiresIn: '30d' } as jwt.SignOptions
  );
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
  } catch {
    return null;
  }
}
