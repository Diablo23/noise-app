import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

// Storage interface for abstraction
export interface StorageService {
  saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
  getFilePath(fileUrl: string): string;
}

/**
 * Local file storage implementation
 */
class LocalStorage implements StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(config.upload.directory);
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private getExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'audio/webm': '.webm',
      'audio/ogg': '.ogg',
      'audio/wav': '.wav',
      'audio/wave': '.wav',
      'audio/x-wav': '.wav',
      'audio/mpeg': '.mp3',
      'audio/mp3': '.mp3',
    };
    return mimeToExt[mimeType] || '.webm';
  }

  async saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    const ext = this.getExtension(mimeType);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    await fs.promises.writeFile(filepath, buffer);

    // Return URL path (relative to server)
    return `/uploads/${filename}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const filename = fileUrl.replace('/uploads/', '');
    const filepath = path.join(this.uploadDir, filename);

    try {
      await fs.promises.unlink(filepath);
    } catch (error: any) {
      // File might not exist - that's OK, just log it
      if (error.code === 'ENOENT') {
        console.log('File already deleted or not found:', filepath);
      } else {
        console.warn('Could not delete file:', filepath, error);
      }
      // Don't throw - let the delete operation continue
    }
  }

  getFilePath(fileUrl: string): string {
    const filename = fileUrl.replace('/uploads/', '');
    return path.join(this.uploadDir, filename);
  }
}

/**
 * S3 storage implementation (placeholder for production)
 */
class S3Storage implements StorageService {
  constructor() {
    console.log('S3 Storage initialized (placeholder - implement for production)');
  }

  async saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    throw new Error('S3 storage not fully implemented. Use local storage for development.');
  }

  async deleteFile(fileUrl: string): Promise<void> {
    throw new Error('S3 storage not fully implemented.');
  }

  getFilePath(fileUrl: string): string {
    return fileUrl;
  }
}

// Factory function to get the appropriate storage service
export function getStorageService(): StorageService {
  if (config.storage.type === 's3') {
    return new S3Storage();
  }
  return new LocalStorage();
}

// Singleton instance
let storageInstance: StorageService | null = null;

export function getStorage(): StorageService {
  if (!storageInstance) {
    storageInstance = getStorageService();
  }
  return storageInstance;
}
