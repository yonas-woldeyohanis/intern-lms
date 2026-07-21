const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/token');
const userRepository = require('../repositories/userRepository');

/**
 * Verifies the Bearer access token, confirms the user still exists and is
 * active, and attaches a minimal, trusted user object to req.user.
 * Route protection for the whole app hinges on this running first.
 */
module.exports = async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw AppError.unauthorized('Missing or malformed authorization header.');
    }

    const payload = verifyAccessToken(token);

    const user = await userRepository.findById(payload.sub);
    if (!user) {
      throw AppError.unauthorized('Account no longer exists.');
    }
    if (user.status !== 'active') {
      throw AppError.forbidden('Your account is not active. Contact an administrator.');
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role_name,
      departmentId: user.department_id,
      firstName: user.first_name,
      lastName: user.last_name
    };

    next();
  } catch (err) {
    next(err);
  }
};
