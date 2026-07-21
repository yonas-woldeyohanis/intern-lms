const env = require('../config/env');
const logger = require('../config/logger');
const AppError = require('../utils/AppError');

function mapKnownError(err) {
  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return AppError.conflict('A record with these details already exists.');
  }
  // MySQL FK constraint violations
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    return AppError.badRequest('This record cannot be modified because it is referenced by other records.');
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    return AppError.badRequest('One of the referenced records does not exist.');
  }
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return AppError.unauthorized('Invalid authentication token.');
  }
  if (err.name === 'TokenExpiredError') {
    return AppError.unauthorized('Your session has expired. Please log in again.');
  }
  // Multer file upload errors
  if (err.name === 'MulterError') {
    return AppError.badRequest(`File upload error: ${err.message}`);
  }
  return null;
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err instanceof AppError ? err : mapKnownError(err);

  if (!error) {
    error = AppError.internal();
  }

  const isProd = env.nodeEnv === 'production';

  logger.error(err.message, {
    statusCode: error.statusCode,
    errorCode: error.errorCode,
    path: req.originalUrl,
    method: req.method,
    userId: req.user ? req.user.id : null,
    ip: req.ip,
    stack: err.stack
  });

  const response = {
    success: false,
    error: {
      code: error.errorCode,
      message: error.message
    }
  };

  if (error.details) {
    response.error.details = error.details;
  }

  // Never leak stack traces or internal error text to clients in production
  if (!isProd && !(err instanceof AppError)) {
    response.error.stack = err.stack;
  }

  res.status(error.statusCode).json(response);
}

function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

module.exports = { errorHandler, notFoundHandler };
