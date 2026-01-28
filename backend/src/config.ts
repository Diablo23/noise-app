import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  },

  // CORS
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim()),
  },

  // File Upload
  upload: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10),
    maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10) * 1024 * 1024,
    directory: process.env.UPLOAD_DIR || './uploads',
    allowedMimeTypes: [
      'audio/webm',
      'audio/ogg',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/mpeg',
      'audio/mp3',
    ] as string[],
  },

  // Storage
  storage: {
    type: (process.env.STORAGE_TYPE || 'local') as 'local' | 's3',
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.S3_BUCKET_NAME || 'noise-audio-files',
      endpoint: process.env.S3_ENDPOINT || undefined,
    },
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    uploadWindowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS || '60000', 10),
    uploadMaxRequests: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX_REQUESTS || '10', 10),
  },

  // Text limits
  text: {
    maxLength: 200,
  },
};

export type Config = typeof config;
