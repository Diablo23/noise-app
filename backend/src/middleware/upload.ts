import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedTypes: string[] = [...config.upload.allowedMimeTypes];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSizeBytes,
    files: 1,
  },
});

export const uploadSingleAudio = upload.single('file');

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
