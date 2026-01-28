import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, message, details);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, message);
  }
}

// Global error handler
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  if (err instanceof ApiError) {
    const response: { error: string; message: string; details?: unknown } = {
      error: err.name,
      message: err.message,
    };
    if (err.details) {
      response.details = err.details;
    }
    res.status(err.statusCode).json(response);
    return;
  }

  // Default to 500 for unhandled errors
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.isProduction ? 'An unexpected error occurred' : err.message,
  });
}

// 404 handler for unmatched routes
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
}
