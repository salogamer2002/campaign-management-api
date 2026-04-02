/**
 * Global error handler for the AI Content Service.
 */
function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[${req.requestId || 'unknown'}] ERROR ${status}: ${message}`);
  if (status === 500) console.error(err.stack);

  res.status(status).json({
    success: false,
    error: message,
    requestId: req.requestId || null,
  });
}

module.exports = errorHandler;
