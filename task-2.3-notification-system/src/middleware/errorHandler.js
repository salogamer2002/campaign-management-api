/**
 * Error handler middleware for the notification system.
 */
function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  console.error(`[NotificationSystem] ERROR ${status}:`, err.message);
  if (status === 500) console.error(err.stack);

  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
}

module.exports = errorHandler;
