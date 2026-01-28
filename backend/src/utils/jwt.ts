import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  ownerId: string;
}

export function generateToken(ownerId: string): string {
  const secret = config.jwt.secret;
  return jwt.sign({ ownerId }, secret, { expiresIn: '30d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const secret = config.jwt.secret;
    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    return null;
  }
}
