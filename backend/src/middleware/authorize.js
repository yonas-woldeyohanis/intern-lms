const AppError = require('../utils/AppError');

/**
 * Role-Based Access Control middleware.
 * Usage: router.post('/books', authenticate, authorize('admin', 'librarian'), handler)
 *
 * Must run AFTER authenticate (relies on req.user.role).
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden(
        `This action requires one of the following roles: ${allowedRoles.join(', ')}.`
      ));
    }
    next();
  };
}

module.exports = authorize;
