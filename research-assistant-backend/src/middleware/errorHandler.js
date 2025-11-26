import config from '../config/index.js';

/**
 * Custom error class for API errors
 * Allows throwing errors with specific status codes
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // Distinguishes from programming errors
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error factory functions
 */
export const Errors = {
  badRequest: (message, details) => new ApiError(400, message, details),
  unauthorized: (message = 'Unauthorized') => new ApiError(401, message),
  forbidden: (message = 'Forbidden') => new ApiError(403, message),
  notFound: (resource = 'Resource') => new ApiError(404, `${resource} not found`),
  conflict: (message) => new ApiError(409, message),
  unprocessable: (message, details) => new ApiError(422, message, details),
  tooLarge: (message = 'File too large') => new ApiError(413, message),
  internal: (message = 'Internal server error') => new ApiError(500, message),
  serviceUnavailable: (message) => new ApiError(503, message),
};

/**
 * Global error handler middleware
 * Must have 4 parameters for Express to recognize it as error handler
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });
  
  // Handle known API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    });
  }
  
  // Handle Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: 'The uploaded file exceeds the maximum allowed size',
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected file',
      message: 'Unexpected file field in upload',
    });
  }
  
  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'The request body contains invalid JSON',
    });
  }
  
  // Handle Supabase errors
  if (err.code && err.code.startsWith('PGRST')) {
    return res.status(400).json({
      error: 'Database error',
      message: config.nodeEnv === 'development' ? err.message : 'A database error occurred',
    });
  }
  
  // Handle unknown errors
  // In production, don't expose internal error details
  return res.status(500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' 
      ? err.message 
      : 'An unexpected error occurred',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 * Without this, async errors would crash the server
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;