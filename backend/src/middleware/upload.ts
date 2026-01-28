import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

// Configure multer for memory storage (we'll process and save ourselves)
const storage = multer.memoryStorage();

// File filter to validate MIME types
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${config.upload.allowedMimeTypes.join(', ')}`));
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSizeBytes,
    files: 1,
  },
});

// Single file upload middleware
export const uploadSingleAudio = upload.single('file');

// Error handling middleware for multer errors
export function handleUploadError(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        error: 'File Too Large',
        message: `File size exceeds maximum limit of ${config.upload.maxFileSizeMb}MB`,
      });
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        error: 'Too Many Files',
        message: 'Only one file upload is allowed',
      });
      return;
    }
    res.status(400).json({
      error: 'Upload Error',
      message: err.message,
    });
    return;
  }

  if (err.message.includes('Invalid file type')) {
    res.status(400).json({
      error: 'Invalid File Type',
      message: err.message,
    });
    return;
  }

  next(err);
}
