const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

/**
 * JWT Authentication Middleware
 * Expects: Authorization: Bearer <token>
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token expired. Please log in again.', 401));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token.', 401));
    }
    next(err);
  }
}

module.exports = { authenticate };
