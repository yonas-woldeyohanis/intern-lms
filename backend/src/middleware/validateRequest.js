const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Run after an array of express-validator checks. Collects all failures
 * into a single, client-friendly 400 response instead of the raw
 * express-validator error shape.
 */
module.exports = function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({
      field: e.path,
      message: e.msg
    }));
    return next(AppError.badRequest('Validation failed. Please check the highlighted fields.', details));
  }
  next();
};
