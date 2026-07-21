/**
 * Wraps an async Express handler so any thrown/rejected error is forwarded
 * to next(), landing in the centralized error handler instead of crashing
 * the process or hanging the request.
 */
module.exports = function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
