/**
 * Custom application error with HTTP status code
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 */
function errorHandler(err, req, res, next) {
  // Default to 500 if no status code set
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error in development
  if (!isProduction) {
    console.error('❌ Error:', err);
  }

  // Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      })),
    });
  }

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry — this record already exists.',
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Referenced record does not exist.',
    });
  }

  // Operational errors (our custom AppError)
  if (err.isOperational) {
    return res.status(statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Unknown / unexpected errors
  res.status(500).json({
    success: false,
    error: isProduction ? 'Internal server error' : err.message,
  });
}

module.exports = { AppError, errorHandler };
